// frontend/src/components/common/Toast.jsx
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, type, onClose }) {
  const colors = {
    success: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', icon: '✅' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', icon: '❌' },
    warning: { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', icon: '⚠️' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', icon: 'ℹ️' },
  };
  const c = colors[type] || colors.info;

  return (
    <div
      style={{
        background: c.bg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${c.border}30`,
        borderLeft: `3px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        minWidth: '300px',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'toast-slide-in 0.3s ease',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <span>{c.icon}</span>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>{message}</p>
    </div>
  );
}
