const axios = require('axios');
let _cache = {}; // keyed by station id, 1-hour TTL

exports.getNearbyAmenities = async (lat, lng, stationId) => {
  const cacheKey = stationId;
  if (_cache[cacheKey] && Date.now() - _cache[cacheKey].ts < 3600000) {
    return _cache[cacheKey].data;
  }
  const radius = 400; // meters
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="parking"](around:${radius},${lat},${lng});
      node["amenity"="atm"](around:${radius},${lat},${lng});
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      node["amenity"="cafe"](around:${radius},${lat},${lng});
    );
    out body 15;
  `;
  const { data } = await axios.post(
    'https://overpass-api.de/api/interpreter',
    query,
    { headers: { 'Content-Type': 'text/plain' } }
  );
  const results = data.elements
    .filter(el => el.tags?.name)
    .map(el => ({
      name: el.tags.name,
      type: el.tags.amenity,
      lat: el.lat, lng: el.lon,
    }));
  _cache[cacheKey] = { data: results, ts: Date.now() };
  return results;
};

exports.getAreaSummary = async (placeName) => {
  try {
    const { data } = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
    );
    if (data.type === 'disambiguation') return null;
    return { extract: data.extract, thumbnailUrl: data.thumbnail?.source, url: data.content_urls?.desktop?.page };
  } catch (err) {
    return null; // some stations won't have a matching article — fine, hide section
  }
};
