// backend-node/src/routes/savedroutes.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getSavedRoutes, saveRoute } = require('../controllers/savedroutes.controller');

router.get('/', protect, getSavedRoutes);
router.post('/', protect, saveRoute);

module.exports = router;
