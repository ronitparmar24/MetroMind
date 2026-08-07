// backend-node/src/controllers/commuter.controller.js
const CommuterUpdate = require('../models/CommuterUpdate.model');

// @desc    Get all commuter updates
// @route   GET /api/commuter
// @access  Public (or Protected, depending on preference)
const getUpdates = async (req, res, next) => {
  try {
    const updates = await CommuterUpdate.find()
      .populate('user', 'name isVerified avatar')
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 updates
    
    // Map to a cleaner format for frontend
    const formattedUpdates = updates.map(update => ({
      id: update._id,
      userId: update.user?._id,
      user: update.user?.name || 'Anonymous',
      station: update.station,
      tag: update.tag,
      text: update.text,
      upvotes: update.upvotes,
      time: update.createdAt,
      verified: update.user?.isVerified || update.isVerified,
    }));

    res.json({ success: true, count: formattedUpdates.length, data: formattedUpdates });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a new commuter update
// @route   POST /api/commuter
// @access  Private
const postUpdate = async (req, res, next) => {
  try {
    const { station, tag, text } = req.body;
    
    if (!station || !tag || !text) {
      return res.status(400).json({ success: false, error: 'Please provide station, tag, and text' });
    }

    const newUpdate = await CommuterUpdate.create({
      user: req.user._id,
      station,
      tag,
      text,
      upvotedBy: [req.user._id], // User automatically upvotes their own post
      upvotes: 1,
    });

    // Populate user details before returning
    await newUpdate.populate('user', 'name isVerified avatar');

    const formattedUpdate = {
      id: newUpdate._id,
      userId: newUpdate.user._id,
      user: newUpdate.user.name,
      station: newUpdate.station,
      tag: newUpdate.tag,
      text: newUpdate.text,
      upvotes: newUpdate.upvotes,
      time: newUpdate.createdAt,
      verified: newUpdate.user.isVerified || newUpdate.isVerified,
    };

    res.status(201).json({ success: true, data: formattedUpdate });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote a commuter update
// @route   POST /api/commuter/:id/upvote
// @access  Private
const upvoteUpdate = async (req, res, next) => {
  try {
    const update = await CommuterUpdate.findById(req.params.id);
    
    if (!update) {
      return res.status(404).json({ success: false, error: 'Update not found' });
    }

    // Check if user already upvoted
    const hasUpvoted = update.upvotedBy.includes(req.user._id);

    if (hasUpvoted) {
      // Remove upvote
      update.upvotedBy = update.upvotedBy.filter(id => id.toString() !== req.user._id.toString());
      update.upvotes -= 1;
    } else {
      // Add upvote
      update.upvotedBy.push(req.user._id);
      update.upvotes += 1;
    }

    await update.save();

    res.json({ success: true, upvotes: update.upvotes, hasUpvoted: !hasUpvoted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUpdates,
  postUpdate,
  upvoteUpdate,
};
