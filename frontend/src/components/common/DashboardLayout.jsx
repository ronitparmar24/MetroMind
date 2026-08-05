// frontend/src/components/common/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AnnouncementBar from './AnnouncementBar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Decorative glow orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={sidebarOpen} />

      <main style={{
        marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0',
        marginTop: 'var(--navbar-height)',
        transition: 'margin-left var(--transition-base)',
        minHeight: 'calc(100vh - var(--navbar-height))',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AnnouncementBar />
        <Outlet />
      </main>
    </div>
  );
}
