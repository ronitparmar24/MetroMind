// backend-node/src/services/payment.service.js
// Razorpay integration — test-mode only.
// Key ID is safe to expose to the frontend; secret NEVER leaves the backend.

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for wallet top-up.
 * @param {number} amountInRupees
 * @returns {Promise<Object>} Razorpay order object
 */
exports.createOrder = async (amountInRupees) => {
  const order = await razorpay.orders.create({
    amount:   Math.round(amountInRupees * 100), // Razorpay uses paise
    currency: 'INR',
    receipt:  `topup_${Date.now()}`,
  });
  return order;
};

/**
 * Verify Razorpay payment signature to prevent tampering.
 * Razorpay signs: orderId + "|" + paymentId with your secret key.
 * A mismatch means the response was tampered with — reject immediately.
 *
 * @param {string} orderId    - razorpay_order_id from client
 * @param {string} paymentId  - razorpay_payment_id from client
 * @param {string} signature  - razorpay_signature from client
 * @returns {boolean}
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};
