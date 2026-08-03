// frontend/src/api/notifications.api.js
import api from './index';

/** Register FCM token with the backend — called once after requestFCMToken() */
export const registerFCMToken = (token) =>
  api.post('/api/notifications/register-token', { token });

/** Schedule a departure push reminder */
export const scheduleReminder = ({ leaveByISO, route, walkMins }) =>
  api.post('/api/notifications/schedule-reminder', { leaveByISO, route, walkMins });

/** Cancel the pending departure reminder */
export const cancelReminder = () =>
  api.delete('/api/notifications/schedule-reminder');

/** Get current reminder status */
export const getReminderStatus = () =>
  api.get('/api/notifications/reminder-status');
