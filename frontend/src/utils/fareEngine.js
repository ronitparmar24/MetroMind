// frontend/src/utils/fareEngine.js
// Frontend copy of GMRC fare engine — used for instant UI preview before booking.
// Backend version is the source of truth for actual charges; keep both in sync.
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
// Track correction: metro track distance ≈ 1.15 × straight-line haversine

// Track-distance correction factor
const TRACK_CORRECTION = 1.15;

// GMRC official slab table: [max_km, fare_rupees]
const GMRC_SLABS = [
  [2,        10],
  [5,        15],
  [12,       20],
  [21,       25],
  [32,       30],
  [Infinity, 35],
];

/** Haversine straight-line distance (km) */
export const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Estimate distance between two station objects.
 * Prefers GPS Haversine; falls back to station-order estimation.
 */
const estimateDistance = (source, dest) => {
  if (source.lat && source.lng && dest.lat && dest.lng) {
    return haversine(source.lat, source.lng, dest.lat, dest.lng);
  }
  // Order-based fallback — avg inter-station gap on GMRC ≈ 1.1 km
  const AVG_GAP_KM = 1.1;
  if (source.order != null && dest.order != null && source.line === dest.line) {
    return Math.abs(source.order - dest.order) * AVG_GAP_KM;
  }
  if (source.order != null && dest.order != null) {
    return (source.order + dest.order) * AVG_GAP_KM * 0.5 + 2;
  }
  return 5;
};

/** Map track distance (km) to GMRC slab fare */
const slabFare = (trackKm) => {
  for (const [maxKm, fare] of GMRC_SLABS) {
    if (trackKm <= maxKm) return fare;
  }
  return 35;
};

/** True if hour is peak on a weekday */
export const isPeakHour = (hour, dayOfWeek) => {
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  return isWeekday && ((hour >= 8 && hour < 11) || (hour >= 17 && hour < 20));
};

/**
 * Calculate fare for a journey (UI preview).
 *
 * @param {Object} source       - Station object with at least {lat, lng} or {order, line}
 * @param {Object} dest         - Station object
 * @param {number} hour         - Hour of travel (0–23)
 * @param {number} dayOfWeek    - 0 = Sunday … 6 = Saturday
 * @param {number} passengers   - Number of passengers (default 1)
 * @returns {{ fare, perPassenger, baseFare, distance, trackDistance, isPeak }}
 */
export const calculateFare = (source, dest, hour, dayOfWeek, passengers = 1) => {
  const straightKm   = estimateDistance(source, dest);
  const trackKm      = Math.round(straightKm * TRACK_CORRECTION * 100) / 100;
  const baseFare     = slabFare(trackKm);
  const peak         = isPeakHour(hour, dayOfWeek);
  const perPassenger = peak ? Math.round(baseFare * 1.2) : baseFare;

  return {
    baseFare,
    fare:          perPassenger * passengers,
    perPassenger,
    distance:      Math.round(straightKm * 100) / 100,
    trackDistance: trackKm,
    isPeak:        peak,
  };
};
