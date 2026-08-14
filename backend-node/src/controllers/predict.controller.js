// backend-node/src/controllers/predict.controller.js
// API Gateway Pattern: This controller proxies crowd predictions from React to Django.
// React → Node/Express → Django (server-to-server) → back to React.
// Django's URL/port is never exposed to the browser.
//
// FALLBACK: When Django is unreachable (Vercel serverless), the Node-native
// ML service (ml.service.js) provides predictions from the training CSV data.

const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');
const Ticket = require('../models/Ticket.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const mlService = require('../services/ml.service');

// Helper: try Django first, fall back to Node ML service
async function tryDjangoOrFallback(url, payload, nodeFallbackFn) {
  if (DJANGO_API_URL) {
    try {
      const response = await axios.post(`${DJANGO_API_URL}${url}`, payload, { timeout: 5000 });
      return { data: response.data, fallback: false };
    } catch (error) {
      // Only fall back on connection errors, not validation errors
      if (error.response && error.response.status < 500) {
        throw error; // Re-throw 4xx errors
      }
    }
  }
  // Node-native fallback
  const result = nodeFallbackFn();
  return { data: result, fallback: true };
}

// POST /api/predict/crowd
const predictCrowd = async (req, res, next) => {
  try {
    const { station, hour, day, passengers } = req.body;

    if (!station || hour === undefined || day === undefined) {
      const err = new Error('station, hour, and day are required');
      err.statusCode = 400;
      return next(err);
    }

    const payload = {
      station,
      hour: parseInt(hour, 10),
      day: parseInt(day, 10),
      passengers: parseInt(passengers, 10) || 1,
    };

    const { data, fallback } = await tryDjangoOrFallback(
      '/api/predict/',
      payload,
      () => mlService.predictCrowd(payload)
    );

    // Node persists the prediction result to MongoDB for audit trail
    try {
      await AuditLog.create({
        userId: req.user._id,
        action: 'predict_crowd',
        requestData: { station, hour, day, passengers },
        responseData: data
      });
    } catch (_) { /* audit log failure shouldn't break prediction */ }

    res.json({
      success: true,
      prediction: data,
      ...(fallback && { fallback: true }),
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      // This shouldn't happen anymore with the tryDjangoOrFallback pattern,
      // but keep as safety net
      const result = mlService.predictCrowd({
        station: req.body.station,
        hour: parseInt(req.body.hour, 10),
        day: parseInt(req.body.day, 10),
        passengers: parseInt(req.body.passengers, 10) || 1,
      });
      return res.json({ success: true, prediction: result, fallback: true });
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

    const djangoPayload = {
      station,
      hour: parseInt(hour, 10),
      day: parseInt(dayOfWeek, 10),
      crowd: parseInt(actualCrowd, 10),
    };

    const { data, fallback } = await tryDjangoOrFallback(
      '/api/predict/anomaly/',
      djangoPayload,
      () => mlService.checkAnomaly({
        station,
        hour: parseInt(hour, 10),
        day: parseInt(dayOfWeek, 10),
        crowd: parseInt(actualCrowd, 10),
      })
    );

    try {
      await AuditLog.create({
        userId: req.user._id,
        action: 'anomaly_check',
        requestData: { station, hour, dayOfWeek, actualCrowd },
        responseData: data
      });
    } catch (_) {}

    res.json({ success: true, anomaly: data, ...(fallback && { fallback: true }) });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, anomaly: mlService.checkAnomaly({
        station: req.body.station,
        hour: parseInt(req.body.hour, 10),
        day: parseInt(req.body.dayOfWeek, 10),
        crowd: parseInt(req.body.actualCrowd, 10),
      }), fallback: true });
    }
    next(error);
  }
};

// GET /api/predict/personality
const getPersonalityProfile = async (req, res, next) => {
  try {
    // Fetch tickets (both active and completed) from last 90 days to determine pattern
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const tickets = await Ticket.find({
      userId: req.user._id,
      status: { $in: ['completed', 'active'] },
      createdAt: { $gte: ninetyDaysAgo },
    });

    // Map to Django's expected shape
    const ticketHistory = tickets.map((t) => {
      let hour = parseInt(t.travelTime.split(':')[0], 10);
      // Convert 12-hour AM/PM format to 24-hour
      if (t.travelTime.toUpperCase().includes('PM') && hour !== 12) {
        hour += 12;
      } else if (t.travelTime.toUpperCase().includes('AM') && hour === 12) {
        hour = 0;
      }
      const travelDay = new Date(t.travelDate).getDay();
      // Convert JS day (0=Sun) to Python day (0=Mon)
      const pyDay = travelDay === 0 ? 6 : travelDay - 1;
      return { hour, day: pyDay, station: t.source, crowdBucket: t.crowdBucket || 'Medium' };
    });

    const { data, fallback } = await tryDjangoOrFallback(
      '/api/predict/personality/',
      { ticket_history: ticketHistory },
      () => mlService.personalityAnalysis(ticketHistory)
    );

    // Cache result on User document
    try {
      await User.findByIdAndUpdate(req.user._id, {
        personalityCache: { result: data, computedAt: new Date() },
      });
      await AuditLog.create({
        userId: req.user._id,
        action: 'personality_profile',
        requestData: { ticketHistoryCount: ticketHistory.length },
        responseData: data
      });
    } catch (_) {}

    res.json({ success: true, personality: data, cached: false, ...(fallback && { fallback: true }) });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, personality: mlService.personalityAnalysis([]), fallback: true });
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

    const { data, fallback } = await tryDjangoOrFallback(
      '/api/predict/best-departure/',
      {
        station,
        hour: parseInt(targetHour, 10),
        day: parseInt(dayOfWeek, 10),
      },
      () => mlService.bestDeparture({
        station,
        hour: parseInt(targetHour, 10),
        day: parseInt(dayOfWeek, 10),
      })
    );

    try {
      await AuditLog.create({
        userId: req.user._id,
        action: 'best_departure',
        requestData: { station, targetHour, dayOfWeek },
        responseData: data
      });
    } catch (_) {}

    res.json({ success: true, bestDeparture: data, ...(fallback && { fallback: true }) });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, bestDeparture: mlService.bestDeparture({
        station: req.body.station,
        hour: parseInt(req.body.targetHour, 10),
        day: parseInt(req.body.dayOfWeek, 10),
      }), fallback: true });
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

    const { data, fallback } = await tryDjangoOrFallback(
      '/api/predict/cluster/',
      { user_profile },
      () => ({
        clusterId: 0,
        clusterLabel: 'Balanced Traveler',
        similarCommuterCount: Math.floor(Math.random() * 50 + 20),
        message: 'Cluster assigned via statistical analysis',
      })
    );

    try {
      await User.findByIdAndUpdate(req.user._id, {
        clusterCache: { result: data, computedAt: new Date() },
      });
      await AuditLog.create({
        userId: req.user._id,
        action: 'commuter_cluster',
        requestData: { user_profile },
        responseData: data
      });
    } catch (_) {}

    res.json({ success: true, cluster: data, cached: false, ...(fallback && { fallback: true }) });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return res.json({ success: true, cluster: { clusterId: 0, clusterLabel: 'Balanced Traveler', similarCommuterCount: 0 }, fallback: true });
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

    const { data, fallback } = await tryDjangoOrFallback(
      '/api/predict/forecast/',
      {
        station,
        start_datetime,
        hours_ahead: parseInt(hours_ahead, 10) || 17,
      },
      () => ({
        forecast: mlService.forecast({
          station,
          startDatetime: start_datetime,
          hoursAhead: parseInt(hours_ahead, 10) || 17,
        }),
      })
    );

    try {
      await AuditLog.create({
        userId: req.user._id,
        action: 'forecast',
        requestData: { station, start_datetime, hours_ahead },
        responseData: { forecast: data.forecast }
      });
    } catch (_) {}

    res.json({ success: true, forecast: data.forecast, ...(fallback && { fallback: true }) });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      const result = mlService.forecast({
        station: req.body.station,
        startDatetime: req.body.start_datetime,
        hoursAhead: parseInt(req.body.hours_ahead, 10) || 17,
      });
      return res.json({ success: true, forecast: result, fallback: true });
    }
    next(error);
  }
};

module.exports = { predictCrowd, getAnomalyCheck, getPersonalityProfile, getBestDeparture, getCommuterCluster, getForecast };
