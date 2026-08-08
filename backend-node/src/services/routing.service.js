const axios = require('axios');
const { ORS_API_KEY } = require('../config/env');

const ORS_BASE = 'https://api.openrouteservice.org';

// In-memory cache for routing (TTL: 1 hour)
const routeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

// Helper to clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of routeCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      routeCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Common Ahmedabad local abbreviations to improve ORS geocoding accuracy
const ALIASES = {
  'lj': 'LJ University',
  'iim': 'IIM Ahmedabad',
  'iima': 'IIM Ahmedabad',
  'ld': 'LD College of Engineering',
  'gls': 'GLS University',
  'nirma': 'Nirma University',
  'cept': 'CEPT University'
};

/**
 * Geocode a typed location or quick-pick chip into coordinates
 */
exports.geocodeLocation = async (query) => {
  const normalizedQuery = query.trim().toLowerCase();
  const expandedQuery = ALIASES[normalizedQuery] || query;

  const { data } = await axios.get(`${ORS_BASE}/geocode/search`, {
    params: {
      api_key: ORS_API_KEY,
      text: `${expandedQuery}, Ahmedabad, India`,
      size: 1,
    },
  });
  if (!data.features || !data.features.length) return null;
  const [lng, lat] = data.features[0].geometry.coordinates;
  return { lat, lng, label: data.features[0].properties.label };
};

/**
 * Real walking directions between two points (not straight-line)
 * Includes in-memory caching rounded to ~100m precision (3 decimal places)
 */
exports.getWalkingDirections = async (fromCoords, toCoords) => {
  // Round to 3 decimal places (~111m at equator)
  const roundCoord = (c) => Math.round(c * 1000) / 1000;
  
  const cacheKey = `${roundCoord(fromCoords.lat)},${roundCoord(fromCoords.lng)}_${roundCoord(toCoords.lat)},${roundCoord(toCoords.lng)}`;
  
  if (routeCache.has(cacheKey)) {
    const cached = routeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    routeCache.delete(cacheKey);
  }

  const { data } = await axios.post(
    `${ORS_BASE}/v2/directions/foot-walking`,
    { coordinates: [[fromCoords.lng, fromCoords.lat], [toCoords.lng, toCoords.lat]] },
    { headers: { Authorization: ORS_API_KEY } }
  );

  if (!data.routes || !data.routes.length) {
    throw new Error('No routes found');
  }

  const route = data.routes[0];
  const result = {
    distanceMeters: Math.round(route.summary.distance),
    durationMinutes: Math.round(route.summary.duration / 60),
    steps: route.segments[0].steps.map(s => s.instruction), // real turn-by-turn
  };

  routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
};
