// frontend/src/utils/fareEngine.js
// Frontend copy of fare engine — used for instant UI preview.
// Backend version is the source of truth for actual charges.

export const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isPeakHour = (hour, dayOfWeek) => {
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  return isWeekday && ((hour >= 8 && hour < 11) || (hour >= 17 && hour < 20));
};

export const calculateFare = (source, dest, hour, dayOfWeek, passengers = 1) => {
  const distance = haversine(source.lat, source.lng, dest.lat, dest.lng);
  const baseFare = Math.max(distance * 2.5, 10);
  const peak = isPeakHour(hour, dayOfWeek);
  const perPassenger = Math.round(baseFare * (peak ? 1.2 : 1.0));
  return {
    fare: perPassenger * passengers,
    perPassenger,
    distance: Math.round(distance * 100) / 100,
    isPeak: peak,
  };
};
