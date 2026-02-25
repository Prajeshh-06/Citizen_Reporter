'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getToken, setToken, clearToken,
  decodeToken, isTokenValid,
} from '@/lib/client-auth';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial token is checked

  // ── On mount: hydrate from localStorage ──────────────────────────────────
  useEffect(() => {
    const stored = getToken();
    if (stored && isTokenValid(stored)) {
      const payload = decodeToken(stored);
      setTokenState(stored);
      setUser(payload);
    } else if (stored) {
      // Expired token — purge it
      clearToken();
    }
    setLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setTokenState(data.token);
    setUser(decodeToken(data.token));
    return data;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (email, password, name) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setToken(data.token);
    setTokenState(data.token);
    setUser(decodeToken(data.token));
    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
