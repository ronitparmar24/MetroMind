const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, requireAdmin } = require('../middleware/auth.middleware');
const User = require('../models/User.model');
const Ticket = require('../models/Ticket.model');
const Wallet = require('../models/Wallet.model');
const Feedback = require('../models/Feedback.model');
const LostFound = require('../models/LostFound.model');
const Announcement = require('../models/Announcement.model');
const SystemSetting = require('../models/SystemSetting.model');
const Transaction = require('../models/Transaction.model');
const MetroCard = require('../models/MetroCard.model');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Apply both auth and admin check to ALL routes in this file
router.use(protect, requireAdmin);

// FSD Admin Endpoints

// 1. User Management
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const query = search
      ? { $or: [{ name: { $regex: escapeRegex(search), $options: 'i' } }, { email: { $regex: escapeRegex(search), $options: 'i' } }] }
      : {};
    if (role === 'user' || role === 'admin') query.role = role;

    const users = await User.find(query)
      .select('name email role isActive createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const rideCount = await Ticket.countDocuments({ userId: user._id, status: { $in: ['upcoming', 'completed'] } });
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

// 1b. Export users as CSV
router.get('/users/export', async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email phone role isActive isVerified authProvider createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const csvCell = (v) => {
      const str = v === undefined || v === null ? '' : String(v);
      // Quote everything and neutralise spreadsheet formula injection
      const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const header = ['Name', 'Email', 'Phone', 'Role', 'Active', 'Verified', 'Auth Provider', 'Joined'];
    const rows = users.map((u) => [
      u.name, u.email, u.phone, u.role, u.isActive !== false, u.isVerified, u.authProvider,
      u.createdAt ? new Date(u.createdAt).toISOString() : '',
    ].map(csvCell).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="metromind_users.csv"');
    res.send([header.map(csvCell).join(','), ...rows].join('\r\n'));
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
    const { status, dateFrom, dateTo, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (search && search.trim()) {
      const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
      const matchedUsers = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').lean();
      query.$or = [
        { userId: { $in: matchedUsers.map((u) => u._id) } },
        { ticketId: rx },
        { source: rx },
        { destination: rx },
      ];
    }
    if (dateFrom || dateTo) {
      query.travelDate = {};
      if (dateFrom) query.travelDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setUTCHours(23, 59, 59, 999);
        query.travelDate.$lte = toDate;
      }
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

// 3b. Admin cancel ticket — full refund to the passenger's wallet
router.patch('/tickets/:id/cancel', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    if (ticket.status === 'cancelled') return res.status(400).json({ success: false, error: 'Ticket already cancelled' });
    if (ticket.status === 'completed') return res.status(400).json({ success: false, error: 'Cannot cancel a completed ticket' });

    // Atomic status change so a double click can't refund twice
    const claimed = await Ticket.findOneAndUpdate(
      { _id: ticket._id, status: 'upcoming' },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!claimed) return res.status(400).json({ success: false, error: 'Ticket is no longer upcoming' });

    const refundAmount = ticket.fare || 0;
    let newBalance = null;
    if (refundAmount > 0) {
      let target = null;
      if (ticket.paymentMethod === 'metrocard') {
        target = await MetroCard.findOneAndUpdate({ userId: ticket.userId, isActive: true }, { $inc: { balance: refundAmount } }, { new: true });
      }
      const wallet = target
        ? await Wallet.findOne({ userId: ticket.userId })
        : await Wallet.findOneAndUpdate({ userId: ticket.userId }, { $inc: { balance: refundAmount } }, { new: true, upsert: true });
      newBalance = target ? target.balance : wallet.balance;
      await Transaction.create({
        userId: ticket.userId,
        type: 'credit',
        amount: refundAmount,
        balance: wallet ? wallet.balance : 0,
        ref: ticket.ticketId,
        note: `Refund to ${target ? 'Metro Card' : 'Wallet'} (cancelled by admin): ${ticket.source} → ${ticket.destination}`,
      });
    }

    res.json({ success: true, data: claimed, refundAmount, newBalance });
  } catch (error) {
    console.error('admin cancel ticket error:', error);
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
    const pendingFeedback = await Feedback.find({ resolved: { $ne: true } })
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

// 6b. Resolve Feedback
router.patch('/feedback/:id/resolve', async (req, res) => {
  try {
    const item = await Feedback.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, error: 'Feedback not found' });
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

// ML Admin endpoints — try Python proxy first, fall back to Node-native ML service
const { DJANGO_API_URL } = require('../config/env');
const PYTHON_API_URL = DJANGO_API_URL || 'http://127.0.0.1:8000';
const mlService = require('../services/ml.service');

// Helper: try Python proxy, fall back to Node-native ML service
const createMLRoute = (path, nodeFallbackFn) => {
  router.get(path, async (req, res) => {
    // Try Python proxy first
    try {
      const response = await axios.get(`${PYTHON_API_URL}/api/analytics/admin${path}`, {
        headers: { 'X-Internal-Secret': process.env.ADMIN_PROXY_SECRET },
        timeout: 4000,
      });
      return res.json(response.data);
    } catch (_proxyErr) {
      // Python unreachable — use Node-native ML service
    }

    // Node-native fallback
    try {
      const result = nodeFallbackFn();
      if (result) return res.json(result);
    } catch (e) {
      console.error(`ML fallback error for ${path}:`, e.message);
    }

    res.status(503).json({ error: 'ML data unavailable', offline: true });
  });
};

createMLRoute('/model-performance/', () => mlService.getModelPerformance());
createMLRoute('/prediction-volume/', () => mlService.getPredictionVolume());
createMLRoute('/feature-drift/',     () => mlService.getFeatureDrift());
createMLRoute('/network-summary/',   () => mlService.getNetworkSummary());

// ==========================================
// Announcements Management
// ==========================================

// Get all announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Create announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, message, priority, isActive } = req.body;
    const announcement = await Announcement.create({ title, message, priority, isActive });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, message, priority, isActive } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, message, priority, isActive },
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, error: 'Announcement not found' });
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Announcement not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// System Settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting({});
    }
    
    const allowed = ['maintenanceMode', 'maxWalletBalance', 'ticketCancellationWindow', 'supportEmailAlerts'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    });
    
    await settings.save();
    res.json({ success: true, data: settings });
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

module.exports = router;
