require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const { MONGO_URI } = require('../config/env');

async function clearCache() {
  await mongoose.connect(MONGO_URI);
  const result = await User.updateOne(
    { email: 'ronitparmar55@gmail.com' },
    { $unset: { personalityCache: '' } }
  );
  console.log('Cache cleared:', result.modifiedCount, 'document(s) updated');
  process.exit(0);
}

clearCache().catch(err => { console.error(err); process.exit(1); });
