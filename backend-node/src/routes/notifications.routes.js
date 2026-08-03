// backend-node/src/routes/notifications.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getNotifications,
  markAllRead,
  registerToken,
  scheduleReminder,
  cancelScheduledReminder,
  reminderStatus,
} = require('../controllers/notifications.controller');

router.get('/',                    protect, getNotifications);
router.put('/read-all',            protect, markAllRead);
router.post('/register-token',     protect, registerToken);
router.post('/schedule-reminder',  protect, scheduleReminder);
router.delete('/schedule-reminder',protect, cancelScheduledReminder);
router.get('/reminder-status',     protect, reminderStatus);

module.exports = router;
