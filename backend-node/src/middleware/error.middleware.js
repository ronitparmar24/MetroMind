// backend-node/src/middleware/error.middleware.js
// Global error handler — must be mounted LAST in the middleware stack.
// Express identifies error handlers by their 4-parameter signature (err, req, res, next).

// Stack traces only when NODE_ENV is *explicitly* development and we're not on
// Vercel — an unset NODE_ENV used to default to 'development' and leak them.
const SHOW_DETAILS = process.env.NODE_ENV === 'development' && !process.env.VERCEL;

const errorHandler = (err, req, res, next) => {
  // Malformed JSON / oversized bodies from express.json()
  let statusCode = err.statusCode || err.status || 500;
  if (err.type === 'entity.too.large') statusCode = 413;

  const isServerError = statusCode >= 500;
  // Don't expose raw database/library messages for unexpected server errors
  const message = isServerError && !SHOW_DETAILS && !err.statusCode
    ? 'Something went wrong. Please try again.'
    : (err.message || 'Internal Server Error');

  console.error(`❌ [${req.method}] ${req.originalUrl} — ${statusCode}: ${err.message}`);
  if (SHOW_DETAILS) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(SHOW_DETAILS && { stack: err.stack }),
  });
};

module.exports = errorHandler;
