// backend-node/src/controllers/predict.controller.js
// API Gateway Pattern: This controller proxies crowd predictions from React to Django.
// React → Node/Express → Django (server-to-server) → back to React.
// Django's URL/port is never exposed to the browser.

const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');
const Ticket = require('../models/Ticket.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');

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
    await AuditLog.create({
      userId: req.user._id,
      action: 'predict_crowd',
      requestData: { station, hour, day, passengers },
      responseData: response.data
    });

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

    await AuditLog.create({
      userId: req.user._id,
      action: 'anomaly_check',
      requestData: { station, hour, dayOfWeek, actualCrowd },
      responseData: response.data
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

    await AuditLog.create({
      userId: req.user._id,
      action: 'personality_profile',
      requestData: { ticketHistoryCount: ticketHistory.length },
      responseData: response.data
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

    await AuditLog.create({
      userId: req.user._id,
      action: 'best_departure',
      requestData: { station, targetHour, dayOfWeek },
      responseData: response.data
    });

    res.json({ success: true, bestDeparture: response.data });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, bestDeparture: { bestHour: parseInt(req.body.targetHour, 10), bestBucket: 'Medium', recommendation: 'ML service unavailable' }, fallback: true });
    }
    next(error);
  }
};

// GET /api/predict/cluster
const getCommuterCluster = async (req, res, next) => {
  try {
    // Check cache on User document
    const user = await User.findById(req.user._id);
    if (user.clusterCache && user.clusterCache.computedAt) {
      const ageMs = Date.now() - new Date(user.clusterCache.computedAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return res.json({ success: true, cluster: user.clusterCache.result, cached: true });
      }
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const tickets = await Ticket.find({
      userId: req.user._id,
      status: 'completed',
      createdAt: { $gte: ninetyDaysAgo },
    });

    // Compute user_profile from ticket history
    let totalHour = 0, peakCount = 0, weekendCount = 0, totalDistance = 0;
    
    tickets.forEach(t => {
      const hour = parseInt(t.travelTime.split(':')[0], 10);
      const day = new Date(t.travelDate).getDay();
      
      totalHour += hour;
      if (hour >= 8 && hour <= 10 || hour >= 17 && hour <= 19) peakCount++;
      if (day === 0 || day === 6) weekendCount++;
      // Mock distance calculation or roughly base it on price/stations
      totalDistance += (t.totalFare ? t.totalFare / 5 : 5); // Rough proxy for distance
    });

    const trip_count = tickets.length;
    const user_profile = {
      avg_hour: trip_count > 0 ? totalHour / trip_count : 12,
      weekend_ratio: trip_count > 0 ? weekendCount / trip_count : 0,
      peak_ratio: trip_count > 0 ? peakCount / trip_count : 0,
      avg_distance: trip_count > 0 ? totalDistance / trip_count : 5,
      trip_count: trip_count
    };

    const response = await axios.post(`${DJANGO_API_URL}/api/predict/cluster/`, {
      user_profile
    });

    await User.findByIdAndUpdate(req.user._id, {
      clusterCache: { result: response.data, computedAt: new Date() },
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'commuter_cluster',
      requestData: { user_profile },
      responseData: response.data
    });

    res.json({ success: true, cluster: response.data, cached: false });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, cluster: { clusterId: 0, clusterLabel: 'Balanced Traveler', similarCommuterCount: 0, message: 'ML service unavailable' }, fallback: true });
    }
    next(error);
  }
};

// POST /api/predict/forecast
const getForecast = async (req, res, next) => {
  try {
    const { station, start_datetime, hours_ahead } = req.body;

    if (!station || !start_datetime) {
      const err = new Error('station and start_datetime are required');
      err.statusCode = 400;
      return next(err);
    }

    const response = await axios.post(`${DJANGO_API_URL}/api/predict/forecast/`, {
      station,
      start_datetime,
      hours_ahead: parseInt(hours_ahead, 10) || 17,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'forecast',
      requestData: { station, start_datetime, hours_ahead },
      responseData: { forecast: response.data.forecast }
    });

    res.json({ success: true, forecast: response.data.forecast });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      // Mock fallback curve
      const fallbackForecast = [];
      const start = new Date(req.body.start_datetime);
      const hours = parseInt(req.body.hours_ahead, 10) || 17;
      for (let i = 0; i < hours; i++) {
        const t = new Date(start.getTime() + i * 3600000);
        const h = t.getHours();
        const bucket = ((h >= 8 && h <= 10) || (h >= 17 && h <= 19)) ? 'High' : ((h >= 7 && h <= 11) || (h >= 16 && h <= 20)) ? 'Medium' : 'Low';
        fallbackForecast.push({
          time: `${String(h).padStart(2, '0')}:00`,
          hour: h,
          bucket,
          confidence: 50.0,
          score: 0.5
        });
      }
      return res.json({ success: true, forecast: fallbackForecast, fallback: true, message: 'ML service unavailable' });
    }
    next(error);
  }
};

module.exports = { predictCrowd, getAnomalyCheck, getPersonalityProfile, getBestDeparture, getCommuterCluster, getForecast };
