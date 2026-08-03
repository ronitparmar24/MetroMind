// backend-node/src/routes/weather.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWeather } = require('../controllers/weather.controller');

// GET /api/weather — protected, cached 10 min server-side
router.get('/', protect, getWeather);

module.exports = router;
