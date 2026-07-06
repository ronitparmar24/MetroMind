// backend-node/src/events/bookingEvents.js
// Node EventEmitter for booking lifecycle events.
// This is a FIRST-CLASS FEATURE — demonstrates deliberate core-module usage.
// Listeners use fs.appendFileSync + path.join for audit logging.

const { EventEmitter } = require('events');
const { logEvent } = require('../utils/eventLogger');

// Central event bus for all booking-related events
const bookingBus = new EventEmitter();

// --- Event Listeners ---

bookingBus.on('booked', (data) => {
  logEvent('BOOKED', {
    ticketId: data.ticketId,
    userId: data.userId,
    source: data.source,
    destination: data.destination,
    fare: data.fare,
    passengers: data.passengerCount,
  });
  console.log(`📋 [Event] Ticket booked: ${data.ticketId}`);
});

bookingBus.on('cancelled', (data) => {
  logEvent('CANCELLED', {
    ticketId: data.ticketId,
    userId: data.userId,
    refundAmount: data.refundAmount,
  });
  console.log(`❌ [Event] Ticket cancelled: ${data.ticketId}`);
});

bookingBus.on('topup', (data) => {
  logEvent('TOPUP', {
    userId: data.userId,
    amount: data.amount,
    newBalance: data.newBalance,
  });
  console.log(`💰 [Event] Wallet topped up: ₹${data.amount}`);
});

module.exports = { bookingBus };
