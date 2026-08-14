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
const announcementRoutes = require('./routes/announcements.routes');
const holidaysRoutes   = require('./routes/holidays.routes');
const routingRoutes    = require('./routes/routing.routes');
const commuterRoutes   = require('./routes/commuter.routes');
const newsRoutes       = require('./routes/news.routes');

const app = express();
app.set('trust proxy', 1); // For Vercel real IP

// --- Middleware stack (ORDER MATTERS) ---

// 0. Handle CORS preflight (OPTIONS) FIRST — before helmet or any other middleware.
//    Without this, preflight requests fall through to routes and get rejected.
const corsOptions = {
  origin: function (origin, callback) {
    const allowed = [
      CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    // Allow requests with no origin (mobile apps, curl, Vercel serverless-to-serverless)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app domain (covers all preview + production deployments)
    if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

// Respond immediately to all OPTIONS preflight requests
app.options('*', cors(corsOptions));

// 1. Security headers — disable policies that interfere with CORS cross-origin requests
app.use(helmet({
  crossOriginResourcePolicy: false,   // don't block cross-origin resource loads
  contentSecurityPolicy: false,       // not needed for a REST API (no HTML)
}));

// 2. CORS — apply to all regular requests
app.use(cors(corsOptions));

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
const publicRoutes   = require('./routes/public.routes');

app.use('/api/auth', authRoutes);
app.use('/api/stations', require('./routes/stations.routes'));
app.use('/api/public', publicRoutes);
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
app.use('/api/announcements', announcementRoutes);
app.use('/api/holidays',   holidaysRoutes);
app.use('/api/routing',    routingRoutes);
app.use('/api/commuter',   commuterRoutes);
app.use('/api/news',       newsRoutes);
app.get('/api/check-username/:username', require('./controllers/auth.controller').checkUsername);

// Temporary debug endpoint — shows user identity + DB data counts to diagnose data mismatch
app.get('/api/debug/me', require('./middleware/auth.middleware').protect, async (req, res) => {
  const mongoose = require('mongoose');
  const Ticket = require('./models/Ticket.model');
  const Transaction = require('./models/Transaction.model');
  const Wallet = require('./models/Wallet.model');

  const [ticketCount, txCount, wallet] = await Promise.all([
    Ticket.countDocuments({ userId: req.user._id }),
    Transaction.countDocuments({ userId: req.user._id }),
    Wallet.findOne({ userId: req.user._id }),
  ]);

  res.json({
    debug: true,
    userId: req.user._id,
    email: req.user.email,
    name: req.user.name,
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.db?.databaseName || 'unknown',
    tickets: ticketCount,
    transactions: txCount,
    walletBalance: wallet?.balance ?? 'no wallet',
    JWT_SECRET_prefix: process.env.JWT_SECRET?.slice(0, 6) + '...',
  });
});


// Health check — returns DB + ML status for admin dashboard
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const axios = require('axios');
  const mlService = require('./services/ml.service');

  const dbState = mongoose.connection.readyState; // 1 = connected
  let mlStatus = 'offline';
  
  // Try Python service first
  try {
    const { DJANGO_API_URL } = require('./config/env');
    const mlUrl = (DJANGO_API_URL || 'http://127.0.0.1:8000') + '/api/health/';
    const r = await axios.get(mlUrl, { timeout: 3000 });
    if (r.status === 200) mlStatus = 'online';
  } catch (_) {
    // Python unreachable — check Node-native ML service
    if (mlService.isAvailable()) {
      mlStatus = 'online';
    }
  }

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
