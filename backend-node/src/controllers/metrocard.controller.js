// backend-node/src/controllers/metrocard.controller.js
const MetroCard = require('../models/MetroCard.model');
const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');

const METRO_CARD_DISCOUNT = 0.10; // 10% off every ticket

// GET /api/metrocard
const getMetroCard = async (req, res, next) => {
  try {
    const card = await MetroCard.findOne({ userId: req.user._id });
    res.json({ success: true, card: card || null, discountRate: METRO_CARD_DISCOUNT });
  } catch (error) {
    next(error);
  }
};

// POST /api/metrocard
const createMetroCard = async (req, res, next) => {
  try {
    const existing = await MetroCard.findOne({ userId: req.user._id });
    if (existing) {
      const err = new Error('You already have a Metro Card');
      err.statusCode = 400;
      return next(err);
    }

    const cardNumber = `MC-${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const card = await MetroCard.create({
      userId: req.user._id,
      cardNumber,
      balance: 0,
    });

    res.status(201).json({ success: true, card, discountRate: METRO_CARD_DISCOUNT });
  } catch (error) {
    next(error);
  }
};

// POST /api/metrocard/topup  — top up card balance from wallet
const topUpMetroCard = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 10 || amt > 5000) {
      const err = new Error('Top-up amount must be between ₹10 and ₹5000');
      err.statusCode = 400;
      return next(err);
    }

    const [card, wallet] = await Promise.all([
      MetroCard.findOne({ userId: req.user._id }),
      Wallet.findOne({ userId: req.user._id }),
    ]);

    if (!card) {
      const err = new Error('No Metro Card found. Please create one first.');
      err.statusCode = 404;
      return next(err);
    }
    if (!wallet || wallet.balance < amt) {
      const err = new Error(`Insufficient wallet balance. Available: ₹${wallet?.balance || 0}`);
      err.statusCode = 402;
      return next(err);
    }

    // Move money: wallet → metro card
    wallet.balance -= amt;
    card.balance += amt;
    await Promise.all([wallet.save(), card.save()]);

    // Record transaction
    await Transaction.create({
      userId: req.user._id,
      type: 'debit',
      amount: amt,
      balance: wallet.balance,
      ref: card.cardNumber,
      note: `Metro Card top-up: ${card.cardNumber}`,
    });

    res.json({
      success: true,
      card,
      walletBalance: wallet.balance,
      message: `₹${amt} added to your Metro Card`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMetroCard, createMetroCard, topUpMetroCard, METRO_CARD_DISCOUNT };
