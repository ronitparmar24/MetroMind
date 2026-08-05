const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, requireAdmin } = require('../middleware/auth.middleware');
const User = require('../models/User.model');
const Ticket = require('../models/Ticket.model');
const Wallet = require('../models/Wallet.model');
const Feedback = require('../models/Feedback.model');
const LostFound = require('../models/LostFound.model');

// Apply both auth and admin check to ALL routes in this file
router.use(protect, requireAdmin);

// FSD Admin Endpoints

// 1. User Management
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';

    const query = search 
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const users = await User.find(query)
      .select('name email role isActive createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const rideCount = await Ticket.countDocuments({ userId: user._id, status: { $in: ['used', 'active', 'completed'] } });
      const wallet = await Wallet.findOne({ userId: user._id }).lean();
      return { ...user, rideCount, walletBalance: wallet ? wallet.balance : 0 };
    }));

    res.json({
      success: true,
      data: enrichedUsers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 2. Toggle User Status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('name email role isActive');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 3. Tickets Oversight
router.get('/tickets', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { status, dateFrom, dateTo } = req.query;

    let query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const tickets = await Ticket.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 4. Revenue Summary — supports ?range=week|month|year (default: month)
router.get('/revenue-summary', async (req, res) => {
  try {
    const range = req.query.range || 'month';
    const now = new Date();

    let startDate;
    if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6); // last 7 days
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
    } else {
      // month (default)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Revenue stats (non-cancelled only)
    const revenueStats = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$fare' }, avgFare: { $avg: '$fare' }, count: { $sum: 1 } } }
    ]);

    // Cancellation stats (all tickets in range)
    const cancellationStats = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
      }}
    ]);
    const statusMap = {};
    cancellationStats.forEach(s => { statusMap[s._id] = s.count; });
    const totalInRange = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const cancelledInRange = statusMap['cancelled'] || 0;

    // Revenue grouped by day (for week/month) or by month (for year)
    let revenueByDay;
    if (range === 'year') {
      revenueByDay = await Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            dailyRevenue: { $sum: '$fare' },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);
    } else {
      revenueByDay = await Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            dailyRevenue: { $sum: '$fare' },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);
    }

    // Top routes (all time)
    const topRoutes = await Ticket.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: { source: '$source', dest: '$destination' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, route: { $concat: ['$_id.source', ' → ', '$_id.dest'] }, count: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        range,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averageFare: revenueStats[0]?.avgFare || 0,
        totalBookings: revenueStats[0]?.count || 0,
        totalInRange,
        cancelledInRange,
        cancelRate: totalInRange > 0 ? Math.round((cancelledInRange / totalInRange) * 100) : 0,
        successRate: totalInRange > 0 ? Math.round(((totalInRange - cancelledInRange) / totalInRange) * 100) : 100,
        revenueByDay,
        topRoutes
      }
    });
  } catch (error) {
    console.error('revenue-summary error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 5. Support Queue
router.get('/support-queue', async (req, res) => {
  try {
    const pendingFeedback = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const pendingLostFound = await LostFound.find({ status: { $in: ['reported', 'found'] } })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const queue = [
      ...pendingFeedback.map(f => ({ ...f, queueType: 'feedback' })),
      ...pendingLostFound.map(lf => ({ ...lf, queueType: 'lost_found' }))
    ].sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 6. Resolve Lost & Found
router.patch('/lostfound/:id/resolve', async (req, res) => {
  try {
    const item = await LostFound.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Sample admin endpoint
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Admin Panel',
    data: {
      activeUsers: 145,
      systemHealth: 'Online'
    }
  });
});

// Proxy helper for Python ML endpoints
const PYTHON_API_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

const createProxyRoute = (path) => {
  router.get(path, async (req, res) => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/api/analytics/admin${path}`, {
        headers: {
          'X-Internal-Secret': process.env.ADMIN_PROXY_SECRET
        }
      });
      res.json(response.data);
    } catch (error) {
      console.error(`Proxy error for ${path}:`, error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Proxy request failed' });
    }
  });
};

createProxyRoute('/model-performance/');
createProxyRoute('/prediction-volume/');
createProxyRoute('/feature-drift/');
createProxyRoute('/network-summary/');

module.exports = router;
