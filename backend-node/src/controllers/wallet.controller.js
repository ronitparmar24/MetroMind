// backend-node/src/controllers/wallet.controller.js
const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');
const SystemSetting = require('../models/SystemSetting.model');
const { bookingBus } = require('../events/bookingEvents');

// GET /api/wallet
const getWallet = async (req, res, next) => {
  try {
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

    // ── Run all 3 DB operations in parallel ─────────────────────────────
    const [walletDoc, recentTransactions, debitAgg] = await Promise.all([
      Wallet.findOne({ userId: req.user._id }),
      Transaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            type: 'debit',
            createdAt: { $gte: fourWeeksAgo },
          },
        },
        { $group: { _id: null, totalDebits: { $sum: '$amount' } } },
      ]),
    ]);

    // Auto-create wallet if first visit
    let wallet = walletDoc;
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
    }

    // ── Predictive low-balance warning ─────────────────────────────────
    const totalDebits = debitAgg.length > 0 ? debitAgg[0].totalDebits : 0;
    const avgWeeklySpend = Math.round((totalDebits / 4) * 100) / 100;
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

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
    }

    const settings = await SystemSetting.findOne();
    const maxBalance = settings ? settings.maxWalletBalance : 10000;

    if (wallet.balance + amount > maxBalance) {
      const err = new Error(`Wallet balance cannot exceed ₹${maxBalance}`);
      err.statusCode = 400;
      return next(err);
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

// POST /api/wallet/convert-carbon
const convertCarbonToCash = async (req, res, next) => {
  try {
    const Ticket = require('../models/Ticket.model');
    const User = require('../models/User.model');

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Sum all CO2 saved
    const tickets = await Ticket.find({
      userId: user._id,
      status: { $in: ['completed', 'upcoming'] }
    });
    
    const totalCO2 = tickets.reduce((s, t) => s + (t.co2Saved || 0), 0);
    const claimedCO2 = user.claimedCO2 || 0;
    const unclaimedCO2 = totalCO2 - claimedCO2;

    const { amount } = req.body;
    
    // If no amount is provided, convert everything. Otherwise convert the requested cash amount.
    const rewardCash = amount ? Number(amount) : Number((unclaimedCO2 * 5).toFixed(2));
    const co2ToConvert = rewardCash / 5; // 1kg = ₹5

    if (co2ToConvert < 0.4 && !amount) {
      return res.status(400).json({ 
        success: false, 
        error: `Not enough unclaimed CO2. Minimum 400g (0.4 kg) required. You have ${(unclaimedCO2 * 1000).toFixed(0)}g.` 
      });
    }

    if (amount && (amount < 2)) {
        return res.status(400).json({ 
          success: false, 
          error: `Minimum conversion amount is ₹2.` 
        });
    }

    if (co2ToConvert > unclaimedCO2 + 0.001) { // small floating point tolerance
      return res.status(400).json({ 
        success: false, 
        error: `You don't have enough unclaimed CO2 to convert ₹${rewardCash}. Maximum allowed is ₹${(unclaimedCO2 * 5).toFixed(2)}.` 
      });
    }

    // Update Wallet
    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: user._id, balance: 0 });
    }
    
    wallet.balance += rewardCash;
    await wallet.save();

    // Update User
    user.claimedCO2 += co2ToConvert;
    await user.save();

    // Record Transaction
    await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount: rewardCash,
      balance: wallet.balance,
      ref: `CARBON-${Date.now()}`,
      note: `Carbon Reward (${co2ToConvert.toFixed(2)} kg CO₂ = ₹${rewardCash.toFixed(2)})`,
    });

    res.json({
      success: true,
      message: `Successfully converted ${co2ToConvert.toFixed(2)}kg CO2 to ₹${rewardCash.toFixed(2)}`,
      rewardCash,
      claimedCO2: user.claimedCO2,
      walletBalance: wallet.balance
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getWallet, topupWallet, convertCarbonToCash };
