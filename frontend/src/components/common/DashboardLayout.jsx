// frontend/src/components/common/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      }}>
        <Outlet />
      </main>
    </div>
  );
}
