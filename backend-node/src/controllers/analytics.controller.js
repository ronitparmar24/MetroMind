// backend-node/src/controllers/analytics.controller.js
const Ticket = require('../models/Ticket.model');
const Transaction = require('../models/Transaction.model');
const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');

// GET /api/analytics/weekly-digest
const getWeeklyDigest = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const tickets = await Ticket.find({
      userId: req.user._id,
      createdAt: { $gte: oneWeekAgo },
    });

    const totalTrips = tickets.length;
    const totalSpent = tickets.reduce((sum, t) => sum + t.fare, 0);
    const totalDistance = tickets.reduce((sum, t) => sum + t.distance, 0);
    const totalCO2 = tickets.reduce((sum, t) => sum + t.co2Saved, 0);

    // Most used route
    const routeCount = {};
    tickets.forEach((t) => {
      const route = `${t.source} → ${t.destination}`;
      routeCount[route] = (routeCount[route] || 0) + 1;
    });
    const topRoute = Object.entries(routeCount).sort((a, b) => b[1] - a[1])[0];

    // Peak vs off-peak split
    const peakTrips = tickets.filter((t) => t.isPeak).length;

    res.json({
      success: true,
      digest: {
        period: '7 days',
        totalTrips,
        totalSpent,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalCO2Saved: Math.round(totalCO2 * 1000) / 1000,
        topRoute: topRoute ? { route: topRoute[0], count: topRoute[1] } : null,
        peakTrips,
        offPeakTrips: totalTrips - peakTrips,
        avgFarePerTrip: totalTrips > 0 ? Math.round(totalSpent / totalTrips) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/spending
const getSpending = async (req, res, next) => {
  try {
    // Get last 30 days of transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const transactions = await Transaction.find({
      userId: req.user._id,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    // Daily spending aggregation
    const dailySpending = {};
    transactions
      .filter((t) => t.type === 'debit')
      .forEach((t) => {
        const day = t.createdAt.toISOString().slice(0, 10);
        dailySpending[day] = (dailySpending[day] || 0) + t.amount;
      });

    // Tickets for cab vs metro comparison
    const tickets = await Ticket.find({
      userId: req.user._id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const totalMetroCost = tickets.reduce((sum, t) => sum + t.fare, 0);
    // Cab fare estimate: ₹12/km (Ahmedabad average auto/cab rate)
    const totalCabCost = tickets.reduce((sum, t) => sum + t.distance * 12, 0);
    const savings = Math.round(totalCabCost - totalMetroCost);

    res.json({
      success: true,
      spending: {
        dailySpending,
        totalMetroCost,
        totalCabCost: Math.round(totalCabCost),
        savings,
        savingsPercent: totalCabCost > 0 ? Math.round((savings / totalCabCost) * 100) : 0,
        totalTrips: tickets.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/heatmap — proxies to Django
const getHeatmap = async (req, res, next) => {
  try {
    const response = await axios.get(`${DJANGO_API_URL}/api/analytics/heatmap/`);
    res.json({ success: true, heatmap: response.data });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.json({ success: true, heatmap: {}, fallback: true });
    }
    next(error);
  }
};

module.exports = { getWeeklyDigest, getSpending, getHeatmap };
