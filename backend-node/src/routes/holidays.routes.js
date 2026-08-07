// backend-node/src/routes/holidays.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { checkHoliday } = require('../controllers/holidays.controller');

// GET /api/holidays/check?date=YYYY-MM-DD
// Used by the frontend date picker to show a discount badge before booking.
router.get('/check', protect, checkHoliday);

module.exports = router;
