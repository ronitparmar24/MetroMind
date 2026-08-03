import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminModels from './AdminModels';
import AdminSupport from './AdminSupport';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Decorative glow orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      
      <div style={{ display: 'flex' }}>
        {sidebarOpen && <AdminSidebar />}

        <main style={{
          flex: 1,
          marginTop: 'var(--navbar-height)',
          minHeight: 'calc(100vh - var(--navbar-height))',
          padding: '24px',
          position: 'relative',
          zIndex: 1,
          overflowY: 'auto'
        }}>
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/models" element={<AdminModels />} />
            <Route path="/support" element={<AdminSupport />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
