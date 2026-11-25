// Resets the admin account password.
// Usage (PowerShell):  $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node seedAdmin.js
// Credentials come from env vars only — never hard-code them (this repo is public).
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGO_URI } = require('./src/config/env.js');
const User = require('./src/models/User.model.js');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 10) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars) before running this script.');
  process.exit(1);
}

mongoose.connect(MONGO_URI).then(async () => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No user found with email ${email}`);
  } else {
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.authProvider = 'local';
    await user.save();
    console.log('Admin password updated');
  }
  await mongoose.disconnect();
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
