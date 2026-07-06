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
