// backend-node/src/controllers/feedback.controller.js
const Feedback = require('../models/Feedback.model');
const SystemSetting = require('../models/SystemSetting.model');
const { analyzeFeedback } = require('../services/gemini.service');
const { sendEmail } = require('../utils/emailer');

// POST /api/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      const err = new Error('Feedback text is required');
      err.statusCode = 400;
      return next(err);
    }

    // Basic gibberish check (e.g. keyboard smashes)
    // - Less than 3 characters (too short to be meaningful)
    // - Over 25 chars without a single space
    // - 6+ consonants in a row
    const isGibberish = text.trim().length < 3 || (text.length > 25 && !text.includes(' ')) || /[bcdfghjklmnpqrstvwxz]{6,}/i.test(text);
    if (isGibberish) {
      const err = new Error('Please provide meaningful feedback. Random text cannot be processed.');
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

    const settings = await SystemSetting.findOne();
    if (settings && settings.supportEmailAlerts) {
      sendEmail({
        to: 'admin@metromind.in',
        subject: 'New Feedback Submitted',
        html: `<p>New feedback received from ${req.user.name}:</p><blockquote>${text}</blockquote><p>Category: ${aiResult.category}</p>`
      }).catch(err => console.error('Failed to send admin email:', err));
    }

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
