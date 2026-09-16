import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('scada_token'));
  const [loading, setLoading] = useState(true);

  // On mount, validate stored token
  useEffect(() => {
    if (token) {
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user) {
            setUser(data.user);
          } else {
            // Token invalid/expired
            localStorage.removeItem('scada_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('scada_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('scada_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('scada_token');
    setToken(null);
    setUser(null);
  };

  // Authenticated fetch helper — automatically attaches Bearer token
  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
