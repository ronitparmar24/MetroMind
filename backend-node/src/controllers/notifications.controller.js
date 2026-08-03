// backend-node/src/controllers/notifications.controller.js
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { addReminder, cancelReminder, getReminderStatus } = require('../utils/departureScheduler');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications/register-token
// Body: { token: "<FCM device token>" }
// Saves the FCM token to the user's document so the backend can push to this device.
const registerToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ success: false, error: 'Valid FCM token required.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      fcmToken:          token,
      fcmTokenUpdatedAt: new Date(),
    });

    console.log(`🔑 [FCM] Token registered for user ${req.user._id.toString().slice(0, 8)}…`);
    res.json({ success: true, message: 'FCM token registered.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications/schedule-reminder
// Body: { leaveByISO: "2026-08-03T14:30:00.000Z", route: "Thaltej → Vastral", walkMins: 12 }
// Schedules a departure push for the authenticated user.
const scheduleReminder = async (req, res, next) => {
  try {
    const { leaveByISO, route, walkMins } = req.body;

    if (!leaveByISO || !route) {
      return res.status(400).json({ success: false, error: 'leaveByISO and route are required.' });
    }

    const leaveByTime = new Date(leaveByISO);
    if (isNaN(leaveByTime.getTime()) || leaveByTime <= new Date()) {
      return res.status(400).json({ success: false, error: 'leaveByISO must be a future timestamp.' });
    }

    // Get current FCM token from DB
    const user = await User.findById(req.user._id).select('fcmToken');
    if (!user?.fcmToken) {
      return res.status(422).json({
        success: false,
        error: 'No FCM token on file. Please enable push notifications first.',
      });
    }

    addReminder(
      req.user._id.toString(),
      user.fcmToken,
      leaveByTime,
      route,
      walkMins || 10,
    );

    const minsFromNow = Math.round((leaveByTime - Date.now()) / 60000);
    res.json({
      success:    true,
      message:    `Departure reminder set — you'll be notified in ~${minsFromNow} min.`,
      leaveByISO: leaveByTime.toISOString(),
      route,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/schedule-reminder
// Cancels any pending reminder for the authenticated user.
const cancelScheduledReminder = async (req, res, next) => {
  try {
    cancelReminder(req.user._id.toString());
    res.json({ success: true, message: 'Departure reminder cancelled.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/reminder-status
const reminderStatus = async (req, res, next) => {
  try {
    const r = getReminderStatus(req.user._id.toString());
    if (!r) return res.json({ success: true, active: false });
    res.json({
      success:    true,
      active:     true,
      leaveByISO: r.leaveByTime.toISOString(),
      route:      r.route,
      walkMins:   r.walkMins,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAllRead,
  registerToken,
  scheduleReminder,
  cancelScheduledReminder,
  reminderStatus,
};
