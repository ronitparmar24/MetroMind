require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Ticket = require('../models/Ticket.model');
const { MONGO_URI } = require('../config/env');
const STATIONS = require('../constants/stations');

let counter = 0;
const generateTicketId = () => {
  counter++;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `MM-${dateStr}-R${String(counter).padStart(4, '0')}`;
};

const RUSH_TIMES = ['08:30 AM', '09:00 AM', '09:15 AM', '09:30 AM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'];
const OFF_PEAK_TIMES = ['11:00 AM', '02:00 PM', '03:00 PM'];

const seedRushHour = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');

    const user = await User.findOne({ email: 'ronitparmar55@gmail.com' });
    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }
    console.log(`Found user: ${user.name} (${user._id})`);

    // Delete ALL existing tickets to start fresh
    const deleted = await Ticket.deleteMany({ userId: user._id });
    console.log(`Deleted ${deleted.deletedCount} old tickets.`);

    const tickets = [];
    const today = new Date();

    // Insert 40 weekday RUSH HOUR tickets (spread over past 20 days Mon-Fri)
    for (let i = 0; i < 40; i++) {
      const daysAgo = Math.floor(i / 2) + 1;
      const travelDate = new Date(today);
      travelDate.setDate(today.getDate() - daysAgo);

      // Force to weekday (Mon-Fri)
      while (travelDate.getDay() === 0 || travelDate.getDay() === 6) {
        travelDate.setDate(travelDate.getDate() - 1);
      }

      const src = STATIONS[i % 8];
      const dst = STATIONS[(i % 8) + 10];
      const rushTime = RUSH_TIMES[i % RUSH_TIMES.length];

      tickets.push({
        userId: user._id,
        ticketId: generateTicketId(),
        source: src.name,
        destination: dst.name,
        fare: 22,
        isPeak: true,
        passengers: [{ name: user.name, age: 25, qrCode: 'rush_qr', farePerPerson: 22 }],
        travelDate: new Date(travelDate.toDateString()),
        travelTime: rushTime,
        status: 'completed',
        crowdBucket: 'High',
        co2Saved: 0.9,
        distance: 9
      });
    }

    // Insert 10 off-peak weekday tickets (less than 30% of total)
    for (let i = 0; i < 10; i++) {
      const daysAgo = i + 1;
      const travelDate = new Date(today);
      travelDate.setDate(today.getDate() - daysAgo);
      while (travelDate.getDay() === 0 || travelDate.getDay() === 6) {
        travelDate.setDate(travelDate.getDate() - 1);
      }

      const src = STATIONS[i % 5];
      const dst = STATIONS[(i % 5) + 15];

      tickets.push({
        userId: user._id,
        ticketId: generateTicketId(),
        source: src.name,
        destination: dst.name,
        fare: 18,
        isPeak: false,
        passengers: [{ name: user.name, age: 25, qrCode: 'off_peak_qr', farePerPerson: 18 }],
        travelDate: new Date(travelDate.toDateString()),
        travelTime: OFF_PEAK_TIMES[i % OFF_PEAK_TIMES.length],
        status: 'completed',
        crowdBucket: 'Low',
        co2Saved: 0.5,
        distance: 6
      });
    }

    await Ticket.insertMany(tickets);
    console.log(`\n✅ Inserted ${tickets.length} tickets (40 rush hour + 10 off-peak)`);
    console.log(`Rush Hour ratio: ${Math.round(40/50 * 100)}% (needs >60% to trigger Rush Hour Warrior)`);
    console.log(`Weekend ratio: 0% (no weekend tickets)`);
    console.log(`\nExpected personality: THE RUSH HOUR WARRIOR ⚡`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seedRushHour();
