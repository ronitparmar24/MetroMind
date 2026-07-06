// backend-node/src/models/SavedRoute.model.js
const mongoose = require('mongoose');

const SavedRouteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: '', // e.g. "Home→Office"
    },
    useCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedRoute', SavedRouteSchema);
