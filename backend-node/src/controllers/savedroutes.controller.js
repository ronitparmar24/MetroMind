// backend-node/src/controllers/savedroutes.controller.js
const SavedRoute = require('../models/SavedRoute.model');

// GET /api/savedroutes
const getSavedRoutes = async (req, res, next) => {
  try {
    const routes = await SavedRoute.find({ userId: req.user._id }).sort({ useCount: -1 });
    res.json({ success: true, routes });
  } catch (error) {
    next(error);
  }
};

// POST /api/savedroutes
const saveRoute = async (req, res, next) => {
  try {
    const { source, destination, label } = req.body;
    if (!source || !destination) {
      const err = new Error('Source and destination are required');
      err.statusCode = 400;
      return next(err);
    }

    // Check if already saved
    let route = await SavedRoute.findOne({
      userId: req.user._id,
      source,
      destination,
    });

    if (route) {
      route.useCount += 1;
      route.lastUsed = new Date();
      await route.save();
    } else {
      route = await SavedRoute.create({
        userId: req.user._id,
        source,
        destination,
        label: label || `${source} → ${destination}`,
        useCount: 1,
        lastUsed: new Date(),
      });
    }

    res.status(201).json({ success: true, route });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSavedRoutes, saveRoute };
