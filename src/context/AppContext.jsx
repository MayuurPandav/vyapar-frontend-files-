import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Authentication & Session States
  const [token, setToken] = useState(() => localStorage.getItem('vyapar_token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('vyapar_user');
    return u ? JSON.parse(u) : null;
  });
  const [viewOnly, setViewOnly] = useState(() => localStorage.getItem('vyapar_view_only') === 'true');
  const [currentView, setCurrentView] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState('Sync OK');

  // Ledger cache matching vanilla DB
  const [dbData, setDbData] = useState({
    products: [],
    sales: [],
    purchases: [],
    parties: [],
    transactions: [],
    settings: {}
  });

  const [notifications, setNotifications] = useState([]);
  const [broadcastBanner, setBroadcastBanner] = useState(null);

  // Auto load DB on login/startup
  useEffect(() => {
    if (token && user) {
      loadDB();
      loadSystemNotifications();
    }
  }, [token, user]);

  // Load Database from Express Server
  const loadDB = async () => {
    if (!user) return;
    setSyncStatus('Syncing...');
    try {
      const res = await fetch(`/api/db?username=${encodeURIComponent(user.username)}`);
      if (res.ok) {
        const data = await res.json();
        // Parse items JSON in sales if format is string
        if (data.sales) {
          data.sales.forEach(s => {
            if (typeof s.items === 'string') {
              try { s.items = JSON.parse(s.items); } catch { s.items = []; }
            }
          });
        }
        setDbData(data);
        setSyncStatus('Sync OK');
      } else {
        setSyncStatus('Sync Error');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Sync Error');
    }
  };

  // Persist Database Changes to Express Backend
  const saveDB = async (updatedData) => {
    if (viewOnly) {
      console.warn('⛔ View-Only Mode: Save blocked.');
      return;
    }
    setSyncStatus('Syncing...');
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, username: user.username })
      });
      if (res.ok) {
        setDbData(updatedData);
        setSyncStatus('Sync OK');
      } else {
        setSyncStatus('Sync Error');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Sync Error');
    }
  };

  // Load SaaS messages and maintenance configs
  const loadSystemNotifications = async () => {
    try {
      const res = await fetch('/api/super/config');
      if (res.ok) {
        const config = await res.json();
        const entries = [];

        if (config.maintenance_mode === 'true' || config.maintenance_message) {
          let msg = config.maintenance_message || 'System maintenance in progress.';
          if (config.maintenance_schedule) msg = `Maintenance: ${config.maintenance_schedule}. ${msg}`;
          entries.push({ title: 'Maintenance Notice', body: msg, type: 'warning' });
        }

        if (config.broadcast_message && config.broadcast_message.trim()) {
          const dismissed = localStorage.getItem('dismissed_broadcast') || '';
          if (dismissed !== config.broadcast_message.trim()) {
            entries.push({ title: 'Announcement', body: config.broadcast_message.trim(), type: 'info' });
          }
        }
        setNotifications(entries);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Sign-In
  const handleLogin = (loginData) => {
    setToken(loginData.token);
    setUser(loginData.user);
    localStorage.setItem('vyapar_token', loginData.token);
    localStorage.setItem('vyapar_user', JSON.stringify(loginData.user));
    if (loginData.user.role === 'super_admin') {
      setCurrentView('dashboard');
    } else {
      localStorage.setItem('vyapar_redirect_profile', 'true');
      setCurrentView('business');
    }
  };

  // View as Tenant (Super Admin view-only simulation)
  const loginAsTenant = (tenant) => {
    if (!window.confirm(`View account: ${tenant.bizName || tenant.username}?\n\n⚠️ You will be in VIEW-ONLY mode.`)) return;
    const tokenStr = 'mongo_token_' + tenant.username;
    const userObj = { username: tenant.username, role: tenant.role, phone: tenant.phone, status: tenant.status };
    
    setToken(tokenStr);
    setUser(userObj);
    setViewOnly(true);
    localStorage.setItem('vyapar_token', tokenStr);
    localStorage.setItem('vyapar_user', JSON.stringify(userObj));
    localStorage.setItem('vyapar_view_only', 'true');
    
    setCurrentView('dashboard');
  };

  // Back to Super Admin
  const backToSuperAdmin = () => {
    localStorage.removeItem('vyapar_view_only');
    localStorage.removeItem('vyapar_token');
    localStorage.removeItem('vyapar_user');
    
    // Restore Super Admin Session
    const saToken = 'super_admin_session';
    const saUser = { username: 'master@vyapar.com', role: 'super_admin' };
    
    setToken(saToken);
    setUser(saUser);
    setViewOnly(false);
    localStorage.setItem('vyapar_token', saToken);
    localStorage.setItem('vyapar_user', JSON.stringify(saUser));
    setCurrentView('dashboard');
  };

  // Sign-Out
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setViewOnly(false);
    localStorage.removeItem('vyapar_token');
    localStorage.removeItem('vyapar_user');
    localStorage.removeItem('vyapar_view_only');
    localStorage.removeItem('vyapar_redirect_profile');
    setCurrentView('dashboard');
  };

  return (
    <AppContext.Provider value={{
      token,
      user,
      viewOnly,
      currentView,
      syncStatus,
      dbData,
      notifications,
      setCurrentView,
      setDbData,
      loadDB,
      saveDB,
      handleLogin,
      loginAsTenant,
      backToSuperAdmin,
      handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
