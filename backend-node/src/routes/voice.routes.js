// backend-node/src/routes/voice.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { voiceChat } = require('../controllers/voice.controller');

// POST /api/voice/chat
// Body: { userMessage, history, context }
router.post('/chat', protect, voiceChat);

module.exports = router;
