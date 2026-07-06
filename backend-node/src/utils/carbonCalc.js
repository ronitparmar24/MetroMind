// backend-node/src/utils/carbonCalc.js
// CO2 savings calculator: compares metro travel vs car travel
// Average car emits ~120g CO2/km; metro emits ~30g CO2/km per passenger

const CAR_CO2_PER_KM = 0.120; // kg CO2 per km
const METRO_CO2_PER_KM = 0.030; // kg CO2 per km per passenger

/**
 * Calculate CO2 saved by taking metro instead of a car.
 * @param {number} distanceKm - Journey distance in kilometers
 * @param {number} passengers - Number of passengers
 * @returns {number} CO2 saved in kg
 */
const calculateCO2Saved = (distanceKm, passengers = 1) => {
  const carEmissions = distanceKm * CAR_CO2_PER_KM * passengers;
  const metroEmissions = distanceKm * METRO_CO2_PER_KM * passengers;
  const saved = carEmissions - metroEmissions;
  return Math.round(saved * 1000) / 1000; // 3 decimal places
};

module.exports = { calculateCO2Saved, CAR_CO2_PER_KM, METRO_CO2_PER_KM };
