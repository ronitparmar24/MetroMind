// frontend/src/components/common/AccessibilityToggle.jsx
import { useAccessibility } from '../../hooks/useAccessibility';

export default function AccessibilityToggle() {
  const { accessible, toggleAccessible } = useAccessibility();

  // Apply high contrast body class when accessible mode is on
  if (accessible) {
    document.body.classList.add('accessibility-mode');
  } else {
    document.body.classList.remove('accessibility-mode');
  }

  return (
    <>
      <style>{`
        .accessibility-mode {
          --bg-primary: #000000;
          --bg-secondary: #111111;
          --text-primary: #ffffff;
          --text-secondary: #e5e5e5;
          --text-muted: #a3a3a3;
          --accent-primary: #facc15; /* High contrast yellow */
          --border-color: #333333;
        }
        .accessibility-mode * {
          letter-spacing: 0.02em;
        }
        .acc-toggle-btn {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 1000;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          alignItems: center;
          justifyContent: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }
        .acc-toggle-btn:hover {
          transform: scale(1.05);
        }
        .acc-toggle-btn.active {
          background: var(--accent-primary);
          color: #000;
          border-color: var(--accent-primary);
        }
      `}</style>
      
      <button 
        className={`acc-toggle-btn ${accessible ? 'active' : ''}`}
        onClick={toggleAccessible}
        aria-label="Toggle Accessibility Mode"
        title="Toggle Accessibility Mode"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
          accessible
        </span>
      </button>
    </>
  );
}
