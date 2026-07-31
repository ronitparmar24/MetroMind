// backend-node/api/index.js
// Vercel Serverless Function entry point — wraps the Express app
const app = require('../src/app');
const connectDB = require('../src/config/db');

let isConnected = false;

module.exports = async (req, res) => {
  // Reuse MongoDB connection across warm invocations
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return app(req, res);
};
