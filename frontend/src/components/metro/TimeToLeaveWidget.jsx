// frontend/src/components/metro/TimeToLeaveWidget.jsx
// Real-time departure countdown with Firebase Cloud Messaging push reminder.
//
// UX flow:
//  1. Widget shows live countdown to departure (recalculated every 30s)
//  2. "🔔 Remind Me" button — requests FCM permission, registers token,
//     then POSTs to /api/notifications/schedule-reminder
//  3. When leaveByTime arrives the backend fires a real push — works even
//     if the tab is closed (background SW handles it)
//  4. "Cancel Reminder" clears the server-side scheduler entry

import { useState, useEffect, useCallback } from 'react';
import { requestFCMToken, onForegroundMessage } from '../../firebase';
import {
  registerFCMToken,
  scheduleReminder,
  cancelReminder,
  getReminderStatus,
} from '../../api/notifications.api';

export default function TimeToLeaveWidget({
  targetTime = '08:45 AM',  // "HH:MM AM/PM" string from ticket
  walkMins   = 12,
  route      = 'Metro Journey',
}) {
  const [minsLeft,       setMinsLeft]       = useState(null);
  const [reminderState,  setReminderState]  = useState('idle'); // idle | loading | active | error
  const [reminderError,  setReminderError]  = useState('');
  const [foregroundMsg,  setForegroundMsg]  = useState(null);

  // ── Parse targetTime → absolute Date ───────────────────────────────
  const parseTargetDate = useCallback(() => {
    try {
      const [time, meridiem] = targetTime.split(' ');
      let [hours, minutes]   = time.split(':').map(Number);
      if (meridiem?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours  = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      // If time already passed today, schedule for tomorrow
      if (d < new Date()) d.setDate(d.getDate() + 1);
      return d;
    } catch { return null; }
  }, [targetTime]);

  // ── Live countdown (updates every 30s) ─────────────────────────────
  useEffect(() => {
    const calc = () => {
      const departure = parseTargetDate();
      if (!departure) return;
      const leaveBy  = new Date(departure.getTime() - walkMins * 60 * 1000);
      const diffMins = Math.round((leaveBy - Date.now()) / 60000);
      setMinsLeft(diffMins);
    };
    calc();
    const id = setInterval(calc, 30_000);
    return () => clearInterval(id);
  }, [parseTargetDate, walkMins]);

  // ── Check if reminder already active on mount ───────────────────────
  useEffect(() => {
    getReminderStatus()
      .then(r => { if (r.data.active) setReminderState('active'); })
      .catch(() => {});
  }, []);

  // ── Foreground FCM message toast ────────────────────────────────────
  useEffect(() => {
    let unsub;
    onForegroundMessage((msg) => {
      setForegroundMsg(msg.notification?.body || 'Time to leave!');
      setTimeout(() => setForegroundMsg(null), 6000);
    }).then(fn => { unsub = fn; });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // ── Remind Me handler ───────────────────────────────────────────────
  const handleRemindMe = async () => {
    setReminderState('loading');
    setReminderError('');
    try {
      const departure   = parseTargetDate();
      if (!departure) throw new Error('Could not parse departure time.');
      const leaveByDate = new Date(departure.getTime() - walkMins * 60 * 1000);
      const msUntilLeave = leaveByDate - Date.now();

      // 1. Try FCM (real push — works even when tab is closed)
      const token = await requestFCMToken();
      if (token) {
        await registerFCMToken(token);
        await scheduleReminder({
          leaveByISO: leaveByDate.toISOString(),
          route,
          walkMins,
        });
        setReminderState('active');
        return;
      }

      // 2. FCM not configured / permission denied — fall back to local browser Notification
      const notifPerm = await Notification.requestPermission();
      if (notifPerm === 'granted' && msUntilLeave > 0) {
        setTimeout(() => {
          new Notification('🚇 Time to Leave — MetroMind', {
            body:  `Head to the station now — ${walkMins} min walk for ${route}.`,
            icon:  '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag:   'metromind-departure',
          });
        }, msUntilLeave);
        setReminderState('active');
      } else if (msUntilLeave <= 0) {
        setReminderError('Your train time has already passed.');
        setReminderState('error');
      } else {
        setReminderError('Notifications blocked. Please enable them in browser settings.');
        setReminderState('error');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not set reminder';
      setReminderError(msg);
      setReminderState('error');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelReminder();
      setReminderState('idle');
    } catch { setReminderState('idle'); }
  };

  // ── Derived state ───────────────────────────────────────────────────
  const statusColor =
    minsLeft === null       ? '#64748b' :
    minsLeft  > 15          ? '#10b981' :
    minsLeft  > 5           ? '#f59e0b' : '#ef4444';

  const statusLabel =
    minsLeft === null  ? 'Calculating…' :
    minsLeft  <= 0     ? '🏃 Hurry Now!'   :
    minsLeft  <= 5     ? '🔴 Leave Now!'   :
    minsLeft  <= 15    ? '🟡 Leave Soon'   : '🟢 On Track';

  const displayMins = minsLeft === null ? '--' : Math.max(0, minsLeft);

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* ── Countdown ring + info ──────────────────────────────────── */}
      <div style={{
        background:   'var(--bg-secondary)',
        border:       `2px solid ${statusColor}`,
        borderRadius: '24px',
        padding:      '20px',
        display:      'flex',
        alignItems:   'center',
        gap:          '20px',
        boxShadow:    `0 8px 24px ${statusColor}20`,
      }}>
        {/* Ring */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          border: `4px solid ${statusColor}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', flexShrink: 0,
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {displayMins}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            MINS
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {statusLabel}
            </h3>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Leave now for a <strong>{walkMins} min</strong> walk to catch the{' '}
            <strong>{targetTime}</strong> train.
          </p>

          {/* Reminder button */}
          {reminderState === 'idle' || reminderState === 'error' ? (
            <button
              id="remind-me-btn"
              onClick={handleRemindMe}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem',
                fontWeight: 700, cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                transition: 'opacity 0.2s',
              }}
            >
              🔔 Remind Me
            </button>
          ) : reminderState === 'loading' ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Setting up push…</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                background: 'rgba(16,185,129,0.12)', color: '#059669',
                border: '1px solid rgba(16,185,129,0.3)',
              }}>
                ✅ Push reminder set
              </span>
              <button
                onClick={handleCancel}
                style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                  background: 'transparent', border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {reminderError && (
            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '6px', marginBottom: 0 }}>
              ⚠️ {reminderError}
            </p>
          )}
        </div>
      </div>

      {/* ── Foreground notification toast ──────────────────────────── */}
      {foregroundMsg && (
        <div style={{
          marginTop: '10px', padding: '12px 16px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#fff', fontSize: '0.875rem', fontWeight: 600,
          animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          🔔 {foregroundMsg}
        </div>
      )}
    </div>
  );
}
