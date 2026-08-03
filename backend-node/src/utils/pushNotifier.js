// backend-node/src/utils/pushNotifier.js
// Thin wrapper around Firebase Admin Messaging (v14 modular API).
// Handles invalid/expired tokens gracefully so one bad token
// never breaks the scheduling loop.

require('../config/firebase'); // ensure app is initialised
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Send a Firebase Cloud Messaging push to a single device.
 * @param {string} fcmToken  — device registration token (from frontend)
 * @param {string} title     — notification title
 * @param {string} body      — notification body text
 * @param {object} [data]    — optional key-value payload for the app to act on
 */
exports.sendPush = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: {
      priority: 'high',
      notification: { sound: 'default', channelId: 'metromind-departures' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const response = await getMessaging().send(message);
    console.log(`🔔 [FCM] Push sent — messageId: ${response}`);
    return response;
  } catch (err) {
    // Token stale / unregistered — not a fatal error for the app
    if (err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token') {
      console.warn(`⚠️  [FCM] Stale token for device — remove from DB: ${fcmToken.slice(0, 20)}…`);
    } else {
      console.error('❌ [FCM] Push failed:', err.message);
    }
  }
};
