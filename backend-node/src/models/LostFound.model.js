// backend-node/src/models/LostFound.model.js
const mongoose = require('mongoose');

const LostFoundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemDescription: {
      type: String,
      required: [true, 'Item description is required'],
    },
    lastSeenLocation: {
      type: String,
      default: '',
    },
    lastSeenDate: {
      type: Date,
      default: Date.now,
    },
    contactPhone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['reported', 'found', 'returned', 'closed'],
      default: 'reported',
    },
    category: {
      type: String,
      enum: ['electronics', 'bags', 'wallet', 'keys', 'documents', 'jewellery', 'umbrella', 'clothing', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LostFound', LostFoundSchema);
