// backend-node/src/controllers/transactions.controller.js
const Transaction = require('../models/Transaction.model');

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions };
