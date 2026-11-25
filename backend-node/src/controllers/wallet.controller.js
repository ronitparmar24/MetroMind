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
      instantTopupEnabled: instantTopupEnabled(),
    });
  } catch (error) {
    next(error);
  }
};

// Instant (no-payment) top-up is a testing convenience. It credits money without
// any payment, so it is off in production unless ALLOW_INSTANT_TOPUP=true.
const instantTopupEnabled = () => {
  if (process.env.ALLOW_INSTANT_TOPUP === 'true') return true;
  if (process.env.ALLOW_INSTANT_TOPUP === 'false') return false;
  return !(process.env.NODE_ENV === 'production' || process.env.VERCEL);
};

// POST /api/wallet/topup
const topupWallet = async (req, res, next) => {
  try {
    if (!instantTopupEnabled()) {
      const err = new Error('Instant top-up is disabled. Please add money with Razorpay checkout.');
      err.statusCode = 403;
      return next(err);
    }

    const amount = Number(req.body.amount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000) {
      const err = new Error('Amount must be a whole number between ₹1 and ₹10,000');
      err.statusCode = 400;
      return next(err);
    }

    const settings = await SystemSetting.findOne();
    const maxBalance = settings ? settings.maxWalletBalance : 10000;

    await Wallet.updateOne({ userId: req.user._id }, { $setOnInsert: { balance: 0 } }, { upsert: true });
    // Atomic: only credits when the result stays within the limit
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, balance: { $lte: maxBalance - amount } },
      { $inc: { balance: amount } },
      { new: true }
    );
    if (!wallet) {
      const err = new Error(`Wallet balance cannot exceed ₹${maxBalance}`);
      err.statusCode = 400;
      return next(err);
    }

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

    // Only trips actually taken earn rewards (upcoming tickets could be booked,
    // converted to cash, then cancelled for a refund)
    const tickets = await Ticket.find({
      userId: user._id,
      status: 'completed',
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

    if (!Number.isFinite(rewardCash) || rewardCash <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Claim the CO2 atomically: the update only matches if nobody else changed
    // claimedCO2 since we read it, so parallel requests can't double-claim.
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, claimedCO2: user.claimedCO2 || 0 },
      { $inc: { claimedCO2: co2ToConvert } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(409).json({ success: false, error: 'Your reward was just updated. Please refresh and try again.' });
    }
    user.claimedCO2 = updatedUser.claimedCO2;

    await Wallet.updateOne({ userId: user._id }, { $setOnInsert: { balance: 0 } }, { upsert: true });
    const wallet = await Wallet.findOneAndUpdate(
      { userId: user._id },
      { $inc: { balance: rewardCash } },
      { new: true }
    );

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
