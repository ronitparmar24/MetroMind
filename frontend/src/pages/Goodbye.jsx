// frontend/src/pages/Goodbye.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Goodbye() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [timeLeft, setTimeLeft] = useState(3);
  const [timeOfDay, setTimeOfDay] = useState('afternoon');

  useEffect(() => {
    // Capture the name before logging out, so it doesn't disappear
    if (user?.name) {
      setFirstName(user.name.split(' ')[0]);
    }
    
    // Determine time of day
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
    
    // Clear user session in the background
    logout();

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [logout, navigate, user]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Starry night / dark space background
      background: 'linear-gradient(135deg, #17172E, #232049, #17172E)',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle infinite ease-in-out;
        }
        @keyframes moveTrain {
          0% { left: 0%; transform: translateX(-50%); }
          100% { left: 100%; transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gradient-text {
          background: linear-gradient(to right, #e2e8f0, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Background Stars (simple CSS implementation) */}
      <div className="star" style={{ top: '10%', left: '20%', width: '3px', height: '3px', animationDuration: '3s' }} />
      <div className="star" style={{ top: '25%', left: '80%', width: '2px', height: '2px', animationDuration: '2s' }} />
      <div className="star" style={{ top: '50%', left: '15%', width: '4px', height: '4px', animationDuration: '4s' }} />
      <div className="star" style={{ top: '75%', left: '70%', width: '3px', height: '3px', animationDuration: '2.5s' }} />
      <div className="star" style={{ top: '80%', left: '30%', width: '2px', height: '2px', animationDuration: '3.5s' }} />
      <div className="star" style={{ top: '15%', left: '50%', width: '2px', height: '2px', animationDuration: '2s' }} />

      {/* Main Glass Card */}
      <div style={{
        background: 'rgba(30, 31, 60, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '48px 40px',
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1,
        animation: 'fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>
        
        {/* Sun/Time Icon */}
        <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(250, 204, 21, 0.4))' }}>
          {timeOfDay === 'evening' ? '🌙' : '🌞'}
        </div>

        {/* Greeting Subtitle */}
        <div style={{
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '8px'
        }}>
          Good {timeOfDay}
        </div>

        {/* Main Title */}
        <h1 className="gradient-text" style={{
          fontSize: '2.75rem',
          fontWeight: 800,
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
        }}>
          See You Soon!
        </h1>

        {/* User Name */}
        <div style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#a78bfa',
          marginBottom: '24px'
        }}>
          {firstName || 'User'}
        </div>

        {/* Message */}
        <p style={{
          fontSize: '0.9375rem',
          color: '#94a3b8',
          lineHeight: 1.6,
          margin: '0 auto 40px auto',
          maxWidth: '400px'
        }}>
          Thank you for travelling with MetroMind this {timeOfDay}. 
          We hope your journey was smooth and pleasant!
        </p>

        {/* Animated Train Progress Bar */}
        <div style={{
          width: '70%',
          margin: '0 auto 32px auto',
          position: 'relative'
        }}>
          {/* Track line */}
          <div style={{
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            width: '100%',
            borderRadius: '2px',
            position: 'absolute',
            top: '20px'
          }} />
          
          {/* Train emoji */}
          <div style={{
            position: 'relative',
            fontSize: '24px',
            animation: 'moveTrain 3s linear forwards',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
          }}>
            🚇
          </div>
        </div>

        {/* Redirecting Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '8px 16px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontWeight: 500,
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#6366f1',
            boxShadow: '0 0 8px #6366f1'
          }} />
          Redirecting in {timeLeft} s
        </div>

      </div>
    </div>
  );
}
