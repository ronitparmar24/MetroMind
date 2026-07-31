// frontend/src/api/auth.api.js
import api from './index';

export const registerUser = (data) => api.post('/api/auth/register', data);
export const loginUser = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');
export const googleLogin = (credential) => api.post('/api/auth/google', { credential });
export const verifyOtp = (email, otp) => api.post('/api/auth/verify-otp', { email, otp });
export const resendOtp = (email) => api.post('/api/auth/resend-otp', { email });
