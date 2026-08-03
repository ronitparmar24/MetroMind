// backend-node/src/services/geocode.service.js
// Wraps OpenStreetMap Nominatim — free, no API key required.
// Nominatim usage policy: max 1 req/sec, must send a descriptive User-Agent.
// We append ", Ahmedabad, India" to bias results to the correct city.

const axios = require('axios');

/**
 * Geocode a free-text location to { lat, lng }.
 * Returns null if Nominatim finds nothing.
 * @param {string} query  e.g. "Bopal", "SG Highway", "Thaltej Cross Road"
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
exports.geocodeLocation = async (query) => {
  const { data } = await axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params: {
        q: `${query}, Ahmedabad, India`,
        format: 'json',
        limit: 1,
        countrycodes: 'in',
        // viewbox acts as a soft ranking bias; bounded=0 so valid areas
        // like Nikol/Naroda aren't hard-excluded by the boundary check
        viewbox: '72.40,22.85,72.85,23.30',
        bounded: 0,
      },
      headers: {
        // Nominatim's policy requires a descriptive User-Agent string
        'User-Agent': 'MetroMind-App/1.0 (student project; contact: metromind@example.com)',
      },
      timeout: 5000,
    }
  );

  if (!data || !data.length) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
};
