import React, { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell.jsx'

export default function Topbar({ t, notifications, setNotifications, unreadCount, bellShake, setShowSettings }) {
  const [currentDateStr, setCurrentDateStr] = useState('')

  useEffect(() => {
    const updateDateTime = () => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      const today = new Date()
      setCurrentDateStr(today.toLocaleDateString(undefined, options))
    }
    updateDateTime()
    const timer = setInterval(updateDateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="driver-topbar">
      <div>
        <p className="eyebrow">{t('today')}</p>
        <h1>{t('deliveryDashboard')}</h1>
        <span id="currentDate">{currentDateStr || t('loadingDate')}</span>
      </div>

      <div className="top-actions" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Glowing / Shaking Notification Bell */}
        <NotificationBell 
          notifications={notifications}
          setNotifications={setNotifications}
          unreadCount={unreadCount}
          bellShake={bellShake}
          t={t}
        />

        {/* Dynamic settings cog toggle */}
        <button 
          id="settingsToggleBtn" 
          className="settings-toggle-btn"
          onClick={() => setShowSettings(true)}
          type="button" 
          aria-label="Settings"
          style={{
            background: 'var(--card-bg-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-color)',
            transition: 'all 0.2s ease',
            marginLeft: '12px'
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="settings-cog-svg">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
  )
}
