const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { geocode, getNearestStations } = require('../controllers/routing.controller');
const { getShortestPath } = require('../controllers/routeGraph.controller');

router.get('/geocode', protect, geocode);
router.get('/nearest-stations', protect, getNearestStations);

// Dijkstra's shortest-path: GET /api/routing/shortest-path?from=<id>&to=<id>
// Protected (requires a valid JWT) — station IDs come from the authenticated UI.
router.get('/shortest-path', protect, getShortestPath);

module.exports = router;
