// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './i18n';
import './styles/globals.css';
import './styles/glassmorphism.css';
import './styles/animations.css';
import './styles/mobile.css'; // Must be last — mobile overrides

// ── Sentry: real-time error monitoring ─────────────────────────
// Must be called BEFORE ReactDOM.createRoot so Sentry can wrap
// React's internal error handling and capture component-level crashes
// with full stack traces and component context.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' | 'production'
  tracesSampleRate: 1.0,             // 100% — fine for student project traffic
  enabled: !!import.meta.env.VITE_SENTRY_DSN,

  // Capture React component tree in error reports
  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  // Don't capture browser extensions or ad-blocker noise
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
  ],
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#f1f5f9',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '3rem' }}>🚇</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa', margin: 0 }}>
            MetroMind encountered an error
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: 0, fontSize: '0.9rem' }}>
            Our team has been automatically notified via Sentry and will fix this shortly.
          </p>
          <p style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '8px 16px', fontSize: '0.78rem',
            color: '#f87171', maxWidth: 480, wordBreak: 'break-all',
          }}>
            {error?.message || 'Unknown error'}
          </p>
          <button
            onClick={resetError}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 10, padding: '10px 24px',
              color: '#fff', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', marginTop: '0.5rem',
            }}
          >
            Try Again
          </button>
        </div>
      )}
      onError={(error, componentStack) => {
        // Additional context is automatically captured by Sentry.init above.
        // This callback is for any extra side effects (e.g., analytics).
        console.error('[Sentry ErrorBoundary]', error.message);
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
