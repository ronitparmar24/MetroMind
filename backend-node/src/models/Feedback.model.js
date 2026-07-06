// backend-node/src/models/Feedback.model.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Feedback text is required'],
      maxlength: 2000,
    },
    moodRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    category: {
      type: String,
      enum: ['service', 'cleanliness', 'safety', 'app', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
