// backend-node/src/controllers/weather.controller.js
// GET /api/weather — returns current Ahmedabad weather.
//
// Caching strategy:
//   Module-level { data, fetchedAt } object — avoids hitting the
//   OpenWeatherMap free-tier (60 calls/min, 1 000 calls/day) on
//   every dashboard load.  Cache is invalidated after 10 minutes.

const { getAhmedabadWeather } = require('../services/weather.service');

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cache = {
  data:      null,
  fetchedAt: null,
};

/**
 * GET /api/weather
 * Protected — requires a valid JWT (via protect middleware in route).
 */
exports.getWeather = async (req, res) => {
  try {
    const now = Date.now();

    // Serve from cache if fresh
    if (cache.data && cache.fetchedAt && now - cache.fetchedAt < CACHE_TTL_MS) {
      return res.json({
        ...cache.data,
        cached:    true,
        cachedAge: Math.round((now - cache.fetchedAt) / 1000), // seconds
      });
    }

    // Fetch fresh data
    const weather = await getAhmedabadWeather();

    // Update cache
    cache = { data: weather, fetchedAt: now };

    return res.json({ ...weather, cached: false, cachedAge: 0 });
  } catch (err) {
    console.error('❌ [Weather] API error:', err.message);

    // If cache has stale data, serve it with a warning rather than
    // returning a 500 — better UX when OWM is temporarily down.
    if (cache.data) {
      return res.json({
        ...cache.data,
        cached:    true,
        stale:     true,
        cachedAge: cache.fetchedAt
          ? Math.round((Date.now() - cache.fetchedAt) / 1000)
          : null,
      });
    }

    // No cache at all — return a safe fallback so the frontend doesn't crash
    return res.status(200).json({
      tempC:       31,
      feelsLike:   35,
      condition:   'Clear',
      description: 'clear sky',
      humidity:    50,
      windKph:     10,
      isRaining:   false,
      emoji:       '☀️',
      fallback:    true,
    });
  }
};
