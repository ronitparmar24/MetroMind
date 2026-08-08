// frontend/src/api/public.api.js
import api from './index';

export const getLandingStats = () => api.get('/api/public/stats');
