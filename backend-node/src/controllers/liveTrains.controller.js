// backend-node/src/controllers/liveTrains.controller.js
// Generates simulated live departure data with ML-driven delay prediction.
// Delays are injected when crowd prediction is 'High', weighted by confidence.

const STATIONS = require('../constants/stations');
const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');

// Interchange stations connecting Blue <-> Red lines
const INTERCHANGE_STATIONS = ['Old High Court', 'Kalupur Railway Station'];
const CONNECTION_BUFFER = 4; // minutes needed to transfer at interchange

/**
 * Call Django ML for crowd prediction; graceful fallback to Node-native ML.
 * Returns { bucket, confidence }
 */
const getCrowdPrediction = async (station, hour, day) => {
  // Try Django first
  try {
    const res = await axios.post(`${DJANGO_API_URL}/api/predict/`, {
      station,
      hour: parseInt(hour, 10),
      day: parseInt(day, 10),
      passengers: 1,
    }, { timeout: 4000 });
    return {
      bucket: res.data.bucket || res.data.predicted_bucket || 'Medium',
      confidence: res.data.confidence || 50,
    };
  } catch (_) {}
  // Node-native fallback
  try {
    const mlService = require('../services/ml.service');
    const result = mlService.predictCrowd({
      station, hour: parseInt(hour, 10), day: parseInt(day, 10), passengers: 1,
    });
    return { bucket: result.bucket || 'Medium', confidence: result.confidence || 50 };
  } catch (_) {
    return { bucket: 'Medium', confidence: 50 };
  }
};

/**
 * Generate next 5 simulated departures from a station.
 * Spacing: every 8 minutes (realistic metro headway).
 */
const generateDepartures = (station) => {
  const now = new Date();
  const stationData = STATIONS.find(s => s.name === station);
  const line = stationData?.line || 'blue';
  const lineStations = STATIONS.filter(s => s.line === line);
  const stationIndex = lineStations.findIndex(s => s.name === station);

  const departures = [];
  for (let i = 0; i < 5; i++) {
    const depTime = new Date(now.getTime() + (i + 1) * 8 * 60 * 1000); // every 8 min
    const direction = i % 2 === 0 ? 1 : -1; // alternating directions
    const nextIdx = stationIndex + direction;
    const destIdx = Math.max(0, Math.min(lineStations.length - 1, nextIdx));

    // Terminal station (last stop on the line in this direction)
    const terminalIdx = direction === 1 ? lineStations.length - 1 : 0;
    const terminal = lineStations[terminalIdx]?.name || lineStations[0].name;

    // Check if route passes through an interchange
    const passesInterchange = INTERCHANGE_STATIONS.find(ic => {
      const icIdx = lineStations.findIndex(s => s.name === ic);
      if (icIdx === -1) return false;
      // Passes through if interchange is between current station and terminal
      if (direction === 1) return icIdx > stationIndex && icIdx <= terminalIdx;
      return icIdx < stationIndex && icIdx >= terminalIdx;
    });

    departures.push({
      trainId: `${line === 'blue' ? 'BL' : 'RL'}-${(stationIndex * 10 + i + 1).toString().padStart(3, '0')}`,
      line,
      departureTime: depTime.toISOString(),
      departureDisplay: depTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      nextStation: lineStations[destIdx]?.name || station,
      terminal,
      passesInterchange: passesInterchange || null,
    });
  }
  return departures;
};

// GET /api/live-trains/:station
const getLiveTrains = async (req, res, next) => {
  try {
    const { station } = req.params;

    if (!station) {
      const err = new Error('Station name is required');
      err.statusCode = 400;
      return next(err);
    }

    const stationData = STATIONS.find(s => s.name === station);
    if (!stationData) {
      const err = new Error(`Station "${station}" not found`);
      err.statusCode = 404;
      return next(err);
    }

    const departures = generateDepartures(station);
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Get crowd predictions for each departure's hour in parallel
    const predictions = await Promise.all(
      departures.map(d => {
        const depHour = new Date(d.departureTime).getHours();
        return getCrowdPrediction(station, depHour, dayOfWeek);
      })
    );

    // Attach delay and ripple warning based on ML predictions
    const enrichedDepartures = departures.map((dep, i) => {
      const { bucket, confidence } = predictions[i];
      let delay = 0;
      let rippleWarning = null;

      // High crowd → simulated delay weighted by confidence
      if (bucket === 'High') {
        // Scale: confidence 50-100 maps to delay 2-8 min
        const confNorm = Math.max(0, Math.min(1, (confidence - 50) / 50));
        delay = Math.round(2 + confNorm * 6); // 2-8 minutes
      }

      // Ripple warning: if delayed and route passes an interchange
      if (delay > 0 && dep.passesInterchange) {
        if (delay >= CONNECTION_BUFFER) {
          const nextSafeMin = delay + 8; // next train headway = 8 min
          rippleWarning = `Tight connection at ${dep.passesInterchange} — next safe train departs ${nextSafeMin} min later`;
        }
      }

      return {
        ...dep,
        crowdBucket: bucket,
        crowdConfidence: confidence,
        delay,
        isOnTime: delay === 0,
        rippleWarning,
      };
    });

    const onTimeCount = enrichedDepartures.filter(d => d.isOnTime).length;

    res.json({
      success: true,
      station,
      line: stationData.line,
      departures: enrichedDepartures,
      onTimeCount,
      totalDepartures: enrichedDepartures.length,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLiveTrains };
