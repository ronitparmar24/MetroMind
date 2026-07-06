// backend-node/src/models/MonthlyPass.model.js
// TTL index on endDate: MongoDB will automatically delete expired documents.
// This means no cron job is needed — the DB handles expiry natively.

const mongoose = require('mongoose');

const MonthlyPassSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planType: {
      type: String,
      enum: ['7day', 'monthly', 'quarterly'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    ridesUsed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes the document when endDate is reached
// expireAfterSeconds: 0 means "expire at the date value itself"
MonthlyPassSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('MonthlyPass', MonthlyPassSchema);
