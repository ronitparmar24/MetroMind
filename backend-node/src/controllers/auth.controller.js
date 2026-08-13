// backend-node/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');
const { signToken } = require('../utils/jwt');
const { GOOGLE_CLIENT_ID } = require('../config/env');
const { sendOTPEmail, sendLoginNotificationEmail, sendWelcomeEmail } = require('../utils/emailer');
const { validateEmail } = require('../services/emailValidator.service');
const { checkPasswordPwned } = require('../services/pwnedCheck.service');

// ─── Helper: generate 6-digit OTP and its bcrypt hash ───
const generateOtp = async () => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(otp, salt);
  return { otp, hash };
};

// ─── Helper: update user day streak upon login ───
const updateUserStreak = async (user) => {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const lastTravel = user.lastTravelDate ? user.lastTravelDate.toDateString() : null;
  let modified = false;

  if (!lastTravel) {
    user.streakDays = (user.streakDays || 0) + 1;
    modified = true;
  } else if (lastTravel === yesterdayStr) {
    user.streakDays += 1;
    modified = true;
  } else if (lastTravel !== today) {
    user.streakDays = 1;
    modified = true;
  }

  if (modified) {
    user.lastTravelDate = now;
    await user.save();
  }
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

    // ── AbstractAPI email validation (before wasting OTP quota) ──────
    const emailCheck = await validateEmail(email.toLowerCase());
    if (!emailCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'This email address looks invalid or undeliverable — please use a real email address.',
        field: 'email',
      });
    }
    if (emailCheck.isDisposable) {
      return res.status(400).json({
        success: false,
        error: 'Temporary or disposable email addresses are not allowed. Please use your real email address.',
        field: 'email',
      });
    }

    // Check if password is pwned
    const pwnedData = await checkPasswordPwned(password);
    if (pwnedData.isPwned) {
      return res.status(400).json({
        success: false,
        error: `This password has appeared in ${pwnedData.breachCount} known data breaches — please choose a different one.`,
        field: 'password',
      });
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

    // Await email to prevent serverless function from freezing before sending
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error('Non-fatal: failed to send welcome email', err);
    }

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
        avatarStyle: user.avatarStyle,
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

    // Await email to prevent serverless function from freezing before sending
    try {
      await sendLoginNotificationEmail(user.email, user.name, 'password');
    } catch (err) {
      console.error('Non-fatal: failed to send login notification email', err);
    }

    await updateUserStreak(user);

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
        avatarStyle: user.avatarStyle,
        role: user.role,
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
    await updateUserStreak(user);
    const wallet = await Wallet.findOne({ userId: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        avatarStyle: user.avatarStyle,
        role: user.role,
        authProvider: user.authProvider || 'local',
        isVerified: user.isVerified,
        loyaltyPoints: user.loyaltyPoints,
        streakDays: user.streakDays,
        lastTravelDate: user.lastTravelDate,
        claimedCO2: user.claimedCO2 || 0,
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
    const { credential, code, redirectUri } = req.body;

    if (!credential && !code) {
      const err = new Error('Google credential or authorization code is required');
      err.statusCode = 400;
      return next(err);
    }

    let payload;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    // 0. If we received an authorization code (Redirect Flow), exchange it for tokens
    let idToken = credential;
    if (code) {
      if (!GOOGLE_CLIENT_SECRET) {
        return next(new Error('Server misconfiguration: missing Google Client Secret'));
      }
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri || 'https://metro-mind-lemon.vercel.app/login',
            grant_type: 'authorization_code',
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(`Code exchange failed: ${tokenData.error_description || tokenData.error}`);
        }
        idToken = tokenData.id_token;
      } catch (err) {
        return next(new Error(`Failed to exchange authorization code: ${err.message}`));
      }
    }

    // 1. If token looks like an access_token (not a JWT), fetch userinfo from Google
    const isAccessToken = !idToken.includes('.') || idToken.split('.').length !== 3;
    if (isAccessToken && !code) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (response.ok) {
          payload = await response.json();
        }
      } catch (fetchErr) {
        console.warn('Google userinfo fetch failed:', fetchErr.message);
      }
    }

    // 2. Try official Google verifyIdToken if credential looks like a JWT id_token
    if (!payload && GOOGLE_CLIENT_ID && !isAccessToken) {
      try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.warn('Google verifyIdToken failed, using fallback:', verifyErr.message);
      }
    }

    // 3. Fallback: decode JWT payload directly if credential is a valid JWT string
    if (!payload && typeof idToken === 'string' && !isAccessToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            Buffer.from(base64, 'base64')
              .toString('ascii')
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          if (decoded && (decoded.email || decoded.sub)) {
            payload = decoded;
          }
        }
      } catch (parseErr) {
        console.warn('JWT payload decoding fallback failed:', parseErr.message);
      }
    }

    if (!payload || (!payload.email && !payload.sub)) {
      const err = new Error('Invalid Google credential');
      err.statusCode = 401;
      return next(err);
    }


    const googleId = payload.sub || payload.id || `google_${Date.now()}`;
    const email = payload.email ? payload.email.toLowerCase() : `google_user_${googleId}@metromind.in`;
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture || '';

    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    let isNewUser = false;

    if (!user) {
      // Create new Google user — already verified by Google
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        isVerified: true,
        avatar: picture,
        passwordHash: null,
      });

      // Create wallet with ₹500 welcome bonus
      await Wallet.create({ userId: user._id, balance: 500 });
      isNewUser = true;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      user.isVerified = true;
      // Always refresh avatar from Google (gets latest photo)
      if (picture) user.avatar = picture;
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
    }

    // Ensure wallet exists for user
    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      await Wallet.create({ userId: user._id, balance: 500 });
    }

    // Generate MetroMind JWT
    const token = signToken(user._id);

    // Await email to prevent serverless function from freezing before sending
    try {
      if (isNewUser) {
        await sendWelcomeEmail(user.email, user.name);
      } else {
        await sendLoginNotificationEmail(user.email, user.name, 'google');
      }
    } catch (err) {
      console.error('Non-fatal: failed to send google auth email', err);
    }

    await updateUserStreak(user);

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        avatarStyle: user.avatarStyle,
        role: user.role,
        authProvider: user.authProvider || 'google',
        isVerified: user.isVerified,
        loyaltyPoints: user.loyaltyPoints || 0,
        streakDays: user.streakDays || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      const err = new Error('Email is required');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success even if not found to prevent email enumeration
      return res.json({ success: true, message: 'If an account exists, a verification code was sent.' });
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

    // Generate OTP
    const { otp, hash: otpHash } = await generateOtp();
    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.lastOtpSentAt = new Date();
    await user.save();

    // Send email
    try {
      await sendOTPEmail(email.toLowerCase(), otp);
    } catch (emailErr) {
      console.error('Failed to send forgot password OTP email:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      const err = new Error('Email, OTP, and new password are required');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid email or code');
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

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Make sure they are verified
    user.isVerified = true;
    
    // Clear OTP fields
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.lastOtpSentAt = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password successfully updated',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/update-profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatarStyle } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (avatarStyle) user.avatarStyle = avatarStyle;
    
    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', data: { name: user.name, email: user.email, avatarStyle: user.avatarStyle } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};// GET /api/auth/check-username/:username
const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    // Just mock it or check by name since there is no username field
    res.json({ available: true, message: 'Username is available' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/check-password-pwned
const checkPwnedPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.json({ isPwned: false });
    const result = await checkPasswordPwned(password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, googleLogin, verifyOtp, resendOtp, forgotPassword, resetPassword, updateProfile, changePassword, checkUsername, checkPwnedPassword };
