// backend-node/src/controllers/routeGraph.controller.js
//
// Exposes Dijkstra's shortest-path algorithm via a simple REST endpoint.
// Query params: ?from=<stationId>&to=<stationId>
// Returns: stations[], stationIds[], totalMinutes, interchangeCount, interchangeStations[]

const STATIONS = require('../constants/stations');
const { findShortestRoute } = require('../services/routeGraph.service');

/**
 * GET /api/routing/shortest-path?from=<id>&to=<id>
 *
 * Validates that both station IDs exist in the 53-station dataset,
 * delegates to Dijkstra's algorithm, and returns the computed route.
 */
exports.getShortestPath = (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: 'Both `from` and `to` station IDs are required.',
    });
  }

  // Validate IDs against the known station set
  const fromStation = STATIONS.find(s => s.id === from);
  const toStation   = STATIONS.find(s => s.id === to);

  if (!fromStation) {
    return res.status(400).json({ error: `Unknown station ID: "${from}"` });
  }
  if (!toStation) {
    return res.status(400).json({ error: `Unknown station ID: "${to}"` });
  }
  if (from === to) {
    return res.status(400).json({ error: 'Origin and destination must be different stations.' });
  }

  const route = findShortestRoute(from, to);

  if (route.error) {
    return res.status(404).json({ error: route.error });
  }

  res.json({
    success: true,
    from: fromStation.name,
    to: toStation.name,
    ...route,
  });
};
