// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import AuthGuard from './components/common/AuthGuard';
import DashboardLayout from './components/common/DashboardLayout';
import SOSButton from './components/common/SOSButton';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard pages
import Dashboard from './pages/Dashboard';
import BookTicket from './pages/BookTicket';
import MyTickets from './pages/MyTickets';
import Wallet from './pages/Wallet';
import Transactions from './pages/Transactions';
import MetroCard from './pages/MetroCard';
import MonthlyPass from './pages/MonthlyPass';
import JourneyPlanner from './pages/JourneyPlanner';
import LiveTrains from './pages/LiveTrains';
import MetroMap from './pages/MetroMap';
import JourneyHistory from './pages/JourneyHistory';
import FareCalculator from './pages/FareCalculator';
import Analytics from './pages/Analytics';
import Spending from './pages/Spending';
import WeeklyDigest from './pages/WeeklyDigest';
import CarbonPassport from './pages/CarbonPassport';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Feedback from './pages/Feedback';
import LostFound from './pages/LostFound';
import EmergencySOS from './pages/EmergencySOS';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — inside DashboardLayout */}
              <Route
                element={
                  <AuthGuard>
                    <DashboardLayout />
                    <SOSButton />
                  </AuthGuard>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="book" element={<BookTicket />} />
                <Route path="tickets" element={<MyTickets />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="metro-card" element={<MetroCard />} />
                <Route path="monthly-pass" element={<MonthlyPass />} />
                <Route path="journey-planner" element={<JourneyPlanner />} />
                <Route path="live-trains" element={<LiveTrains />} />
                <Route path="metro-map" element={<MetroMap />} />
                <Route path="journey-history" element={<JourneyHistory />} />
                <Route path="fare-calculator" element={<FareCalculator />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="spending" element={<Spending />} />
                <Route path="weekly-digest" element={<WeeklyDigest />} />
                <Route path="carbon-passport" element={<CarbonPassport />} />
                <Route path="profile" element={<Profile />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="settings" element={<Settings />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="lost-found" element={<LostFound />} />
                <Route path="emergency" element={<EmergencySOS />} />
              </Route>

              {/* Catch-all → landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
