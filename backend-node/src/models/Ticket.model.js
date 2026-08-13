// backend-node/src/models/Ticket.model.js
// Each ticket can have 1-6 passengers, each with their own QR code.
// The ticketId format is MM-YYYYMMDD-XXXX (e.g. MM-20260706-0042).

const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  qrCode: { type: String, default: '' }, // base64 QR image
  farePerPerson: { type: Number, default: 0 }, // split fare for group bookings
});

const TicketSchema = new mongoose.Schema(
  {
    // Note: .populate('userId') performs a second query to the User collection.
    // This is intentional — MongoDB denormalization-friendly design, not a SQL-style JOIN.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketId: {
      type: String,
      unique: true,
      required: true,
    },
    source: {
      type: String,
      required: [true, 'Source station is required'],
    },
    destination: {
      type: String,
      required: [true, 'Destination station is required'],
    },
    fare: {
      type: Number,
      required: true,
    },
    isPeak: {
      type: Boolean,
      default: false,
    },
    passengers: [PassengerSchema],
    travelDate: {
      type: Date,
      required: true,
    },
    travelTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    crowdBucket: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    co2Saved: {
      type: Number,
      default: 0, // kg CO2 saved vs car travel
    },
    distance: {
      type: Number,
      default: 0, // km
    },
    coachPref: {
      type: String,
      default: 'general',
    },
  },
  { timestamps: true }
);

// Compound indexes — critical for performance with large collections
// Index 1: userId + status — used by getTickets with status filter
TicketSchema.index({ userId: 1, status: 1 });
// Index 2: userId + createdAt — used by getTickets sorted list
TicketSchema.index({ userId: 1, createdAt: -1 });
// Index 3: userId + travelDate — used by bulk expiry updateMany
TicketSchema.index({ userId: 1, travelDate: 1, status: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
