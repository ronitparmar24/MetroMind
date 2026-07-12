// frontend/src/pages/BookTicket.jsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StationSelector from '../components/booking/StationSelector';
import TimeSlotPicker from '../components/booking/TimeSlotPicker';
import GroupPassengerForm from '../components/booking/GroupPassengerForm';
import FarePulseWidget from '../components/booking/FarePulseWidget';
import CrowdBadge from '../components/booking/CrowdBadge';
import GlassCard from '../components/common/GlassCard';
import { useToast } from '../components/common/Toast';
import { useCrowd } from '../hooks/useCrowd';
import { bookTicket } from '../api/tickets.api';
import { STATIONS } from '../constants/stations';
import { calculateFare } from '../utils/fareEngine';

export default function BookTicket() {
  const location = useLocation();
  const prefilled = location.state || {};

  const [source, setSource] = useState(prefilled.source || '');
  const [destination, setDestination] = useState(prefilled.destination || '');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelTime, setTravelTime] = useState('');
  const [passengers, setPassengers] = useState([{ name: '', age: '' }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Show a toast if pre-filled from JourneyPlanner
  useEffect(() => {
    if (prefilled.source && prefilled.destination) {
      toast.success(`Route pre-filled: ${prefilled.source} → ${prefilled.destination}${prefilled.viaStation ? ` via ${prefilled.viaStation}` : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour = travelTime ? parseInt(travelTime.split(':')[0]) : new Date().getHours();
  const { prediction } = useCrowd(source, hour);

  // Calculate fare preview
  const farePreview = useMemo(() => {
    if (!source || !destination) return null;
    const srcStation = STATIONS.find(s => s.name === source);
    const destStation = STATIONS.find(s => s.name === destination);
    if (!srcStation || !destStation) return null;
    const dayOfWeek = new Date(travelDate).getDay();
    return calculateFare(srcStation, destStation, hour, dayOfWeek, passengers.length);
  }, [source, destination, travelDate, hour, passengers.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source || !destination || !travelDate || !travelTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    const validPassengers = passengers.filter(p => p.name && p.age);
    if (validPassengers.length === 0) {
      toast.error('Please add at least one passenger with name and age');
      return;
    }

    setLoading(true);
    try {
      const res = await bookTicket({
        source, destination,
        passengers: validPassengers.map(p => ({ name: p.name, age: parseInt(p.age) })),
        travelDate, travelTime,
      });
      toast.success(`Ticket booked! ${res.data.ticket.ticketId}`);
      navigate('/tickets');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Book Ticket 🎫</h1>
        <p className="page-subtitle">Book your metro ride with real-time crowd intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-xl)', alignItems: 'start' }}>
        <form onSubmit={handleSubmit}>
          <GlassCard style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '20px' }}>Route</h3>
            <StationSelector label="From" value={source} onChange={setSource} excludeStation={destination} />
            <StationSelector label="To" value={destination} onChange={setDestination} excludeStation={source} />

            <div className="form-group">
              <label className="form-label">Travel Date</label>
              <input type="date" className="form-input" value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          </GlassCard>

          <GlassCard style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '20px' }}>Time & Crowd</h3>
            <TimeSlotPicker value={travelTime} onChange={setTravelTime} />
            {prediction && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Expected crowd:</span>
                <CrowdBadge level={prediction.bucket} confidence={prediction.confidence} />
              </div>
            )}
          </GlassCard>

          <GlassCard style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '20px' }}>Passengers</h3>
            <GroupPassengerForm passengers={passengers} onChange={setPassengers} />
          </GlassCard>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}
            disabled={loading || !source || !destination || !travelTime} id="book-submit">
            {loading ? 'Booking...' : `Book Ticket${farePreview ? ` — ${farePreview.fare > 0 ? '₹' + farePreview.fare : ''}` : ''}`}
          </button>
        </form>

        {/* Side panel */}
        <div>
          {farePreview && <FarePulseWidget fareData={farePreview} />}

          <GlassCard style={{ marginTop: 'var(--space-lg)', padding: '20px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px' }}>💡 Travel Tips</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                🕐 Off-peak hours (11am-5pm) have lower fares
              </li>
              <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                👥 Group bookings up to 6 passengers supported
              </li>
              <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                🌿 Every ride saves ~90g CO₂ vs driving
              </li>
              <li style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                💰 Earn loyalty points: 1 point per ₹10 spent
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
