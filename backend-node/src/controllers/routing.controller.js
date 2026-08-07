const { geocodeLocation, getWalkingDirections } = require('../services/routing.service');
const { haversine } = require('../utils/fareEngine');
const STATIONS = require('../constants/stations');

exports.geocode = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    const location = await geocodeLocation(q);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ location });
  } catch (error) {
    console.error('Geocode error:', error.message);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
};

exports.getNearestStations = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng are required' });
    }

    const userCoords = { lat, lng };

    // 1. Compute straight-line distance to all stations to shortlist top 5
    const stationsWithStraightDist = STATIONS.map(station => ({
      ...station,
      straightDistKm: haversine(lat, lng, station.lat, station.lng),
    }));

    stationsWithStraightDist.sort((a, b) => a.straightDistKm - b.straightDistKm);
    const top5 = stationsWithStraightDist.slice(0, 5);

    // 2. Call ORS walking directions for the top 5
    const results = await Promise.all(top5.map(async (station) => {
      try {
        const directions = await getWalkingDirections(userCoords, { lat: station.lat, lng: station.lng });
        return {
          ...station,
          distanceMeters: directions.distanceMeters,
          durationMinutes: directions.durationMinutes,
          steps: directions.steps.slice(0, 3), // first 3 steps
        };
      } catch (err) {
        console.error(`Failed to get directions for ${station.name}:`, err.message);
        // Fallback to haversine estimate if ORS fails for a specific station
        const fallbackMeters = Math.round(station.straightDistKm * 1000 * 1.3); // 1.3 road factor
        return {
          ...station,
          distanceMeters: fallbackMeters,
          durationMinutes: Math.round((fallbackMeters / 1000) * 12), // ~12 mins per km walking
          steps: ['Head towards ' + station.name],
        };
      }
    }));

    // 3. Sort by real walking duration
    results.sort((a, b) => a.durationMinutes - b.durationMinutes);

    res.json({ stations: results });
  } catch (error) {
    console.error('Nearest stations error:', error.message);
    res.status(500).json({ error: 'Failed to find nearest stations' });
  }
};
