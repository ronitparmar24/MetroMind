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

// Personality type definitions
const PERSONALITIES = {
  earlyBird: {
    type: 'The Early Bird',
    icon: 'sunrise',
    description: 'You beat the rush every time — first train, best seats.',
  },
  rushHour: {
    type: 'The Rush Hour Warrior',
    icon: 'zap',
    description: "Peak hours don't scare you. You've mastered the crowd.",
  },
  weekend: {
    type: 'The Weekend Explorer',
    icon: 'compass',
    description: 'Your metro life comes alive on weekends.',
  },
  smart: {
    type: 'The Smart Commuter',
    icon: 'brain',
    description: 'You consistently dodge crowded slots. Efficient.',
  },
  balanced: {
    type: 'The Balanced Traveler',
    icon: 'scale',
    description: 'No fixed pattern — you go where the day takes you.',
  },
};

// GET /api/analytics/personality
const getPersonality = async (req, res, next) => {
  try {
    const completedTickets = await Ticket.find({
      userId: req.user._id,
      status: 'completed',
    });

    const total = completedTickets.length;

    // Minimum 5 completed tickets required
    if (total < 5) {
      return res.json({
        success: true,
        personality: {
          type: 'Newcomer',
          icon: 'lock',
          description: 'Take more trips to unlock your commute personality!',
          message: `${total}/5 trips to unlock`,
          tripsCompleted: total,
          tripsRequired: 5,
        },
      });
    }

    // Compute ratios from completed tickets
    let earlyCount = 0;
    let rushCount = 0;
    let weekendCount = 0;
    let smartCount = 0;

    completedTickets.forEach((ticket) => {
      const hour = parseInt(ticket.travelTime.split(':')[0], 10);
      const travelDay = new Date(ticket.travelDate).getDay(); // 0=Sun, 6=Sat

      // Early bird: trips before 9am
      if (hour < 9) earlyCount++;

      // Rush hour: 8-10am or 5-8pm
      if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) rushCount++;

      // Weekend: Saturday (6) or Sunday (0)
      if (travelDay === 0 || travelDay === 6) weekendCount++;

      // Smart: avoided High crowd
      if (ticket.crowdBucket !== 'High') smartCount++;
    });

    const stats = {
      earlyBirdRatio: Math.round((earlyCount / total) * 100) / 100,
      rushHourRatio: Math.round((rushCount / total) * 100) / 100,
      weekendRatio: Math.round((weekendCount / total) * 100) / 100,
      smartRatio: Math.round((smartCount / total) * 100) / 100,
    };

    // Determine personality using priority order
    let personality;
    if (stats.earlyBirdRatio > 0.6) {
      personality = PERSONALITIES.earlyBird;
    } else if (stats.rushHourRatio > 0.6) {
      personality = PERSONALITIES.rushHour;
    } else if (stats.weekendRatio > 0.5) {
      personality = PERSONALITIES.weekend;
    } else if (stats.smartRatio > 0.7) {
      personality = PERSONALITIES.smart;
    } else {
      personality = PERSONALITIES.balanced;
    }

    res.json({
      success: true,
      personality: {
        ...personality,
        stats,
        totalTrips: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    // Aggregate CO2 saved across ALL users
    const allRankings = await Ticket.aggregate([
      { $match: { status: { $in: ['completed', 'upcoming'] } } },
      { $group: { _id: '$userId', totalCO2: { $sum: '$co2Saved' } } },
      { $sort: { totalCO2: -1 } },
    ]);

    // Top 5 with anonymized names
    const top5 = allRankings.slice(0, 5).map((entry, idx) => ({
      rank: idx + 1,
      name: `User #${entry._id.toString().slice(0, 4).toUpperCase()}`,
      userId: entry._id,
      totalCO2: Math.round(entry.totalCO2 * 1000) / 1000,
    }));

    // Current user's rank
    const currentUserId = req.user._id.toString();
    const currentUserEntry = allRankings.find(
      (e) => e._id.toString() === currentUserId
    );
    const currentUserCO2 = currentUserEntry
      ? Math.round(currentUserEntry.totalCO2 * 1000) / 1000
      : 0;

    // Rank = number of users with higher CO2 + 1
    const currentUserRank = currentUserEntry
      ? allRankings.filter((e) => e.totalCO2 > currentUserEntry.totalCO2).length + 1
      : allRankings.length + 1;

    // Check if current user is in top 5
    const isInTop5 = top5.some(
      (e) => e.userId.toString() === currentUserId
    );

    // Mark the current user's entry in top5
    const top5WithHighlight = top5.map((e) => ({
      ...e,
      isCurrentUser: e.userId.toString() === currentUserId,
      userId: undefined, // strip ObjectId from response
    }));

    res.json({
      success: true,
      top5: top5WithHighlight,
      currentUserRank,
      currentUserCO2,
      isInTop5,
      totalParticipants: allRankings.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeeklyDigest, getSpending, getHeatmap, getPersonality, getLeaderboard };
