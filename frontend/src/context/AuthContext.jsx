// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth.api';

export const AuthContext = createContext(null);

// ── Preload image into browser cache silently ──
function preloadImage(url) {
  if (!url) return;
  const img = new window.Image();
  img.src = url;
}

// ── Merge avatar: prefer server value, fall back to cached Google picture ──
function resolveAvatar(serverAvatar) {
  if (serverAvatar) return serverAvatar;
  // Fallback: use the picture we cached from the last Google login JWT
  return localStorage.getItem('mm_g_pic') || '';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('metromind_token');
    if (token) {
      getMe()
        .then((res) => {
          const u = res.data.user;
          u.avatar = resolveAvatar(u.avatar);
          preloadImage(u.avatar);
          setUser(u);
        })
        .catch(() => {
          localStorage.removeItem('metromind_token');
          localStorage.removeItem('metromind_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    userData.avatar = resolveAvatar(userData.avatar);
    preloadImage(userData.avatar);
    localStorage.setItem('metromind_token', token);
    localStorage.setItem('metromind_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('metromind_token');
    localStorage.removeItem('metromind_user');
    // Keep mm_g_pic so next login is instant
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
