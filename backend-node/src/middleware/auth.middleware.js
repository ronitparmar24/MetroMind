// backend-node/src/middleware/auth.middleware.js
// JWT verification middleware — attaches decoded user to req.user

const { verifyToken } = require('../utils/jwt');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const err = new Error('Not authorized — no token provided');
      err.statusCode = 401;
      return next(err);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      const err = new Error('Not authorized — user not found');
      err.statusCode = 401;
      return next(err);
    }

    // A password change/reset signs out every session issued before it
    if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
      const err = new Error('Session expired — please log in again');
      err.statusCode = 401;
      return next(err);
    }

    // A password change/reset signs out every session issued before it
    if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
      const err = new Error('Session expired — please log in again');
      err.statusCode = 401;
      return next(err);
    }

    if (user.isActive === false) {
      const err = new Error('This account has been deactivated');
      err.statusCode = 401;
      return next(err);
    }

    req.user = user;
    next();
  } catch (error) {
    const err = new Error('Not authorized — invalid token');
    err.statusCode = 401;
    next(err);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const err = new Error('Access denied — Admin privileges required');
    err.statusCode = 403;
    next(err);
  }
};

module.exports = { protect, requireAdmin };
