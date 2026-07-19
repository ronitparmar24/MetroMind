// backend-node/src/routes/analytics.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWeeklyDigest, getSpending, getHeatmap, getPersonality, getLeaderboard, getStationProfile, getNetworkPulse } = require('../controllers/analytics.controller');

router.get('/weekly-digest', protect, getWeeklyDigest);
router.get('/spending', protect, getSpending);
router.get('/heatmap', protect, getHeatmap);
router.get('/personality', protect, getPersonality);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/station-profile/:station', protect, getStationProfile);
router.get('/network-pulse', protect, getNetworkPulse);

module.exports = router;
