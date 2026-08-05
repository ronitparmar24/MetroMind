// backend-node/src/app.js
// Express application setup with middleware stack.
// Middleware order matters — mounted in this specific sequence:
// helmet → cors → json → morgan → rateLimit → routes → errorHandler (last)

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { CLIENT_URL } = require('./config/env');
const { limiter } = require('./middleware/rateLimit.middleware');
const errorHandler = require('./middleware/error.middleware');
const auditMiddleware = require('./middleware/audit.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/tickets.routes');
const walletRoutes = require('./routes/wallet.routes');
const transactionRoutes = require('./routes/transactions.routes');
const predictRoutes = require('./routes/predict.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const passRoutes = require('./routes/pass.routes');
const savedRouteRoutes = require('./routes/savedroutes.routes');
const metrocardRoutes = require('./routes/metrocard.routes');
const lostfoundRoutes = require('./routes/lostfound.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const notificationRoutes = require('./routes/notifications.routes');
const routeCompareRoutes = require('./routes/routes.routes');
const liveTrainsRoutes = require('./routes/liveTrains.routes');
const weatherRoutes    = require('./routes/weather.routes');
const geocodeRoutes    = require('./routes/geocode.routes');
const voiceRoutes      = require('./routes/voice.routes');
const adminRoutes      = require('./routes/admin.routes');

const app = express();

// --- Middleware stack (ORDER MATTERS) ---

// 1. Security headers
app.use(helmet());

// 2. CORS — allow the React frontend (local + Vercel deployed)
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app domain
    if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. HTTP request logging
app.use(morgan('dev'));

// 5. Rate limiting — 100 requests per 15 minutes
app.use(limiter);

// 6. Audit Logging (MUST be before routes)
app.use(auditMiddleware);

// 7. Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pass', passRoutes);
app.use('/api/savedroutes', savedRouteRoutes);
app.use('/api/metrocard', metrocardRoutes);
app.use('/api/lostfound', lostfoundRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/routes', routeCompareRoutes);
app.use('/api/live-trains', liveTrainsRoutes);
app.use('/api/weather',    weatherRoutes);
app.use('/api/geocode',    geocodeRoutes);
app.use('/api/voice',      voiceRoutes);
app.use('/api/admin',      adminRoutes);

// Health check — returns DB + ML status for admin dashboard
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const axios = require('axios');

  const dbState = mongoose.connection.readyState; // 1 = connected
  let mlStatus = 'offline';
  try {
    const r = await axios.get('http://127.0.0.1:8000/api/health/', { timeout: 2000 });
    if (r.status === 200) mlStatus = 'online';
  } catch (_) { /* ml offline */ }

  res.json({
    status: 'ok',
    service: 'metromind-product-api',
    db: dbState === 1 ? 'connected' : 'disconnected',
    ml: mlStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 7. Global error handler — MUST be last middleware
app.use(errorHandler);

module.exports = app;
