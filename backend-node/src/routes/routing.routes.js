const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { geocode, getNearestStations } = require('../controllers/routing.controller');

router.get('/geocode', protect, geocode);
router.get('/nearest-stations', protect, getNearestStations);

module.exports = router;
