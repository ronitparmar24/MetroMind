// frontend/src/api/index.js
// Single shared Axios instance with auth interceptors.
// All API calls in the app go through this instance.

import axios from 'axios';

// Use the Vercel env var if set, otherwise fall back to the canonical
// Node backend production URL. Never fall back to '' (same-origin) since
// the frontend and Node backend are on different Vercel projects.
const NODE_API_BASE =
  import.meta.env.VITE_NODE_API_URL ||
  'https://metro-mind-x9mm.vercel.app';

const api = axios.create({
  baseURL: NODE_API_BASE,
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
