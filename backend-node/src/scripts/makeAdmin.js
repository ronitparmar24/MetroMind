require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const { MONGO_URI } = require('../config/env');

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node src/scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`Successfully promoted ${email} to admin`);
    process.exit(0);
  } catch (err) {
    console.error('Error promoting user:', err);
    process.exit(1);
  }
};

makeAdmin();
