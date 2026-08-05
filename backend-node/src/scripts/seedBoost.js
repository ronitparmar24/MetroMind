/**
 * Booster Seed — adds higher-fare group bookings and previous months' data
 * to make the admin revenue charts look impressive and realistic.
 * Run: node src/scripts/seedBoost.js
 */
require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const Ticket = require('../models/Ticket.model');
const User   = require('../models/User.model');

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

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n) { return String(n).padStart(2, '0'); }

function daysAgoDate(n, offsetHour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(offsetHour, rand(0,59), 0, 0);
  return d;
}

let counter = 5000;
function ticketId() {
  const now = new Date();
  return `MM-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${String(counter++).padStart(4,'0')}`;
}

// Fares: realistic but slightly higher for longer routes
function fare(src, dst, passengerCount = 1, isPeak = false) {
  const dist = Math.abs(STATIONS.indexOf(src) - STATIONS.indexOf(dst)) || 1;
  const basePerPerson = Math.min(10 + dist * 5, 80);
  const peakSurcharge = isPeak ? 1.15 : 1;
  return Math.round(basePerPerson * peakSurcharge * passengerCount);
}

mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ Connected. Loading users…');
  const users = await User.find({ role: 'user', isVerified: true }).limit(50).lean();
  if (users.length === 0) {
    console.log('❌ No seed users found. Run seed.js first.');
    process.exit(1);
  }
  console.log(`   Found ${users.length} users`);

  const tickets = [];
  const PEAK_HOURS = [8, 9, 17, 18, 19];

  // ── Add bulk tickets for last 90 days (group bookings 2-4 passengers) ──
  for (let daysBack = 89; daysBack >= 0; daysBack--) {
    // 5-10 group bookings per day
    const groupsToday = daysBack < 7 ? rand(8, 14) : daysBack < 30 ? rand(5, 10) : rand(2, 6);

    for (let g = 0; g < groupsToday; g++) {
      const user = pick(users);
      const src  = pick(STATIONS);
      let dst = pick(STATIONS);
      while (dst === src) dst = pick(STATIONS);

      const hour = Math.random() < 0.4 ? pick(PEAK_HOURS) : rand(7, 22);
      const isPeak = PEAK_HOURS.includes(hour);
      const numPassengers = rand(2, 5);
      const totalFare = fare(src, dst, numPassengers, isPeak);
      const dist = Math.abs(STATIONS.indexOf(src) - STATIONS.indexOf(dst));
      const ticketDate = daysAgoDate(daysBack, hour);

      const statuses = ['completed', 'completed', 'completed', 'upcoming', 'cancelled'];
      const status = daysBack > 1 ? pick(statuses) : (Math.random() < 0.6 ? 'upcoming' : 'completed');

      const passengers = Array.from({ length: numPassengers }, (_, i) => ({
        name: i === 0 ? user.name : `Passenger ${i + 1}`,
        age: rand(12, 65),
        farePerPerson: Math.round(totalFare / numPassengers),
      }));

      tickets.push({
        userId: user._id,
        ticketId: ticketId(),
        source: src,
        destination: dst,
        fare: totalFare,
        isPeak,
        travelDate: ticketDate,
        travelTime: `${pad(hour)}:${pad(rand(0, 59))}`,
        status,
        crowdBucket: isPeak ? 'High' : pick(['Low', 'Medium', 'Medium', 'High']),
        co2Saved: Math.round(dist * 0.12 * numPassengers * 100) / 100,
        distance: dist,
        coachPref: pick(['general', 'general', 'general', 'ladies']),
        passengers,
        createdAt: ticketDate,
        updatedAt: ticketDate,
      });
    }
  }

  // ── Batch insert ──────────────────────────────────────────────────
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < tickets.length; i += BATCH) {
    try {
      const res = await Ticket.insertMany(tickets.slice(i, i + BATCH), { ordered: false });
      inserted += res.length;
    } catch (e) {
      // Count partial inserts even if some duplicates
      inserted += e.insertedDocs?.length || 0;
    }
  }
  console.log(`🎫 Inserted ${inserted} group-booking tickets`);

  // ── Final stats ───────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [rev] = await Ticket.aggregate([
    { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, revenue: { $sum: '$fare' }, count: { $sum: 1 } } }
  ]);

  const total = await Ticket.countDocuments();
  console.log('\n═══════════════════════════════════════');
  console.log('  Boost Seed Complete! 🚀');
  console.log('═══════════════════════════════════════');
  console.log(`  🎫 Total DB Tickets:   ${total}`);
  console.log(`  💰 Monthly Revenue:    ₹${rev?.revenue?.toLocaleString('en-IN') || 0}`);
  console.log(`  🎟  Monthly Tickets:   ${rev?.count || 0}`);
  console.log('═══════════════════════════════════════\n');

  mongoose.disconnect();
}).catch(err => {
  console.error('Boost seed failed:', err.message);
  process.exit(1);
});
