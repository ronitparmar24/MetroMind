const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getNearbyForStation, getAboutForStation } = require('../controllers/stations.controller');

router.get('/:stationId/nearby', protect, getNearbyForStation);
router.get('/:stationId/about', protect, getAboutForStation);

module.exports = router;
