// backend-node/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');
const { signToken } = require('../utils/jwt');
const { GOOGLE_CLIENT_ID } = require('../config/env');
const { sendOTPEmail, sendLoginNotificationEmail } = require('../utils/emailer');

// ─── Helper: generate 6-digit OTP and its bcrypt hash ───
const generateOtp = async () => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(otp, salt);
  return { otp, hash };
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing && existing.isVerified) {
      const err = new Error('User with this email already exists');
      err.statusCode = 409;
      return next(err);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP
    const { otp, hash: otpHash } = await generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (existing && !existing.isVerified) {
      // User exists but never verified — update their info and resend OTP
      existing.name = name;
      existing.passwordHash = passwordHash;
      existing.phone = phone || '';
      existing.otpHash = otpHash;
      existing.otpExpiresAt = otpExpiresAt;
      existing.lastOtpSentAt = new Date();
      await existing.save();
    } else {
      // Create new user (unverified)
      await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || '',
        isVerified: false,
        otpHash,
        otpExpiresAt,
        lastOtpSentAt: new Date(),
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email.toLowerCase(), otp);
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr.message);
      // Don't block registration — OTP is logged in console by emailer fallback
    }

    // Return requiresVerification — no JWT yet
    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: email.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      const err = new Error('Email and OTP are required');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const err = new Error('No account found with this email');
      err.statusCode = 404;
      return next(err);
    }

    if (user.isVerified) {
      const err = new Error('Account is already verified');
      err.statusCode = 400;
      return next(err);
    }

    // Check expiry
    if (!user.otpExpiresAt || user.otpExpiresAt < Date.now()) {
      const err = new Error('Verification code has expired. Please request a new one.');
      err.statusCode = 410;
      return next(err);
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      const err = new Error('Invalid verification code');
      err.statusCode = 401;
      return next(err);
    }

    // Mark verified, clear OTP fields
    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.lastOtpSentAt = null;
    await user.save();

    // Create wallet with ₹500 welcome bonus
    const existingWallet = await Wallet.findOne({ userId: user._id });
    if (!existingWallet) {
      await Wallet.create({ userId: user._id, balance: 500 });
    }

    // Issue JWT
    const token = signToken(user._id);

    // Fire-and-forget login notification email
    sendLoginNotificationEmail(user.email, user.name, 'password');

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        streakDays: user.streakDays,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      const err = new Error('Email is required');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const err = new Error('No account found with this email');
      err.statusCode = 404;
      return next(err);
    }

    if (user.isVerified) {
      const err = new Error('Account is already verified');
      err.statusCode = 400;
      return next(err);
    }

    // Rate limit: 60 seconds between resends
    if (user.lastOtpSentAt) {
      const elapsed = Date.now() - user.lastOtpSentAt.getTime();
      const remaining = Math.ceil((60000 - elapsed) / 1000);
      if (elapsed < 60000) {
        const err = new Error(`Please wait ${remaining} seconds before requesting a new code`);
        err.statusCode = 429;
        return next(err);
      }
    }

    // Generate fresh OTP
    const { otp, hash: otpHash } = await generateOtp();
    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.lastOtpSentAt = new Date();
    await user.save();

    // Send email
    try {
      await sendOTPEmail(email.toLowerCase(), otp);
    } catch (emailErr) {
      console.error('Failed to resend OTP email:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Verification code sent',
      retryAfter: 60,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    // Google-only accounts can't use password login
    if (!user.passwordHash) {
      const err = new Error('This account uses Google Sign-In. Please sign in with Google.');
      err.statusCode = 401;
      return next(err);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Auto-resend OTP if rate limit allows
      let otpSent = false;
      const canResend = !user.lastOtpSentAt || (Date.now() - user.lastOtpSentAt.getTime()) >= 60000;

      if (canResend) {
        const { otp, hash: otpHash } = await generateOtp();
        user.otpHash = otpHash;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.lastOtpSentAt = new Date();
        await user.save();

        try {
          await sendOTPEmail(email.toLowerCase(), otp);
          otpSent = true;
        } catch (emailErr) {
          console.error('Failed to send OTP email on login:', emailErr.message);
        }
      }

      return res.status(403).json({
        success: false,
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address',
        email: user.email,
        otpSent,
      });
    }

    // Generate JWT
    const token = signToken(user._id);

    // Fire-and-forget login notification email
    sendLoginNotificationEmail(user.email, user.name, 'password');

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        streakDays: user.streakDays,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const wallet = await Wallet.findOne({ userId: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        loyaltyPoints: user.loyaltyPoints,
        streakDays: user.streakDays,
        lastTravelDate: user.lastTravelDate,
        walletBalance: wallet ? wallet.balance : 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      const err = new Error('Google credential is required');
      err.statusCode = 400;
      return next(err);
    }

    if (!GOOGLE_CLIENT_ID) {
      const err = new Error('Google Sign-In is not configured on this server');
      err.statusCode = 501;
      return next(err);
    }

    // Verify the Google id_token
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      const err = new Error('Invalid Google credential');
      err.statusCode = 401;
      return next(err);
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      const err = new Error('Google account does not have an email');
      err.statusCode = 400;
      return next(err);
    }

    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    let isNewUser = false;

    if (!user) {
      // Create new Google user — already verified by Google
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        isVerified: true,
        avatar: picture || '',
        passwordHash: null,
      });

      // Create wallet with ₹500 welcome bonus
      await Wallet.create({ userId: user._id, balance: 500 });
      isNewUser = true;
    } else if (!user.googleId) {
      // Existing local user → link their Google account
      user.googleId = googleId;
      user.isVerified = true; // Google verifies their email
      user.authProvider = user.passwordHash ? user.authProvider : 'google';
      if (picture && !user.avatar) user.avatar = picture;
      // Clear any pending OTP since Google verified them
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
    }

    // Generate MetroMind JWT
    const token = signToken(user._id);

    // Fire-and-forget login notification email (skip for brand-new users — they just registered)
    if (!isNewUser) {
      sendLoginNotificationEmail(user.email, user.name, 'google');
    }

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        loyaltyPoints: user.loyaltyPoints,
        streakDays: user.streakDays,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, googleLogin, verifyOtp, resendOtp };
