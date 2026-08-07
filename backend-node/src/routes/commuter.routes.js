// backend-node/src/routes/commuter.routes.js
const express = require('express');
const { getUpdates, postUpdate, upvoteUpdate } = require('../controllers/commuter.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
  .get(getUpdates)
  .post(protect, postUpdate);

router.route('/:id/upvote')
  .post(protect, upvoteUpdate);

module.exports = router;
