// frontend/src/api/predict.api.js
// Calls Node, which proxies to Django — never calls Django directly
import api from './index';

export const predictCrowd = (data) => api.post('/api/predict/crowd', data);
export const getLiveTrains = (station) => api.get(`/api/live-trains/${encodeURIComponent(station)}`);
export const checkAnomaly = (data) => api.post('/api/predict/anomaly', data);
export const getPersonalityProfile = () => api.get('/api/predict/personality');
export const getBestDeparture = (data) => api.post('/api/predict/best-departure', data);
