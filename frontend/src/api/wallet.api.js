// frontend/src/api/wallet.api.js
import api from './index';

export const getWallet = () => api.get('/api/wallet');
export const topupWallet = (amount) => api.post('/api/wallet/topup', { amount });
export const getTransactions = (params) => api.get('/api/transactions', { params });
export const convertCarbonReward = (amount) => api.post('/api/wallet/convert-carbon', amount ? { amount } : {});
