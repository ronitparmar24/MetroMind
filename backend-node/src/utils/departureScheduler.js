// backend-node/src/utils/departureScheduler.js
// Every-minute cron-style loop that fires FCM push notifications when a
// user's scheduled "leave by" time arrives.
//
// Architecture:
//   - In-memory Map of pending reminders: reminderMap
//     key:   userId string
//     value: { fcmToken, leaveByTime (Date), ticketRef, route }
//   - addReminder() called when the user POSTs to /api/notifications/schedule-reminder
//   - cancelReminder() called on ticket cancel
//   - The setInterval loop checks every 30s; fires when now >= leaveByTime
//
// This is intentionally process-local (no Redis/DB) — reminders survive for
// the lifetime of the Node process.  For production, move to a job queue.

const { sendPush } = require('./pushNotifier');

// { userId → { fcmToken, leaveByTime, route, ticketRef } }
const reminderMap = new Map();

let _schedulerStarted = false;

function startDepartureScheduler() {
  if (_schedulerStarted) return;
  _schedulerStarted = true;

  setInterval(async () => {
    const now = Date.now();
    for (const [userId, reminder] of reminderMap) {
      if (now >= reminder.leaveByTime.getTime()) {
        reminderMap.delete(userId); // Fire once

        const { fcmToken, route, walkMins } = reminder;
        const title = '🚇 Time to Leave for MetroMind!';
        const body  = `Head to the station now — ${walkMins} min walk for ${route}.`;

        console.log(`🔔 [Scheduler] Firing departure reminder for user ${userId.slice(0, 8)}…`);
        await sendPush(fcmToken, title, body, {
          type:   'DEPARTURE_REMINDER',
          route,
          userId,
        });
      }
    }
  }, 30 * 1000); // Check every 30 seconds

  console.log('⏰ Departure reminder scheduler started (30s interval)');
}

/**
 * Schedule a departure push for a user.
 * @param {string} userId
 * @param {string} fcmToken
 * @param {Date}   leaveByTime   — exact moment to fire the push
 * @param {string} route         — "Thaltej → Vastral" display string
 * @param {number} walkMins      — walk time in minutes
 */
function addReminder(userId, fcmToken, leaveByTime, route, walkMins) {
  reminderMap.set(userId, { fcmToken, leaveByTime, route, walkMins });
  console.log(`📌 [Scheduler] Reminder set for ${userId.slice(0, 8)}… at ${leaveByTime.toLocaleTimeString()}`);
}

function cancelReminder(userId) {
  if (reminderMap.delete(userId)) {
    console.log(`🗑️  [Scheduler] Reminder cancelled for ${userId.slice(0, 8)}…`);
  }
}

function getReminderStatus(userId) {
  return reminderMap.get(userId) || null;
}

module.exports = { startDepartureScheduler, addReminder, cancelReminder, getReminderStatus };
