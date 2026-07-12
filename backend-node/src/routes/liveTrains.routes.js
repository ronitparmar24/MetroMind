// backend-node/src/routes/liveTrains.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getLiveTrains } = require('../controllers/liveTrains.controller');

router.get('/:station', protect, getLiveTrains);

module.exports = router;
