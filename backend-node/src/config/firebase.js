// backend-node/src/config/firebase.js
// Firebase Admin SDK — server-side only.
// firebase-admin v14 uses named exports (no admin.credential.cert namespace).

const {
  initializeApp,
  getApps,
  getApp,
  cert,
} = require('firebase-admin/app');

const serviceAccount = require('../../config/firebase-service-account.json');

// Singleton guard — safe under nodemon hot-reload
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
  console.log('✅ Firebase Admin initialised — project:', serviceAccount.project_id);
}

// Export the admin namespace so pushNotifier.js can call admin.messaging()
const admin = require('firebase-admin');
module.exports = admin;
