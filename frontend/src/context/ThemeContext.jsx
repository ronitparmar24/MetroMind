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

/**
 * Read the saved preference from localStorage, falling back to 'system'.
 * Only trusts the saved value if the user explicitly set it (mm_theme_manual=1).
 */
function getInitialPreference() {
  try {
    const manual = localStorage.getItem('mm_theme_manual');
    if (manual === '1') {
      const saved = localStorage.getItem('mm_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
  } catch (_) { /* localStorage unavailable */ }
  // No explicit user choice → follow the OS
  return 'system';
}

/**
 * Apply theme to <html> immediately (before React paints) to avoid flash.
 * Called once outside of React so it runs synchronously on module load.
 */
(function applyThemeEarly() {
  try {
    const pref = getInitialPreference();
    const theme = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) { /* noop */ }
})();

export function ThemeProvider({ children }) {
  // Initialise from localStorage / system — never hardcode 'dark'
  const [preference, setPreference] = useState(getInitialPreference);

  // resolved is the actual applied theme: 'light' | 'dark'
  const [resolved, setResolved] = useState(() => resolveTheme(getInitialPreference()));

  // Apply theme to DOM whenever preference changes
  useEffect(() => {
    const effectiveTheme = resolveTheme(preference);
    setResolved(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('mm_theme', preference);
    
    // Also sync the inline background colors to match index.html logic
    if (effectiveTheme === 'dark') {
      document.documentElement.style.backgroundColor = '#0f172a';
      document.documentElement.style.color = '#f1f5f9';
    } else {
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.documentElement.style.color = '#0f172a';
    }
  }, [preference]);

  // Listen for OS-level theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolved(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.style.backgroundColor = '#0f172a';
        document.documentElement.style.color = '#f1f5f9';
      } else {
        document.documentElement.style.backgroundColor = '#f8fafc';
        document.documentElement.style.color = '#0f172a';
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // setTheme: set a specific theme preference ('light', 'dark', or 'system')
  const setTheme = useCallback((newTheme) => {
    localStorage.setItem('mm_theme_manual', '1');
    setPreference(newTheme);
  }, []);

  // toggleTheme: cycle between dark & light (for the Navbar quick toggle)
  const toggleTheme = useCallback(() => {
    localStorage.setItem('mm_theme_manual', '1');
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
