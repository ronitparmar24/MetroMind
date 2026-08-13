import api from './index';

export async function geocodeLocationRouting(query) {
  const res = await api.get('/api/routing/geocode', { params: { q: query } });
  return res.data.location; // { lat, lng, label }
}

export async function getNearestStationsRouting(lat, lng) {
  const res = await api.get('/api/routing/nearest-stations', { params: { lat, lng } });
  return res.data.stations;
}

/**
 * Call Dijkstra's shortest-path algorithm on the backend.
 * @param {string} fromId  Station ID (e.g. "old-high-court")
 * @param {string} toId    Station ID (e.g. "sabarmati")
 * @returns {{ stations, stationIds, totalMinutes, interchangeCount, interchangeStations }}
 */
export async function getShortestPath(fromId, toId) {
  const res = await api.get('/api/routing/shortest-path', { params: { from: fromId, to: toId } });
  return res.data;
}
