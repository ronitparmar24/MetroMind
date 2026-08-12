// backend-node/src/utils/eventLogger.js
// Simple event logger using Node's built-in EventEmitter
// Provides basic logging functions used by bookingEvents.js

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'events.log');

/**
 * Append an event entry to the log file.
 * Uses fs.appendFileSync (Node core module) deliberately per spec.
 * @param {string} eventType - Type of event (e.g., 'BOOKED', 'CANCELLED')
 * @param {Object} data - Event data
 */
const logEvent = (eventType, data) => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: eventType,
    data,
  });

  try {
    // Ensure log directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Using fs.appendFileSync + path.join per spec
    fs.appendFileSync(LOG_FILE, entry + '\n', 'utf8');
  } catch (error) {
    console.warn('Failed to write event log to file (read-only filesystem). Logging to console instead:', entry);
  }
};

module.exports = { logEvent };
