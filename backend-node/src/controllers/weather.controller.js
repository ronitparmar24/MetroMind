// backend-node/src/controllers/weather.controller.js
// GET /api/weather — returns current Ahmedabad weather.
//
// Caching strategy (upgraded from in-memory to Upstash Redis):
//   Key  : 'weather:ahmedabad'
//   TTL  : 600 seconds (10 minutes) — set via Redis native `ex` option.
//
// Why Redis instead of a module-level object?
//   • Survives server restarts — the cache isn't lost on each deploy.
//   • Shared across multiple server instances — correct on multi-worker or
//     horizontally-scaled deployments (e.g. Vercel serverless functions).
//   • TTL is enforced by Redis atomically — no manual Date.now() comparison.

const { getAhmedabadWeather } = require('../services/weather.service');
const redis = require('../config/redis');

const CACHE_KEY = 'weather:ahmedabad';
const CACHE_TTL = 600; // seconds (10 minutes)

/**
 * GET /api/weather
 * Protected — requires a valid JWT (via protect middleware in route).
 */
exports.getWeather = async (req, res) => {
  try {
    // ── 1. Check Redis cache ─────────────────────────────────────────────
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      // Upstash automatically deserialises JSON stored as a string
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.json({ ...data, cached: true });
    }

    // ── 2. Fetch fresh data from OpenWeatherMap ──────────────────────────
    const weather = await getAhmedabadWeather();

    // ── 3. Store in Redis with automatic TTL (no manual timestamp needed) ─
    await redis.set(CACHE_KEY, JSON.stringify(weather), { ex: CACHE_TTL });

    return res.json({ ...weather, cached: false });
  } catch (err) {
    // On network error, try to serve whatever is in Redis (may be stale past TTL
    // if Redis itself failed — in that case cached will be null and we fall through).
    try {
      const stale = await redis.get(CACHE_KEY);
      if (stale) {
        const data = typeof stale === 'string' ? JSON.parse(stale) : stale;
        return res.json({ ...data, cached: true, stale: true });
      }
    } catch (_) { /* Redis also unavailable — fall through to static fallback */ }

    // No cache at all — return a safe static fallback so the frontend doesn't crash
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
