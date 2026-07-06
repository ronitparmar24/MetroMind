// frontend/src/hooks/useWallet.js
import { useState, useCallback, useEffect } from 'react';
import { getWallet } from '../api/wallet.api';

export function useWallet() {
  const [data, setData] = useState({ balance: 0, recentTransactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWallet();
      setData({
        balance: res.data.wallet.balance,
        currency: res.data.wallet.currency,
        recentTransactions: res.data.recentTransactions,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { wallet: data, loading, error, refetch: fetch };
}
