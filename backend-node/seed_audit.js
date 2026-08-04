const mongoose = require('mongoose');
const AuditLog = require('./src/models/AuditLog.model');
const User = require('./src/models/User.model');
const dotenv = require('dotenv');

dotenv.config();

const seedAudits = async () => {
  try {
    // Force IPv4 to connect to the instance the user sees in Compass
    const mongoUri = 'mongodb://127.0.0.1:27017/metromind';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const users = await User.find().limit(3);
    
    if (users.length === 0) {
      console.log('No users found in database to attach audit logs to. Exiting.');
      process.exit(0);
    }

    const auditData = [];
    const actions = ['predict_crowd', 'anomaly_check', 'personality_profile', 'best_departure', 'commuter_cluster', 'forecast'];
    
    for (let i = 0; i < 15; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      auditData.push({
        userId: randomUser._id,
        action: randomAction,
        requestData: { endpoint: `/api/ml/${randomAction}`, timestamp: Date.now() },
        responseData: { status: 'success', confidence: Math.random().toFixed(2) },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
      });
    }

    await AuditLog.deleteMany({});
    console.log('Cleared existing audit logs.');

    await AuditLog.insertMany(auditData);
    console.log(`Successfully seeded ${auditData.length} audit logs!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding audits:', error);
    process.exit(1);
  }
};

seedAudits();
