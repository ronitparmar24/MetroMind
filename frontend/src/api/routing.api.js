import api from './index';

export async function geocodeLocationRouting(query) {
  const res = await api.get('/api/routing/geocode', { params: { q: query } });
  return res.data.location; // { lat, lng, label }
}

export async function getNearestStationsRouting(lat, lng) {
  const res = await api.get('/api/routing/nearest-stations', { params: { lat, lng } });
  return res.data.stations;
}
