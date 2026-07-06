// backend-node/src/server.js
// Application entry point — connects to MongoDB then starts Express server

const app = require('./app');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚇 MetroMind Product API running on port ${PORT} [${NODE_ENV}]`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
