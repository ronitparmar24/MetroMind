// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './i18n';
import './styles/globals.css';
import './styles/glassmorphism.css';
import './styles/animations.css';
import './styles/mobile.css'; // Must be last — mobile overrides

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '934944525206-q1ihuugng41ekcarp109737v13v27oa9.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
