// backend-node/src/utils/fareEngine.js
// Fare calculation engine — mirrors the frontend copy for UI preview.
// This is the source of truth for actual charges.
// Haversine formula calculates distance between station GPS coordinates.
// Rate: ₹2.50/km, ₹10 minimum, 1.2x multiplier during peak hours.

/**
 * Haversine formula to calculate distance between two GPS coordinates.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if given hour falls in peak window.
 * Peak windows: 8-11 AM and 5-8 PM on weekdays.
 * @param {number} hour - Hour (0-23)
 * @param {number} dayOfWeek - Day of week (0=Sun, 6=Sat)
 * @returns {boolean}
 */
const isPeakHour = (hour, dayOfWeek) => {
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isMorningPeak = hour >= 8 && hour < 11;
  const isEveningPeak = hour >= 17 && hour < 20;
  return isWeekday && (isMorningPeak || isEveningPeak);
};

/**
 * Calculate fare for a journey.
 * @param {Object} source - {lat, lng} of source station
 * @param {Object} dest - {lat, lng} of destination station
 * @param {number} hour - Hour of travel (0-23)
 * @param {number} dayOfWeek - Day of week (0=Sun, 6=Sat)
 * @param {number} passengerCount - Number of passengers
 * @returns {Object} { fare, distance, isPeak, perPassenger }
 */
const calculateFare = (source, dest, hour, dayOfWeek, passengerCount = 1) => {
  const distance = haversine(source.lat, source.lng, dest.lat, dest.lng);
  const baseFare = Math.max(distance * 2.5, 10); // ₹2.50/km, ₹10 minimum
  const peak = isPeakHour(hour, dayOfWeek);
  const multiplier = peak ? 1.2 : 1.0;
  const perPassenger = Math.round(baseFare * multiplier);
  const totalFare = perPassenger * passengerCount;

  return {
    fare: totalFare,
    perPassenger,
    distance: Math.round(distance * 100) / 100,
    isPeak: peak,
  };
};

module.exports = { haversine, isPeakHour, calculateFare };
