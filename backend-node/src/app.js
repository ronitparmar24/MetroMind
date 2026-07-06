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

const app = express();

// --- Middleware stack (ORDER MATTERS) ---

// 1. Security headers
app.use(helmet());

// 2. CORS — only allow the React frontend origin
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. HTTP request logging
app.use(morgan('dev'));

// 5. Rate limiting — 100 requests per 15 minutes
app.use(limiter);

// 6. Mount routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'metromind-product-api' });
});

// 7. Global error handler — MUST be last middleware
app.use(errorHandler);

module.exports = app;
