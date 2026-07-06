// backend-node/src/middleware/error.middleware.js
// Global error handler — must be mounted LAST in the middleware stack.
// Express identifies error handlers by their 4-parameter signature (err, req, res, next).

const { NODE_ENV } = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`❌ [${req.method}] ${req.originalUrl} — ${statusCode}: ${message}`);
  if (NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
