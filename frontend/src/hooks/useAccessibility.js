// frontend/src/hooks/useAccessibility.js
// Reads/writes the "step-free / accessible routing" preference from localStorage.
// Used by InteractiveMetroMap and JourneyPlanner to conditionally show ♿ badges.

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'mm_accessible';

export function useAccessibility() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const set = useCallback((value) => {
    const boolVal = Boolean(value);
    setEnabled(boolVal);
    try { localStorage.setItem(STORAGE_KEY, String(boolVal)); } catch {}
  }, []);

  return { accessible: enabled, toggleAccessible: toggle, setAccessible: set };
}
