// backend-node/src/services/holiday.service.js
// Fetches public holidays for India (with Gujarat state coverage) via Calendarific.
// Falls back to Nager.Date (no key required) if Calendarific key is missing or fails.
//
// Cache strategy (upgraded from in-memory Map to Upstash Redis):
//   Key  : 'holidays:<year>'   e.g. 'holidays:2026'
//   TTL  : 31 536 000 seconds (≈ 1 year) — public holidays don't change mid-year.
//
// Why Redis?
//   • Persists across server restarts — no cold-start re-fetch on every deploy.
//   • Shared across all serverless function instances simultaneously.
//   • Redis native TTL guarantees automatic yearly expiry with zero application code.

const axios = require('axios');
const redis = require('../config/redis');

const CALENDARIFIC_KEY = process.env.CALENDARIFIC_API_KEY || '';
const HOLIDAY_DISCOUNT_PERCENT = 15;
const CACHE_TTL = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Build the holiday map from Calendarific response shape:
 * data.response.holidays[].{ name, date: { iso: 'YYYY-MM-DD...' } }
 */
function _parseCalendarific(data) {
  const map = {};
  (data?.response?.holidays || []).forEach((h) => {
    const dateKey = h.date?.iso?.slice(0, 10);
    if (dateKey) map[dateKey] = h.name;
  });
  return map;
}

/**
 * Build the holiday map from Nager.Date response shape:
 * [{ date: 'YYYY-MM-DD', localName: '...', name: '...' }]
 */
function _parseNager(data) {
  const map = {};
  (Array.isArray(data) ? data : []).forEach((h) => {
    if (h.date) map[h.date] = h.localName || h.name;
  });
  return map;
}

/**
 * Fetch and cache public holidays for a given year.
 * Tries Calendarific first (Gujarat state holidays included), falls back to Nager.Date.
 *
 * @param {number} year
 * @returns {Promise<Object>} Map of { 'YYYY-MM-DD': holidayName }
 */
exports.getHolidaysForYear = async (year) => {
  const cacheKey = `holidays:${year}`;

  // ── 1. Try Redis cache first ──────────────────────────────────────────────
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const map = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return map;
    }
  } catch (redisErr) {
    // Redis unavailable — proceed to live fetch; no data lost, just slower
    console.warn('[Holiday] Redis read failed, fetching live:', redisErr.message?.slice(0, 60));
  }

  // ── 2. Live fetch ─────────────────────────────────────────────────────────
  let holidayMap = {};
  let source = 'unknown';

  // Primary: Calendarific (with Gujarat state holidays)
  if (CALENDARIFIC_KEY) {
    try {
      const { data } = await axios.get('https://calendarific.com/api/v2/holidays', {
        params: {
          api_key: CALENDARIFIC_KEY,
          country:  'IN',
          year,
          location: 'in-gj', // Gujarat state holidays included
        },
        timeout: 8000,
      });
      holidayMap = _parseCalendarific(data);
      source = 'Calendarific';
    } catch (err) {
      console.warn(`[Holiday] Calendarific failed (${err.message?.slice(0, 60)}), trying Nager.Date fallback…`);
    }
  }

  // Fallback: Nager.Date (national holidays only, no API key)
  if (Object.keys(holidayMap).length === 0) {
    try {
      const { data } = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`,
        { timeout: 8000 }
      );
      holidayMap = _parseNager(data);
      source = 'Nager.Date';

      if (Object.keys(holidayMap).length === 0) {
        throw new Error('Nager.Date returned empty array/no data');
      }
    } catch (err) {
      console.warn(`[Holiday] Nager.Date also failed (${err.message?.slice(0, 60)}) — using hardcoded fallback list.`);
      // Last-resort hardcoded list of major Indian public holidays
      const STATIC_HOLIDAYS = {
        [`${year}-01-14`]: 'Uttarayan / Makar Sankranti',
        [`${year}-01-26`]: 'Republic Day',
        [`${year}-04-14`]: 'Ambedkar Jayanti',
        [`${year}-05-01`]: 'Gujarat Day / Labour Day',
        [`${year}-08-15`]: 'Independence Day',
        [`${year}-10-02`]: 'Gandhi Jayanti',
        [`${year}-11-01`]: 'Diwali',
        [`${year}-12-25`]: 'Christmas',
      };
      holidayMap = STATIC_HOLIDAYS;
      source = 'hardcoded-fallback';
    }
  }

  // ── 3. Store in Redis with 1-year TTL ─────────────────────────────────────
  try {
    await redis.set(cacheKey, JSON.stringify(holidayMap), { ex: CACHE_TTL });
    console.log(
      `[Holiday] Fetched ${Object.keys(holidayMap).length} holidays for ${year} from ${source} — cached in Redis for 1 year.`
    );
  } catch (redisErr) {
    // Write failure is non-fatal — the data is returned correctly even without caching
    console.warn('[Holiday] Redis write failed (non-fatal):', redisErr.message?.slice(0, 60));
    console.log(
      `[Holiday] Fetched ${Object.keys(holidayMap).length} holidays for ${year} from ${source} (not cached).`
    );
  }

  return holidayMap;
};

/**
 * Check whether a given travel date falls on a public holiday and return discount info.
 *
 * @param {string} travelDate — 'YYYY-MM-DD' or any ISO-parseable date string
 * @returns {Promise<{ isHoliday: boolean, holidayName: string|null, discountPercent: number }>}
 */
exports.checkHolidayDiscount = async (travelDate) => {
  try {
    const dateObj = new Date(travelDate);
    const year    = dateObj.getUTCFullYear();
    const dateKey = dateObj.toISOString().slice(0, 10); // always YYYY-MM-DD

    const holidays = await exports.getHolidaysForYear(year);

    if (holidays[dateKey]) {
      return {
        isHoliday:       true,
        holidayName:     holidays[dateKey],
        discountPercent: HOLIDAY_DISCOUNT_PERCENT,
      };
    }
    return { isHoliday: false, holidayName: null, discountPercent: 0 };
  } catch (err) {
    // Never block a booking due to a holiday check error
    console.warn('[Holiday] checkHolidayDiscount failed silently:', err.message?.slice(0, 60));
    return { isHoliday: false, holidayName: null, discountPercent: 0 };
  }
};
