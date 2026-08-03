// frontend/src/api/geocode.api.js
// Two-tier geocode strategy:
//   1. Backend proxy (/api/geocode) — server-side Nominatim call
//   2. Browser-direct Nominatim fallback — if backend is 502 (datacenter IP blocked),
//      call Nominatim directly from the browser where IPs are never blocked
import api from './index';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Browser-direct Nominatim call (fallback only).
 * NOTE: bounded=0 so real Ahmedabad areas like Nikol, Naroda, ISCON etc.
 * are not filtered out by the viewbox boundary check.
 */
async function _nominatimDirect(query) {
  const params = new URLSearchParams({
    q:            `${query}, Ahmedabad, India`,
    format:       'json',
    limit:        '1',
    countrycodes: 'in',
    viewbox:      '72.40,22.85,72.85,23.30', // soft bias toward Ahmedabad
    bounded:      '0',                         // don't hard-restrict — allow nearby matches
  });
  const res  = await fetch(`${NOMINATIM_URL}?${params}`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    success:     true,
    lat:         parseFloat(data[0].lat),
    lng:         parseFloat(data[0].lon),
    displayName: data[0].display_name,
    query,
    direct:      true,
  };
}

/**
 * Geocode a free-text Ahmedabad location.
 * @param {string} query  e.g. "Nikol", "SG Highway", "Bopal"
 * @returns {Promise<{lat, lng, displayName}>}
 */
export async function geocodeLocation(query) {
  try {
    const res = await api.get('/api/geocode', { params: { q: query } });
    return res.data;
  } catch (err) {
    // Backend 502 = Nominatim blocked server IP; fall back to browser-direct
    if (err.response?.status === 502 || !err.response) {
      const result = await _nominatimDirect(query);
      if (!result) {
        const e = new Error('Location not found');
        e.response = { status: 404 };
        throw e;
      }
      return result;
    }
    throw err; // re-throw 404 and other genuine errors
  }
}
