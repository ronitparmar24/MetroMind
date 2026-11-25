// backend-node/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');
const { signToken } = require('../utils/jwt');
const { GOOGLE_CLIENT_ID } = require('../config/env');
const { IS_PROD, sendOTPEmail, sendLoginNotificationEmail, sendWelcomeEmail } = require('../utils/emailer');

const EMAIL_FAIL_MSG = "We couldn't send the verification email right now. Please try again in a few minutes.";
const DEV_EMAIL_NOTICE = 'Email could not be sent (SMTP login failed). DEV ONLY: the code is printed in the backend console.';

// Sends the OTP; returns { sent } and never throws.
const deliverOtp = async (email, otp) => {
  try {
    await sendOTPEmail(email.toLowerCase(), otp);
    return { sent: true };
  } catch (e) {
    console.error('OTP email failed:', e.message);
    return { sent: false };
  }
};

// Production: a 503 so the user isn't told a code was sent when it wasn't.
// Development: let the flow continue (code is in the console) but say so.
const emailFailureResponse = async (res, email) => {
  if (IS_PROD) {
    try { await redis.del(OTP_RATE_KEY(email)); } catch (_) { /* best effort */ }
    return res.status(503).json({ success: false, error: EMAIL_FAIL_MSG });
  }
  return null;
};
const { validateEmail } = require('../services/emailValidator.service');
const { validatePhone } = require('../services/phoneValidator.service');
const { checkPasswordPwned } = require('../services/pwnedCheck.service');
const { checkRecaptcha, getIpLocation } = require('../services/security.service');
const redis = require('../config/redis');

// Redis OTP key helpers
// otp:<email>      — bcrypt hash of the 6-digit code, expires in 10 min
// otp_rate:<email> — rate-limit sentinel, expires in 60 s
const OTP_KEY      = (email) => `otp:${email.toLowerCase()}`;
const OTP_RATE_KEY = (email) => `otp_rate:${email.toLowerCase()}`;
const OTP_TTL      = 600; // 10 minutes
const OTP_RATE_TTL = 60;  // 60 second cooldown between resends

// Max wrong guesses per issued code. A 6-digit code has 900k values, so without
// a cap it can be brute-forced inside its 10-minute lifetime.
const MAX_OTP_ATTEMPTS = 5;
const TOO_MANY_ATTEMPTS_MSG = 'Too many incorrect attempts. Please request a new code.';

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
    const { name, email, password, phone, recaptchaToken } = req.body;

    const captcha = await checkRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      const err = new Error(captcha.message);
      err.statusCode = 400;
      return next(err);
    }

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

    // ── AbstractAPI phone validation ──────
    if (phone) {
      const phoneCheck = await validatePhone(phone);
      if (!phoneCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format for an Indian mobile number.',
          field: 'phone',
        });
      }
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
      existing.name         = name;
      existing.passwordHash = passwordHash;
      existing.phone        = phone || '';
      existing.otpAttempts  = 0;
      await existing.save();
    } else {
      // Create new user (unverified)
      await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || '',
        isVerified: false,
      });
    }

    // Store OTP hash in Redis with automatic 10-minute TTL
    // (OTPs are ephemeral — they don't belong in the permanent user document)
    await redis.set(OTP_KEY(email), otpHash, { ex: OTP_TTL });
    // Set rate-limit sentinel so the user must wait 60s before requesting another
    await redis.set(OTP_RATE_KEY(email), '1', { ex: OTP_RATE_TTL });

    // Send OTP email
    const delivery = await deliverOtp(email, otp);
    if (!delivery.sent && (await emailFailureResponse(res, email))) return;

    // Return requiresVerification — no JWT yet
    res.status(201).json({
      success: true,
      emailSent: delivery.sent,
      ...(delivery.sent ? {} : { devNotice: DEV_EMAIL_NOTICE }),
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
      const err = new Error('Invalid or expired verification code');
      err.statusCode = 400;
      return next(err);
    }

    if (user.isVerified) {
      const err = new Error('Account is already verified');
      err.statusCode = 400;
      return next(err);
    }

    // Fetch OTP hash from Redis (auto-expires after 10 min — no manual timestamp check needed)
    const storedHash = await redis.get(OTP_KEY(email));

    if (!storedHash) {
      const err = new Error('Verification code has expired. Please request a new one.');
      err.statusCode = 410;
      return next(err);
    }

    if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      await redis.del(OTP_KEY(email));
      const err = new Error(TOO_MANY_ATTEMPTS_MSG);
      err.statusCode = 429;
      return next(err);
    }

    // Compare OTP against the stored bcrypt hash
    const isMatch = await bcrypt.compare(String(otp), storedHash);
    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        await redis.del(OTP_KEY(email)); // burn the code
        const err = new Error(TOO_MANY_ATTEMPTS_MSG);
        err.statusCode = 429;
        return next(err);
      }
      const err = new Error('Invalid verification code');
      err.statusCode = 400;
      return next(err);
    }
    user.otpAttempts = 0;

    // Verification succeeded — delete OTP from Redis immediately (one-time use)
    await redis.del(OTP_KEY(email));
    await redis.del(OTP_RATE_KEY(email));

    // Mark verified, clear any legacy OTP fields from the User document
    user.isVerified   = true;
    user.otpHash      = null;
    user.otpExpiresAt = null;
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
        claimedCO2: user.claimedCO2 || 0,
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
      const err = new Error('Invalid or expired verification code');
      err.statusCode = 400;
      return next(err);
    }

    if (user.isVerified) {
      const err = new Error('Account is already verified');
      err.statusCode = 400;
      return next(err);
    }

    // Rate limit: 60 seconds between resends (enforced by Redis TTL key)
    const rateLimited = await redis.get(OTP_RATE_KEY(email));
    if (rateLimited) {
      const err = new Error('Please wait 60 seconds before requesting a new code');
      err.statusCode = 429;
      return next(err);
    }

    // Generate fresh OTP and store in Redis
    const { otp, hash } = await generateOtp();
    user.otpAttempts = 0;
    await redis.set(OTP_KEY(email), hash, { ex: OTP_TTL });
    await redis.set(OTP_RATE_KEY(email), '1', { ex: OTP_RATE_TTL });
    // Clear any legacy OTP fields from the User document
    user.otpHash      = null;
    user.otpExpiresAt = null;
    await user.save();

    // Send email
    const delivery = await deliverOtp(email, otp);
    if (!delivery.sent && (await emailFailureResponse(res, email))) return;

    res.json({
      success: true,
      emailSent: delivery.sent,
      ...(delivery.sent ? {} : { devNotice: DEV_EMAIL_NOTICE }),
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
    const { email, password, recaptchaToken } = req.body;

    const captcha = await checkRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      const err = new Error(captcha.message);
      err.statusCode = 400;
      return next(err);
    }

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

    if (user.isActive === false) {
      const err = new Error('This account has been deactivated. Please contact support.');
      err.statusCode = 403;
      return next(err);
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Auto-resend OTP if rate limit allows
      let otpSent = false;
      const canResend = !user.lastOtpSentAt || (Date.now() - user.lastOtpSentAt.getTime()) >= 60000;

      if (canResend) {
        const { otp, hash } = await generateOtp();
        user.otpAttempts = 0;
        // Store OTP hash in Redis (10 min TTL) instead of the User document
        await redis.set(OTP_KEY(email), hash, { ex: OTP_TTL });
        await redis.set(OTP_RATE_KEY(email), '1', { ex: OTP_RATE_TTL });
        // Clear any stale OTP fields from the User document
        user.otpHash      = null;
        user.otpExpiresAt = null;
        await user.save();

        otpSent = (await deliverOtp(email, otp)).sent;
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

    // IP Location check
    const clientIp = req.ip || req.connection?.remoteAddress;
    const ipLocation = await getIpLocation(clientIp);
    let newLocationDetected = false;
    let loginLocationString = null;

    if (ipLocation) {
      loginLocationString = `${ipLocation.city}, ${ipLocation.region}`;
      if (user.lastLoginIp && user.lastLoginIp !== clientIp && user.lastLoginLocation && user.lastLoginLocation !== loginLocationString) {
        newLocationDetected = true;
      }
      user.lastLoginIp = clientIp;
      user.lastLoginLocation = loginLocationString;
      await user.save();
    }

    await updateUserStreak(user);

    res.json({
      success: true,
      token,
      newLocationDetected,
      loginLocationString,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        streakDays: user.streakDays,
        claimedCO2: user.claimedCO2 || 0,
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

    if (!GOOGLE_CLIENT_ID) {
      return next(new Error('Server misconfiguration: missing Google Client ID'));
    }
    if (typeof idToken !== 'string' || !idToken) {
      const err = new Error('Invalid Google credential');
      err.statusCode = 401;
      return next(err);
    }

    // SECURITY: every path below verifies with Google that the token was issued
    // to *this* app. (Previously a failed verification fell back to decoding the
    // JWT payload without checking its signature, so anyone could forge a token
    // for any email — including the admin's — and get logged in.)
    const isAccessToken = idToken.split('.').length !== 3;

    if (isAccessToken) {
      // 1. OAuth access token: confirm it belongs to our client, then read the profile
      try {
        const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(idToken)}`);
        const info = infoRes.ok ? await infoRes.json() : null;
        if (info && (info.aud === GOOGLE_CLIENT_ID || info.azp === GOOGLE_CLIENT_ID)) {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (response.ok) payload = await response.json();
        } else {
          console.warn('Google access token rejected: wrong audience or invalid token');
        }
      } catch (fetchErr) {
        console.warn('Google token check failed:', fetchErr.message);
      }
    } else {
      // 2. ID token (JWT): verify signature, expiry and audience
      try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.warn('Google verifyIdToken failed:', verifyErr.message);
      }
    }

    const emailVerified = payload && (payload.email_verified === true || payload.email_verified === 'true');
    if (!payload || !payload.sub || !payload.email || !emailVerified) {
      const err = new Error('Invalid Google credential');
      err.statusCode = 401;
      return next(err);
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
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
        claimedCO2: user.claimedCO2 || 0,
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
    user.otpAttempts = 0;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.lastOtpSentAt = new Date();
    await user.save();

    // Send email
    const delivery = await deliverOtp(email, otp);
    if (!delivery.sent) {
      if (IS_PROD) {
        user.lastOtpSentAt = null; // allow an immediate retry
        await user.save();
        return res.status(503).json({ success: false, error: EMAIL_FAIL_MSG });
      }
    }

    res.json({
      success: true,
      emailSent: delivery.sent,
      ...(delivery.sent ? {} : { devNotice: DEV_EMAIL_NOTICE }),
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

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters');
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

    if (!user.otpHash || (user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
      const err = new Error(TOO_MANY_ATTEMPTS_MSG);
      err.statusCode = 429;
      return next(err);
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(String(otp), user.otpHash);
    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.otpHash = null; // burn the code
        user.otpExpiresAt = null;
      }
      await user.save();
      const err = new Error(user.otpHash ? 'Invalid verification code' : TOO_MANY_ATTEMPTS_MSG);
      err.statusCode = user.otpHash ? 400 : 429;
      return next(err);
    }
    user.otpAttempts = 0;

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    
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

    // Google-only accounts have no password hash — bcrypt.compare would throw (500)
    if (!user.passwordHash) {
      const msg = 'This account uses Google Sign-In and has no password. Use "Forgot password" on the login page to set one.';
      return res.status(400).json({ success: false, message: msg, error: msg });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    // 400, not 401: a 401 makes the frontend interceptor wipe the session on a simple typo
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password', error: 'Incorrect current password' });

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters', error: 'New password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    await user.save();

    // Other sessions are now invalid; give this one a fresh token
    res.json({ success: true, message: 'Password updated successfully', token: signToken(user._id) });
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
