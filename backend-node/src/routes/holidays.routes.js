// backend-node/src/routes/holidays.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { checkHoliday } = require('../controllers/holidays.controller');

// GET /api/holidays/check?date=YYYY-MM-DD
// Used by the frontend date picker to show a discount badge before booking.
router.get('/check', protect, checkHoliday);

// GET /api/holidays/daily-fact?date=YYYY-MM-DD
// AI generated fun fact widget
const { getDailyFact } = require('../controllers/holidays.controller');
router.get('/daily-fact', protect, getDailyFact);

module.exports = router;
