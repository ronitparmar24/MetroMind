// frontend/src/components/common/SOSButton.jsx
export default function SOSButton() {
  const handleSOS = () => {
    if (confirm('Are you sure you want to trigger an Emergency SOS?')) {
      alert('🚨 Emergency services have been notified. Stay calm and stay where you are.');
    }
  };

  return (
    <button
      onClick={handleSOS}
      id="sos-button"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        border: 'none',
        fontSize: '1.2rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
        zIndex: 'var(--z-dropdown)',
        transition: 'all var(--transition-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="Emergency SOS"
    >
      🆘
    </button>
  );
}
