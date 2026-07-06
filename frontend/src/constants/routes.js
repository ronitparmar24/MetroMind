// frontend/src/constants/routes.js
// Sidebar navigation routes configuration

export const NAV_ROUTES = [
  {
    section: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/book', label: 'Book Ticket', icon: '🎫' },
      { path: '/tickets', label: 'My Tickets', icon: '🎟️' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { path: '/wallet', label: 'Wallet', icon: '💰' },
      { path: '/transactions', label: 'Transactions', icon: '📋' },
      { path: '/metro-card', label: 'Metro Card', icon: '💳' },
      { path: '/monthly-pass', label: 'Monthly Pass', icon: '🎪' },
    ],
  },
  {
    section: 'Travel',
    items: [
      { path: '/journey-planner', label: 'Journey Planner', icon: '🗺️' },
      { path: '/live-trains', label: 'Live Trains', icon: '🚇' },
      { path: '/metro-map', label: 'Metro Map', icon: '🗾' },
      { path: '/journey-history', label: 'Journey History', icon: '📜' },
      { path: '/fare-calculator', label: 'Fare Calculator', icon: '🧮' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { path: '/analytics', label: 'Analytics', icon: '📈' },
      { path: '/spending', label: 'Spending', icon: '💸' },
      { path: '/weekly-digest', label: 'Weekly Digest', icon: '🤖' },
      { path: '/carbon-passport', label: 'Carbon Passport', icon: '🌿' },
    ],
  },
  {
    section: 'Account',
    items: [
      { path: '/profile', label: 'Profile', icon: '👤' },
      { path: '/achievements', label: 'Achievements', icon: '🏆' },
      { path: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
  {
    section: 'Support',
    items: [
      { path: '/feedback', label: 'Feedback', icon: '💬' },
      { path: '/lost-found', label: 'Lost & Found', icon: '🔍' },
      { path: '/emergency', label: 'Emergency SOS', icon: '🆘' },
    ],
  },
];
