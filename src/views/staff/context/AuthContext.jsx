import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useData } from './DataContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { findUserByEmail, addLoginEvent, addUser, updateUser: updateUserRecord, users, refreshData } = useData();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staffDashboardToken') || localStorage.getItem('vyapar_token');
    const userData = localStorage.getItem('staffDashboardUser') || localStorage.getItem('vyapar_user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser({ username: userData });
      }
    }
    setLoading(false);
  }, []);

  const updateLocalUser = (data) => {
    localStorage.setItem('staffDashboardUser', JSON.stringify(data));
    setUser(data);
  };

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('staffDashboardToken', data.token);
      updateLocalUser(data);
      addLoginEvent({ userId: data._id, device: navigator.userAgent, ip: '127.0.0.1' });
      await refreshData();
      toast.success('Login successful');
      return true;
    } catch (error) {
      const localUser = findUserByEmail(credentials.email);
      if (localUser && localUser.password === credentials.password) {
        const token = `local-${Date.now()}`;
        localStorage.setItem('staffDashboardToken', token);
        updateLocalUser(localUser);
        addLoginEvent({ userId: localUser._id, device: navigator.userAgent, ip: '127.0.0.1' });
        await refreshData();
        toast.success('Logged in locally');
        return true;
      }
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('staffDashboardToken', data.token);
      updateLocalUser(data);
      await refreshData();
      toast.success('Registration successful');
      return true;
    } catch (error) {
      const existing = users.find((item) => item.email.toLowerCase() === payload.email.toLowerCase());
      if (existing) {
        toast.error('Email already in use');
        return false;
      }
      const userToSave = {
        _id: `user-${Date.now()}`,
        ...payload,
        role: 'staff',
        joiningDate: new Date().toISOString(),
        permissions: {
          canDiscount: false,
          canViewAllInvoices: false,
          canEditInventory: false,
          canManageDelivery: false,
        },
      };
      addUser(userToSave);
      localStorage.setItem('staffDashboardToken', `local-${Date.now()}`);
      updateLocalUser(userToSave);
      toast.success('Registered locally');
      return true;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset instructions sent to your email');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send reset link');
      return false;
    }
  };

  const updateProfile = async (payload) => {
    try {
      const { data } = await api.put('/profile', payload);
      updateLocalUser({ ...user, ...data });
      updateUserRecord(user._id, { ...user, ...data });
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      updateLocalUser({ ...user, ...payload });
      updateUserRecord(user._id, { ...user, ...payload });
      toast.success('Profile updated locally');
      return true;
    }
  };

  const [loginHistory, setLoginHistory] = useState([]);

  const fetchLoginHistory = async () => {
    try {
      const { data } = await api.get('/auth/login-history');
      setLoginHistory(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch login history', error);
      return [];
    }
  };

  const changePassword = async (payload) => {
    if (user && user.password && payload.currentPassword !== user.password) {
      toast.error('Current password is incorrect');
      return false;
    }
    if (payload.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return false;
    }
    try {
      await api.put('/profile/change-password', payload);
      updateUserRecord(user._id, { ...user, password: payload.newPassword });
      updateLocalUser({ ...user, password: payload.newPassword });
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      updateUserRecord(user._id, { ...user, password: payload.newPassword });
      updateLocalUser({ ...user, password: payload.newPassword });
      toast.success('Password changed locally');
      return true;
    }
  };

  const logout = () => {
    localStorage.removeItem('staffDashboardToken');
    localStorage.removeItem('staffDashboardUser');
    localStorage.removeItem('vyapar_token');
    localStorage.removeItem('vyapar_user');
    setUser(null);
    setLoginHistory([]);
    toast.success('Logged out');
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPassword, updateProfile, changePassword, logout, loginHistory, fetchLoginHistory }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    console.warn("useAuth context is undefined or null! Using fallback from localStorage.");
    const storedUser = localStorage.getItem('vyapar_user') || localStorage.getItem('staffDashboardUser');
    let parsedUser = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (e) {
        parsedUser = { username: storedUser };
      }
    }
    return {
      user: parsedUser,
      loading: false,
      login: async () => true,
      register: async () => true,
      forgotPassword: async () => true,
      updateProfile: async () => true,
      changePassword: async () => true,
      logout: () => {
        localStorage.removeItem('staffDashboardToken');
        localStorage.removeItem('staffDashboardUser');
        localStorage.removeItem('vyapar_token');
        localStorage.removeItem('vyapar_user');
        window.location.reload();
      },
      loginHistory: [],
      fetchLoginHistory: async () => []
    };
  }
  return context;
};

