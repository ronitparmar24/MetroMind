// backend-node/src/routes/notifications.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getNotifications, markAllRead } = require('../controllers/notifications.controller');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);

module.exports = router;
