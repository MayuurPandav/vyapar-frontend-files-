import React, { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell.jsx'
import ThemeToggle from '../../components/ThemeToggle'

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

      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeToggle />
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
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#38bdf8',
            transition: 'all 0.2s ease',
            marginLeft: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="settings-cog-svg" style={{ stroke: '#38bdf8' }}>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
  )
}
