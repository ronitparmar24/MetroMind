require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const Ticket = require('../models/Ticket.model');
const User = require('../models/User.model');

mongoose.connect(MONGO_URI).then(async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [rev] = await Ticket.aggregate([
    { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, revenue: { $sum: '$fare' }, count: { $sum: 1 }, avg: { $avg: '$fare' } } }
  ]);
  console.log('This month revenue:', JSON.stringify(rev, null, 2));

  const revenueByDay = await Ticket.aggregate([
    { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, dailyRevenue: { $sum: '$fare' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log('Revenue by day:');
  revenueByDay.forEach(d => console.log(' ', d._id, '- ₹', d.dailyRevenue, '(', d.count, 'tickets)'));

  const total = await Ticket.countDocuments();
  const users = await User.countDocuments();
  console.log('\nTotal tickets in DB:', total);
  console.log('Total users in DB:', users);
  mongoose.disconnect();
}).catch(console.error);
