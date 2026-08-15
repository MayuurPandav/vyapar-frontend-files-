import React, { useState, useEffect, useRef } from 'react'

export default function NotificationBell({ notifications, setNotifications, unreadCount, bellShake, t }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
    setDropdownOpen(false)
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        id="notificationBellBtn" 
        className={`notification-bell-btn ${unreadCount > 0 ? 'active-glow' : ''} ${bellShake ? 'shake' : ''}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        type="button" 
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'var(--card-bg-hover)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: unreadCount > 0 ? '#e11d48' : 'var(--text-color)',
          transition: 'all 0.2s ease'
        }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="bell-icon-svg">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span 
            id="notificationBadge" 
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#e11d48',
              color: 'white',
              borderRadius: '50%',
              fontSize: '10px',
              fontWeight: 'bold',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--body-bg)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {dropdownOpen && (
        <div 
          id="notificationDropdown" 
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: '56px',
            right: 0,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '320px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-hover)' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                Mark Read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                No active notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={async () => {
                    if (!notif.read && notif.id !== 'default-1') {
                      try {
                        const username = localStorage.getItem('vyapar_user') 
                          ? JSON.parse(localStorage.getItem('vyapar_user')).username 
                          : (localStorage.getItem('driver_profile') ? JSON.parse(localStorage.getItem('driver_profile')).employeeId : '');
                        if (username) {
                          await fetch('/api/admin/notifications/ack/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, notificationId: notif.id })
                          });
                        }
                      } catch (e) {
                        console.error(e);
                      }
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                    borderLeft: notif.read ? 'none' : '3px solid var(--primary-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: notif.read ? 'default' : 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: notif.type === 'success' ? '#10b981' : notif.type === 'error' ? '#ef4444' : 'var(--text-color)' }}>
                      {notif.title}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                      {new Date(notif.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>{notif.text}</p>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', textAlign: 'center', background: 'var(--card-bg-hover)' }}>
              <button 
                onClick={handleClearAll} 
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
              >
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
