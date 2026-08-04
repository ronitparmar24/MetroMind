// frontend/src/hooks/useCrowd.js
import { useState, useCallback, useEffect } from 'react';
import { predictCrowd } from '../api/predict.api';

export function useCrowd(station, hour) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!station || hour === undefined) return;
    setLoading(true);
    setError(null);
    try {
      const day = new Date().getDay();
      const res = await predictCrowd({ station, hour, day, passengers: 1 });
      setData(res.data.prediction);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [station, hour]);

  useEffect(() => { fetch(); }, [fetch]);

  return { prediction: data, loading, error, refetch: fetch };
}

export function useCrowdForecast(station, travelDate, startHour = 6, hoursAhead = 17) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!station || !travelDate) return;
    setLoading(true);
    setError(null);
    try {
      const { getCrowdForecast } = await import('../api/predict.api');
      
      const startDate = new Date(travelDate);
      startDate.setHours(startHour, 0, 0, 0);

      const res = await getCrowdForecast({
        station,
        start_datetime: startDate.toISOString(),
        hours_ahead: hoursAhead
      });
      setData(res.data.forecast);
    } catch (err) {
      setError(err.response?.data?.error || 'Forecast failed');
    } finally {
      setLoading(false);
    }
  }, [station, travelDate, startHour, hoursAhead]);

  useEffect(() => { fetch(); }, [fetch]);

  return { forecast: data, loading, error, refetch: fetch };
}
