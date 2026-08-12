// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import './styles/globals.css';
import './styles/glassmorphism.css';
import './styles/animations.css';
import './styles/mobile.css'; // Must be last — mobile overrides

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

