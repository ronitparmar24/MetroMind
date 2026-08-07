// frontend/src/api/commuter.api.js
import api from './index';

export const getCommuterUpdates = () => api.get('/api/commuter');
export const postCommuterUpdate = (data) => api.post('/api/commuter', data);
export const upvoteCommuterUpdate = (id) => api.post(`/api/commuter/${id}/upvote`);
