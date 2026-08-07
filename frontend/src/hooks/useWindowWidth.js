// frontend/src/hooks/useWindowWidth.js
// Returns the current window innerWidth, updated on resize with debounce.
// Use this in JSX to conditionally apply mobile styles to inline-styled pages.
//
// Usage:
//   const isMobile = useWindowWidth() < 768;
//   const isSmall  = useWindowWidth() < 480;

import { useState, useEffect } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    let rafId;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return width;
}

// Convenience breakpoint helpers
export const BREAKPOINTS = {
  desktop:     1200,
  tablet:      768,
  mobile:      480,
};
