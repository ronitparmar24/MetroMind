// backend-node/src/server.js
// Application entry point — connects to MongoDB then starts Express server

// ── Sentry must be initialised FIRST, before any other require ──
// This allows it to auto-instrument http, express, mongoose, etc.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN_NODE,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,           // 100% of transactions traced (reduce in prod if volume is high)
  enabled: !!process.env.SENTRY_DSN_NODE,  // only activate when DSN is set
});

const app = require('./app');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

const startServer = async () => {
  await connectDB();

  // ── Firebase Admin + push scheduler ──────────────────────────────────
  // Firebase is OPTIONAL — push notifications only. Never crash on failure.
  try {
    require('./config/firebase'); // initialises Firebase Admin singleton
    try {
      const { startDepartureScheduler } = require('./utils/departureScheduler');
      startDepartureScheduler();
    } catch (schedErr) {
      console.warn('⚠️  Departure scheduler skipped:', schedErr.message);
    }
  } catch (err) {
    console.warn('⚠️  Firebase Admin skipped (push notifications disabled):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚇 MetroMind Product API running on port ${PORT} [${NODE_ENV}]`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

