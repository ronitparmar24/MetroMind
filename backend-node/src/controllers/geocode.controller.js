// backend-node/src/controllers/geocode.controller.js
// GET /api/geocode?q=<location>
//
// Rate limiting: Nominatim asks for max 1 req/sec.
// express-rate-limit already covers the app globally (100/15min).
// We add a simple in-memory last-request timestamp guard so rapid
// successive dashboard calls never breach the 1 req/sec policy.

const { geocodeLocation } = require('../services/geocode.service');

// Minimum gap between Nominatim calls (ms) — 1 request per second
const MIN_GAP_MS   = 1100;
let   _lastCallAt  = 0;

/**
 * GET /api/geocode?q=Bopal
 * Protected — requires JWT (via protect middleware in route).
 */
exports.geocode = async (req, res) => {
  const query = (req.query.q || '').trim();

  if (!query) {
    return res.status(400).json({ success: false, error: 'Query parameter "q" is required.' });
  }

  // Enforce Nominatim's 1 req/sec policy with a simple server-side gate.
  // If requests arrive faster, we add a small wait rather than dropping the call.
  const now = Date.now();
  const gap  = now - _lastCallAt;
  if (gap < MIN_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_GAP_MS - gap));
  }
  _lastCallAt = Date.now();

  try {
    const result = await geocodeLocation(query);

    if (!result) {
      return res.status(404).json({
        success: false,
        error:   `Location "${query}" not found in Ahmedabad. Try a nearby landmark or area name.`,
        notFound: true,
      });
    }

    return res.json({
      success:     true,
      lat:         result.lat,
      lng:         result.lng,
      displayName: result.displayName,
      query,
    });
  } catch (err) {
    console.error('❌ [Geocode] Nominatim error:', err.message);
    return res.status(502).json({
      success: false,
      error:   'Geocoding service temporarily unavailable. Try again in a moment.',
    });
  }
};
