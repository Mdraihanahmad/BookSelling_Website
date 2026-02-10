import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setAuthToken(token);

    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, reload: loadMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
