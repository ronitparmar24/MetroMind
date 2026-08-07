// backend-node/src/models/CommuterUpdate.model.js
const mongoose = require('mongoose');

const CommuterUpdateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    station: {
      type: String,
      required: [true, 'Station is required'],
      trim: true,
    },
    tag: {
      type: String,
      required: [true, 'Tag/Category is required'],
      enum: ['Amenity', 'Queue', 'AC', 'Delay', 'General', 'Crowd'],
      default: 'General',
    },
    text: {
      type: String,
      required: [true, 'Update text is required'],
      trim: true,
      maxlength: 300,
    },
    upvotes: {
      type: Number,
      default: 1,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommuterUpdate', CommuterUpdateSchema);
