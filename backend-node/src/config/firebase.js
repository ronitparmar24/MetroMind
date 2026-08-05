// backend-node/src/config/firebase.js
// Firebase Admin SDK — server-side only (used for push notifications).
// firebase-admin v14 uses named exports (no admin.credential.cert namespace).

let admin = null;

try {
  const {
    initializeApp,
    getApps,
    cert,
  } = require('firebase-admin/app');

  const serviceAccount = require('../../config/firebase-service-account.json');

  // Singleton guard — safe under nodemon hot-reload
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Firebase Admin initialised — project:', serviceAccount.project_id);
  }

  admin = require('firebase-admin');
} catch (err) {
  // Firebase is optional (only needed for push notifications).
  // A missing or invalid service account key should NOT crash the server.
  console.warn('⚠️  Firebase Admin skipped — push notifications disabled:', err.message);
}

module.exports = admin;
