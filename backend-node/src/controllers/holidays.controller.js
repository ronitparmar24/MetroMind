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
