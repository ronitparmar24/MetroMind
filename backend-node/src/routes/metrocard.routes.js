// backend-node/src/routes/metrocard.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getMetroCard, createMetroCard, topUpMetroCard } = require('../controllers/metrocard.controller');

router.get('/', protect, getMetroCard);
router.post('/', protect, createMetroCard);
router.post('/topup', protect, topUpMetroCard);

module.exports = router;
