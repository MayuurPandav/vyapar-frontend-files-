import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = (user?.name || 'Staff').toUpperCase();

  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/admin/notifications/my?username=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const list = data.notifications || [];
          setNotifications(list);

          // Pop up toast for any new unread notification that we haven't seen in this session
          const storageKey = `seen_staff_notifs_${user.email}`;
          let seenIds = [];
          try {
            seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
          } catch (e) {}

          const newUnread = list.filter(n => !n.read && !seenIds.includes(String(n._id)));
          if (newUnread.length > 0) {
            const updatedSeen = [...seenIds, ...newUnread.map(n => String(n._id))];
            localStorage.setItem(storageKey, JSON.stringify(updatedSeen));

            newUnread.forEach(notif => {
              toast.info(`📢 Broadcast:\n${notif.title}\n${notif.message}`, {
                duration: 6000,
                position: 'top-right'
              });
              
              // Auto ack read
              fetch('/api/admin/notifications/ack/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.email, notificationId: notif._id })
              }).catch(err => console.error('Error auto-ack read:', err));
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff notifications:', err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await fetch('/api/admin/notifications/ack/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.email, notificationId: notif._id })
        });
        fetchNotifications();
      } catch (err) {
        console.error('Failed to ack notification:', err);
      }
    }
  };

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div className="topbar__search">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search products, invoices, customers..."
          readOnly
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div className="topbar__right" style={{ position: 'relative' }}>
        <button
          className="topbar__bell"
          onClick={() => setPanelOpen(!panelOpen)}
          style={{ position: 'relative' }}
        >
          <i className="far fa-bell"></i>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%'
            }}></span>
          )}
        </button>

        {panelOpen && (
          <div style={{
            position: 'absolute',
            top: '56px',
            right: '120px',
            width: '320px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '14px',
            boxShadow: '0 18px 50px rgba(15,23,42,.15)',
            zIndex: 250,
            padding: '14px',
            color: 'var(--text-1, #1e293b)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong style={{ fontSize: '15px' }}>Staff Notifications</strong>
              <button
                className="btn--icon"
                onClick={() => setPanelOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.5' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3, #64748b)' }}>
                  No notifications available.
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={i}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      borderRadius: '10px',
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: n.read ? 'var(--bg-input, #f8fafc)' : '#eef6ff',
                      border: `1px solid ${n.read ? 'var(--border, #e2e8f0)' : '#dbeafe'}`,
                      cursor: n.read ? 'default' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{n.title}</span>
                      {!n.read && <span style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span>}
                    </div>
                    <div style={{ color: 'var(--text-2, #475569)', marginTop: '4px' }}>{n.message}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3, #94a3b8)', marginTop: '6px' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div
          className="topbar__profile"
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${name}&background=10b981&color=fff&size=64`}
            className="topbar__avatar"
            alt={name}
          />
          <span className="topbar__name">{name} ({user?.role?.replace('_', ' ').toUpperCase()})</span>
        </div>

        <button
          onClick={onLogout}
          className="topbar__bell"
          style={{ color: '#ef4444', marginLeft: '8px' }}
          title="Logout"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
