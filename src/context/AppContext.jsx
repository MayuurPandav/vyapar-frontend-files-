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
    expenses: [],
    offers: [],
    accounts: [],
    bankAccounts: [],
    cheques: [],
    settings: {}
  });

  const [systemNotifications, setSystemNotifications] = useState([]);
  const [myBroadcasts, setMyBroadcasts] = useState([]);
  const [broadcastBanner, setBroadcastBanner] = useState(null);

  const fetchMyNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/notifications/my?username=${encodeURIComponent(user.username)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const list = data.notifications || [];
          const formatted = list.map(n => ({
            id: n._id,
            title: n.title,
            body: n.message,
            type: 'broadcast',
            read: n.read,
            createdAt: n.createdAt
          }));
          setMyBroadcasts(formatted);

          // Pop up alert for new unread messages
          const storageKey = `seen_notifs_${user.username}`;
          let seenIds = [];
          try {
            seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
          } catch (e) {}

          const newUnread = list.filter(n => !n.read && !seenIds.includes(String(n._id)));
          if (newUnread.length > 0) {
            const updatedSeen = [...seenIds, ...newUnread.map(n => String(n._id))];
            localStorage.setItem(storageKey, JSON.stringify(updatedSeen));

            newUnread.forEach(notif => {
              window.alert(`📢 Broadcast Message:\n\nTitle: ${notif.title}\n\n${notif.message}`);
              // Auto ack read
              fetch('/api/admin/notifications/ack/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, notificationId: notif._id })
              }).catch(err => console.error('Error auto-ack read:', err));
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching my notifications:', err);
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    const role = (user.role || '').toString().toLowerCase().replace(/[-_]/g, '');
    if (role === 'superadmin') return;

    fetchMyNotifications();
    const interval = setInterval(fetchMyNotifications, 15000);
    return () => clearInterval(interval);
  }, [token, user]);

  // Custom Alert & Confirm Modals State
  const [confirmModal, setConfirmModal] = useState(null); // { message, resolve }
  const [alertModal, setAlertModal] = useState(null); // { message, resolve }

  // Override native alert and confirm dialogs
  useEffect(() => {
    window.confirm = (message) => {
      return new Promise((resolve) => {
        setConfirmModal({ message, resolve });
      });
    };

    window.alert = (message) => {
      return new Promise((resolve) => {
        setAlertModal({ message, resolve });
      });
    };
  }, []);

  const handleConfirmClose = (value) => {
    if (confirmModal && confirmModal.resolve) {
      confirmModal.resolve(value);
    }
    setConfirmModal(null);
  };

  const handleAlertClose = () => {
    if (alertModal && alertModal.resolve) {
      alertModal.resolve();
    }
    setAlertModal(null);
  };

  // Auto load DB on login/startup/navigation
  useEffect(() => {
    if (token && user) {
      const normalizeRole = (r) => (r || '').toString().toLowerCase().replace(/[-_]/g, '');
      if (normalizeRole(user.role) !== 'deliveryboy') {
        loadDB();
        loadSystemNotifications();
      }
    }
  }, [token, user, currentView]);

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
        const defaultAccounts = [
          { id: 'acc-1', name: 'Cash in Hand (Asset)', type: 'Asset', description: 'Physical cash on hand', isSystem: true, openingBalance: 0 },
          { id: 'acc-2', name: 'Bank Account (Asset)', type: 'Asset', description: 'Company main bank account', isSystem: true, openingBalance: 0 },
          { id: 'acc-3', name: 'Accounts Receivable (Asset)', type: 'Asset', description: 'Amounts owed by customers', isSystem: true, openingBalance: 0 },
          { id: 'acc-4', name: 'Accounts Payable (Liability)', type: 'Liability', description: 'Amounts owed to suppliers', isSystem: true, openingBalance: 0 },
          { id: 'acc-5', name: 'Sales Revenue (Income)', type: 'Income', description: 'Revenue from sales of products', isSystem: true, openingBalance: 0 },
          { id: 'acc-6', name: 'Cost of Goods Sold (Expense)', type: 'Expense', description: 'Direct costs of goods sold', isSystem: true, openingBalance: 0 },
          { id: 'acc-7', name: 'Petty Cash (Asset)', type: 'Asset', description: 'Physical cash held for minor expenses', isSystem: true, openingBalance: 0 }
        ];
        let accounts = data.accounts || [];
        if (accounts.length === 0) {
          accounts = defaultAccounts;
        } else {
          if (!accounts.some(a => a.name === 'Petty Cash (Asset)')) {
            accounts.push({ id: 'acc-7', name: 'Petty Cash (Asset)', type: 'Asset', description: 'Physical cash held for minor expenses', isSystem: true, openingBalance: 0 });
          }
        }
        data.accounts = accounts;
        
        if (!data.bankAccounts || data.bankAccounts.length === 0) {
          data.bankAccounts = [
            { id: 'bank-1', accountName: 'Bank Account (Asset)', bankName: 'State Bank of India', accountNumber: 'XXXX1234', ifscCode: 'SBIN0001234', branchName: 'MG Road Branch', openingBalance: 10000 }
          ];
        }
        setDbData(data);
        setSyncStatus('Sync OK');
        loadSystemNotifications(data.settings);
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
        loadSystemNotifications(updatedData.settings);
      } else {
        setSyncStatus('Sync Error');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Sync Error');
    }
  };

  // Load SaaS messages and maintenance configs
  const loadSystemNotifications = async (currentSettings = null) => {
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

        const activeSettings = currentSettings || dbData.settings;
        if (activeSettings && activeSettings.subscriptionExpiry) {
          const expiryDate = new Date(activeSettings.subscriptionExpiry);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = expiryDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if ([7, 3, 1].includes(daysLeft)) {
            entries.push({
              title: '📅 Subscription Expiry Alert',
              body: `Your Vyapar subscription will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''} on ${activeSettings.subscriptionExpiry}. Please renew to avoid any service disruptions.`,
              type: 'warning'
            });
          } else if (daysLeft <= 0) {
            entries.push({
              title: '⚠️ Subscription Expired',
              body: 'Your subscription has expired. Please renew your plan in the Subscription panel to re-enable service integrations.',
              type: 'warning'
            });
          }
        }

        setSystemNotifications(entries);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Sign-In
  const handleLogin = (loginData) => {
    setToken(loginData.token);
    const augmentedUser = { ...(loginData.user || {}), profileComplete: loginData.profileComplete || false, subscription: loginData.subscription || null, onboardingRequired: !!loginData.onboardingRequired };
    const normalizeRole_local = (r) => (r || '').toString().toLowerCase().replace(/[-_]/g, '');
    const isSuper_local = normalizeRole_local(augmentedUser.role) === 'superadmin';
    const isDeliveryBoy_local = normalizeRole_local(augmentedUser.role) === 'deliveryboy';
    const isAccountant_local = normalizeRole_local(augmentedUser.role) === 'accountant';
    const isStaff_local = normalizeRole_local(augmentedUser.role) === 'staff' || normalizeRole_local(augmentedUser.role) === 'cashier';

    // Super Admin, Delivery Boy, Accountant, and Staff should not be forced into tenant onboarding/profile flows
    if (isSuper_local || isDeliveryBoy_local || isAccountant_local || isStaff_local) {
      augmentedUser.onboardingRequired = false;
    }

    setUser(augmentedUser);
    localStorage.setItem('vyapar_token', loginData.token);
    localStorage.setItem('vyapar_user', JSON.stringify(augmentedUser));

    const normalizeRole = (r) => (r || '').toString().toLowerCase().replace(/[-_]/g, '');
    const isSuper = normalizeRole(augmentedUser.role) === 'superadmin';
    const isDeliveryBoy = normalizeRole(augmentedUser.role) === 'deliveryboy';
    const isAccountant = normalizeRole(augmentedUser.role) === 'accountant';
    const isStaff = normalizeRole(augmentedUser.role) === 'staff' || normalizeRole(augmentedUser.role) === 'cashier';

    if (isSuper || isDeliveryBoy || isAccountant || isStaff) {
      setCurrentView('dashboard');
    } else {
      if (augmentedUser.onboardingRequired) {
        setCurrentView('onboarding');
      } else {
        setCurrentView('business');
      }
    }
  };

  // Derived role flags (centralized)
  const normalizeRole = (r) => (r || '').toString().toLowerCase().replace(/[-_]/g, '');
  const isSuperAdmin = normalizeRole(user && user.role) === 'superadmin';


  const updateUser = (updates) => {
    setUser(prev => {
      const nu = { ...(prev || {}), ...(updates || {}) };
      localStorage.setItem('vyapar_user', JSON.stringify(nu));
      return nu;
    });
  };

  // View as Tenant (Super Admin view-only simulation)
  const loginAsTenant = async (tenant) => {
    if (!await window.confirm(`View account: ${tenant.bizName || tenant.username}?\n\n⚠️ You will be in VIEW-ONLY mode.`)) return;
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
    localStorage.removeItem('driverToken');
    setCurrentView('dashboard');
  };

  return (
    <AppContext.Provider value={{
      token,
      user,
      viewOnly,
      currentView,
      setCurrentView,
      syncStatus,
      dbData,
      loadDB,
      saveDB,
      notifications: [...systemNotifications, ...myBroadcasts],
      broadcastBanner,
      handleLogin,
      handleLogout,
      updateUser,
      loginAsTenant,
      backToSuperAdmin,
      isSuperAdmin
    }}>
      {children}

      {/* Premium Custom Confirm Dialog */}
      {confirmModal && (
        <div className="custom-dialog-overlay" onClick={() => handleConfirmClose(false)}>
          <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="custom-dialog-card__header">
              <div className="custom-dialog-card__icon custom-dialog-card__icon--confirm">
                <i className="fas fa-circle-question"></i>
              </div>
              <h3 className="custom-dialog-card__title">Confirm Action</h3>
            </div>
            <div className="custom-dialog-card__body">
              {confirmModal.message}
            </div>
            <div className="custom-dialog-card__actions">
              <button 
                className="custom-dialog-btn" 
                onClick={() => handleConfirmClose(false)}
              >
                Cancel
              </button>
              <button 
                className={`custom-dialog-btn ${
                  confirmModal.message.toLowerCase().includes('delete') || 
                  confirmModal.message.toLowerCase().includes('purge') || 
                  confirmModal.message.toLowerCase().includes('warning') || 
                  confirmModal.message.toLowerCase().includes('remove') ||
                  confirmModal.message.toLowerCase().includes('blacklist')
                    ? 'custom-dialog-btn--danger' 
                    : 'custom-dialog-btn--primary'
                }`}
                onClick={() => handleConfirmClose(true)}
                autoFocus
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Custom Alert Dialog */}
      {alertModal && (
        <div className="custom-dialog-overlay" onClick={handleAlertClose}>
          <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="custom-dialog-card__header">
              <div className="custom-dialog-card__icon custom-dialog-card__icon--alert">
                <i className="fas fa-circle-exclamation"></i>
              </div>
              <h3 className="custom-dialog-card__title">Message</h3>
            </div>
            <div className="custom-dialog-card__body">
              {alertModal.message}
            </div>
            <div className="custom-dialog-card__actions">
              <button 
                className="custom-dialog-btn custom-dialog-btn--primary" 
                onClick={handleAlertClose}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
