// backend-node/src/services/payment.service.js
// Razorpay integration — test-mode only.
// Key ID is safe to expose to the frontend; secret NEVER leaves the backend.

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Created lazily: `new Razorpay()` throws when RAZORPAY_KEY_ID is missing, and
// doing that at module load crashed the whole API on boot in such environments.
let razorpayClient = null;
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error('Razorpay keys are missing in backend environment variables.');
    err.statusCode = 500;
    throw err;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

/**
 * Create a Razorpay order for wallet top-up.
 * @param {number} amountInRupees
 * @returns {Promise<Object>} Razorpay order object
 */
exports.createOrder = async (amountInRupees) => {
  const order = await getRazorpay().orders.create({
    amount:   Math.round(amountInRupees * 100), // Razorpay uses paise
    currency: 'INR',
    receipt:  `topup_${Date.now()}`,
  });
  return order;
};

/**
 * Fetch an order from Razorpay — used to get the authoritative paid amount
 * instead of trusting the amount sent by the client.
 */
exports.fetchOrder = async (orderId) => getRazorpay().orders.fetch(orderId);

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
  if (!process.env.RAZORPAY_KEY_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};
