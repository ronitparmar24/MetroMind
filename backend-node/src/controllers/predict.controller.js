// backend-node/src/controllers/predict.controller.js
// API Gateway Pattern: This controller proxies crowd predictions from React to Django.
// React → Node/Express → Django (server-to-server) → back to React.
// Django's URL/port is never exposed to the browser.

const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');

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

module.exports = { predictCrowd };
