// backend-node/src/controllers/tickets.controller.js
const Ticket = require('../models/Ticket.model');
const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const { generateQR } = require('../utils/qrGenerator');
const { calculateFare } = require('../utils/fareEngine');
const { calculateCO2Saved } = require('../utils/carbonCalc');
const { generatePDFTicket } = require('../utils/pdfTicket');
const { bookingBus } = require('../events/bookingEvents');
const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');

// Hardcoded GMRC station coordinates — used for fare calculation
// These are imported from a shared constants file
const STATIONS = require('../constants/stations');

/**
 * Generate a unique ticket ID in format MM-YYYYMMDD-XXXX
 */
const generateTicketId = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MM-${dateStr}-${rand}`;
};

// POST /api/tickets/book
const bookTicket = async (req, res, next) => {
  try {
    const {
      source,
      destination,
      passengers,
      travelDate,
      travelTime,
      coachPref,
    } = req.body;

    if (!source || !destination || !passengers || !travelDate || !travelTime) {
      const err = new Error('Missing required booking fields');
      err.statusCode = 400;
      return next(err);
    }

    if (passengers.length < 1 || passengers.length > 6) {
      const err = new Error('1 to 6 passengers allowed per booking');
      err.statusCode = 400;
      return next(err);
    }

    // Find station coordinates
    const sourceStation = STATIONS.find((s) => s.name === source);
    const destStation = STATIONS.find((s) => s.name === destination);

    if (!sourceStation || !destStation) {
      const err = new Error('Invalid station name');
      err.statusCode = 400;
      return next(err);
    }

    // Calculate fare
    const travelDateObj = new Date(travelDate);
    const hour = parseInt(travelTime.split(':')[0], 10);
    const dayOfWeek = travelDateObj.getDay();

    const fareResult = calculateFare(
      { lat: sourceStation.lat, lng: sourceStation.lng },
      { lat: destStation.lat, lng: destStation.lng },
      hour,
      dayOfWeek,
      passengers.length
    );

    // Try to get crowd prediction from Django ML service
    let crowdBucket = 'Medium';
    try {
      const predResponse = await axios.post(`${DJANGO_API_URL}/api/predict/`, {
        station: source,
        hour,
        day: dayOfWeek,
        passengers: passengers.length,
      });
      if (predResponse.data && predResponse.data.bucket) {
        crowdBucket = predResponse.data.bucket;
      }
    } catch (predErr) {
      // If Django is unavailable, default to Medium — don't block booking
      console.warn('⚠️ ML prediction service unavailable, defaulting to Medium');
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < fareResult.fare) {
      const err = new Error(`Insufficient wallet balance. Required: ₹${fareResult.fare}, Available: ₹${wallet ? wallet.balance : 0}`);
      err.statusCode = 402;
      return next(err);
    }

    // Generate QR codes for each passenger
    const ticketId = generateTicketId();
    const passengersWithQR = await Promise.all(
      passengers.map(async (p, i) => {
        const qrData = JSON.stringify({
          ticketId,
          passenger: p.name,
          index: i,
          source,
          destination,
          date: travelDate,
        });
        const qrCode = await generateQR(qrData);
        return { ...p, qrCode };
      })
    );

    // Calculate CO2 savings
    const co2Saved = calculateCO2Saved(fareResult.distance, passengers.length);

    // Create ticket
    const ticket = await Ticket.create({
      userId: req.user._id,
      ticketId,
      source,
      destination,
      fare: fareResult.fare,
      isPeak: fareResult.isPeak,
      passengers: passengersWithQR,
      travelDate,
      travelTime,
      crowdBucket,
      co2Saved,
      distance: fareResult.distance,
      coachPref: coachPref || 'general',
    });

    // Deduct from wallet
    wallet.balance -= fareResult.fare;
    await wallet.save();

    // Record transaction
    await Transaction.create({
      userId: req.user._id,
      type: 'debit',
      amount: fareResult.fare,
      balance: wallet.balance,
      ref: ticketId,
      note: `Ticket: ${source} → ${destination}`,
    });

    // Update user loyalty points and streak
    const user = await User.findById(req.user._id);
    user.loyaltyPoints += Math.floor(fareResult.fare / 10); // 1 point per ₹10 spent
    const today = new Date().toDateString();
    const lastTravel = user.lastTravelDate ? user.lastTravelDate.toDateString() : null;
    if (lastTravel === new Date(Date.now() - 86400000).toDateString()) {
      user.streakDays += 1; // Consecutive day
    } else if (lastTravel !== today) {
      user.streakDays = 1; // Reset streak
    }
    user.lastTravelDate = new Date();
    await user.save();

    // Emit booking event (first-class feature: Node EventEmitter + fs logging)
    bookingBus.emit('booked', {
      ticketId,
      userId: req.user._id,
      source,
      destination,
      fare: fareResult.fare,
      passengerCount: passengers.length,
    });

    res.status(201).json({
      success: true,
      ticket,
      fareBreakdown: fareResult,
      crowdBucket,
      co2Saved,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets
const getTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tickets/:id
const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!ticket) {
      const err = new Error('Ticket not found');
      err.statusCode = 404;
      return next(err);
    }

    if (ticket.status === 'cancelled') {
      const err = new Error('Ticket already cancelled');
      err.statusCode = 400;
      return next(err);
    }

    if (ticket.status === 'completed') {
      const err = new Error('Cannot cancel a completed ticket');
      err.statusCode = 400;
      return next(err);
    }

    // Cancel and refund
    ticket.status = 'cancelled';
    await ticket.save();

    // Refund to wallet
    const wallet = await Wallet.findOne({ userId: req.user._id });
    wallet.balance += ticket.fare;
    await wallet.save();

    // Record refund transaction
    await Transaction.create({
      userId: req.user._id,
      type: 'credit',
      amount: ticket.fare,
      balance: wallet.balance,
      ref: ticket.ticketId,
      note: `Refund: ${ticket.source} → ${ticket.destination}`,
    });

    // Emit cancellation event
    bookingBus.emit('cancelled', {
      ticketId: ticket.ticketId,
      userId: req.user._id,
      refundAmount: ticket.fare,
    });

    res.json({
      success: true,
      message: `Ticket cancelled. ₹${ticket.fare} refunded to wallet.`,
      ticket,
      newBalance: wallet.balance,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/:id/pdf
const downloadTicketPDF = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!ticket) {
      const err = new Error('Ticket not found');
      err.statusCode = 404;
      return next(err);
    }

    const pdfBuffer = await generatePDFTicket(ticket);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ticket-${ticket.ticketId}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { bookTicket, getTickets, cancelTicket, downloadTicketPDF };
