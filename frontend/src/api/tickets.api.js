// frontend/src/api/tickets.api.js
import api from './index';

export const bookTicket = (data) => api.post('/api/tickets/book', data);
export const getTickets = (status) => api.get('/api/tickets', { params: { status } });
export const cancelTicket = (id) => api.delete(`/api/tickets/${id}`);
export const downloadTicketPDF = (id) => api.get(`/api/tickets/${id}/pdf`, { responseType: 'blob' });
export const checkHoliday = (date) => api.get('/api/holidays/check', { params: { date } });
export const getDailyFact = (date) => api.get('/api/holidays/daily-fact', { params: { date } });
