const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const Ticket = require('./src/models/Ticket.model');
const Transaction = require('./src/models/Transaction.model');
const dotenv = require('dotenv');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/metromind');
    console.log('Connected to MongoDB');

    const email = 'ronitparmar55@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found: ' + email);
      process.exit(1);
    }

    // Clear existing for clean slate
    await Ticket.deleteMany({ userId: user._id });
    await Transaction.deleteMany({ userId: user._id });
    console.log('Cleared old tickets and transactions.');

    const today = new Date();
    
    // Create random data over the last 30 days
    for (let i = 29; i >= 0; i--) {
      // Commute about 70% of the days (skip weekends usually)
      if (Math.random() < 0.3) continue;

      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const isReturn = Math.random() < 0.8; // 80% chance of a return trip (2 tickets/day)
      const numTickets = isReturn ? 2 : 1;
      
      for (let j = 0; j < numTickets; j++) {
        // Random time (Morning for first ticket, Evening for second)
        const travelHour = j === 0 ? 8 + Math.floor(Math.random() * 3) : 17 + Math.floor(Math.random() * 3);
        const tDate = new Date(d);
        tDate.setHours(travelHour, Math.floor(Math.random() * 60), 0);

        const dist = 8 + Math.floor(Math.random() * 12); // 8-20 km
        const fare = dist * 2; // Roughly Rs. 2 per km
        
        const yyyy = tDate.getFullYear();
        const mm = String(tDate.getMonth() + 1).padStart(2, '0');
        const dd = String(tDate.getDate()).padStart(2, '0');
        const rId = Math.floor(1000 + Math.random() * 9000);
        const ticketId = `MM-${yyyy}${mm}${dd}-${rId}-${i}-${j}`;

        const ticket = await Ticket.create({
          userId: user._id,
          ticketId,
          source: 'Thaltej',
          destination: 'Kalupur Railway Station',
          fare: fare,
          distance: dist,
          travelDate: tDate,
          travelTime: `${String(travelHour).padStart(2, '0')}:00`,
          status: 'completed',
          co2Saved: dist * 0.12,
          passengers: [{ name: user.name || 'Commuter', age: 25, farePerPerson: fare }],
          createdAt: tDate,
        });

        await Transaction.create({
          userId: user._id,
          type: 'debit',
          amount: fare,
          balance: 500, // Dummy balance
          ref: ticket.ticketId,
          note: 'Metro Ticket Purchase',
          createdAt: tDate,
        });
      }
    }

    console.log('Successfully seeded 30-day realistic spending data!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seed();
