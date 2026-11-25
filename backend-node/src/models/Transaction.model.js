// backend-node/src/models/Transaction.model.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true, // Snapshot of wallet balance after this transaction
    },
    ref: {
      type: String,
      default: '', // ticketId or topup reference
    },
    // Unique id from an external payment provider (e.g. RZP-<paymentId>).
    // Unique + sparse so the same payment can never be credited twice.
    externalId: {
      type: String,
      unique: true,
      sparse: true,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index — covers sorted per-user queries and wallet aggregation
TransactionSchema.index({ userId: 1, createdAt: -1 });
// Type filter index — covers Transactions page type filter
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
