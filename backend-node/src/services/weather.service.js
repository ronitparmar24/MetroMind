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

exports.getAhmedabadWeather = async () => {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY not set in environment');
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

  return {
    tempC,
    feelsLike,
    condition: main,
    description: desc,
    humidity,
    windKph,
    isRaining,
    emoji,
  };
};
