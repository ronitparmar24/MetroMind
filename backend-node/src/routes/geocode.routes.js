// backend-node/src/routes/geocode.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { geocode } = require('../controllers/geocode.controller');

// GET /api/geocode?q=<location>  — protected, Nominatim-backed
router.get('/', protect, geocode);

module.exports = router;
