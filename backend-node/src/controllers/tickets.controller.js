// backend-node/src/controllers/tickets.controller.js
const Ticket = require('../models/Ticket.model');
const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const MetroCard = require('../models/MetroCard.model');
const SystemSetting = require('../models/SystemSetting.model');
const { generateQR } = require('../utils/qrGenerator');
const { calculateFare } = require('../utils/fareEngine');
const { calculateCO2Saved } = require('../utils/carbonCalc');
const { generatePDFTicket } = require('../utils/pdfTicket');
const { bookingBus } = require('../events/bookingEvents');
const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');
const { METRO_CARD_DISCOUNT } = require('./metrocard.controller');
const { checkHolidayDiscount } = require('../services/holiday.service');

// Hardcoded GMRC station coordinates — used for fare calculation
// These are imported from a shared constants file
const STATIONS = require('../constants/stations');

/**
 * Generate a unique ticket ID in format MM-YYYYMMDD-XXXX
 */
const generateTicketId = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
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
      paymentMethod = 'wallet', // 'wallet' | 'metrocard'
    } = req.body;

    const settings = await SystemSetting.findOne();
    if (settings && settings.maintenanceMode) {
      const err = new Error('System is currently under maintenance. Ticket booking is temporarily disabled.');
      err.statusCode = 503;
      return next(err);
    }



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

    if (passengers.some(p => /\d/.test(p.name))) {
      const err = new Error('Passenger name cannot contain numbers');
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
      passengers,
      travelDate
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

    // ── Metro Card lookup ──
    const metroCard = await MetroCard.findOne({ userId: req.user._id, isActive: true });
    const useMetroCard = !!metroCard && paymentMethod === 'metrocard';
    const metroCardDiscountAmount = useMetroCard ? Math.round(fareResult.fare * METRO_CARD_DISCOUNT) : 0;

    // ── Live Holiday discount (15%) via Calendarific / Nager.Date ──
    const holidayCheck = await checkHolidayDiscount(travelDate);
    const holidayDiscountAmount = holidayCheck.isHoliday
      ? Math.round(fareResult.fare * (holidayCheck.discountPercent / 100))
      : 0;

    // Combine discounts: Metro Card applied first, then holiday on top
    const discountAmount = metroCardDiscountAmount;
    // Only enforce ₹1 minimum when base fare is non-zero — children-only bookings should stay free
    const finalFare = fareResult.fare === 0
      ? 0
      : Math.max(1, fareResult.fare - discountAmount - holidayDiscountAmount);


    // ── Payment source check ──
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (paymentMethod === 'metrocard') {
      // Pay from Metro Card balance
      if (!metroCard) {
        const err = new Error('No active Metro Card found. Please get a Metro Card first.');
        err.statusCode = 402; return next(err);
      }
      if (metroCard.balance < finalFare) {
        const err = new Error(`Insufficient Metro Card balance. Required: \u20b9${finalFare}, Available: \u20b9${metroCard.balance}`);
        err.statusCode = 402; return next(err);
      }
    } else {
      // Pay from Wallet
      if (!wallet || wallet.balance < finalFare) {
        const err = new Error(`Insufficient wallet balance. Required: \u20b9${finalFare}, Available: \u20b9${wallet ? wallet.balance : 0}`);
        err.statusCode = 402; return next(err);
      }
    }


    // Generate QR codes for each passenger with split fare
    const ticketId = generateTicketId();
    const farePerPerson = Math.round(finalFare / passengers.length);
    const passengersWithQR = await Promise.all(
      passengers.map(async (p, i) => {
        const qrData = JSON.stringify({
          ticketId,
          passenger: p.name,
          index: i,
          source,
          destination,
          date: travelDate,
          farePerPerson,
          totalPassengers: passengers.length,
        });
        const qrCode = await generateQR(qrData);
        return { ...p, qrCode, farePerPerson };
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
      fare: finalFare,
      isPeak: fareResult.isPeak,
      passengers: passengersWithQR,
      travelDate,
      travelTime,
      crowdBucket,
      co2Saved,
      distance: fareResult.distance,
      coachPref: coachPref || 'general',
    });

    // ── Deduct payment ──
    if (paymentMethod === 'metrocard') {
      // Deduct fare from Metro Card balance
      metroCard.balance -= finalFare;
      metroCard.lastUsed = new Date();
      metroCard.totalSaved = (metroCard.totalSaved || 0) + discountAmount;
      metroCard.totalTrips = (metroCard.totalTrips || 0) + 1;
      await metroCard.save();
    } else {
      // Deduct from wallet
      wallet.balance -= finalFare;
      await wallet.save();
      // Update Metro Card stats if discount was applied via active card
      if (useMetroCard && metroCard) {
        metroCard.lastUsed = new Date();
        metroCard.totalSaved = (metroCard.totalSaved || 0) + discountAmount;
        metroCard.totalTrips = (metroCard.totalTrips || 0) + 1;
        await metroCard.save();
      }
    }

    // Record transaction
    const payLabel = paymentMethod === 'metrocard' ? 'Metro Card' : 'Wallet';
    const newBalance = paymentMethod === 'metrocard'
      ? (wallet ? wallet.balance : 0)  // wallet unchanged
      : wallet.balance;
    await Transaction.create({
      userId: req.user._id,
      type: 'debit',
      amount: finalFare,
      balance: newBalance,
      ref: ticketId,
      note: `Ticket: ${source} \u2192 ${destination} (${passengers.length} pax) | ${payLabel}${discountAmount > 0 ? ` | Metro Card \u221210% \u2212\u20b9${discountAmount}` : ''}${holidayDiscountAmount > 0 ? ` | ${holidayCheck.holidayName} \u221215% \u2212\u20b9${holidayDiscountAmount}` : ''}`,
    });



    // Update user loyalty points and streak
    const user = await User.findById(req.user._id);
    user.loyaltyPoints += Math.floor(fareResult.fare / 10); // 1 point per ₹10 spent
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const lastTravel = user.lastTravelDate ? user.lastTravelDate.toDateString() : null;

    if (!lastTravel) {
      user.streakDays = (user.streakDays || 0) + 1;
    } else if (lastTravel === yesterdayStr) {
      user.streakDays += 1;
    } else if (lastTravel !== today) {
      user.streakDays = 1;
    }
    
    user.lastTravelDate = now;
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
      farePerPerson,
      crowdBucket,
      co2Saved,
      metroCardDiscount: discountAmount,
      holidayDiscount: holidayDiscountAmount,
      holidayName: holidayCheck.holidayName || null,
      originalFare: fareResult.fare,
      finalFare,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets
const getTickets = async (req, res, next) => {
  try {
    const now = new Date();
    const upcomingTickets = await Ticket.find({ userId: req.user._id, status: 'upcoming' });

    for (const ticket of upcomingTickets) {
      if (!ticket.travelDate || !ticket.travelTime) continue;

      let timeParts = ticket.travelTime.split(' ');
      let time = timeParts[0];
      let modifier = timeParts[1];
      
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      
      if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
      
      const ticketDateTime = new Date(ticket.travelDate);
      ticketDateTime.setHours(hours, parseInt(minutes || 0, 10), 0, 0);
      
      // Add 1 hour
      const expiryTime = new Date(ticketDateTime.getTime() + 1 * 60 * 60 * 1000);
      
      if (now >= expiryTime) {
        ticket.status = 'completed';
        await ticket.save();
      }
    }

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

    const settings = await SystemSetting.findOne();
    const windowMins = settings ? settings.ticketCancellationWindow : 30;

    let refundAmount = ticket.fare;

    if (ticket.travelDate && ticket.travelTime) {
      let timeParts = ticket.travelTime.split(' ');
      let time = timeParts[0];
      let modifier = timeParts[1];
      
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      
      if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
      
      const ticketDateTime = new Date(ticket.travelDate);
      ticketDateTime.setHours(hours, parseInt(minutes || 0, 10), 0, 0);
      
      const diffHours = (ticketDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      
      if (diffHours >= 24) {
        refundAmount = Math.round(ticket.fare * 0.8);
      } else if (diffHours > 0) {
        refundAmount = Math.round(ticket.fare * 0.5);
      } else {
        refundAmount = 0;
      }
    }

    // Cancel and refund
    ticket.status = 'cancelled';
    await ticket.save();

    // Refund to wallet
    const wallet = await Wallet.findOne({ userId: req.user._id });
    wallet.balance += refundAmount;
    await wallet.save();

    if (refundAmount > 0) {
      // Record refund transaction
      await Transaction.create({
        userId: req.user._id,
        type: 'credit',
        amount: refundAmount,
        balance: wallet.balance,
        ref: ticket.ticketId,
        note: `Refund: ${ticket.source} → ${ticket.destination} (${Math.round((refundAmount/ticket.fare)*100)}%)`,
      });
    }

    // Emit cancellation event
    bookingBus.emit('cancelled', {
      ticketId: ticket.ticketId,
      userId: req.user._id,
      refundAmount: refundAmount,
    });

    res.json({
      success: true,
      message: refundAmount > 0 ? `Ticket cancelled. ₹${refundAmount} refunded to wallet.` : 'Ticket cancelled. No refund is available for this ticket.',
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
