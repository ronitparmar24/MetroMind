// frontend/src/api/index.js
// Single shared Axios instance with auth interceptors.
// All API calls in the app go through this instance.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('metromind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — on 401, clear stale token only.
// AuthGuard handles the actual redirect to /login for protected routes.
// This prevents the interceptor from hijacking public pages like Landing.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('metromind_token');
      localStorage.removeItem('metromind_user');
    }
    return Promise.reject(error);
  }
);

export default api;
