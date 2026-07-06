// frontend/src/api/predict.api.js
// Calls Node, which proxies to Django — never calls Django directly
import api from './index';

export const predictCrowd = (data) => api.post('/api/predict/crowd', data);
