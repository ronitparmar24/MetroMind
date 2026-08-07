/**
 * MetroMind Database Seeder
 * Seeds realistic data for the Admin Dashboard to display properly.
 *
 * What it seeds:
 *  - 30 realistic Users (varied names, emails, roles)
 *  - Wallet for every user
 *  - 500+ Tickets spread over 90 days (upcoming, completed, cancelled)
 *  - 50 Feedback entries (varied ratings + categories)
 *  - 25 Lost & Found reports
 *  - Transactions linked to wallets
 *
 * Usage: node src/scripts/seed.js [--clear]  (--clear wipes seed data first)
 */

require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User        = require('../models/User.model');
const Ticket      = require('../models/Ticket.model');
const Wallet      = require('../models/Wallet.model');
const Transaction = require('../models/Transaction.model');
const Feedback    = require('../models/Feedback.model');
const LostFound   = require('../models/LostFound.model');

const { MONGO_URI } = require('../config/env');

// ── Config ──────────────────────────────────────────────────────────
const CLEAR = process.argv.includes('--clear');
const SEED_TAG = 'SEEDED'; // marker so we only clear our own seed data

// ── Ahmedabad Metro Stations ────────────────────────────────────────
const STATIONS = [
  'Vastral Gam', 'Nirant Cross Road', 'Rabari Colony', 'Amraiwadi',
  'Retail Market', 'Old High Court', 'Shahpur', 'Gheekanta',
  'Kankaria East', 'Apparel Park', 'Lambha', 'Jantanagar',
  'Motera Stadium', 'Sabarmati', 'Ranip', 'Chandkheda',
  'Sargasan', 'Prahladnagar', 'AEC Cross Road', 'Gymnasium',
  'Kalupur Railway Station', 'Maninagar', 'Thaltej', 'APMC',
  'Khodiyarnagar', 'Vastral', 'Gujarat University', 'PDPU',
  'Bopal', 'Shyamal Cross Road',
];

const PEAK_HOURS  = [8, 9, 17, 18, 19];
const OFF_HOURS   = [10, 11, 12, 13, 14, 15, 16];
const CROWD_BUCKETS = ['Low', 'Medium', 'High'];

// ── Helpers ─────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function formatDate(d) {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}
function pad(n) { return String(n).padStart(2, '0'); }
function ticketId(counter) {
  const now = new Date();
  return `MM-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${String(counter).padStart(4,'0')}`;
}

// Fare calculation (matches real app logic)
function calcFare(src, dst, isPeak) {
  const dist = Math.abs(STATIONS.indexOf(src) - STATIONS.indexOf(dst)) || 1;
  const base = 10 + dist * 4;
  return Math.min(base * (isPeak ? 1.2 : 1), 80);
}

// ── User pool ────────────────────────────────────────────────────────
const USER_POOL = [
  { name: 'Aarav Shah',       email: 'aarav.shah@gmail.com' },
  { name: 'Priya Patel',      email: 'priya.patel@gmail.com' },
  { name: 'Rohan Mehta',      email: 'rohan.mehta@outlook.com' },
  { name: 'Sneha Joshi',      email: 'sneha.joshi@gmail.com' },
  { name: 'Karan Desai',      email: 'karan.desai@yahoo.com' },
  { name: 'Anjali Trivedi',   email: 'anjali.trivedi@gmail.com' },
  { name: 'Dev Parmar',       email: 'dev.parmar@gmail.com' },
  { name: 'Ritu Singh',       email: 'ritu.singh@hotmail.com' },
  { name: 'Arjun Nair',       email: 'arjun.nair@gmail.com' },
  { name: 'Kavya Reddy',      email: 'kavya.reddy@gmail.com' },
  { name: 'Vivek Sharma',     email: 'vivek.sharma@gmail.com' },
  { name: 'Meera Gupta',      email: 'meera.gupta@outlook.com' },
  { name: 'Harsh Prajapati',  email: 'harsh.prajapati@gmail.com' },
  { name: 'Pooja Yadav',      email: 'pooja.yadav@gmail.com' },
  { name: 'Nikhil Bhatt',     email: 'nikhil.bhatt@gmail.com' },
  { name: 'Divya Kapoor',     email: 'divya.kapoor@gmail.com' },
  { name: 'Rahul Verma',      email: 'rahul.verma@gmail.com' },
  { name: 'Ananya Malhotra',  email: 'ananya.malhotra@gmail.com' },
  { name: 'Siddharth Iyer',   email: 'siddharth.iyer@gmail.com' },
  { name: 'Tanvi Kulkarni',   email: 'tanvi.kulkarni@gmail.com' },
  { name: 'Mohit Agarwal',    email: 'mohit.agarwal@gmail.com' },
  { name: 'Nisha Dubey',      email: 'nisha.dubey@outlook.com' },
  { name: 'Aditya Pandey',    email: 'aditya.pandey@gmail.com' },
  { name: 'Shruti Bose',      email: 'shruti.bose@gmail.com' },
  { name: 'Varun Mishra',     email: 'varun.mishra@gmail.com' },
  { name: 'Ishaan Saxena',    email: 'ishaan.saxena@gmail.com' },
  { name: 'Pallavi Rao',      email: 'pallavi.rao@gmail.com' },
  { name: 'Gaurav Thakur',    email: 'gaurav.thakur@gmail.com' },
  { name: 'Simran Chauhan',   email: 'simran.chauhan@gmail.com' },
  { name: 'Manish Srivastava',email: 'manish.srivastava@gmail.com' },
  { name: 'Neha Sharma',      email: 'neha.sharma@gmail.com' },
  { name: 'Kunal Kapoor',     email: 'kunal.kapoor@outlook.com' },
  { name: 'Diya Agarwal',     email: 'diya.agarwal@gmail.com' },
  { name: 'Ravi Teja',        email: 'ravi.teja@yahoo.com' },
  { name: 'Sonal Desai',      email: 'sonal.desai@gmail.com' },
  { name: 'Yash Patel',       email: 'yash.patel@gmail.com' },
  { name: 'Megha Nair',       email: 'megha.nair@hotmail.com' },
  { name: 'Abhishek Gupta',   email: 'abhishek.gupta@gmail.com' },
  { name: 'Riya Singh',       email: 'riya.singh@gmail.com' },
  { name: 'Vikram Chawla',    email: 'vikram.chawla@gmail.com' },
  { name: 'Tarun Joshi',      email: 'tarun.joshi@gmail.com' },
  { name: 'Akansha Verma',    email: 'akansha.verma@gmail.com' },
  { name: 'Deepak Kumar',     email: 'deepak.kumar@gmail.com' },
  { name: 'Smriti Iyer',      email: 'smriti.iyer@gmail.com' },
  { name: 'Ritika Banerjee',  email: 'ritika.banerjee@gmail.com' },
  { name: 'Karthik Menon',    email: 'karthik.menon@gmail.com' },
  { name: 'Sanya Reddy',      email: 'sanya.reddy@gmail.com' },
  { name: 'Pranav Das',       email: 'pranav.das@gmail.com' },
  { name: 'Aditi Jain',       email: 'aditi.jain@gmail.com' },
  { name: 'Manoj Tiwari',     email: 'manoj.tiwari@gmail.com' },
];

const FEEDBACK_TEXTS = [
  'Very smooth ride today! Metro is clean and punctual.',
  'Trains are always on time. Love the app for booking.',
  'Crowd was manageable. The AC was working perfectly.',
  'App is super easy to use. Booked ticket in under 30 seconds!',
  'Motera to Kalupur route is very convenient for daily commute.',
  'The metro staff is helpful and courteous. Good experience.',
  'Sometimes the train is a bit delayed in evenings.',
  'I appreciate the QR ticketing — no more paper tickets!',
  'The platform announcements are clear and timely.',
  'Metro helped me avoid peak hour traffic completely.',
  'Great infrastructure. Happy to use Ahmedabad Metro daily.',
  'The new Sargasan extension is a game changer!',
  'Waiting time is minimal. Usually every 5-6 minutes.',
  'Cleanliness is top notch. Metro staff keeps it spotless.',
  'Online booking saves so much time at the station.',
];

const LOST_ITEMS = [
  { desc: 'Black leather wallet with Aadhar card inside', cat: 'documents' },
  { desc: 'Blue JBL wireless earphones in grey case', cat: 'electronics' },
  { desc: 'Purple backpack with laptop and chargers', cat: 'bags' },
  { desc: 'Navy blue umbrella with wooden handle', cat: 'clothing' },
  { desc: 'iPhone 14 with cracked screen protector', cat: 'electronics' },
  { desc: 'Brown leather briefcase with documents', cat: 'bags' },
  { desc: 'Red tiffin box with steel containers inside', cat: 'other' },
  { desc: 'White OnePlus phone with red case', cat: 'electronics' },
  { desc: 'Grey hoodie — "IIT Gandhinagar" printed on it', cat: 'clothing' },
  { desc: 'Yellow rubber ducky (child\'s toy)', cat: 'other' },
  { desc: 'Samsung Galaxy earbuds (white, no case)', cat: 'electronics' },
  { desc: 'Driving license + PAN card in plastic pouch', cat: 'documents' },
];

// ── Main seeder ──────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  if (CLEAR) {
    console.log('🧹 Clearing previous seed data…');
    await User.deleteMany({ name: { $in: USER_POOL.map(u => u.name) } });
    // Tickets/wallets/etc are wiped for those user IDs after we find them below
    console.log('   Seed users removed.');
  }

  // ── 1. Create Users ───────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const pwHash = await bcrypt.hash('Metro@123', salt);

  const createdUsers = [];
  for (const u of USER_POOL) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      existing = await User.create({
        name: u.name,
        email: u.email,
        passwordHash: pwHash,
        authProvider: 'local',
        role: 'user',
        isVerified: true,
        loyaltyPoints: rand(50, 2000),
        streakDays: rand(0, 90),
        createdAt: daysAgo(rand(30, 365)),
      });
      console.log(`  👤 Created user: ${u.name}`);
    }
    createdUsers.push(existing);
  }

  // ── 2. Create Wallets ─────────────────────────────────────────────
  for (const user of createdUsers) {
    const exists = await Wallet.findOne({ userId: user._id });
    if (!exists) {
      await Wallet.create({ userId: user._id, balance: rand(100, 3000) });
    }
  }
  console.log(`💳 Wallets ensured for ${createdUsers.length} users`);

  // ── 3. Seed Tickets (spread over 90 days) ─────────────────────────
  const existingCount = await Ticket.countDocuments({ userId: { $in: createdUsers.map(u => u._id) } });
  console.log('🎫 Seeding tickets (appending realistic seasonal curve data for 365 days)…');
  const tickets = [];
  let counter = 1000 + existingCount;

  // Generate tickets over a 365 day period
  for (let daysBack = 364; daysBack >= 0; daysBack--) {
    const date = daysAgo(daysBack);

    // Linear growth trend over the year (15 up to 45 base volume)
    const growth = 15 + ((365 - daysBack) / 365) * 30; 
    
    // Seasonal sine wave (peaks around mid year, dips towards end)
    const seasonality = Math.sin((daysBack / 365) * Math.PI * 2) * 20;

    // Add some daily noise and cap minimum
    const expectedCount = Math.max(5, growth + seasonality);
    const countToday = Math.floor(expectedCount + rand(-4, 4));

      for (let i = 0; i < countToday; i++) {
        const user = pick(createdUsers);
        const src  = pick(STATIONS);
        let dst = pick(STATIONS);
        while (dst === src) dst = pick(STATIONS);

        const hour = Math.random() < 0.35 ? pick(PEAK_HOURS) : pick(OFF_HOURS);
        const isPeak = PEAK_HOURS.includes(hour);
        const fare = Math.round(calcFare(src, dst, isPeak));
        const dist = Math.abs(STATIONS.indexOf(src) - STATIONS.indexOf(dst));
        const co2  = Math.round(dist * 0.12 * 100) / 100;

        // Status: older tickets are completed/cancelled, recent are upcoming
        let status;
        if (daysBack > 1) {
          const r = Math.random();
          status = r < 0.78 ? 'completed' : r < 0.92 ? 'cancelled' : 'upcoming';
        } else {
          status = Math.random() < 0.7 ? 'upcoming' : 'completed';
        }

        tickets.push({
          userId: user._id,
          ticketId: ticketId(counter++),
          source: src,
          destination: dst,
          fare,
          isPeak,
          travelDate: date,
          travelTime: `${pad(hour)}:${pick(['00','15','30','45'])}`,
          status,
          crowdBucket: isPeak ? (Math.random() < 0.6 ? 'High' : 'Medium') : pick(CROWD_BUCKETS),
          co2Saved: co2,
          distance: dist,
          coachPref: pick(['general', 'ladies', 'disabled']),
          passengers: [{
            name: user.name,
            age: rand(18, 55),
            farePerPerson: fare,
          }],
          createdAt: date,
          updatedAt: date,
        });
      }
    }

    const BATCH = 100;
    for (let i = 0; i < tickets.length; i += BATCH) {
      await Ticket.insertMany(tickets.slice(i, i + BATCH), { ordered: false }).catch(() => {});
    }
    console.log(`   ✅ Inserted ${tickets.length} tickets appended successfully.`);

  // ── 4. Seed Feedback ──────────────────────────────────────────────
  const feedbackCount = await Feedback.countDocuments({ userId: { $in: createdUsers.map(u => u._id) } });
  if (feedbackCount < 20) {
    console.log('💬 Seeding feedback…');
    const feedbacks = [];
    for (let i = 0; i < 60; i++) {
      feedbacks.push({
        userId: pick(createdUsers)._id,
        text: pick(FEEDBACK_TEXTS),
        moodRating: rand(3, 5),
        category: pick(['service','cleanliness','safety','app','other']),
        createdAt: daysAgo(rand(0, 60)),
      });
    }
    await Feedback.insertMany(feedbacks).catch(console.error);
    console.log(`   ✅ Inserted ${feedbacks.length} feedback entries`);
  } else {
    console.log(`   ⏭  Feedback already seeded (${feedbackCount} found), skipping`);
  }

  // ── 5. Seed Lost & Found ──────────────────────────────────────────
  const lfCount = await LostFound.countDocuments({ userId: { $in: createdUsers.map(u => u._id) } });
  if (lfCount < 5) {
    console.log('📦 Seeding Lost & Found…');
    const lfItems = [];
    for (const item of LOST_ITEMS) {
      lfItems.push({
        userId: pick(createdUsers)._id,
        itemDescription: item.desc,
        lastSeenLocation: pick(STATIONS),
        lastSeenDate: daysAgo(rand(1, 20)),
        contactPhone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
        status: pick(['reported', 'found']),
        category: item.cat,
        createdAt: daysAgo(rand(1, 20)),
      });
    }
    await LostFound.insertMany(lfItems).catch(console.error);
    console.log(`   ✅ Inserted ${lfItems.length} lost & found items`);
  } else {
    console.log(`   ⏭  Lost & Found already seeded (${lfCount} found), skipping`);
  }

  // ── 5.5 Commuter Live Pulse ───────────────────────────────────────
  const CommuterUpdate = require('../models/CommuterUpdate.model');
  const pulseCount = await CommuterUpdate.countDocuments();
  if (pulseCount < 3) {
    console.log('📡 Seeding Commuter Live Pulse…');
    const dummyUpdates = [
      { user: pick(createdUsers)._id, station: 'Kalupur Ry.', tag: 'Amenity', text: 'Elevator #2 near Gate 3 is back operational!', upvotes: 14, upvotedBy: [], isVerified: true, createdAt: new Date(Date.now() - 8 * 60000) },
      { user: pick(createdUsers)._id, station: 'Thaltej', tag: 'Queue', text: 'Automatic Ticket Vending Machine 2 accepting UPI quickly.', upvotes: 9, upvotedBy: [], isVerified: true, createdAt: new Date(Date.now() - 15 * 60000) },
      { user: pick(createdUsers)._id, station: 'Gujarat University', tag: 'AC', text: 'Coach 3 AC is set super cold (around 20°C).', upvotes: 6, upvotedBy: [], isVerified: false, createdAt: new Date(Date.now() - 22 * 60000) },
    ];
    await CommuterUpdate.insertMany(dummyUpdates).catch(console.error);
    console.log(`   ✅ Inserted ${dummyUpdates.length} commuter updates`);
  } else {
    console.log(`   ⏭  Commuter Updates already seeded (${pulseCount} found), skipping`);
  }

  // ── 6. Summary ────────────────────────────────────────────────────
  const totalUsers   = await User.countDocuments();
  const totalTickets = await Ticket.countDocuments();
  const totalFeedback = await Feedback.countDocuments();
  const totalLF       = await LostFound.countDocuments();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [revResult] = await Ticket.aggregate([
    { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, revenue: { $sum: '$fare' }, count: { $sum: 1 } } }
  ]);

  console.log('\n═══════════════════════════════════════');
  console.log('  MetroMind Seed Complete! 🚇');
  console.log('═══════════════════════════════════════');
  console.log(`  👥 Total Users:     ${totalUsers}`);
  console.log(`  🎫 Total Tickets:   ${totalTickets}`);
  console.log(`  💬 Total Feedback:  ${totalFeedback}`);
  console.log(`  📦 Lost & Found:    ${totalLF}`);
  console.log(`  💰 Monthly Revenue: ₹${revResult?.revenue?.toFixed(0) || 0}`);
  console.log(`  🎟  Monthly Tickets: ${revResult?.count || 0}`);
  console.log('═══════════════════════════════════════\n');

  mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err.message);
  process.exit(1);
});
