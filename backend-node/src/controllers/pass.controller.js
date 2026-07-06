// backend-node/src/controllers/pass.controller.js
const MonthlyPass = require('../models/MonthlyPass.model');
const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');

const PLAN_PRICES = {
  '7day': 200,
  'monthly': 700,
  'quarterly': 1800,
};

const PLAN_DURATIONS = {
  '7day': 7,
  'monthly': 30,
  'quarterly': 90,
};

// GET /api/pass
const getPass = async (req, res, next) => {
  try {
    const pass = await MonthlyPass.findOne({
      userId: req.user._id,
      status: 'active',
    });

    res.json({
      success: true,
      pass: pass || null,
      plans: PLAN_PRICES,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/pass/buy
const buyPass = async (req, res, next) => {
  try {
    const { planType } = req.body;

    if (!PLAN_PRICES[planType]) {
      const err = new Error('Invalid plan type. Choose: 7day, monthly, or quarterly');
      err.statusCode = 400;
      return next(err);
    }

    // Check if already has an active pass
    const existing = await MonthlyPass.findOne({
      userId: req.user._id,
      status: 'active',
    });
    if (existing) {
      const err = new Error('You already have an active pass');
      err.statusCode = 400;
      return next(err);
    }

    const price = PLAN_PRICES[planType];

    // Check wallet
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < price) {
      const err = new Error(`Insufficient balance. Required: ₹${price}`);
      err.statusCode = 402;
      return next(err);
    }

    // Deduct from wallet
    wallet.balance -= price;
    await wallet.save();

    // Create pass
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + PLAN_DURATIONS[planType]);

    const pass = await MonthlyPass.create({
      userId: req.user._id,
      planType,
      startDate,
      endDate,
    });

    // Record transaction
    await Transaction.create({
      userId: req.user._id,
      type: 'debit',
      amount: price,
      balance: wallet.balance,
      ref: `PASS-${pass._id}`,
      note: `${planType} pass purchased`,
    });

    res.status(201).json({
      success: true,
      pass,
      newBalance: wallet.balance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPass, buyPass };
