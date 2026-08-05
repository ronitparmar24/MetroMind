const mongoose = require('mongoose');
const { MONGO_URI } = require('./backend-node/src/config/env.js');
const User = require('./backend-node/src/models/User.model.js');
mongoose.connect(MONGO_URI).then(async () => {
  const result = await User.updateMany({}, { $unset: { personalityCache: '' } });
  console.log('Cleared cache for', result.modifiedCount, 'users');
  mongoose.disconnect();
}).catch(console.error);
