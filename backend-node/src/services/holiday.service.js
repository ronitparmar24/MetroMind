// backend-node/src/services/holiday.service.js
// Fetches public holidays for India (with Gujarat state coverage) via Calendarific.
// Falls back to Nager.Date (no key required) if Calendarific key is missing or fails.
//
// Cache strategy: per-year in-memory Map — at most ONE real API call per calendar year
// across ALL users and all requests. The cache resets on server restart (acceptable;
// stale holiday names are not harmful). Check server logs for
//   "[Holiday] Fetched N holidays for <year> from <source> — cached for the year."
// to confirm caching is working (should appear only once per year, not per booking).

const axios = require('axios');

// { year (number) → { 'YYYY-MM-DD': holidayName (string) } }
const _cache = new Map();

const CALENDARIFIC_KEY = process.env.CALENDARIFIC_API_KEY || '';
const HOLIDAY_DISCOUNT_PERCENT = 15;

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
  if (_cache.has(year)) return _cache.get(year);

  let holidayMap = {};
  let source = 'unknown';

  // ── Primary: Calendarific (with Gujarat state holidays) ──────────────────
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

  // ── Fallback: Nager.Date (national holidays only, no API key) ───────────
  if (Object.keys(holidayMap).length === 0) {
    try {
      const { data } = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`,
        { timeout: 8000 }
      );
      holidayMap = _parseNager(data);
      source = 'Nager.Date';
    } catch (err) {
      console.warn(`[Holiday] Nager.Date also failed (${err.message?.slice(0, 60)}) — using hardcoded fallback list.`);
      // Last-resort hardcoded list of major Indian public holidays (MM-DD)
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

  _cache.set(year, holidayMap);
  console.log(
    `[Holiday] Fetched ${Object.keys(holidayMap).length} holidays for ${year} from ${source} — cached for the year.`
  );
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
