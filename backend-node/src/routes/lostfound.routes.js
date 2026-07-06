// backend-node/src/routes/lostfound.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { reportLostItem, getLostItems } = require('../controllers/lostfound.controller');

router.post('/', protect, reportLostItem);
router.get('/', protect, getLostItems);

module.exports = router;
