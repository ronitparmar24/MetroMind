// backend-node/src/server.js
// Application entry point — connects to MongoDB then starts Express server

const app = require('./app');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

const startServer = async () => {
  await connectDB();

  // ── Firebase Admin + push scheduler ──────────────────────────────────
  try {
    require('./config/firebase'); // initialises Firebase Admin singleton
    const { startDepartureScheduler } = require('./utils/departureScheduler');
    startDepartureScheduler();
  } catch (err) {
    console.warn('⚠️  Firebase Admin failed to init (push notifications disabled):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚇 MetroMind Product API running on port ${PORT} [${NODE_ENV}]`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
