// frontend/src/components/common/VoiceAssistantModal.jsx
// MetroMind Voice AI — premium glassmorphic UI, fully readable.

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index';

const SUGGESTIONS = [
  { icon: '💳', label: 'My wallet balance' },
  { icon: '🎫', label: 'Show my tickets' },
  { icon: '🚇', label: 'Book a ticket' },
  { icon: '📍', label: 'Busy hours today' },
  { icon: '💰', label: 'Fare: Thaltej to Kalupur' },
  { icon: '🗺️', label: 'Plan my journey' },
];

/* ── Animated waveform ───────────────────────────────────────────────────── */
function Waveform({ active, color = 'white', height = 18 }) {
  const scales = [0.4, 0.7, 1, 0.7, 0.4];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height }}>
      {scales.map((s, i) => (
        <div key={i} style={{
          width:      4,
          borderRadius: 3,
          background: color,
          height:     active ? `${Math.round(s * height)}px` : 3,
          animation:  active ? `vmBar${i} ${0.55 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          transition: 'height 0.15s',
          minHeight:  3,
        }} />
      ))}
    </div>
  );
}

/* ── Typing dots ─────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 20 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#a5b4fc',
          animation: `vmDot 1.1s ${i * 0.18}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

/* ── Message bubble — HIGH CONTRAST ─────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display:       'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems:    'flex-start',
      gap:           10,
      marginBottom:  16,
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        background: isUser
          ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
          : 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color: '#fff',
        boxShadow: '0 2px 10px rgba(79,70,229,.35)',
        border: '2px solid rgba(255,255,255,.15)',
      }}>
        {isUser ? 'U' : '✦'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth:     '73%',
        padding:      '12px 16px',
        borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',

        // HIGH CONTRAST backgrounds — fully readable on dark card
        background: isUser
          ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
          : '#1e2d4e',                        // solid dark-blue — clearly readable
        color:   isUser ? '#ffffff' : '#e2e8f0', // pure white text both sides
        fontSize: '0.92rem',
        fontWeight: 400,
        lineHeight: 1.6,

        border: isUser
          ? 'none'
          : '1px solid rgba(99,102,241,.35)',   // visible indigo border on AI bubble
        boxShadow: isUser
          ? '0 4px 20px rgba(79,70,229,.35)'
          : '0 2px 12px rgba(0,0,0,.3)',

        wordBreak: 'break-word',
        letterSpacing: '0.01em',
      }}>
        {msg.text}

        {/* Role label under AI messages */}
        {!isUser && (
          <div style={{ fontSize: '0.68rem', marginTop: 6, opacity: 0.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            MetroMind AI
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function VoiceAssistantModal({ isOpen, onClose, weatherData }) {
  const [listening,   setListening]   = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [messages,    setMessages]    = useState([]);
  const [isThinking,  setIsThinking]  = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [inputText,   setInputText]   = useState('');
  const [speechReady, setSpeechReady] = useState(false);
  const [micError,    setMicError]    = useState('');
  const [hasGreeted,  setHasGreeted]  = useState(false);

  const recRef     = useRef(null);
  const endRef     = useRef(null);
  const inputRef   = useRef(null);
  const sendingRef = useRef(false);
  const txRef      = useRef('');
  const navigate   = useNavigate();

  /* ── Speech recognition ───────────────────────────────────────────────── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError('Voice needs Chrome or Edge.'); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-IN';
    rec.onstart  = () => { setListening(true); setTranscript(''); txRef.current = ''; setMicError(''); };
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(t); txRef.current = t;
    };
    rec.onend  = () => setListening(false);
    rec.onerror = e => { setListening(false); if (e.error !== 'no-speech') setMicError(`Mic: ${e.error}`); };
    recRef.current = rec; setSpeechReady(true);
  }, []);

  /* ── Auto-submit after mic stops ─────────────────────────────────────── */
  useEffect(() => {
    if (!listening && txRef.current.trim()) {
      const t = txRef.current.trim();
      txRef.current = '';
      setTranscript('');
      sendMessage(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  /* ── Greet on open ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const h   = new Date().getHours();
      const g   = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      const wx  = weatherData ? ` It's ${weatherData.tempC}°C and ${weatherData.condition?.toLowerCase()} outside.` : '';
      setMessages([{
        role: 'model',
        text: `${g}! 👋 I'm your MetroMind AI.${wx}\n\nAsk me about fares, your wallet balance, upcoming tickets, crowd levels, or say "book a ticket"!`,
      }]);
      setHasGreeted(true);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, hasGreeted, weatherData]);

  /* ── Reset on close ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      setHasGreeted(false); setMessages([]); setInputText('');
      setTranscript(''); setListening(false); setIsThinking(false);
      sendingRef.current = false; txRef.current = '';
      window.speechSynthesis?.cancel();
    }
  }, [isOpen]);

  /* ── Scroll to latest ────────────────────────────────────────────────── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  /* ── Keyboard ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const h = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault(); toggleMic();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, listening]);

  /* ── TTS ─────────────────────────────────────────────────────────────── */
  const speak = useCallback((text, onComplete) => {
    if (!('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 1.05; u.pitch = 1.05;
    const v = window.speechSynthesis.getVoices().find(v =>
      v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google'))
    );
    if (v) u.voice = v;
    u.onstart = () => setIsSpeaking(true);
    u.onend   = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    u.onerror = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    window.speechSynthesis.speak(u);
  }, []);

  /* ── Send to backend ─────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text) => {
    const clean = text?.trim();
    if (!clean || isThinking || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg = { role: 'user', text: clean };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setInputText('');

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const wxCtx   = weatherData
      ? `${weatherData.tempC}°C, ${weatherData.condition}${weatherData.isRaining ? ', raining' : ''}`
      : null;

    try {
      const res    = await api.post('/api/voice/chat', {
        userMessage: clean, history, context: { weather: wxCtx },
      });
      const { reply, action } = res.data;
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
      speak(reply, () => {
        if (action?.type === 'NAVIGATE' && action.target) {
          onClose();
          navigate(action.target);
        }
      });
    } catch (err) {
      const fb = 'Sorry, I hit a snag. Try asking about your wallet, tickets, or live trains!';
      setMessages(prev => [...prev, { role: 'model', text: fb }]);
      speak(fb);
    } finally {
      setIsThinking(false);
      sendingRef.current = false;
    }
  }, [messages, isThinking, weatherData, navigate, onClose, speak]);

  /* ── Mic toggle ──────────────────────────────────────────────────────── */
  const toggleMic = useCallback(() => {
    if (!recRef.current) return;
    if (listening) recRef.current.stop();
    else { txRef.current = ''; setTranscript(''); try { recRef.current.start(); } catch {} }
  }, [listening]);

  if (!isOpen) return null;

  const statusLabel = listening  ? '🔴 Listening…'
    : isThinking ? '⏳ Thinking…'
    : isSpeaking ? '🔊 Speaking…'
    : '✦ Gemini 2.0 Flash';

  return createPortal(
    <>
      <style>{`
        @keyframes vmBar0 { from{height:5px} to{height:12px} }
        @keyframes vmBar1 { from{height:5px} to{height:17px} }
        @keyframes vmBar2 { from{height:5px} to{height:20px} }
        @keyframes vmBar3 { from{height:5px} to{height:17px} }
        @keyframes vmBar4 { from{height:5px} to{height:12px} }
        @keyframes vmDot  { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes vmIn   { from{opacity:0;transform:translateY(14px)scale(.97)} to{opacity:1;transform:none} }
        @keyframes vmPulse{ 0%{box-shadow:0 0 0 0 rgba(99,102,241,.6)} 70%{box-shadow:0 0 0 14px rgba(99,102,241,0)} 100%{box-shadow:0 0 0 0 rgba(99,102,241,0)} }
        .vm-chip { transition: all 0.18s !important; }
        .vm-chip:hover { background: rgba(99,102,241,.22) !important; border-color: rgba(99,102,241,.55) !important; color: #a5b4fc !important; transform: translateY(-1px); }
        .vm-send:hover:not(:disabled) { opacity:.88; transform:scale(1.06); }
        .vm-input:focus { border-color: rgba(99,102,241,.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,.15) !important; outline: none; }
        .vm-scroll { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,.35) transparent; }
        .vm-scroll::-webkit-scrollbar { width: 5px; }
        .vm-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,.3); border-radius: 3px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(4, 6, 18, 0.88)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Modal card */}
        <div style={{
          width: '100%', maxWidth: 520, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          background: '#0d1530',            // very dark navy — high contrast base
          border: '1px solid rgba(99,102,241,.3)',
          borderRadius: 28,
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,.05)',
            '0 32px 80px rgba(0,0,0,.7)',
            '0 0 80px rgba(79,70,229,.12)',
          ].join(', '),
          animation: 'vmIn .32s cubic-bezier(.2,.8,.2,1)',
          overflow: 'hidden',
        }}>

          {/* ── HEADER ─────────────────────────────────────────────── */}
          <div style={{
            padding: '18px 20px 14px',
            background: 'linear-gradient(135deg, rgba(79,70,229,.15) 0%, rgba(14,165,233,.08) 100%)',
            borderBottom: '1px solid rgba(255,255,255,.07)',
            display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
          }}>
            {/* Orb */}
            <div style={{
              width: 46, height: 46, borderRadius: 15, flexShrink: 0,
              background: 'linear-gradient(135deg,#4338ca 0%,#7c3aed 55%,#0ea5e9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(79,70,229,.55)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,.15)',
            }}>
              {isSpeaking ? <Waveform active height={18} /> : <span style={{ fontSize: 20, fontWeight: 700 }}>✦</span>}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 800, fontSize: '1rem', color: '#f1f5f9',
                letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>
                MetroMind Voice AI
              </div>
              <div style={{
                fontSize: '0.73rem', marginTop: 3, fontWeight: 600,
                letterSpacing: '0.02em',
                color: listening  ? '#fca5a5'
                     : isThinking ? '#c4b5fd'
                     : isSpeaking ? '#7dd3fc'
                     : '#6366f1',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {(listening || isThinking || isSpeaking) && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                    background: listening  ? '#ef4444'
                              : isThinking ? '#8b5cf6'
                              : '#38bdf8',
                    animation: 'vmPulse 1.5s infinite',
                  }} />
                )}
                {statusLabel}
              </div>
            </div>

            {listening && (
              <div style={{ color: '#fca5a5' }}>
                <Waveform active color="#fca5a5" height={20} />
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,.08)', color: '#94a3b8',
                cursor: 'pointer', fontSize: 14, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
                fontWeight: 700,
              }}
            >✕</button>
          </div>

          {/* ── CONVERSATION THREAD ────────────────────────────────── */}
          <div
            className="vm-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '22px 18px 12px' }}
          >
            {messages.map((m, i) => <Bubble key={i} msg={m} />)}

            {/* AI thinking dots */}
            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: 'linear-gradient(135deg,#4f46e5,#0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff', border: '2px solid rgba(255,255,255,.15)',
                }}>✦</div>
                <div style={{
                  padding: '14px 18px', borderRadius: '20px 20px 20px 6px',
                  background: '#1e2d4e',
                  border: '1px solid rgba(99,102,241,.35)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Live transcript preview while speaking */}
            {listening && transcript && (
              <div style={{
                display: 'flex', flexDirection: 'row-reverse',
                alignItems: 'flex-start', gap: 10, marginBottom: 16, opacity: 0.7,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#fff', fontWeight: 700,
                  border: '2px solid rgba(255,255,255,.15)',
                }}>U</div>
                <div style={{
                  maxWidth: '73%', padding: '12px 16px',
                  borderRadius: '20px 20px 6px 20px',
                  background: 'rgba(99,102,241,.12)',
                  border: '1px dashed rgba(99,102,241,.4)',
                  fontSize: '0.9rem', color: '#a5b4fc', fontStyle: 'italic',
                }}>
                  {transcript}…
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── SUGGESTION CHIPS ─────────────────────────────────── */}
          {messages.length <= 1 && !isThinking && (
            <div style={{
              padding: '10px 18px 14px',
              borderTop: '1px solid rgba(255,255,255,.06)',
            }}>
              <p style={{
                fontSize: '0.7rem', color: '#475569', margin: '0 0 10px',
                textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
              }}>
                TRY ASKING
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="vm-chip"
                    onClick={() => sendMessage(s.label)}
                    style={{
                      background: 'rgba(99,102,241,.1)',
                      border: '1px solid rgba(99,102,241,.25)',
                      borderRadius: 22, padding: '7px 13px',
                      fontSize: '0.78rem', color: '#94a3b8',
                      cursor: 'pointer', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem' }}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── INPUT BAR ─────────────────────────────────────────── */}
          <div style={{
            padding: '12px 16px 16px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,.07)',
            background: 'rgba(0,0,0,.25)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            {/* Mic */}
            <button
              onClick={toggleMic}
              disabled={!speechReady}
              title={listening ? 'Stop (Space)' : 'Speak (Space)'}
              style={{
                width: 46, height: 46, borderRadius: 14, border: 'none', flexShrink: 0,
                background: listening
                  ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: '#fff', cursor: speechReady ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                boxShadow: listening
                  ? '0 4px 16px rgba(239,68,68,.45)'
                  : '0 4px 16px rgba(79,70,229,.4)',
                animation: listening ? 'vmPulse 1.5s infinite' : 'none',
                transition: 'all .2s',
              }}
            >
              {listening ? '⏹' : '🎤'}
            </button>

            {/* Text input + send */}
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(inputText); }}
              style={{ flex: 1, display: 'flex', gap: 8 }}
            >
              <input
                ref={inputRef}
                className="vm-input"
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={listening ? 'Listening… speak now' : 'Message MetroMind AI…'}
                disabled={isThinking}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 14,
                  border: '1px solid rgba(99,102,241,.3)',
                  background: '#1a2540',       // solid dark — fully readable
                  color: '#f1f5f9',            // near-white text
                  fontSize: '0.9rem',
                  transition: 'border-color .2s, box-shadow .2s',
                  opacity: isThinking ? 0.5 : 1,
                }}
              />
              <button
                type="submit"
                className="vm-send"
                disabled={!inputText.trim() || isThinking}
                style={{
                  width: 46, height: 46, borderRadius: 14, border: 'none', flexShrink: 0,
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color: '#fff', cursor: 'pointer', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                  opacity: (!inputText.trim() || isThinking) ? 0.35 : 1,
                  boxShadow: '0 4px 14px rgba(79,70,229,.35)',
                }}
              >➤</button>
            </form>
          </div>

          {/* ── FOOTER HINT ──────────────────────────────────────── */}
          <div style={{
            padding: '0 20px 14px', textAlign: 'center',
            fontSize: '0.7rem', color: '#334155', userSelect: 'none',
          }}>
            {micError
              ? <span style={{ color: '#fca5a5' }}>⚠ {micError}</span>
              : <>
                  <kbd style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:4, padding:'2px 6px', color:'#64748b' }}>Space</kbd>
                  {' toggle mic · '}
                  <kbd style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:4, padding:'2px 6px', color:'#64748b' }}>Esc</kbd>
                  {' close'}
                </>
            }
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
