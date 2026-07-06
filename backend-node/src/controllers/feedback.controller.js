// backend-node/src/controllers/feedback.controller.js
const Feedback = require('../models/Feedback.model');

// POST /api/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { text, moodRating, category } = req.body;

    if (!text || !moodRating) {
      const err = new Error('Feedback text and mood rating are required');
      err.statusCode = 400;
      return next(err);
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      text,
      moodRating,
      category: category || 'other',
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

// GET /api/feedback
const getFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitFeedback, getFeedback };
