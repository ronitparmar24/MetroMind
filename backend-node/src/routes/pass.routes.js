// backend-node/src/routes/pass.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getPass, buyPass } = require('../controllers/pass.controller');

router.get('/', protect, getPass);
router.post('/buy', protect, buyPass);

module.exports = router;
