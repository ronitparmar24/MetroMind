// backend-node/src/routes/predict.routes.js
// Proxies crowd predictions to Django ML service — API Gateway pattern
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { predictCrowd } = require('../controllers/predict.controller');

router.post('/crowd', protect, predictCrowd);

module.exports = router;
