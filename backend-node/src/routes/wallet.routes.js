// backend-node/src/routes/wallet.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWallet, topupWallet } = require('../controllers/wallet.controller');

router.get('/', protect, getWallet);
router.post('/topup', protect, topupWallet);

module.exports = router;
