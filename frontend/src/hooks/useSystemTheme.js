// frontend/src/hooks/useSystemTheme.js
// Forces a page to ALWAYS follow the OS/system theme preference,
// ignoring any manually-saved in-app theme (mm_theme in localStorage).
// Used by auth and landing pages so they are always OS-accurate.
// On unmount, restores the user's in-app preference.

import { useEffect } from 'react';

export function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    // Snapshot whatever theme was active before we arrived here
    const previousTheme = document.documentElement.getAttribute('data-theme') || 'light';

    const apply = () => {
      const t = mq.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
    };

    // Apply system theme immediately
    apply();

    // Keep in sync if user changes OS theme while on the page
    mq.addEventListener('change', apply);

    return () => {
      mq.removeEventListener('change', apply);
      // Restore what was there before (user's in-app preference)
      document.documentElement.setAttribute('data-theme', previousTheme);
    };
  }, []);
}
