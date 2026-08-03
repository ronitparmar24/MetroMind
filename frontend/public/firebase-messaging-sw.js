// frontend/public/firebase-messaging-sw.js
// Firebase Cloud Messaging background service worker.
// This file MUST be at /firebase-messaging-sw.js (root of the origin).
// It handles push messages when the browser tab is in the background or closed.
//
// NOTE: This is a SEPARATE service worker from sw.js (the PWA offline worker).
// Firebase SDK automatically registers this SW when getToken() is called.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ── Config ────────────────────────────────────────────────────────────────
// These values match VITE_FIREBASE_* in frontend/.env.
// Service workers can't read import.meta.env, so they're hardcoded here.
// These are PUBLIC client-side keys — safe to include in a service worker.
firebase.initializeApp({
  apiKey:            'AIzaSyAxxxxxxxx',           // ← Replace with real VITE_FIREBASE_API_KEY
  authDomain:        'metromind-34e9d.firebaseapp.com',
  projectId:         'metromind-34e9d',
  storageBucket:     'metromind-34e9d.appspot.com',
  messagingSenderId: '106070719211346286914',
  appId:             '1:106070719211346286914:web:placeholder', // ← Replace with real appId
});

const messaging = firebase.messaging();

// ── Background message handler ─────────────────────────────────────────
// Called when a push arrives and the tab is not in focus.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || '🚇 MetroMind', {
    body:    body  || 'Time to head to the station!',
    icon:    icon  || '/icons/icon-192.png',
    badge:         '/icons/icon-72.png',
    vibrate:       [200, 100, 200],
    tag:           'metromind-departure',       // replaces any existing departure notification
    renotify:      true,
    data:          payload.data || {},
    actions: [
      { action: 'open',   title: '📱 Open App' },
      { action: 'dismiss',title: 'Dismiss'    },
    ],
  });
});

// ── Notification click handler ─────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Focus existing tab or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find(c => c.url.includes('localhost') || c.url.includes('metromind'));
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});
