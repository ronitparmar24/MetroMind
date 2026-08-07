import React, { useEffect, useState, useContext, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { AuthContext } from '../../context/AuthContext';
import {
  Settings, Shield, Database, Bell, Server,
  Save, AlertTriangle, CheckCircle2, Eye, EyeOff, Lock, User
} from 'lucide-react';
import api from '../../api/index';

const PURPLE  = '#6366f1';
const EMERALD = '#34d399';
const ROSE    = '#f87171';
const AMBER   = '#fbbf24';
const CYAN    = '#22d3ee';
const VIOLET  = '#a78bfa';

// Reusable toggle switch
function ToggleSwitch({ checked, onChange }) {
  return (
    <label style={{ position:'relative', display:'inline-flex', alignItems:'center', cursor:'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display:'none' }} />
      <div style={{
        width:44, height:24, borderRadius:12,
        background: checked ? `linear-gradient(90deg, ${PURPLE}, #a78bfa)` : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? PURPLE : 'rgba(255,255,255,0.07)'}`,
        boxShadow: checked ? `0 0 12px rgba(99,102,241,0.35)` : 'none',
        transition:'all 0.3s',
        position:'relative',
      }}>
        <div style={{
          position:'absolute', top:2,
          left: checked ? 22 : 2,
          width:18, height:18,
          borderRadius:'50%',
          background:'white',
          transition:'left 0.3s',
          boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </label>
  );
}

// Section card wrapper
function SettingsSection({ icon: Icon, title, subtitle, iconColor = PURPLE, children }) {
  return (
    <div className="glass-card admin-fade-in" style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{
          width:40, height:40, borderRadius:12,
          background:`${iconColor}18`, border:`1px solid ${iconColor}30`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 14px ${iconColor}15`,
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <div>
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--adm-text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:2 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsRow({ label, desc, children }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
      padding:'14px 0',
      borderBottom:'1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--adm-text)' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{children}</div>
    </div>
  );
}

export default function AdminSettings() {
  const { user, updateUser } = useContext(AuthContext);

  // System settings from backend
  const [sysSettings, setSysSettings] = useState({
    maintenanceMode:           false,
    maxWalletBalance:          10000,
    ticketCancellationWindow:  30,
    supportEmailAlerts:        true,
  });
  const [sysSaving,  setSysSaving]  = useState(false);
  const [sysSaved,   setSysSaved]   = useState(false);
  const [sysLoading, setSysLoading] = useState(true);

  // Password change
  const [pwdOld,   setPwdOld]   = useState('');
  const [pwdNew,   setPwdNew]   = useState('');
  const [pwdConf,  setPwdConf]  = useState('');
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,   setPwdMsg]   = useState({ type:'', text:'' });

  // Display name
  const [displayName,    setDisplayName]    = useState(user?.name || '');
  const [nameSaving,     setNameSaving]     = useState(false);
  const [nameMsg,        setNameMsg]        = useState({ type:'', text:'' });

  // Load system settings
  useEffect(() => {
    adminApi.getSettings()
      .then(r => { if (r.data?.data) setSysSettings(r.data.data); })
      .catch(console.error)
      .finally(() => setSysLoading(false));
  }, []);

  const saveSystemSettings = async () => {
    setSysSaving(true);
    setSysSaved(false);
    try {
      await adminApi.updateSettings(sysSettings);
      setSysSaved(true);
      setTimeout(() => setSysSaved(false), 3000);
    } catch(e) { console.error(e); }
    finally { setSysSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdNew !== pwdConf) {
      setPwdMsg({ type:'error', text:'New passwords do not match.' });
      return;
    }
    if (pwdNew.length < 8) {
      setPwdMsg({ type:'error', text:'Password must be at least 8 characters.' });
      return;
    }
    setPwdSaving(true);
    setPwdMsg({ type:'', text:'' });
    try {
      await api.put('/api/auth/change-password', { currentPassword: pwdOld, newPassword: pwdNew });
      setPwdMsg({ type:'success', text:'Password changed successfully.' });
      setPwdOld(''); setPwdNew(''); setPwdConf('');
    } catch(e) {
      setPwdMsg({ type:'error', text: e.response?.data?.message || 'Failed to change password.' });
    } finally { setPwdSaving(false); }
  };

  const handleNameSave = async () => {
    if (!displayName.trim()) { setNameMsg({ type:'error', text:'Name cannot be empty.' }); return; }
    setNameSaving(true);
    setNameMsg({ type:'', text:'' });
    try {
      await api.put('/api/auth/update-profile', { name: displayName });
      updateUser({ name: displayName });
      setNameMsg({ type:'success', text:'Display name updated.' });
    } catch(e) {
      setNameMsg({ type:'error', text: e.response?.data?.message || 'Failed to update name.' });
    } finally { setNameSaving(false); }
  };

  const MsgBox = ({ msg }) => !msg.text ? null : (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'10px 14px', borderRadius:10, marginTop:14,
      fontSize:'0.82rem', fontWeight:600,
      background: msg.type==='success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
      color: msg.type==='success' ? EMERALD : ROSE,
      border:`1px solid ${msg.type==='success' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
    }}>
      {msg.type==='success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      {msg.text}
    </div>
  );

  const inputStyle = {
    width:'100%', padding:'9px 14px', borderRadius:10,
    border:'1px solid rgba(255,255,255,0.07)',
    background:'rgba(255,255,255,0.04)', color:'var(--adm-text)',
    fontSize:'0.875rem', outline:'none', fontFamily:'Inter, sans-serif',
    boxSizing:'border-box',
  };
  const pwdInputWrap = (value, setValue, show, setShow) => (
    <div style={{ position:'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="admin-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{ paddingRight:40 }}
      />
      <button type="button" onClick={() => setShow(s => !s)} style={{
        position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
        background:'none', border:'none', cursor:'pointer', color:'#475569',
        display:'flex', alignItems:'center',
      }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Page header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          width:44, height:44, borderRadius:14,
          background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Settings size={20} color={PURPLE} />
        </div>
        <div>
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)' }}>
            System Settings
          </div>
          <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>
            Configure platform behavior, admin account and notification preferences
          </div>
        </div>
      </div>

      <div className="admin-settings-grid">
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* System Config */}
          <SettingsSection icon={Server} title="Platform Config" subtitle="Core system behavior settings" iconColor={PURPLE}>
            {sysLoading ? (
              Array.from({length:3}).map((_,i) => (
                <div key={i} className="admin-skeleton" style={{ height:48, borderRadius:10, marginBottom:12 }} />
              ))
            ) : (
              <>
                <SettingsRow
                  label="Maintenance Mode"
                  desc="Show maintenance banner to all users. Blocks new ticket purchases."
                >
                  <ToggleSwitch
                    checked={sysSettings.maintenanceMode}
                    onChange={v => setSysSettings(s => ({...s, maintenanceMode: v}))}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Support Email Alerts"
                  desc="Send admin email when new support items are submitted."
                >
                  <ToggleSwitch
                    checked={sysSettings.supportEmailAlerts}
                    onChange={v => setSysSettings(s => ({...s, supportEmailAlerts: v}))}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Max Wallet Balance (₹)"
                  desc="Maximum amount a user can load into their wallet."
                >
                  <input
                    type="number"
                    className="admin-input"
                    style={{ width:110, textAlign:'right' }}
                    value={sysSettings.maxWalletBalance}
                    onChange={e => setSysSettings(s => ({...s, maxWalletBalance: parseInt(e.target.value)||0}))}
                    min={100} max={100000} step={500}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Ticket Cancellation Window (min)"
                  desc="How many minutes before departure users can cancel."
                >
                  <input
                    type="number"
                    className="admin-input"
                    style={{ width:80, textAlign:'right' }}
                    value={sysSettings.ticketCancellationWindow}
                    onChange={e => setSysSettings(s => ({...s, ticketCancellationWindow: parseInt(e.target.value)||0}))}
                    min={0} max={1440}
                  />
                </SettingsRow>

                <div style={{ marginTop:20 }}>
                  {sysSaved && (
                    <div style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'10px 14px', borderRadius:10, marginBottom:12,
                      background:'rgba(52,211,153,0.1)', color:EMERALD,
                      border:'1px solid rgba(52,211,153,0.2)',
                      fontSize:'0.82rem', fontWeight:600,
                    }}>
                      <CheckCircle2 size={14} /> Settings saved successfully
                    </div>
                  )}
                  {sysSettings.maintenanceMode && (
                    <div style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'10px 14px', borderRadius:10, marginBottom:12,
                      background:'rgba(248,113,113,0.1)', color:ROSE,
                      border:'1px solid rgba(248,113,113,0.2)',
                      fontSize:'0.82rem', fontWeight:600,
                    }}>
                      <AlertTriangle size={14} /> Maintenance mode is ON — users see a maintenance page
                    </div>
                  )}
                  <button
                    className="admin-action-btn admin-action-btn-primary"
                    onClick={saveSystemSettings}
                    disabled={sysSaving}
                    style={{ width:'100%', justifyContent:'center' }}
                  >
                    <Save size={14} />
                    {sysSaving ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </>
            )}
          </SettingsSection>

          {/* Database Info */}
          <SettingsSection icon={Database} title="Data Management" subtitle="System diagnostics and info" iconColor={ROSE}>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Environment',   value: import.meta.env.MODE || 'development' },
                { label:'API Base URL',  value: import.meta.env.VITE_API_URL || window.location.origin },
                { label:'Admin Panel',   value: 'v2.0 — Dark Command Center' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 14px', borderRadius:10,
                  background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)',
                  fontSize:'0.82rem',
                }}>
                  <span style={{ color:'#64748b', fontWeight:600 }}>{label}</span>
                  <span style={{ fontFamily:'JetBrains Mono, monospace', color:'var(--adm-text-3)', fontSize:'0.75rem' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </SettingsSection>

        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Admin Account */}
          <SettingsSection icon={User} title="Admin Account" subtitle="Manage your admin profile" iconColor={CYAN}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                Display Name
              </label>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  type="text"
                  className="admin-input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your admin name"
                  style={{ flex:1 }}
                />
                <button
                  className="admin-action-btn admin-action-btn-primary"
                  onClick={handleNameSave}
                  disabled={nameSaving}
                  style={{ flexShrink:0 }}
                >
                  {nameSaving ? '…' : <><Save size={13} /> Save</>}
                </button>
              </div>
              <MsgBox msg={nameMsg} />
            </div>

            <div style={{ paddingTop:4 }}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                Email
              </label>
              <div style={{
                padding:'9px 14px', borderRadius:10, fontSize:'0.875rem',
                color:'#64748b', background:'rgba(255,255,255,0.02)',
                border:'1px solid rgba(255,255,255,0.05)',
              }}>
                {user?.email || 'admin@metromind.in'}
              </div>
            </div>

            <div style={{ marginTop:8, paddingTop:8 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10,
                background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)',
                fontSize:'0.78rem', color:'#818cf8',
              }}>
                <Shield size={13} />
                Signed in as <strong>Administrator</strong>
              </div>
            </div>
          </SettingsSection>

          {/* Change Password */}
          <SettingsSection icon={Lock} title="Change Password" subtitle="Update your admin credentials" iconColor={VIOLET}>
            <form onSubmit={handlePasswordChange} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  Current Password
                </label>
                {pwdInputWrap(pwdOld, setPwdOld, showOld, setShowOld)}
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  New Password
                </label>
                {pwdInputWrap(pwdNew, setPwdNew, showNew, setShowNew)}
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="admin-input"
                  value={pwdConf}
                  onChange={e => setPwdConf(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              {/* Password strength hint */}
              {pwdNew.length > 0 && (
                <div style={{ display:'flex', gap:6 }}>
                  {['Length ≥8', 'Mixed case', 'Has numbers'].map((hint, i) => {
                    const checks = [pwdNew.length>=8, /[A-Z]/.test(pwdNew)&&/[a-z]/.test(pwdNew), /\d/.test(pwdNew)];
                    return (
                      <div key={i} style={{
                        fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', borderRadius:8,
                        background: checks[i] ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                        color: checks[i] ? EMERALD : '#475569',
                        border:`1px solid ${checks[i] ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      }}>{hint}</div>
                    );
                  })}
                </div>
              )}

              <MsgBox msg={pwdMsg} />

              <button
                type="submit"
                className="admin-action-btn admin-action-btn-primary"
                disabled={pwdSaving || !pwdOld || !pwdNew || !pwdConf}
                style={{ width:'100%', justifyContent:'center' }}
              >
                <Lock size={14} />
                {pwdSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </SettingsSection>

        </div>
      </div>


    </div>
  );
}
