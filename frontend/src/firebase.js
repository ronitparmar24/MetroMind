// frontend/src/firebase.js
// Firebase client SDK setup — used for FCM push token registration.
//
// IMPORTANT: These are PUBLIC/CLIENT-SIDE keys — safe in the browser bundle.
// All privileged operations run server-side via firebase-admin.
//
// If VITE_FIREBASE_API_KEY is still the placeholder value, Firebase is NOT
// initialised and all FCM functions return null gracefully — no console errors.
//
// To enable FCM:
//   Firebase Console → metromind-34e9d → Project Settings → Your apps → Web → Config
//   Copy apiKey and appId, then update frontend/.env and public/firebase-messaging-sw.js

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const API_KEY  = import.meta.env.VITE_FIREBASE_API_KEY  || '';
const APP_ID   = import.meta.env.VITE_FIREBASE_APP_ID   || '';
const VAPID    = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const PROJECT  = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'metromind-34e9d';
const SENDER   = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';

// Detect placeholder values — don't init Firebase with fake keys
const IS_CONFIGURED =
  API_KEY  && !API_KEY.includes('xxxxxxxx') &&
  APP_ID   && !APP_ID.includes('placeholder');

let _app       = null;
let _messaging = null;

if (IS_CONFIGURED && !getApps().length) {
  try {
    _app = initializeApp({
      apiKey:            API_KEY,
      authDomain:        `${PROJECT}.firebaseapp.com`,
      projectId:         PROJECT,
      storageBucket:     `${PROJECT}.appspot.com`,
      messagingSenderId: SENDER,
      appId:             APP_ID,
    });
  } catch (e) {
    console.warn('[FCM] Firebase init skipped:', e.message);
  }
} else if (!IS_CONFIGURED) {
  console.info('[FCM] Firebase not configured — push notifications disabled. Add real keys to frontend/.env to enable.');
}

/**
 * Lazily get the Messaging instance.
 * Returns null if Firebase isn't configured or FCM isn't supported.
 */
async function getMessagingInstance() {
  if (!IS_CONFIGURED || !_app) return null;
  if (_messaging) return _messaging;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    _messaging = getMessaging(_app);
    return _messaging;
  } catch (e) {
    console.warn('[FCM] Messaging unavailable:', e.message);
    return null;
  }
}

/**
 * Request notification permission and get an FCM registration token.
 * Returns null if Firebase isn't configured or permission is denied.
 */
export async function requestFCMToken() {
  if (!IS_CONFIGURED) {
    console.info('[FCM] Skipped — Firebase not configured with real keys.');
    return null;
  }
  if (!VAPID) {
    console.warn('[FCM] VAPID key missing.');
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission denied.');
      return null;
    }
    const messaging = await getMessagingInstance();
    if (!messaging) return null;
    const token = await getToken(messaging, { vapidKey: VAPID });
    console.log('✅ [FCM] Token:', token.slice(0, 20) + '…');
    return token;
  } catch (err) {
    console.warn('[FCM] Token request failed:', err.message);
    return null;
  }
}

/**
 * Listen for foreground FCM messages.
 * Returns a no-op unsubscribe if Firebase isn't configured.
 */
export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

export { _app as app };
