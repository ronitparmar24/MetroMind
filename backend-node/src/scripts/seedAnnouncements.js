require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement.model');
const { MONGO_URI } = require('../config/env');

const seedAnnouncements = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Seeding announcements...');

    // Clear existing announcements
    await Announcement.deleteMany({});
    console.log('Cleared existing announcements.');

    const announcements = [
      {
        title: 'Weekend Track Maintenance',
        message: 'Red Line trains will run every 15 minutes this weekend due to scheduled track maintenance.',
        priority: 'warning',
        isActive: true
      },
      {
        title: 'New Station Opening',
        message: 'We are thrilled to announce the opening of the new Gandhinagar extended line next month!',
        priority: 'info',
        isActive: true
      },
      {
        title: 'System Update Complete',
        message: 'MetroMind v2.0 is now live! Enjoy the new live tracking features on your dashboard.',
        priority: 'info',
        isActive: false
      },
      {
        title: 'Heavy Rainfall Alert',
        message: 'Due to heavy rainfall, expect slight delays on the Blue Line. Please hold handrails firmly.',
        priority: 'critical',
        isActive: true
      }
    ];

    await Announcement.insertMany(announcements);
    console.log('Successfully seeded realistic announcements!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding announcements:', error);
    process.exit(1);
  }
};

seedAnnouncements();
