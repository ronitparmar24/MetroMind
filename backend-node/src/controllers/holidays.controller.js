// backend-node/src/controllers/holidays.controller.js

const { checkHolidayDiscount } = require('../services/holiday.service');

/**
 * GET /api/holidays/check?date=YYYY-MM-DD
 * Returns holiday status and discount percentage for the given date.
 * Used by the frontend date-picker to show a proactive discount badge.
 */
exports.checkHoliday = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const err = new Error('Query param `date` is required and must be YYYY-MM-DD');
      err.statusCode = 400;
      return next(err);
    }

    const result = await checkHolidayDiscount(date);
    return res.json({ success: true, date, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/holidays/daily-fact?date=YYYY-MM-DD
 * Uses AI to generate a short fun fact or holiday explanation.
 */
exports.getDailyFact = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });
    
    const holidayCheck = await checkHolidayDiscount(date);
    let prompt = `You are a helpful, concise MetroMind AI assistant. Give a very short, 1-2 sentence fun fact or greeting for someone booking a metro ticket on ${date}.`;
    
    if (holidayCheck.isHoliday) {
      prompt += ` This day is ${holidayCheck.holidayName}. Briefly explain why this is a holiday and wish them a great journey.`;
    } else {
      prompt += ` It's a regular day. Give a short fun fact about metro travel, eco-friendly transport, or just a positive daily greeting.`;
    }

    try {
      const { aiWithFallback } = require('./voice.controller');
      const fact = await aiWithFallback(
        "You are a short, engaging Metro ticket assistant. Keep answers to 2 short sentences max. Do NOT use emojis.",
        prompt,
        []
      );
      return res.json({ success: true, fact, isHoliday: holidayCheck.isHoliday, holidayName: holidayCheck.holidayName });
    } catch (aiErr) {
      // Fallback if AI fails completely
      console.error('[getDailyFact] AI error:', aiErr.message);
      return res.json({ success: true, fact: "Enjoy your quick, eco-friendly ride with MetroMind today!" });
    }
  } catch (error) {
    next(error);
  }
};
