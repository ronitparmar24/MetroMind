// frontend/src/components/common/GlassCard.jsx
// "Dumb" component — no API calls. Pure presentation.

export default function GlassCard({ children, className = '', hover = true, onClick, style }) {
  return (
    <div
      className={`glass-card ${hover ? 'hover-lift' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </div>
  );
}
