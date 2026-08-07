// backend-node/src/services/weather.service.js
// Fetches real-time Ahmedabad weather from OpenWeatherMap.
// Single responsibility: HTTP call + response normalisation.
const axios = require('axios');
const { OPENWEATHER_API_KEY } = require('../config/env');

const WEATHER_EMOJI = {
  Clear:        '☀️',
  Clouds:       '☁️',
  Rain:         '🌧️',
  Drizzle:      '🌦️',
  Thunderstorm: '⛈️',
  Snow:         '❄️',
  Mist:         '🌫️',
  Fog:          '🌫️',
  Haze:         '🌫️',
  Smoke:        '🌫️',
  Dust:         '🌪️',
  Sand:         '🌪️',
  Ash:          '🌋',
  Squall:       '💨',
  Tornado:      '🌪️',
};

// Realistic mock data for when the API key is not configured
const MOCK_WEATHER = {
  tempC:       32,
  feelsLike:   35,
  condition:   'Partly Cloudy',
  description: 'partly cloudy',
  humidity:    60,
  windKph:     14,
  isRaining:   false,
  emoji:       '⛅',
  sunrise:     new Date().setHours(6, 10, 0, 0),
  sunset:      new Date().setHours(19, 25, 0, 0),
  isDark:      (() => { const h = new Date().getHours(); return h < 6 || h >= 20; })(),
  isMock:      true,
};

exports.getAhmedabadWeather = async () => {
  if (!OPENWEATHER_API_KEY) {
    // Return mock data silently — no error, no warning spam
    return MOCK_WEATHER;
  }

  const { data } = await axios.get(
    'https://api.openweathermap.org/data/2.5/weather',
    {
      params: {
        q: 'Ahmedabad,IN',
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
      timeout: 5000,
    }
  );

  const main      = data.weather[0].main;        // 'Rain', 'Clear', …
  const desc      = data.weather[0].description; // 'light rain', …
  const tempC     = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const humidity  = data.main.humidity;
  const windKph   = Math.round((data.wind?.speed ?? 0) * 3.6);
  const isRaining = ['Rain', 'Thunderstorm', 'Drizzle'].includes(main);
  const emoji     = WEATHER_EMOJI[main] ?? '🌡️';

  const now = Date.now();

  return {
    tempC,
    feelsLike,
    condition: main,
    description: desc,
    humidity,
    windKph,
    isRaining,
    emoji,
    sunrise:  new Date(data.sys.sunrise * 1000).toISOString(),
    sunset:   new Date(data.sys.sunset  * 1000).toISOString(),
    isDark:   now > data.sys.sunset * 1000 || now < data.sys.sunrise * 1000,
  };
};
