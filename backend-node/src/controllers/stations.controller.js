const { getNearbyAmenities, getAreaSummary } = require('../services/nearby.service');
const STATIONS = require('../constants/stations');

exports.getNearbyForStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const station = STATIONS.find(s => s.id === stationId);
    
    if (!station) {
      const error = new Error('Station not found');
      error.statusCode = 404;
      return next(error);
    }

    if (!station.lat || !station.lng) {
      const error = new Error('Coordinates not available for this station');
      error.statusCode = 400;
      return next(error);
    }

    const amenities = await getNearbyAmenities(station.lat, station.lng, station.id);
    
    res.json({
      success: true,
      data: amenities,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAboutForStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const station = STATIONS.find(s => s.id === stationId);
    
    if (!station) {
      const error = new Error('Station not found');
      error.statusCode = 404;
      return next(error);
    }

    let cleanName = station.name.replace(/ Metro Station/i, '').trim();
    let summary = await getAreaSummary(cleanName);
    
    if (!summary) {
      summary = await getAreaSummary(`${cleanName}, Ahmedabad`);
    }
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
