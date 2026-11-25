// backend-node/src/controllers/lostfound.controller.js
const LostFound = require('../models/LostFound.model');
const SystemSetting = require('../models/SystemSetting.model');
const { sendEmail, escapeHtml } = require('../utils/emailer');

// POST /api/lostfound
const reportLostItem = async (req, res, next) => {
  try {
    const { itemDescription, lastSeenLocation, lastSeenDate, contactPhone, category } = req.body;

    if (typeof itemDescription !== 'string' || itemDescription.length > 1000 ||
        (lastSeenLocation && (typeof lastSeenLocation !== 'string' || lastSeenLocation.length > 200))) {
      const err = new Error('Please keep the description under 1000 characters and the location under 200.');
      err.statusCode = 400;
      return next(err);
    }

    if (!itemDescription) {
      const err = new Error('Item description is required');
      err.statusCode = 400;
      return next(err);
    }

    const report = await LostFound.create({
      userId: req.user._id,
      itemDescription,
      lastSeenLocation: lastSeenLocation || '',
      lastSeenDate: lastSeenDate || new Date(),
      contactPhone: contactPhone || '',
      category: category || 'other',
    });

    const settings = await SystemSetting.findOne();
    if (settings && settings.supportEmailAlerts) {
      sendEmail({
        to: 'admin@metromind.in',
        subject: 'New Lost & Found Report',
        html: `<p>New lost & found item reported by ${escapeHtml(req.user.name)}:</p><blockquote>${escapeHtml(itemDescription)}</blockquote><p>Location: ${escapeHtml(lastSeenLocation)}</p>`
      }).catch(err => console.error('Failed to send admin email:', err));
    }

    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// GET /api/lostfound
const getLostItems = async (req, res, next) => {
  try {
    const items = await LostFound.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
};

module.exports = { reportLostItem, getLostItems };
