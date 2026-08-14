// backend-node/src/routes/wallet.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWallet, topupWallet, convertCarbonToCash } = require('../controllers/wallet.controller');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/payment.controller');

// ── Existing routes (instant top-up) ──────────────────────────
router.get('/',              protect, getWallet);
router.post('/topup',        protect, topupWallet);
router.post('/convert-carbon', protect, convertCarbonToCash);

// ── Razorpay payment routes ────────────────────────────────────
// POST /api/wallet/create-order  → creates a Razorpay order, returns orderId + public key
// POST /api/wallet/verify-payment → verifies HMAC signature, credits wallet if valid
router.post('/create-order',    protect, createRazorpayOrder);
router.post('/verify-payment',  protect, verifyRazorpayPayment);

module.exports = router;
