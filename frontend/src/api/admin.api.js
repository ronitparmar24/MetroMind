import api from './index';

export const adminApi = {
  // Python ML Endpoints via Node Proxy
  getModelPerformance: () => api.get('/api/admin/model-performance/'),
  getPredictionVolume: () => api.get('/api/admin/prediction-volume/'),
  getFeatureDrift: () => api.get('/api/admin/feature-drift/'),
  getNetworkSummary: () => api.get('/api/admin/network-summary/'),

  // Node FSD Endpoints
  getUsers: (params) => api.get('/api/admin/users', { params }),
  toggleUserStatus: (id, isActive) => api.patch(`/api/admin/users/${id}/status`, { isActive }),
  getTickets: (params) => api.get('/api/admin/tickets', { params }),
  getRevenueSummary: () => api.get('/api/admin/revenue-summary'),
  getSupportQueue: () => api.get('/api/admin/support-queue'),
  resolveSupportItem: (id) => api.patch(`/api/admin/lostfound/${id}/resolve`),
};
