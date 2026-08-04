const mongoose = require('mongoose');

// Import all models
const AuditLog = require('./src/models/AuditLog.model');
const Feedback = require('./src/models/Feedback.model');
const LostFound = require('./src/models/LostFound.model');
const MetroCard = require('./src/models/MetroCard.model');
const MonthlyPass = require('./src/models/MonthlyPass.model');
const Notification = require('./src/models/Notification.model');
const SavedRoute = require('./src/models/SavedRoute.model');
const Ticket = require('./src/models/Ticket.model');
const Transaction = require('./src/models/Transaction.model');
const User = require('./src/models/User.model');
const Wallet = require('./src/models/Wallet.model');

const MONGO_URI = 'mongodb://127.0.0.1:27017/metromind';

const STATIONS = ['Thaltej', 'Vastral Gam', 'Motera Stadium', 'APMC', 'Old High Court', 'Kalupur', 'Shahpur', 'Gujarat University', 'Kankaria East', 'Commerce Six Road'];

// Helper to get a random item
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate a random string
const randomString = (len) => Math.random().toString(36).substring(2, 2 + len);

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Starting global seed...');

    const numRecords = 50;

    // 1. Create Users
    const usersData = [];
    for (let i = 0; i < numRecords; i++) {
      usersData.push({
        name: `User ${randomString(5)}`,
        email: `user_${randomString(8)}@example.com`,
        authProvider: 'local',
        role: 'user',
        isActive: true,
        isVerified: true,
        phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        loyaltyPoints: Math.floor(Math.random() * 500)
      });
    }
    const users = await User.insertMany(usersData);
    console.log(`✅ Seeded ${users.length} Users`);

    // 2. Create Wallets for each user
    const walletsData = users.map(u => ({
      userId: u._id,
      balance: Math.floor(Math.random() * 1000) + 100
    }));
    const wallets = await Wallet.insertMany(walletsData);
    console.log(`✅ Seeded ${wallets.length} Wallets`);

    // 3. Create AuditLogs, Feedbacks, LostFounds, MetroCards, MonthlyPasses, Notifications, SavedRoutes, Tickets, Transactions
    const auditLogsData = [];
    const feedbacksData = [];
    const lostFoundsData = [];
    const metroCardsData = [];
    const monthlyPassesData = [];
    const notificationsData = [];
    const savedRoutesData = [];
    const ticketsData = [];
    const transactionsData = [];

    const auditActions = ['predict_crowd', 'anomaly_check', 'personality_profile', 'best_departure', 'commuter_cluster', 'forecast'];
    
    for (let i = 0; i < numRecords; i++) {
      const u = users[i];

      // AuditLog
      auditLogsData.push({
        userId: u._id,
        action: getRandom(auditActions),
        requestData: { param: 'test' },
        responseData: { status: 'ok' }
      });

      // Feedback
      feedbacksData.push({
        userId: u._id,
        moodRating: Math.floor(Math.random() * 5) + 1,
        category: getRandom(['service', 'cleanliness', 'safety', 'app', 'other']),
        text: `This is a test feedback ${randomString(5)}`
      });

      // LostFound
      lostFoundsData.push({
        userId: u._id,
        category: getRandom(['electronics', 'bags', 'documents', 'clothing', 'other']),
        itemDescription: `Lost a ${randomString(5)} item`,
        lastSeenLocation: getRandom(STATIONS),
        lastSeenDate: new Date(),
        status: 'reported',
        contactPhone: '+919876543210'
      });

      // MetroCard
      metroCardsData.push({
        userId: u._id,
        cardNumber: `MC${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        balance: Math.floor(Math.random() * 1000),
        isActive: true,
        lastUsed: new Date()
      });

      // MonthlyPass
      monthlyPassesData.push({
        userId: u._id,
        planType: getRandom(['7day', 'monthly', 'quarterly']),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ridesUsed: Math.floor(Math.random() * 10),
        status: 'active'
      });

      // Notification
      notificationsData.push({
        userId: u._id,
        title: 'Test Notification',
        body: `Hello ${u.name}, this is a test.`,
        type: getRandom(['booking', 'wallet', 'pass', 'system', 'promo']),
        read: false
      });

      // SavedRoute
      savedRoutesData.push({
        userId: u._id,
        source: getRandom(STATIONS),
        destination: getRandom(STATIONS),
        label: 'Daily Commute',
        useCount: Math.floor(Math.random() * 20),
        lastUsed: new Date()
      });

      // Ticket
      ticketsData.push({
        userId: u._id,
        ticketId: `MM-2026${randomString(6).toUpperCase()}`,
        source: getRandom(STATIONS),
        destination: getRandom(STATIONS),
        fare: Math.floor(Math.random() * 50) + 10,
        isPeak: Math.random() > 0.5,
        passengers: [{ name: 'Test Pass', age: 25, farePerPerson: 10 }],
        travelDate: new Date(),
        travelTime: '10:00 AM',
        status: getRandom(['upcoming', 'completed']),
        crowdBucket: getRandom(['Low', 'Medium', 'High']),
        co2Saved: Math.random() * 2,
        distance: Math.random() * 15
      });

      // Transaction
      transactionsData.push({
        userId: u._id,
        type: getRandom(['credit', 'debit']),
        amount: Math.floor(Math.random() * 100) + 10,
        balance: Math.floor(Math.random() * 1000),
        ref: `REF${randomString(8).toUpperCase()}`,
        note: 'Test transaction'
      });
    }

    await AuditLog.insertMany(auditLogsData);
    console.log(`✅ Seeded ${auditLogsData.length} AuditLogs`);
    
    await Feedback.insertMany(feedbacksData);
    console.log(`✅ Seeded ${feedbacksData.length} Feedbacks`);
    
    await LostFound.insertMany(lostFoundsData);
    console.log(`✅ Seeded ${lostFoundsData.length} LostFounds`);
    
    await MetroCard.insertMany(metroCardsData);
    console.log(`✅ Seeded ${metroCardsData.length} MetroCards`);
    
    await MonthlyPass.insertMany(monthlyPassesData);
    console.log(`✅ Seeded ${monthlyPassesData.length} MonthlyPasses`);
    
    await Notification.insertMany(notificationsData);
    console.log(`✅ Seeded ${notificationsData.length} Notifications`);
    
    await SavedRoute.insertMany(savedRoutesData);
    console.log(`✅ Seeded ${savedRoutesData.length} SavedRoutes`);
    
    await Ticket.insertMany(ticketsData);
    console.log(`✅ Seeded ${ticketsData.length} Tickets`);
    
    await Transaction.insertMany(transactionsData);
    console.log(`✅ Seeded ${transactionsData.length} Transactions`);

    console.log('🎉 Successfully seeded 50+ records for all 11 collections!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
