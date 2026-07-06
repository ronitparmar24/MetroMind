// frontend/src/hooks/useTickets.js
import { useState, useCallback, useEffect } from 'react';
import { getTickets as fetchTickets } from '../api/tickets.api';

export function useTickets(statusFilter) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTickets(statusFilter);
      setData(res.data.tickets);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tickets: data, loading, error, refetch: fetch };
}
