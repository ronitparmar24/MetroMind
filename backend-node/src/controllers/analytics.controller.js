// backend-node/src/controllers/analytics.controller.js
const Ticket = require('../models/Ticket.model');
const Transaction = require('../models/Transaction.model');
const axios = require('axios');
const { DJANGO_API_URL } = require('../config/env');
const { generateWeeklyDigestText, generatePersonalityDescription } = require('../services/gemini.service');
const { generateCarbonPassportPDF } = require('../utils/pdfReport');

// GET /api/analytics/weekly-digest
const getWeeklyDigest = async (req, res, next) => {
  try {
    // ── Determine reference date (anchor to latest ticket) ──
    const latestTicket = await Ticket.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    const anchorDate = latestTicket ? latestTicket.createdAt : new Date();
    
    // One week before anchor
    const oneWeekAgo = new Date(anchorDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tickets = await Ticket.find({
      userId: req.user._id,
      createdAt: { $gte: oneWeekAgo, $lte: anchorDate },
    });

    let totalTrips    = tickets.length;
    let totalSpent    = tickets.reduce((sum, t) => sum + (t.fare || 0), 0);
    let totalDistance = tickets.reduce((sum, t) => sum + (t.distance || 0), 0);
    let totalCO2      = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
    let cabSavings = Math.round(tickets.reduce((sum, t) => sum + ((t.distance || 0) * 12), 0) - totalSpent);

    let topRouteEntry = null;
    let peakTrips = tickets.filter((t) => t.isPeak).length;
    let offPeakTrips = totalTrips - peakTrips;

    // ── Handle Zero Data with Realistic Mock ───────────────────────────
    if (totalTrips === 0) {
      totalTrips = Math.floor(Math.random() * 8) + 5; // 5 to 12
      totalSpent = Math.round(totalTrips * (30 + Math.random() * 20)); // ~30-50 per trip
      totalDistance = Math.round(totalTrips * (5 + Math.random() * 10) * 10) / 10;
      totalCO2 = Math.round(totalDistance * 0.09 * 1000) / 1000;
      cabSavings = Math.round((totalDistance * 12) - totalSpent);
      
      topRouteEntry = ['Thaltej ➝ Kalupur Railway Station', Math.floor(totalTrips / 2)];
      peakTrips = Math.floor(totalTrips * 0.7);
      offPeakTrips = totalTrips - peakTrips;
    } else {
      // Real data Most used route
      const routeCount = {};
      tickets.forEach((t) => {
        const route = `${t.source} ➝ ${t.destination}`;
        routeCount[route] = (routeCount[route] || 0) + 1;
      });
      const sorted = Object.entries(routeCount).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) topRouteEntry = sorted[0];
    }

    const offPeakRatio = totalTrips > 0 ? Math.round((offPeakTrips / totalTrips) * 100) : 0;

    // Trips per weekday, Mon..Sun (IST), used by the "Trips By Day" chart
    const dailyTrips = [0, 0, 0, 0, 0, 0, 0];
    if (tickets.length > 0) {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      tickets.forEach((t) => {
        const when = new Date(t.travelDate || t.createdAt);
        if (Number.isNaN(when.getTime())) return;
        const jsDay = new Date(when.getTime() + IST_OFFSET_MS).getUTCDay(); // 0 = Sun
        dailyTrips[(jsDay + 6) % 7] += 1;
      });
    } else {
      for (let i = 0; i < totalTrips; i++) dailyTrips[Math.floor(Math.random() * 7)] += 1;
    }

    // ── Gemini AI Summary (cached per user per day) ──
    const aiStats = {
      tripCount:       totalTrips,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
      totalSpent:      Math.round(totalSpent),
      cabSavings:      Math.max(0, cabSavings),
      co2Saved:        Math.round(totalCO2 * 1000) / 1000,
      topRoute:        topRouteEntry ? topRouteEntry[0] : null,
      offPeakRatio,
    };

    let aiSummary = await generateWeeklyDigestText(req.user._id.toString(), aiStats);

    // If mocked data, override AI insight to indicate it's a preview
    if (tickets.length === 0) {
      aiSummary = "✨ Welcome! Here's a preview of your potential Weekly Digest. Book your first trip to start tracking real stats!";
    }

    res.json({
      success: true,
      digest: {
        period: '7 days',
        totalTrips,
        totalSpent,
        totalDistance:    Math.round(totalDistance * 100) / 100,
        totalCO2Saved:    Math.round(totalCO2 * 1000) / 1000,
        topRoute:         topRouteEntry ? { route: topRouteEntry[0], count: topRouteEntry[1] } : null,
        peakTrips,
        offPeakTrips,
        offPeakRatio,
        dailyTrips,
        avgFarePerTrip:   totalTrips > 0 ? Math.round(totalSpent / totalTrips) : 0,
        cabSavings:       Math.max(0, cabSavings),
        aiSummary,
        aiGenerated: true,
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
        // Bucket by IST calendar day (the frontend builds local-date keys)
        const day = new Date(t.createdAt.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
        dailySpending[day] = (dailySpending[day] || 0) + t.amount;
      });

    // Tickets for cab vs metro comparison
    const tickets = await Ticket.find({
      userId: req.user._id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const totalMetroCost = tickets.reduce((sum, t) => sum + t.fare, 0);
    // Cab fare estimate: ₹50 base + ₹15/km. If distance is 0 (old data), estimate based on fare or default to 5km.
    const totalCabCost = tickets.reduce((sum, t) => {
      let dist = t.distance;
      if (!dist || dist === 0) {
        // Fallback for old tickets: ~5km
        dist = 5;
      }
      return sum + (50 + dist * 15);
    }, 0);
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

// GET /api/analytics/heatmap — proxies to Django, falls back to Node ML service
const getHeatmap = async (req, res, next) => {
  const mlService = require('../services/ml.service');
  try {
    const response = await axios.get(`${DJANGO_API_URL}/api/analytics/heatmap/`, { timeout: 5000 });
    return res.json({ success: true, heatmap: response.data });
  } catch (_) {
    // Python unreachable — use Node-native ML service
  }
  try {
    const heatmapData = mlService.getHeatmap();
    if (heatmapData) return res.json({ success: true, heatmap: heatmapData });
  } catch (_) {}
  res.json({ success: true, heatmap: {}, fallback: true });
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
      let hour = parseInt(ticket.travelTime.split(':')[0], 10);
      if (ticket.travelTime.includes('PM') && hour !== 12) {
        hour += 12;
      } else if (ticket.travelTime.includes('AM') && hour === 12) {
        hour = 0;
      }
      
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

    // ── Gemini AI personality description (cached per user per day) ───
    const aiDescription = await generatePersonalityDescription(
      req.user._id.toString(),
      personality.type,
      stats,
    );

    res.json({
      success: true,
      personality: {
        ...personality,
        // Replace static description with Gemini-generated one;
        // keep original as fallback field in case frontend needs it
        description:   aiDescription,
        aiDescription,
        aiGenerated:   true,
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

// GET /api/analytics/station-profile/:station
// Merges Django's global station stats with Node's per-user personal trip count
const getStationProfile = async (req, res, next) => {
  try {
    const { station } = req.params;

    // Always get personal trip count from MongoDB — this never depends on Django
    const personalCount = await Ticket.countDocuments({
      userId: req.user._id,
      $or: [{ source: station }, { destination: station }],
      status: { $in: ['completed', 'upcoming'] },
    });

    // Try Django for global ML stats — if unavailable, return graceful fallback
    let djangoData = null;
    try {
      const djangoRes = await axios.get(
        `${DJANGO_API_URL}/api/analytics/station-profile/${encodeURIComponent(station)}/`,
        { timeout: 5000 }
      );
      djangoData = djangoRes.data;
    } catch (djangoErr) {
      // Django offline, connection refused, or no dataset for this station — all handled the same way
      // Return a partial profile with just the personal trip data
      return res.json({
        success: true,
        fallback: true,
        profile: {
          station,
          personalTripCount: personalCount,
          // Synthetic crowd data so the UI always has something to show
          hourlyAvgCrowd: buildSyntheticHourly(),
          busiestDay: null,
          stationRank: null,
          weekdayWeekend: null,
        },
      });
    }

    res.json({
      success: true,
      profile: { ...djangoData, personalTripCount: personalCount },
    });
  } catch (error) {
    next(error);
  }
};

/** Build plausible synthetic hourly crowd distribution when ML service is offline */
function buildSyntheticHourly() {
  const peaks = new Set([8, 9, 17, 18, 19]);
  const semi  = new Set([10, 16, 20]);
  const result = {};
  for (let h = 6; h <= 22; h++) {
    let base = 25 + Math.random() * 30;
    if (peaks.has(h))  base = 120 + Math.random() * 60;
    else if (semi.has(h)) base = 65 + Math.random() * 40;
    result[String(h)] = Math.round(base);
  }
  return result;
}

// GET /api/analytics/network-pulse
// Proxy to Django, falls back to Node-native ML service
const getNetworkPulse = async (req, res, next) => {
  const mlService = require('../services/ml.service');
  try {
    const response = await axios.get(`${DJANGO_API_URL}/api/analytics/network-pulse/`, { timeout: 5000 });
    return res.json({ success: true, pulse: response.data });
  } catch (_) {
    // Python unreachable — use Node-native ML service
  }
  try {
    const pulseData = mlService.getNetworkPulse();
    if (pulseData) return res.json({ success: true, pulse: pulseData });
  } catch (_) {}
  res.json({ success: true, pulse: {}, fallback: true });
};

// GET /api/analytics/carbon-passport/pdf  (protected)
// Assembles a full Carbon Passport PDF with an embedded CO2 chart.
const getCarbonPassportPDF = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── 1. All-time totals ──────────────────────────────────────
    const tickets = await Ticket.find({
      userId,
      status: { $in: ['completed', 'upcoming'] },
    });

    const totalCO2      = tickets.reduce((s, t) => s + (t.co2Saved  || 0), 0);
    const totalDistance = tickets.reduce((s, t) => s + (t.distance  || 0), 0);
    const totalTrips    = tickets.length;
    const treesEquivalent = (totalCO2 / 21).toFixed(1);

    // ── 2. Monthly CO2 for the last 6 months ───────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRaw = await Ticket.aggregate([
      { $match: { userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          co2: { $sum: '$co2Saved' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill any missing months with 0
    const monthlyMap = {};
    monthlyRaw.forEach(m => { monthlyMap[m._id] = m.co2; });
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.push({ month: key, co2: monthlyMap[key] || 0 });
    }
    monthlyData.sort((a, b) => (a.month > b.month ? 1 : -1));

    // ── 3. Generate PDF ────────────────────────────────────────
    const pdfBuffer = await generateCarbonPassportPDF({
      user:          { name: req.user.name, email: req.user.email },
      totalCO2,
      totalDistance,
      totalTrips,
      treesEquivalent,
      monthlyData,
    });

    // ── 4. Stream to client ────────────────────────────────────
    const filename = `MetroMind_CarbonPassport_${req.user.name?.replace(/\s+/g, '_') || 'user'}.pdf`;
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeeklyDigest, getSpending, getHeatmap, getPersonality, getLeaderboard, getStationProfile, getNetworkPulse, getCarbonPassportPDF };
