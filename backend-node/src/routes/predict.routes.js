// backend-node/src/routes/predict.routes.js
// Proxies crowd predictions to Django ML service — API Gateway pattern
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  predictCrowd,
  getAnomalyCheck,
  getPersonalityProfile,
  getBestDeparture,
  getCommuterCluster,
  getForecast,
} = require('../controllers/predict.controller');

router.post('/crowd', protect, predictCrowd);
router.post('/anomaly', protect, getAnomalyCheck);
router.get('/personality', protect, getPersonalityProfile);
router.post('/best-departure', protect, getBestDeparture);
router.get('/cluster', protect, getCommuterCluster);
router.post('/forecast', protect, getForecast);

module.exports = router;
