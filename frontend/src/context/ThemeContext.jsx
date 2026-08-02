// frontend/src/context/ThemeContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext(null);

/**
 * Resolve the effective theme (light/dark) from a preference value.
 * 'system' checks window.matchMedia for the OS preference.
 */
function resolveTheme(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }) {
  // preference is one of: 'light' | 'dark' | 'system'
  const [preference, setPreference] = useState('dark');

  // resolved is the actual applied theme: 'light' | 'dark'
  const [resolved, setResolved] = useState('dark');

  // Apply theme to DOM whenever preference changes
  useEffect(() => {
    const effectiveTheme = resolveTheme(preference);
    setResolved(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('mm_theme', preference);
  }, [preference]);

  // Listen for OS-level theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolved(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // setTheme: set a specific theme preference ('light', 'dark', or 'system')
  const setTheme = useCallback((newTheme) => {
    setPreference(newTheme);
  }, []);

  // toggleTheme: cycle between dark ↔ light (for the Navbar quick toggle)
  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = resolveTheme(prev);
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme: resolved,           // actual applied theme: 'light' | 'dark'
      preference,                // user preference: 'light' | 'dark' | 'system'
      setTheme,                  // set specific preference
      toggleTheme,               // quick dark↔light cycle
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
