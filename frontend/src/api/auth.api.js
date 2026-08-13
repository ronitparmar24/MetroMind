// frontend/src/api/auth.api.js
import api from './index';

export const registerUser = (data) => api.post('/api/auth/register', data);
export const loginUser = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');
export const googleLogin = (credential, code, redirectUri) => api.post('/api/auth/google', { credential, code, redirectUri });
export const verifyOtp = (email, otp) => api.post('/api/auth/verify-otp', { email, otp });
export const resendOtp = (email) => api.post('/api/auth/resend-otp', { email });
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (email, otp, newPassword) => api.post('/api/auth/reset-password', { email, otp, newPassword });
export const updateProfile = (data) => api.put('/api/auth/update-profile', data);
export const checkPasswordPwnedApi = (password) => api.post('/api/auth/check-password-pwned', { password });
