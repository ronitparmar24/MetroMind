import React from 'react';
import { FaUndo } from 'react-icons/fa';

export default function CancellationPolicy() {
  return (
    <div className="glass-card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-2xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
        <div style={{
          backgroundColor: '#ef4444', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FaUndo />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          Cancellation & Refund Policy
        </h3>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
        Tickets may be cancelled before the travel date. Refunds are credited to your MetroMind wallet:
      </p>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#7c3aed', color: 'white' }}>
              <th style={{ padding: '16px', fontWeight: '500' }}>Cancellation Window</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Refund</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>More than 24 hours before travel</td>
              <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>80% <span style={{fontWeight:'normal', color:'var(--text-secondary)'}}>of fare</span></td>
              <td style={{ padding: '16px' }}>
                <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '600' }}>Best Rate</span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>Less than 24 hours before travel</td>
              <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>50% <span style={{fontWeight:'normal', color:'var(--text-secondary)'}}>of fare</span></td>
              <td style={{ padding: '16px' }}>
                <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '600' }}>Partial</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>After travel date / Used ticket</td>
              <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>0% <span style={{fontWeight:'normal', color:'var(--text-secondary)'}}>— No refund</span></td>
              <td style={{ padding: '16px' }}>
                <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '600' }}>Non-refundable</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
