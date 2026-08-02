// frontend/src/components/common/VoiceAssistantModal.jsx
// Interactive MetroMind Voice Assistant ("Voice Command")
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const QUICK_COMMANDS = [
  "Book ticket from Thaltej to Kalupur",
  "Check crowd at Gujarat University",
  "Check my wallet balance",
  "Show active ticket QR code",
];

export default function VoiceAssistantModal({ isOpen, onClose, walletBalance = 500 }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('Listening... Speak your command naturally');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setResponse('Web Speech API is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setListening(true);
      setResponse('Listening... Speak now');
    };

    rec.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== 'no-speech') {
        setResponse(`Error listening: ${e.error}`);
      }
    };

    recognitionRef.current = rec;
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCommand = (cmdText) => {
    const text = cmdText.toLowerCase();
    setTranscript(cmdText);

    if (text.includes('book') || text.includes('ticket')) {
      const reply = "Opening booking page for you now!";
      setResponse(reply);
      speakText(reply);
      setTimeout(() => {
        onClose();
        navigate('/book');
      }, 1500);
    } else if (text.includes('wallet') || text.includes('balance')) {
      const reply = `Your current MetroMind wallet balance is ₹${walletBalance}.`;
      setResponse(reply);
      speakText(reply);
    } else if (text.includes('crowd') || text.includes('thaltej') || text.includes('kalupur')) {
      const reply = "Thaltej station has low crowd levels right now. Good time to travel!";
      setResponse(reply);
      speakText(reply);
    } else if (text.includes('live') || text.includes('train')) {
      const reply = "Opening live train tracker!";
      setResponse(reply);
      speakText(reply);
      setTimeout(() => {
        onClose();
        navigate('/live-trains');
      }, 1500);
    } else {
      const reply = `I heard: "${cmdText}". Try saying "Book ticket", "Wallet balance", or "Check crowd".`;
      setResponse(reply);
      speakText(reply);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch {
        // Ignored if already started
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      animation: 'fadeInUp 0.3s ease',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '28px', maxWidth: '440px', width: '100%', padding: '32px 28px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative', textAlign: 'center',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center',
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="material-symbols-outlined" style={{ color: '#4F46E5', fontSize: '24px' }}>graphic_eq</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            MetroMind Voice AI
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 24px' }}>
          Hands-free transit command assistant
        </p>

        {/* Animated Mic Wave */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '10px 0 24px' }}>
          {listening && (
            <div style={{
              position: 'absolute', inset: '-12px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79,70,229,0.3), transparent 70%)',
              animation: 'dashPulse 1.2s ease-in-out infinite',
            }} />
          )}

          <button
            onClick={listening ? stopListening : startListening}
            disabled={!isSupported}
            style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: listening ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff', border: 'none', cursor: isSupported ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: listening ? '0 0 30px rgba(239,68,68,0.5)' : '0 10px 25px rgba(79,70,229,0.4)',
              transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)',
              position: 'relative', zIndex: 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
              {listening ? 'mic' : 'mic_none'}
            </span>
          </button>
        </div>

        {/* Status / Response Box */}
        <div style={{
          background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '16px',
          marginBottom: '20px', minHeight: '70px', display: 'flex', flexDirection: 'column',
          justify: 'center', alignItems: 'center', border: '1px solid var(--border-color)',
        }}>
          {transcript && (
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4F46E5', marginBottom: '4px' }}>
              "{transcript}"
            </div>
          )}
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {response}
          </div>
        </div>

        {/* Quick Voice Shortcut Chips */}
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Or try tapping a command:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {QUICK_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              onClick={() => processCommand(cmd)}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                borderRadius: '9999px', padding: '6px 12px', fontSize: '0.75rem',
                color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🎤 "{cmd}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
