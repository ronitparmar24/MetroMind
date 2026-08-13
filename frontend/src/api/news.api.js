import api from './index';

export const getLocalNews = () => api.get('/api/news/local');
