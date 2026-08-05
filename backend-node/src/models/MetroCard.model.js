// backend-node/src/models/MetroCard.model.js
const mongoose = require('mongoose');

const MetroCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    cardNumber: {
      type: String,
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    totalSaved: {
      type: Number,
      default: 0, // cumulative rupees saved via 10% discount
    },
    totalTrips: {
      type: Number,
      default: 0, // trips made using this card discount
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MetroCard', MetroCardSchema);
