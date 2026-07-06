// frontend/src/utils/carbonCalc.js
const CAR_CO2_PER_KM = 0.120;
const METRO_CO2_PER_KM = 0.030;

export const calculateCO2Saved = (distanceKm, passengers = 1) => {
  const carEmissions = distanceKm * CAR_CO2_PER_KM * passengers;
  const metroEmissions = distanceKm * METRO_CO2_PER_KM * passengers;
  return Math.round((carEmissions - metroEmissions) * 1000) / 1000;
};

export const formatCO2 = (kg) => {
  if (kg >= 1) return `${kg.toFixed(1)} kg`;
  return `${(kg * 1000).toFixed(0)} g`;
};
