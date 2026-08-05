// frontend/src/api/analytics.api.js
import api from './index';

export const getWeeklyDigest = () => api.get('/api/analytics/weekly-digest');
export const getSpending = () => api.get('/api/analytics/spending');
export const getHeatmap = () => api.get('/api/analytics/heatmap');
export const getPersonality = () => api.get('/api/analytics/personality');
export const compareRoutes = (source, destination) => api.post('/api/routes/compare', { source, destination });
export const getLeaderboard = () => api.get('/api/analytics/leaderboard');
export const downloadCarbonPassportPDF = () => api.get('/api/analytics/carbon-passport/pdf', { responseType: 'blob' });
export const getPass = () => api.get('/api/pass');
export const buyPass = (planType) => api.post('/api/pass/buy', { planType });
export const getSavedRoutes = () => api.get('/api/savedroutes');
export const saveRoute = (data) => api.post('/api/savedroutes', data);
export const getMetroCard = () => api.get('/api/metrocard');
export const createMetroCard = () => api.post('/api/metrocard');
export const topUpMetroCard = (amount) => api.post('/api/metrocard/topup', { amount });
export const reportLostItem = (data) => api.post('/api/lostfound', data);
export const getLostItems = () => api.get('/api/lostfound');
export const submitFeedback = (data) => api.post('/api/feedback', data);
export const getFeedback = () => api.get('/api/feedback');
export const getNotifications = () => api.get('/api/notifications');
export const markAllRead = () => api.put('/api/notifications/read-all');
export const getStationProfile = (station) => api.get(`/api/analytics/station-profile/${encodeURIComponent(station)}`);
export const getNetworkPulse = () => api.get('/api/analytics/network-pulse');
