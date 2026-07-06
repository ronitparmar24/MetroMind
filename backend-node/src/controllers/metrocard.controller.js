// backend-node/src/controllers/metrocard.controller.js
const MetroCard = require('../models/MetroCard.model');

// GET /api/metrocard
const getMetroCard = async (req, res, next) => {
  try {
    const card = await MetroCard.findOne({ userId: req.user._id });
    res.json({ success: true, card: card || null });
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

    // Generate card number: MC-XXXXXXXXXXXX
    const cardNumber = `MC-${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const card = await MetroCard.create({
      userId: req.user._id,
      cardNumber,
      balance: 0,
    });

    res.status(201).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMetroCard, createMetroCard };
