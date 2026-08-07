// backend-node/src/routes/wallet.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWallet, topupWallet, convertCarbonToCash } = require('../controllers/wallet.controller');

router.get('/', protect, getWallet);
router.post('/topup', protect, topupWallet);
router.post('/convert-carbon', protect, convertCarbonToCash);

module.exports = router;
