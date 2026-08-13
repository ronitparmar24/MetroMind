/**
 * seed_user.js
 * Seeds realistic data for a specific user (by email) in the MetroMind Atlas DB.
 * Run: node seed_user.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const User        = require('./src/models/User.model');
const Ticket      = require('./src/models/Ticket.model');
const Transaction = require('./src/models/Transaction.model');
const Wallet      = require('./src/models/Wallet.model');
const MetroCard   = require('./src/models/MetroCard.model');
const MonthlyPass = require('./src/models/MonthlyPass.model');
const Notification= require('./src/models/Notification.model');
const SavedRoute  = require('./src/models/SavedRoute.model');

const TARGET_EMAIL = 'ronitparmar55@gmail.com';

// Real GMRC station pairs (source → destination)
const ROUTES = [
  { source: 'Thaltej',                destination: 'Kalupur Railway Station', distance: 12.4 },
  { source: 'Gujarat University',     destination: 'Old High Court',          distance: 7.2  },
  { source: 'Vastral Gam',            destination: 'Motera Stadium',           distance: 18.6 },
  { source: 'APMC',                   destination: 'Shahpur',                  distance: 9.1  },
  { source: 'Kalupur Railway Station',destination: 'Thaltej',                  distance: 12.4 },
  { source: 'Old High Court',         destination: 'Gujarat University',        distance: 7.2  },
  { source: 'Motera Stadium',         destination: 'Vastral Gam',              distance: 18.6 },
  { source: 'Shahpur',                destination: 'APMC',                     distance: 9.1  },
  { source: 'Commerce Six Road',      destination: 'Kalupur Railway Station',  distance: 6.8  },
  { source: 'Kankaria East',          destination: 'Shahpur',                  distance: 8.3  },
];

const TIMES   = ['07:30 AM', '08:15 AM', '09:00 AM', '10:30 AM', '12:00 PM',
                 '02:00 PM', '04:30 PM', '05:45 PM', '07:00 PM', '09:00 PM'];
const CROWDS  = ['Low', 'Medium', 'High'];
const COACHES = ['general', 'ladies', 'general'];

const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysAhead = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const genTicketId = (offset = 0) => {
  const d = new Date(Date.now() - offset * 86400000);
  const ds = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `MM-${ds}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const genQR = (data) => `data:image/png;base64,SEEDQR${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 40)}`;

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(MONGO_URI, { bufferCommands: false });
  console.log('✅ Connected to:', mongoose.connection.db.databaseName);

  // ── 1. Find user ────────────────────────────────────────────────────────────
  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.error(`❌ User "${TARGET_EMAIL}" not found in DB. Register first.`);
    process.exit(1);
  }
  console.log(`✅ Found user: ${user.name} (${user._id})`);

  // ── 2. Upsert Wallet ────────────────────────────────────────────────────────
  let wallet = await Wallet.findOne({ userId: user._id });
  if (!wallet) {
    wallet = await Wallet.create({ userId: user._id, balance: 0 });
    console.log('✅ Created wallet');
  }
  wallet.balance = 2450; // give a healthy balance
  await wallet.save();
  console.log('✅ Wallet balance set to ₹2,450');

  // ── 3. Seed Tickets ─────────────────────────────────────────────────────────
  // Clear existing tickets for clean state
  const existing = await Ticket.countDocuments({ userId: user._id });
  console.log(`ℹ️  Existing tickets for user: ${existing}`);

  const ticketsToInsert = [];

  // 12 COMPLETED tickets (past 60 days)
  for (let i = 0; i < 12; i++) {
    const route    = ROUTES[i % ROUTES.length];
    const dAgo     = randInt(2, 60);
    const fare     = randInt(15, 80);
    const pax      = randInt(1, 3);
    const farePerP = Math.round(fare / pax);
    const passengers = Array.from({ length: pax }, (_, pi) => ({
      name:         pi === 0 ? user.name : `Passenger ${pi + 1}`,
      age:          randInt(18, 55),
      farePerPerson: farePerP,
      qrCode:        genQR({ ticketId: genTicketId(dAgo), i: pi }),
    }));
    ticketsToInsert.push({
      userId:      user._id,
      ticketId:    genTicketId(dAgo),
      source:      route.source,
      destination: route.destination,
      fare,
      isPeak:      rand([true, false]),
      passengers,
      travelDate:  daysAgo(dAgo),
      travelTime:  rand(TIMES),
      status:      'completed',
      crowdBucket: rand(CROWDS),
      co2Saved:    parseFloat((route.distance * 0.14 * pax).toFixed(3)),
      distance:    route.distance,
      coachPref:   rand(COACHES),
    });
  }

  // 3 UPCOMING tickets (next 7 days)
  for (let i = 0; i < 3; i++) {
    const route    = ROUTES[(i + 3) % ROUTES.length];
    const dAhead   = randInt(1, 7);
    const fare     = randInt(20, 65);
    const pax      = 1;
    const passengers = [{
      name:         user.name,
      age:          25,
      farePerPerson: fare,
      qrCode:       genQR({ ticketId: genTicketId(), i: 0 }),
    }];
    ticketsToInsert.push({
      userId:      user._id,
      ticketId:    genTicketId(-dAhead),
      source:      route.source,
      destination: route.destination,
      fare,
      isPeak:      rand([true, false]),
      passengers,
      travelDate:  daysAhead(dAhead),
      travelTime:  rand(TIMES),
      status:      'upcoming',
      crowdBucket: rand(CROWDS),
      co2Saved:    parseFloat((route.distance * 0.14).toFixed(3)),
      distance:    route.distance,
      coachPref:   rand(COACHES),
    });
  }

  // 2 CANCELLED tickets
  for (let i = 0; i < 2; i++) {
    const route = ROUTES[(i + 6) % ROUTES.length];
    const dAgo  = randInt(5, 30);
    const fare  = randInt(20, 50);
    ticketsToInsert.push({
      userId:      user._id,
      ticketId:    genTicketId(dAgo + 100),
      source:      route.source,
      destination: route.destination,
      fare,
      isPeak:      false,
      passengers:  [{ name: user.name, age: 25, farePerPerson: fare, qrCode: '' }],
      travelDate:  daysAgo(dAgo),
      travelTime:  rand(TIMES),
      status:      'cancelled',
      crowdBucket: 'Medium',
      co2Saved:    0,
      distance:    route.distance,
      coachPref:   'general',
    });
  }

  const insertedTickets = await Ticket.insertMany(ticketsToInsert);
  console.log(`✅ Seeded ${insertedTickets.length} tickets (12 completed, 3 upcoming, 2 cancelled)`);

  // ── 4. Seed Transactions ────────────────────────────────────────────────────
  const txToInsert = [];
  let runningBalance = wallet.balance;

  // Top-up transactions
  const topups = [
    { amount: 500,  dAgo: 45 },
    { amount: 1000, dAgo: 20 },
    { amount: 500,  dAgo: 5  },
  ];
  for (const t of topups) {
    txToInsert.push({
      userId:    user._id,
      type:      'credit',
      amount:    t.amount,
      balance:   runningBalance,
      ref:       `TOPUP-${Date.now()}-${t.dAgo}`,
      note:      'Wallet top-up',
      createdAt: daysAgo(t.dAgo),
    });
  }

  // Ticket debit transactions (matching completed tickets)
  for (const tk of insertedTickets.filter(t => t.status === 'completed').slice(0, 10)) {
    runningBalance -= tk.fare;
    txToInsert.push({
      userId:    user._id,
      type:      'debit',
      amount:    tk.fare,
      balance:   Math.max(runningBalance, 0),
      ref:       tk.ticketId,
      note:      `Ticket: ${tk.source} → ${tk.destination} (${tk.passengers.length} pax) | Wallet`,
      createdAt: new Date(tk.travelDate),
    });
  }

  // Refund for cancelled tickets
  for (const tk of insertedTickets.filter(t => t.status === 'cancelled')) {
    const refund = Math.round(tk.fare * 0.5);
    runningBalance += refund;
    txToInsert.push({
      userId:    user._id,
      type:      'credit',
      amount:    refund,
      balance:   runningBalance,
      ref:       tk.ticketId,
      note:      `Refund: ${tk.source} → ${tk.destination} (50%)`,
      createdAt: daysAgo(randInt(3, 25)),
    });
  }

  // Sort by date descending (most recent first)
  txToInsert.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  await Transaction.insertMany(txToInsert);
  console.log(`✅ Seeded ${txToInsert.length} transactions`);

  // ── 5. Metro Card ────────────────────────────────────────────────────────────
  const existingCard = await MetroCard.findOne({ userId: user._id });
  if (!existingCard) {
    await MetroCard.create({
      userId:     user._id,
      cardNumber: `MC${randInt(1000000000, 9999999999)}`,
      balance:    randInt(200, 800),
      isActive:   true,
      lastUsed:   daysAgo(2),
      totalTrips: 12,
      totalSaved: 120,
    });
    console.log('✅ Created Metro Card');
  } else {
    console.log('ℹ️  Metro Card already exists');
  }

  // ── 6. Monthly Pass ──────────────────────────────────────────────────────────
  const existingPass = await MonthlyPass.findOne({ userId: user._id, status: 'active' });
  if (!existingPass) {
    await MonthlyPass.create({
      userId:    user._id,
      planType:  'monthly',
      startDate: daysAgo(10),
      endDate:   daysAhead(20),
      ridesUsed: 15,
      status:    'active',
    });
    console.log('✅ Created Monthly Pass');
  } else {
    console.log('ℹ️  Monthly Pass already exists');
  }

  // ── 7. Notifications ─────────────────────────────────────────────────────────
  const notifCount = await Notification.countDocuments({ userId: user._id });
  if (notifCount < 3) {
    await Notification.insertMany([
      {
        userId: user._id,
        title:  'Welcome to MetroMind! 🚇',
        body:   'Your account is all set. Book your first ticket now.',
        type:   'system',
        read:   false,
      },
      {
        userId: user._id,
        title:  'Wallet Top-up Successful',
        body:   '₹500 added to your MetroMind wallet.',
        type:   'wallet',
        read:   true,
      },
      {
        userId: user._id,
        title:  'Weekend Track Maintenance',
        body:   'Red Line trains will run every 15 minutes this weekend.',
        type:   'system',
        read:   false,
      },
    ]);
    console.log('✅ Seeded 3 notifications');
  }

  // ── 8. Saved Routes ──────────────────────────────────────────────────────────
  const savedCount = await SavedRoute.countDocuments({ userId: user._id });
  if (savedCount < 2) {
    await SavedRoute.insertMany([
      {
        userId:      user._id,
        source:      'Thaltej',
        destination: 'Kalupur Railway Station',
        label:       'Daily Commute',
        useCount:    18,
        lastUsed:    daysAgo(1),
      },
      {
        userId:      user._id,
        source:      'Gujarat University',
        destination: 'Old High Court',
        label:       'Work Route',
        useCount:    7,
        lastUsed:    daysAgo(3),
      },
    ]);
    console.log('✅ Seeded 2 saved routes');
  }

  // ── 9. Update user loyalty points + streak ───────────────────────────────────
  user.loyaltyPoints = (user.loyaltyPoints || 0) + 340;
  user.streakDays    = 5;
  user.lastTravelDate= daysAgo(1);
  await user.save();
  console.log('✅ Updated user loyalty points & streak');

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete for:', TARGET_EMAIL);
  console.log('   Tickets    :', insertedTickets.length);
  console.log('   Transactions:', txToInsert.length);
  console.log('   Wallet     : ₹', wallet.balance);
  console.log('   Points     :', user.loyaltyPoints);

  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
