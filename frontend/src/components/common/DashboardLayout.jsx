// frontend/src/components/common/DashboardLayout.jsx
import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AnnouncementBar from './AnnouncementBar';

const MOBILE_BREAKPOINT = 768;

export default function DashboardLayout() {
  // Default open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth >= MOBILE_BREAKPOINT : true
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  const navigate = useNavigate();
  const location = useLocation();

  // Track screen size changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-open on desktop, auto-close on mobile resize down
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation (mobile only)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      switch (e.key.toLowerCase()) {
        case 'h': navigate('/dashboard'); break;
        case 'b': navigate('/book'); break;
        case 't': navigate('/tickets'); break;
        case 'w': navigate('/wallet'); break;
        case 'escape': setSidebarOpen(false); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Decorative glow orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      <Navbar onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={closeSidebar} />

      {/* Mobile backdrop — tap to close sidebar */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 'calc(var(--z-sidebar) - 1)',
            animation: 'fadeIn 0.2s ease',
          }}
          aria-label="Close sidebar"
        />
      )}

      <main style={{
        // On mobile sidebar is overlay — no margin push
        marginLeft: (!isMobile && sidebarOpen) ? 'var(--sidebar-width)' : '0',
        marginTop: 'var(--navbar-height)',
        transition: 'margin-left var(--transition-base)',
        minHeight: 'calc(100vh - var(--navbar-height))',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        width: (!isMobile && sidebarOpen) ? 'calc(100% - var(--sidebar-width))' : '100%',
        boxSizing: 'border-box',
      }}>
        <AnnouncementBar />
        <Outlet />
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
