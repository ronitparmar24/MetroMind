// backend-node/src/controllers/payment.controller.js
// Handles Razorpay wallet top-up: order creation + signature verification.
// Architecture: only the public Key ID ever goes to the frontend.
// The secret key and signature verification live exclusively server-side.

const Wallet = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');
const SystemSetting = require('../models/SystemSetting.model');
const { bookingBus } = require('../events/bookingEvents');
const { createOrder, fetchOrder, verifyPaymentSignature } = require('../services/payment.service');

/**
 * POST /api/wallet/create-order
 * Creates a Razorpay order and returns orderId + public key to the frontend.
 * Body: { amount: Number }   (in ₹)
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const parsed = Number(amount);

    if (!parsed || parsed < 10 || parsed > 10000) {
      const err = new Error('Amount must be between ₹10 and ₹10,000');
      err.statusCode = 400;
      return next(err);
    }

    // Verify wallet won't exceed cap
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) wallet = await Wallet.create({ userId: req.user._id, balance: 0 });

    const settings = await SystemSetting.findOne();
    const maxBalance = settings?.maxWalletBalance ?? 10000;

    if (wallet.balance + parsed > maxBalance) {
      const err = new Error(`Adding ₹${parsed} would exceed the ₹${maxBalance} wallet limit. Current balance: ₹${wallet.balance}`);
      err.statusCode = 400;
      return next(err);
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const err = new Error('Razorpay keys are missing in backend environment variables.');
      err.statusCode = 500;
      return next(err);
    }

    const order = await createOrder(parsed, req.user._id);

    res.json({
      success: true,
      orderId: order.id,
      amount:  order.amount, // in paise — Razorpay checkout expects this
      currency: order.currency,
      keyId:   process.env.RAZORPAY_KEY_ID, // public only — safe to send
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wallet/verify-payment
 * Verifies Razorpay HMAC signature, then credits wallet.
 * Body: { orderId, paymentId, signature, amount }
 *
 * Security: if signature doesn't match, we reject + log a warning.
 * A bad signature = someone tried to spoof a successful payment.
 */
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      const err = new Error('Missing orderId, paymentId, or signature');
      err.statusCode = 400;
      return next(err);
    }

    // ── Critical security check ─────────────────────────────────
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      // Log tampered payment attempt for audit
      console.error(`🚨 [SECURITY] Invalid Razorpay signature from user ${req.user._id}`, {
        orderId, paymentId, userId: req.user._id.toString(),
      });
      const err = new Error('Payment verification failed — signature mismatch');
      err.statusCode = 400;
      return next(err);
    }

    // Amount comes from Razorpay's own order record, never from the client body
    const order = await fetchOrder(orderId);
    const creditAmount = order && order.amount ? Math.round(Number(order.amount) / 100) : 0;
    if (creditAmount <= 0) {
      const err = new Error('Invalid payment amount');
      err.statusCode = 400;
      return next(err);
    }

    // The order must belong to this user (otherwise one payment could be
    // "verified" from several accounts)
    if (order.notes?.userId && order.notes.userId !== String(req.user._id)) {
      console.error(`🚨 [SECURITY] Razorpay order ${orderId} replayed by another user ${req.user._id}`);
      const err = new Error('This payment belongs to a different account');
      err.statusCode = 403;
      return next(err);
    }

    // Claim the payment first. externalId has a unique index, so a replayed or
    // concurrent verify for the same payment fails here, before any money moves.
    const ref = `RZP-${paymentId}`;
    let txn;
    try {
      txn = await Transaction.create({
        userId:     req.user._id,
        type:       'credit',
        amount:     creditAmount,
        balance:    0, // filled in below
        ref,
        externalId: ref,
        note:       `Razorpay wallet top-up (${paymentId})`,
      });
    } catch (dupErr) {
      if (dupErr && dupErr.code === 11000) {
        const err = new Error('This payment has already been credited');
        err.statusCode = 409;
        return next(err);
      }
      throw dupErr;
    }

    await Wallet.updateOne({ userId: req.user._id }, { $setOnInsert: { balance: 0 } }, { upsert: true });
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { balance: creditAmount } },
      { new: true }
    );
    txn.balance = wallet.balance;
    await txn.save();

    bookingBus.emit('topup', {
      userId:     req.user._id,
      amount:     creditAmount,
      newBalance: wallet.balance,
    });

    res.json({
      success: true,
      message: `₹${creditAmount} successfully added via Razorpay`,
      wallet:  { balance: wallet.balance, currency: wallet.currency },
      paymentId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
