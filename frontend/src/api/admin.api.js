import api from './index';

export const adminApi = {
  // Python ML Endpoints via Node Proxy
  getModelPerformance: () => api.get('/admin/model-performance/'),
  getPredictionVolume: () => api.get('/admin/prediction-volume/'),
  getFeatureDrift: () => api.get('/admin/feature-drift/'),
  getNetworkSummary: () => api.get('/admin/network-summary/'),

  // Node FSD Endpoints
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  getTickets: (params) => api.get('/admin/tickets', { params }),
  getRevenueSummary: () => api.get('/admin/revenue-summary'),
  getSupportQueue: () => api.get('/admin/support-queue'),
  resolveSupportItem: (id) => api.patch(`/admin/lostfound/${id}/resolve`),
};
