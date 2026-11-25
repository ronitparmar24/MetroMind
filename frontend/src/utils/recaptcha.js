// frontend/src/utils/recaptcha.js
// Safe wrapper around Google reCAPTCHA v3.
//
// - Loads the script lazily (only on pages that actually submit a protected form).
// - Skips entirely on localhost: Google refuses localhost for this site key
//   ("Localhost is not supported by default"), which produced a bad token and the
//   backend's "Suspicious activity detected" error. The backend skips the check
//   outside production, so local login/register work without it.
// - Never throws: if the script is blocked (ad blockers, network) it resolves to
//   null and the backend returns a clear message instead of the page crashing.

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

let loadPromise = null;

const isLocalHost = () =>
  typeof window !== 'undefined' &&
  (LOCAL_HOSTS.includes(window.location.hostname) || window.location.hostname.endsWith('.localhost'));

const loadRecaptcha = () => {
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('reCAPTCHA script failed to load'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('reCAPTCHA timed out')), ms)),
  ]);

/** Warm up the script early (e.g. when the login/register page mounts). */
export const preloadRecaptcha = () => {
  if (!SITE_KEY || isLocalHost()) return;
  loadRecaptcha().catch(() => {});
};

/** Returns a reCAPTCHA token, or null if reCAPTCHA is unavailable/skipped. */
export const getRecaptchaToken = async (action = 'submit') => {
  if (!SITE_KEY || isLocalHost()) return null;
  try {
    const grecaptcha = await withTimeout(loadRecaptcha(), 8000);
    await withTimeout(new Promise((resolve) => grecaptcha.ready(resolve)), 8000);
    return await withTimeout(grecaptcha.execute(SITE_KEY, { action }), 8000);
  } catch (err) {
    console.warn('[reCAPTCHA]', err.message);
    return null;
  }
};
