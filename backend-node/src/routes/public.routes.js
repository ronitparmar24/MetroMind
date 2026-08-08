// backend-node/src/routes/public.routes.js
const router = require('express').Router();
const { getLandingStats } = require('../controllers/public.controller');

router.get('/stats', getLandingStats);

module.exports = router;
