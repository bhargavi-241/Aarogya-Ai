import { useState, useCallback } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (apiFn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      return response.data;
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, call, reset };
}
