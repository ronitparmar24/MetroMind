import api from './index';

export const getLocalNews = () => api.get('/news/local');
