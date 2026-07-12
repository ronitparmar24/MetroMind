// backend-node/src/routes/routes.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { compareRoutes } = require('../controllers/routes.controller');

router.post('/compare', protect, compareRoutes);

module.exports = router;
