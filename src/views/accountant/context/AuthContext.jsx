import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vyapar_token') || localStorage.getItem('token');
    const userData = localStorage.getItem('vyapar_user');
    if (token) {
      if (userData) {
        try {
          setUser(JSON.parse(userData));
          setLoading(false);
          return;
        } catch (e) {}
      }
      api.get('/auth/me').then(res => setUser(res.data.data)).catch(() => { localStorage.removeItem('vyapar_token'); }).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('vyapar_token', res.data.data.token);
    localStorage.setItem('vyapar_user', JSON.stringify(res.data.data.user));
    setUser(res.data.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vyapar_token');
    localStorage.removeItem('vyapar_user');
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
