require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Ticket = require('../models/Ticket.model');
const { MONGO_URI } = require('../config/env');
const STATIONS = require('../constants/stations');

const generateTicketId = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MM-${dateStr}-${rand}`;
};

const seedPersonality = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Seeding personality data...');

    const email = 'ronitparmar55@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User ${email} not found!`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user._id})`);

    // DO NOT delete existing tickets as requested by the user
    // await Ticket.deleteMany({ userId: user._id });
    console.log('Keeping existing tickets and adding more...');

    const ticketsToInsert = [];
    
    // Insert 50 Rush Hour tickets to dilute any existing weekend tickets
    // We will place them specifically on Wednesdays to avoid any weekend timezone shifts
    
    for (let i = 0; i < 50; i++) {
      // Pick a Wednesday in the past
      let travelDate = new Date();
      travelDate.setDate(travelDate.getDate() - (i % 30) - 2); // Spread over the past 30 days
      
      // Force it to be a Wednesday (3)
      const diff = 3 - travelDate.getDay();
      travelDate.setDate(travelDate.getDate() + diff);

      const sourceStat = STATIONS[Math.floor(Math.random() * 5)];
      const destStat = STATIONS[Math.floor(Math.random() * 5) + 5];

      ticketsToInsert.push({
        userId: user._id,
        ticketId: generateTicketId() + i,
        source: sourceStat.name,
        destination: destStat.name,
        fare: 25,
        isPeak: true,
        passengers: [
          { name: user.name, age: 25, qrCode: 'dummy_qr', farePerPerson: 25 }
        ],
        travelDate: travelDate,
        travelTime: '06:30 PM', // Rush hour!
        status: 'completed',
        crowdBucket: 'High',
        co2Saved: 0.8,
        distance: 8
      });
    }

    await Ticket.insertMany(ticketsToInsert);
    console.log(`Successfully seeded ${ticketsToInsert.length} realistic tickets!`);
    console.log('Expected Personality: The Rush Hour Warrior (Overwhelming amount of Rush Hour tickets inserted)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding personality data:', error);
    process.exit(1);
  }
};

seedPersonality();
