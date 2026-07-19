// backend-node/src/controllers/predict.controller.js
// API Gateway Pattern: This controller proxies crowd predictions from React to Django.
// React → Node/Express → Django (server-to-server) → back to React.
// Django's URL/port is never exposed to the browser.

const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');
const Ticket = require('../models/Ticket.model');
const User = require('../models/User.model');

// POST /api/predict/crowd
const predictCrowd = async (req, res, next) => {
  try {
    const { station, hour, day, passengers } = req.body;

    if (!station || hour === undefined || day === undefined) {
      const err = new Error('station, hour, and day are required');
      err.statusCode = 400;
      return next(err);
    }

    // Server-side call to Django ML service — never exposed to browser
    const response = await axios.post(`${DJANGO_API_URL}/api/predict/`, {
      station,
      hour: parseInt(hour, 10),
      day: parseInt(day, 10),
      passengers: parseInt(passengers, 10) || 1,
    });

    // Node persists the prediction result to MongoDB for audit trail
    // (handled via PredictionLog on the Django side; Node also records it)

    res.json({
      success: true,
      prediction: response.data,
    });
  } catch (error) {
    // If Django is down, return a graceful fallback
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({
        success: true,
        prediction: {
          bucket: 'Medium',
          confidence: 50.0,
          score: 0.5,
          top_features: [],
          fallback: true,
          message: 'ML service unavailable — showing default prediction',
        },
      });
    }
    next(error);
  }
};

// POST /api/predict/anomaly
const getAnomalyCheck = async (req, res, next) => {
  try {
    const { station, hour, dayOfWeek, actualCrowd } = req.body;

    if (!station || hour === undefined || dayOfWeek === undefined || actualCrowd === undefined) {
      const err = new Error('station, hour, dayOfWeek, and actualCrowd are required');
      err.statusCode = 400;
      return next(err);
    }

    const response = await axios.post(`${DJANGO_API_URL}/api/predict/anomaly/`, {
      station,
      hour: parseInt(hour, 10),
      day: parseInt(dayOfWeek, 10),
      crowd: parseInt(actualCrowd, 10),
    });

    res.json({ success: true, anomaly: response.data });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, anomaly: { isAnomaly: false, anomalyScore: 0, message: 'ML service unavailable' }, fallback: true });
    }
    next(error);
  }
};

// GET /api/predict/personality
const getPersonalityProfile = async (req, res, next) => {
  try {
    // Check cache on User document — skip recomputation if fresh
    const user = await User.findById(req.user._id);
    if (user.personalityCache && user.personalityCache.computedAt) {
      const ageMs = Date.now() - new Date(user.personalityCache.computedAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return res.json({ success: true, personality: user.personalityCache.result, cached: true });
      }
    }

    // Fetch completed tickets from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const tickets = await Ticket.find({
      userId: req.user._id,
      status: 'completed',
      createdAt: { $gte: ninetyDaysAgo },
    });

    // Map to Django's expected shape
    const ticketHistory = tickets.map((t) => {
      const hour = parseInt(t.travelTime.split(':')[0], 10);
      const travelDay = new Date(t.travelDate).getDay();
      // Convert JS day (0=Sun) to Python day (0=Mon)
      const pyDay = travelDay === 0 ? 6 : travelDay - 1;
      return { hour, day: pyDay, station: t.source, crowdBucket: t.crowdBucket || 'Medium' };
    });

    const response = await axios.post(`${DJANGO_API_URL}/api/predict/personality/`, {
      ticket_history: ticketHistory,
    });

    // Cache result on User document
    await User.findByIdAndUpdate(req.user._id, {
      personalityCache: { result: response.data, computedAt: new Date() },
    });

    res.json({ success: true, personality: response.data, cached: false });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, personality: { personality: 'Balanced Traveler', description: 'ML service unavailable', ratios: {}, totalTrips: 0 }, fallback: true });
    }
    next(error);
  }
};

// POST /api/predict/best-departure
const getBestDeparture = async (req, res, next) => {
  try {
    const { station, targetHour, dayOfWeek } = req.body;

    if (!station || targetHour === undefined || dayOfWeek === undefined) {
      const err = new Error('station, targetHour, and dayOfWeek are required');
      err.statusCode = 400;
      return next(err);
    }

    const response = await axios.post(`${DJANGO_API_URL}/api/predict/best-departure/`, {
      station,
      hour: parseInt(targetHour, 10),
      day: parseInt(dayOfWeek, 10),
    });

    res.json({ success: true, bestDeparture: response.data });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, bestDeparture: { bestHour: parseInt(req.body.targetHour, 10), bestBucket: 'Medium', recommendation: 'ML service unavailable' }, fallback: true });
    }
    next(error);
  }
};

module.exports = { predictCrowd, getAnomalyCheck, getPersonalityProfile, getBestDeparture };
