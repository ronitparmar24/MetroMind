// backend-node/src/routes/auth.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { register, login, getMe, googleLogin, verifyOtp, resendOtp, forgotPassword, resetPassword } = require('../controllers/auth.controller');

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/me', protect, getMe);

// Google OAuth — verify Google id_token and return MetroMind JWT
router.post('/google', googleLogin);

// OTP verification
router.post(
  '/verify-otp',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ]),
  verifyOtp
);

// Resend OTP
router.post(
  '/resend-otp',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
  ]),
  resendOtp
);

// Forgot Password
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
  ]),
  forgotPassword
);

// Reset Password
router.post(
  '/reset-password',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  resetPassword
);

module.exports = router;
