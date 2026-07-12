// backend-node/src/controllers/routes.controller.js
// Computes multiple route options between two stations with crowd predictions.
// Uses the existing fare engine, CO2 calc, and Django ML prediction proxy.

const STATIONS = require('../constants/stations');
const { calculateFare, haversine } = require('../utils/fareEngine');
const { calculateCO2Saved } = require('../utils/carbonCalc');
const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');

// Interchange stations connecting Blue ↔ Red lines
const INTERCHANGE_STATIONS = ['Old High Court', 'Kalupur Railway Station'];

/**
 * Call Django ML service for crowd prediction; graceful fallback on error.
 */
const getCrowdPrediction = async (station, hour, day) => {
  try {
    const response = await axios.post(`${DJANGO_API_URL}/api/predict/`, {
      station,
      hour: parseInt(hour, 10),
      day: parseInt(day, 10),
      passengers: 1,
    });
    return response.data.bucket || response.data.predicted_bucket || 'Medium';
  } catch {
    return 'Medium'; // fallback if Django is down
  }
};

/**
 * Build a route option object.
 */
const buildRoute = (label, source, dest, hour, dayOfWeek, distance, viaStation = null) => {
  const fareResult = calculateFare(
    { lat: source.lat, lng: source.lng },
    { lat: dest.lat, lng: dest.lng },
    hour,
    dayOfWeek,
    1
  );

  // If there's a via station, add the extra distance
  let totalDistance = fareResult.distance;
  if (viaStation) {
    const via = STATIONS.find(s => s.name === viaStation);
    if (via) {
      const leg1 = haversine(source.lat, source.lng, via.lat, via.lng);
      const leg2 = haversine(via.lat, via.lng, dest.lat, dest.lng);
      totalDistance = Math.round((leg1 + leg2) * 100) / 100;
    }
  }

  // Override with the actual distance if via
  const adjustedFare = viaStation
    ? Math.round(Math.max(totalDistance * 2.5, 10) * (fareResult.isPeak ? 1.2 : 1.0))
    : fareResult.perPassenger;

  const estimatedMinutes = Math.round(totalDistance * 2.5); // ~2.5 min/km
  const co2Saved = calculateCO2Saved(totalDistance, 1);

  return {
    label,
    viaStation,
    source: source.name,
    destination: dest.name,
    fare: adjustedFare,
    distance: totalDistance,
    estimatedMinutes: Math.max(estimatedMinutes, 5), // minimum 5 min
    co2Saved,
    isPeak: fareResult.isPeak,
    hour,
  };
};

// POST /api/routes/compare
const compareRoutes = async (req, res, next) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      const err = new Error('source and destination are required');
      err.statusCode = 400;
      return next(err);
    }

    const srcStation = STATIONS.find(s => s.name === source);
    const destStation = STATIONS.find(s => s.name === destination);

    if (!srcStation || !destStation) {
      const err = new Error('Invalid station name');
      err.statusCode = 400;
      return next(err);
    }

    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();

    const routes = [];

    // ── Route 1: Direct route (current time) ──
    const directRoute = buildRoute(
      'Direct Route',
      srcStation, destStation,
      currentHour, dayOfWeek
    );
    routes.push(directRoute);

    // ── Route 2: Via interchange (if on different lines) ──
    const sameLine = srcStation.line === destStation.line;
    if (!sameLine) {
      // Pick the nearest interchange station to minimize detour
      let bestInterchange = null;
      let bestTotalDist = Infinity;

      for (const interchangeName of INTERCHANGE_STATIONS) {
        const interchangeStation = STATIONS.find(s => s.name === interchangeName);
        if (!interchangeStation) continue;
        const leg1 = haversine(srcStation.lat, srcStation.lng, interchangeStation.lat, interchangeStation.lng);
        const leg2 = haversine(interchangeStation.lat, interchangeStation.lng, destStation.lat, destStation.lng);
        const total = leg1 + leg2;
        if (total < bestTotalDist) {
          bestTotalDist = total;
          bestInterchange = interchangeName;
        }
      }

      if (bestInterchange) {
        const interchangeRoute = buildRoute(
          'Via Interchange',
          srcStation, destStation,
          currentHour, dayOfWeek,
          bestTotalDist,
          bestInterchange
        );
        routes.push(interchangeRoute);
      }
    } else {
      // Same line — offer an interchange route as a scenic alternative
      const interchange = INTERCHANGE_STATIONS[0];
      const interchangeRoute = buildRoute(
        'Scenic Route',
        srcStation, destStation,
        currentHour, dayOfWeek,
        0,
        interchange
      );
      routes.push(interchangeRoute);
    }

    // ── Route 3: Off-peak alternative (shift +/- 1 hour) ──
    const altHour = currentHour >= 17 ? currentHour - 2 : currentHour + 1;
    const clampedHour = Math.max(6, Math.min(22, altHour)); // metro hours: 6am-10pm
    const altRoute = buildRoute(
      `Off-Peak (${clampedHour}:00)`,
      srcStation, destStation,
      clampedHour, dayOfWeek
    );
    routes.push(altRoute);

    // ── Fetch crowd predictions for all routes in parallel ──
    const crowdPromises = routes.map(r =>
      getCrowdPrediction(r.source, r.hour, dayOfWeek)
    );
    const crowds = await Promise.all(crowdPromises);

    // Attach crowd predictions
    routes.forEach((r, i) => {
      r.crowdBucket = crowds[i];
    });

    // ── Determine recommended route ──
    // Priority: lowest crowd, then shortest time, then cheapest fare
    const crowdScore = { Low: 0, Medium: 1, High: 2 };
    const sorted = [...routes].sort((a, b) => {
      const crowdDiff = (crowdScore[a.crowdBucket] || 1) - (crowdScore[b.crowdBucket] || 1);
      if (crowdDiff !== 0) return crowdDiff;
      return a.estimatedMinutes - b.estimatedMinutes;
    });

    // Mark exactly one route as recommended
    routes.forEach(r => { r.isRecommended = false; });
    const recommended = sorted[0];
    const match = routes.find(r => r.label === recommended.label);
    if (match) match.isRecommended = true;

    res.json({
      success: true,
      routes,
      source,
      destination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { compareRoutes };
