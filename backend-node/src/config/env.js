// backend-node/src/config/env.js
// Loads environment variables — works with both .env files (local)
// and Vercel's dashboard-configured env vars (production)

const dotenv = require('dotenv');
const path = require('path');

// Load .env file only in non-production (Vercel sets vars via dashboard)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// In production (Vercel), only MONGO_URI and JWT_SECRET are strictly required
// DJANGO_API_URL, CLIENT_URL etc. have sensible defaults
const REQUIRED_VARS = ['MONGO_URI', 'JWT_SECRET'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  // Don't process.exit in serverless — throw instead
  if (process.env.VERCEL) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
  console.error('   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DJANGO_API_URL: process.env.DJANGO_API_URL || '',
  CLIENT_URL: process.env.CLIENT_URL || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || '',
};
