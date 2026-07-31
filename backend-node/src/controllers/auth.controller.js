// backend-node/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');
const { signToken } = require('../utils/jwt');
const { GOOGLE_CLIENT_ID } = require('../config/env');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const err = new Error('User with this email already exists');
      err.statusCode = 409;
      return next(err);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || '',
    });

    // Create wallet for the new user (one wallet per user)
    await Wallet.create({ userId: user._id, balance: 500 }); // ₹500 welcome bonus

    // Generate JWT
    const token = signToken(user._id);

    res.status(201).json({
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

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include passwordHash (excluded by default in queries)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid email or password');
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

    // Generate JWT
    const token = signToken(user._id);

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
    const user = req.user; // Attached by auth middleware
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
      // Create new Google user
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        avatar: picture || '',
        passwordHash: null,
      });

      // Create wallet with ₹500 welcome bonus
      await Wallet.create({ userId: user._id, balance: 500 });
      isNewUser = true;
    } else if (!user.googleId) {
      // Existing local user → link their Google account
      user.googleId = googleId;
      user.authProvider = user.passwordHash ? user.authProvider : 'google';
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    // Generate MetroMind JWT
    const token = signToken(user._id);

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

module.exports = { register, login, getMe, googleLogin };
