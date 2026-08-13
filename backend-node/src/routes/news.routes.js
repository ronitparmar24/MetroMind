const express = require('express');
const router = express.Router();
const newsService = require('../services/news.service');
const { protect } = require('../middleware/auth.middleware');

router.get('/local', protect, async (req, res) => {
  try {
    const articles = await newsService.getAhmedabadTransitNews();
    res.json(articles);
  } catch (error) {
    console.error('Error fetching local news:', error.message);
    res.status(500).json({ message: 'Failed to fetch local news' });
  }
});

module.exports = router;
