// backend-node/api/index.js
// Vercel Serverless Function entry point — wraps the Express app
const app = require('../src/app');
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  // Reuse MongoDB connection across warm invocations.
  // Check actual readyState (1 = connected) — a boolean flag
  // would stay true after a dropped connection and skip reconnect.
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  return app(req, res);
};
