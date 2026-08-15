import React, { useEffect, useRef } from 'react'

export default function SettingsSidebar({ 
  showSettings, 
  setShowSettings, 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  baseCommission, 
  setBaseCommission, 
  handleSeedData, 
  t 
}) {
  const sidebarRef = useRef(null)

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Exclude clicking the settings button itself to prevent double toggling
        const toggleBtn = document.getElementById('settingsToggleBtn')
        if (toggleBtn && toggleBtn.contains(event.target)) return
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettings])

  return (
    <>
      {/* Settings Backdrop blur */}
      <div 
        className={`settings-backdrop ${showSettings ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(4px)',
          zIndex: 1400,
          opacity: showSettings ? 1 : 0,
          pointerEvents: showSettings ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={() => setShowSettings(false)}
      />

      <div 
        ref={sidebarRef}
        id="settingsSidebar" 
        className={`settings-sidebar ${showSettings ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '350px',
          height: '100vh',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          zIndex: 1500,
          display: 'flex',
          flexDirection: 'column',
          transform: showSettings ? 'translateX(0)' : 'translateX(350px)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: 1
        }}
      >
        <div 
          className="settings-sidebar-header"
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>System Settings</h2>
          <button 
            id="settingsCloseBtn" 
            onClick={() => setShowSettings(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div 
          className="settings-sidebar-content" 
          style={{
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto'
          }}
        >
          {/* Language Selection */}
          <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('language')}</span>
            <select 
              id="languageSelect" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                minHeight: '40px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--body-bg)',
                color: 'var(--text-color)',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>

          {/* Theme Selector Button */}
          <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('theme')}</span>
            <button 
              id="themeToggle" 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                width: '100%',
                minHeight: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--body-bg)',
                color: 'var(--text-color)',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize'
              }}
              type="button"
            >
              {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
            </button>
          </div>

          {/* Base Commission rate */}
          <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('baseCommission')}</span>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--muted)' }}>Rs.</span>
              <input 
                id="commissionInput" 
                type="number" 
                value={baseCommission}
                disabled
                style={{
                  width: '100%',
                  minHeight: '40px',
                  padding: '0 12px 0 40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg-hover)',
                  color: 'var(--muted)',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'not-allowed'
                }}
              />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Managed by system administrator
            </span>
          </div>

          {/* Data Seeder Sync Section */}
          <div 
            className="settings-group" 
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('databaseSync')}</span>
            <button 
              id="seedBtn" 
              onClick={handleSeedData}
              style={{
                width: '100%',
                minHeight: '42px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              type="button"
            >
              {t('loadDemoData')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
