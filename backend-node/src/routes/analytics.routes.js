// backend-node/src/routes/analytics.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWeeklyDigest, getSpending, getHeatmap } = require('../controllers/analytics.controller');

router.get('/weekly-digest', protect, getWeeklyDigest);
router.get('/spending', protect, getSpending);
router.get('/heatmap', protect, getHeatmap);

module.exports = router;
