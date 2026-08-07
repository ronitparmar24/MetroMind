// Seed test support queue data
const admin = db.users.findOne({ role: 'admin' });
const user  = db.users.findOne({ role: { $ne: 'admin' } }) || admin;

if (!user) { print('No users found — register a user first'); quit(); }

// ── Feedback entries ──────────────────────────────────────────────────────
db.feedbacks.insertMany([
  {
    userId:     user._id,
    text:       'The app is amazing! Booking tickets is super fast and the QR code worked perfectly at the gate.',
    moodRating: 5,
    category:   'app',
    aiReply:    'Hi ' + user.name + ', thank you so much! We\'re thrilled the QR ticket experience was seamless for you. 🎉',
    createdAt:  new Date(),
    updatedAt:  new Date(),
  },
  {
    userId:     user._id,
    text:       'The Kalupur station escalator has been out of order for 3 days. Please fix it urgently.',
    moodRating: 2,
    category:   'service',
    aiReply:    'Hi ' + user.name + ', we sincerely apologize for the inconvenience. Our maintenance team has been alerted and will prioritize this.',
    createdAt:  new Date(),
    updatedAt:  new Date(),
  },
  {
    userId:     user._id,
    text:       'Washrooms at Thaltej station need more frequent cleaning. Not up to standard.',
    moodRating: 2,
    category:   'cleanliness',
    aiReply:    'Hi ' + user.name + ', thank you for flagging this. We\'ve escalated this to our hygiene team immediately.',
    createdAt:  new Date(),
    updatedAt:  new Date(),
  },
]);

// ── Lost & Found entries ──────────────────────────────────────────────────
db.lostfounds.insertMany([
  {
    userId:          user._id,
    type:            'lost',
    itemType:        'Bag',
    itemDescription: 'Black JanSport backpack with laptop inside, left on Blue Line train around 9 AM.',
    location:        'Gujarat University Station',
    status:          'reported',
    contactPhone:    '9876543210',
    createdAt:       new Date(),
    updatedAt:       new Date(),
  },
  {
    userId:          user._id,
    type:            'found',
    itemType:        'Umbrella',
    itemDescription: 'Navy blue umbrella found on seat near Kalupur Station platform.',
    location:        'Kalupur Station',
    status:          'found',
    contactPhone:    '9123456780',
    createdAt:       new Date(),
    updatedAt:       new Date(),
  },
]);

print('✅ Seeded: ' + db.feedbacks.countDocuments() + ' feedbacks, ' + db.lostfounds.countDocuments() + ' lost & found items.');
