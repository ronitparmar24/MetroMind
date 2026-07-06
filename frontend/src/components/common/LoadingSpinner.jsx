// frontend/src/components/common/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 40, text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 0',
      gap: '16px',
    }}>
      <div
        className="animate-spin"
        style={{
          width: size,
          height: size,
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
        }}
      />
      {text && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>}
    </div>
  );
}
