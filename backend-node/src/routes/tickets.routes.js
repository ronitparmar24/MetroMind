// backend-node/src/routes/tickets.routes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { bookTicket, getTickets, cancelTicket, downloadTicketPDF } = require('../controllers/tickets.controller');

router.post('/book', protect, bookTicket);
router.get('/', protect, getTickets);
router.delete('/:id', protect, cancelTicket);
router.get('/:id/pdf', protect, downloadTicketPDF);

module.exports = router;
