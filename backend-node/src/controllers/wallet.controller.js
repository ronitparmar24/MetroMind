// backend-node/src/controllers/wallet.controller.js
const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');
const { bookingBus } = require('../events/bookingEvents');

// GET /api/wallet
const getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
    }

    // Get recent transactions (last 10)
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // ── Predictive low-balance warning ──
    // Aggregate last 4 weeks of debit transactions
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const debitAgg = await Transaction.aggregate([
      {
        $match: {
          userId: wallet.userId,
          type: 'debit',
          createdAt: { $gte: fourWeeksAgo },
        },
      },
      { $group: { _id: null, totalDebits: { $sum: '$amount' } } },
    ]);

    const totalDebits = debitAgg.length > 0 ? debitAgg[0].totalDebits : 0;
    const avgWeeklySpend = Math.round((totalDebits / 4) * 100) / 100; // average over 4 weeks
    const dailySpendRate = avgWeeklySpend / 7;
    const daysUntilEmpty = dailySpendRate > 0
      ? Math.floor(wallet.balance / dailySpendRate)
      : Infinity;
    const lowBalanceWarning = isFinite(daysUntilEmpty) && daysUntilEmpty <= 3;

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
      recentTransactions,
      prediction: {
        avgWeeklySpend,
        daysUntilEmpty: isFinite(daysUntilEmpty) ? daysUntilEmpty : null,
        lowBalanceWarning,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/wallet/topup
const topupWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      const err = new Error('Amount must be greater than 0');
      err.statusCode = 400;
      return next(err);
    }

    if (amount > 10000) {
      const err = new Error('Maximum topup amount is ₹10,000');
      err.statusCode = 400;
      return next(err);
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
    }

    wallet.balance += amount;
    await wallet.save();

    // Record transaction
    await Transaction.create({
      userId: req.user._id,
      type: 'credit',
      amount,
      balance: wallet.balance,
      ref: `TOPUP-${Date.now()}`,
      note: 'Wallet top-up',
    });

    // Emit topup event
    bookingBus.emit('topup', {
      userId: req.user._id,
      amount,
      newBalance: wallet.balance,
    });

    res.json({
      success: true,
      message: `₹${amount} added to wallet`,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWallet, topupWallet };
