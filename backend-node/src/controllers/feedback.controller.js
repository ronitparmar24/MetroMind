// backend-node/src/controllers/feedback.controller.js
const Feedback = require('../models/Feedback.model');
const { analyzeFeedback } = require('../services/gemini.service');

// POST /api/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      const err = new Error('Feedback text is required');
      err.statusCode = 400;
      return next(err);
    }

    // Call Gemini API for analysis
    const aiResult = await analyzeFeedback(text, req.user.name);

    if (!aiResult.isValid) {
      const err = new Error(aiResult.aiReply || 'Please provide meaningful feedback. Random text cannot be processed.');
      err.statusCode = 400;
      return next(err);
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      text,
      moodRating: aiResult.moodRating,
      category: aiResult.category,
      aiReply: aiResult.aiReply,
    });

    res.status(201).json({ success: true, feedback, aiReply: aiResult.aiReply });
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
