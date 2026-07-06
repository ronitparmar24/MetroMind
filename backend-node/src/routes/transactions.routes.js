// backend-node/src/routes/transactions.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getTransactions } = require('../controllers/transactions.controller');

router.get('/', protect, getTransactions);

module.exports = router;
