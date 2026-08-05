const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGO_URI } = require('./src/config/env.js');
const User = require('./src/models/User.model.js');

mongoose.connect(MONGO_URI).then(async () => {
  const email = 'adminofmetromind@metromind.com';
  
  let user = await User.findOne({ email });
  if (user) {
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash('Admin@123', salt);
    user.authProvider = 'local';
    await user.save();
    console.log('Fixed admin user password and authProvider');
  }
  mongoose.disconnect();
}).catch(console.error);
