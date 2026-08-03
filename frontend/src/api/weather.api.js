// frontend/src/api/weather.api.js
// Thin wrapper around GET /api/weather
import api from './index';

/**
 * @returns {Promise<{
 *   tempC: number,
 *   feelsLike: number,
 *   condition: string,
 *   description: string,
 *   humidity: number,
 *   windKph: number,
 *   isRaining: boolean,
 *   emoji: string,
 *   cached?: boolean,
 *   fallback?: boolean
 * }>}
 */
export const fetchWeather = () => api.get('/api/weather').then(r => r.data);
