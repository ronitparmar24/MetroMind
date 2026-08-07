import api from './index';

export const adminApi = {
  // Python ML Endpoints via Node Proxy
  getModelPerformance: () => api.get('/api/admin/model-performance/'),
  getPredictionVolume: () => api.get('/api/admin/prediction-volume/'),
  getFeatureDrift:     () => api.get('/api/admin/feature-drift/'),
  getNetworkSummary:   () => api.get('/api/admin/network-summary/'),

  // Node FSD Endpoints — Users
  getUsers:          (params) => api.get('/api/admin/users', { params }),
  toggleUserStatus:  (id, isActive) => api.patch(`/api/admin/users/${id}/status`, { isActive }),
  exportUsers:       () => api.get('/api/admin/users/export', { responseType: 'blob' }),

  // Node FSD Endpoints — Tickets
  getTickets:        (params) => api.get('/api/admin/tickets', { params }),
  cancelTicket:      (id) => api.patch(`/api/admin/tickets/${id}/cancel`),

  // Revenue
  getRevenueSummary: (range = 'month') => api.get('/api/admin/revenue-summary', { params: { range } }),

  // Support Queue
  getSupportQueue:       ()  => api.get('/api/admin/support-queue'),
  resolveSupportItem:    (id) => api.patch(`/api/admin/lostfound/${id}/resolve`),
  resolveFeedbackItem:   (id) => api.patch(`/api/admin/feedback/${id}/resolve`),

  // System Settings
  getSettings:    ()    => api.get('/api/admin/settings'),
  updateSettings: (data) => api.put('/api/admin/settings', data),
};
