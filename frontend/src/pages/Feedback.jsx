// frontend/src/pages/Feedback.jsx
import { useState, useRef } from 'react';
import GlassCard from '../components/common/GlassCard';
import { useToast } from '../components/common/Toast';
import { submitFeedback } from '../api/analytics.api';

export default function Feedback() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReply, setAiReply] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const toast = useToast();

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        toast.error('Voice input error: ' + event.error);
      }
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { toast.error('Please enter your feedback'); return; }
    setLoading(true);
    setAiReply(null);
    try {
      const res = await submitFeedback({ text });
      setAiReply(res.data.aiReply || 'Thank you for your feedback! Our team will review it shortly.');
      setText('');
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to submit feedback'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="page" style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Feedback 💬</h1>
        <p className="page-subtitle">Powered by Gemini AI — we hear you loud and clear.</p>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {aiReply && (
          <GlassCard style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.04))', animation: 'fadeInUp 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                ✨
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>MetroMind AI Support</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {aiReply}
                </p>
                <button onClick={() => setAiReply(null)} style={{ marginTop: '20px', padding: '8px 16px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}>
                  Submit another response
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {!aiReply && (
          <GlassCard style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>How was your experience today?</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    className="form-input" 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us everything... (e.g., 'The train was late today', 'Loved the clean station!', 'App is very easy to use')" 
                    rows={6} 
                    style={{ 
                      resize: 'none', 
                      padding: '20px', 
                      fontSize: '1.05rem', 
                      lineHeight: 1.5,
                      borderRadius: '20px',
                      background: 'var(--bg-tertiary)',
                      border: '2px solid transparent',
                      transition: 'border-color 0.3s ease',
                    }} 
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                    disabled={loading}
                  />

                  <button 
                    type="button"
                    onClick={toggleListening}
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      right: '16px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isListening ? '#ef4444' : 'var(--bg-secondary)',
                      border: 'none',
                      color: isListening ? 'white' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s',
                      animation: isListening ? 'pulse 1.5s infinite' : 'none',
                      zIndex: 5
                    }}
                    title="Dictate feedback"
                  >
                    🎤
                  </button>
                  
                  {loading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 600, zIndex: 10 }}>
                      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                      Analyzing feedback...
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  borderRadius: '16px', 
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #4F46E5, #8B5CF6)',
                  boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  opacity: loading ? 0.7 : 1
                }} 
                disabled={loading}
                onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 12px 24px rgba(139,92,246,0.4)')}
                onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)')}
              >
                <span>Submit to MetroMind AI</span> 
                <span style={{ fontSize: '1.2rem' }}>✨</span>
              </button>
            </form>
          </GlassCard>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
