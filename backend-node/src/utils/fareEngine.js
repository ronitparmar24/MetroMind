// backend-node/src/utils/fareEngine.js
// GMRC Ahmedabad Metro fare engine — slab-based pricing (official published rates).
// Source of truth for actual deductions; frontend copy mirrors this for UI preview.
//
// GMRC Fare Slabs (non-peak):
//   0 – 2 km  → ₹10
//   2 – 5 km  → ₹15
//   5 – 12 km → ₹20
//  12 – 21 km → ₹25
//  21 – 32 km → ₹30
//  32+ km     → ₹35
//
// Peak hours (Mon–Fri, 08:00–11:00 & 17:00–20:00): +20% on base fare
// Track correction: metro track distance ≈ 1.15 × straight-line (curves, diversions)

/**
 * Haversine straight-line distance between two GPS points (km).
 */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Track-distance correction: metro lines are not perfectly straight
const TRACK_CORRECTION = 1.15;

// GMRC official slab table: [max_km, fare_rupees]
const GMRC_SLABS = [
  [2,  10],
  [5,  15],
  [12, 20],
  [21, 25],
  [32, 30],
  [Infinity, 35],
];

/**
 * Map track distance to GMRC fare slab.
 * @param {number} trackKm - Track distance (haversine × TRACK_CORRECTION)
 * @returns {number} Base fare in ₹
 */
const slabFare = (trackKm) => {
  for (const [maxKm, fare] of GMRC_SLABS) {
    if (trackKm <= maxKm) return fare;
  }
  return 35;
};

/**
 * Check if hour is peak (Mon–Fri, 8–11 AM or 5–8 PM).
 */
const isPeakHour = (hour, dayOfWeek) => {
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  return isWeekday && ((hour >= 8 && hour < 11) || (hour >= 17 && hour < 20));
};

/**
 * Calculate fare for a journey between two stations.
 *
 * @param {Object} source   - {lat, lng} of source station
 * @param {Object} dest     - {lat, lng} of destination station
 * @param {number} hour     - Hour of travel (0–23)
 * @param {number} dayOfWeek - 0 = Sunday … 6 = Saturday
 * @param {number} passengerCount - Number of passengers (default 1)
 * @returns {{ fare, perPassenger, baseFare, distance, trackDistance, isPeak }}
 */
const calculateFare = (source, dest, hour, dayOfWeek, passengerCount = 1) => {
  const straightKm   = haversine(source.lat, source.lng, dest.lat, dest.lng);
  const trackKm      = Math.round(straightKm * TRACK_CORRECTION * 100) / 100;
  const baseFare     = slabFare(trackKm);
  const peak         = isPeakHour(hour, dayOfWeek);
  const perPassenger = peak ? Math.round(baseFare * 1.2) : baseFare;
  const totalFare    = perPassenger * passengerCount;

  return {
    fare:          totalFare,
    perPassenger,
    baseFare,
    distance:      Math.round(straightKm * 100) / 100, // straight-line (shown in UI)
    trackDistance: trackKm,                             // actual track distance (used for slab)
    isPeak:        peak,
  };
};

module.exports = { haversine, isPeakHour, calculateFare };
