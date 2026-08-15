import React from 'react'

export default function Sidebar({ activeTab, setActiveTab, driverProfile, handleLogout, t }) {
  const getInitials = (name) => {
    if (!name) return 'RJ'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const initials = driverProfile ? getInitials(driverProfile.fullName) : 'RJ'
  const name = driverProfile ? driverProfile.fullName : 'Rahul Joshi'
  const vehicle = driverProfile ? `${driverProfile.vehicleType} Courier` : 'Bike Courier'

  return (
    <aside className="driver-sidebar" aria-label="Dashboard navigation">
      <div className="brand">
        <div className="brand-mark" aria-label="SwiftDrop Brand Mark">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="bike-logo-svg">
            <rect className="bike-topbox" x="2" y="7" width="5" height="5.5" rx="1"></rect>
            <line className="bike-topbox-strap" x1="4.5" y1="7" x2="4.5" y2="12.5"></line>
            <circle className="bike-wheel" cx="6" cy="18" r="2.5"></circle>
            <circle className="bike-wheel" cx="18" cy="18" r="2.5"></circle>
            <line className="bike-frame" x1="6" y1="18" x2="11" y2="18"></line>
            <line className="bike-frame" x1="11" y1="18" x2="9.5" y2="12.5"></line>
            <line className="bike-frame" x1="6" y1="18" x2="9.5" y2="12.5"></line>
            <line className="bike-frame" x1="9.5" y1="12.5" x2="15" y2="11"></line>
            <line className="bike-frame" x1="11" y1="18" x2="15" y2="11"></line>
            <path className="bike-frame" d="M15 11l3 7"></path>
            <path className="bike-frame" d="M14.5 11h2"></path>
            <circle className="bike-wheel" cx="11.5" cy="5" r="1.5"></circle>
            <path className="bike-frame" d="M9.5 12c0.5-2.5 1.2-4.5 2-5"></path>
            <path className="bike-frame" d="M11.5 7l3.5 4"></path>
            <path className="bike-frame" d="M9.5 12.5l2.5 2.5l-1 3"></path>
          </svg>
        </div>
        <div>
          <p>SwiftDrop</p>
          <span>{t('deliveryPartnerPanel')}</span>
        </div>
      </div>

      <nav className="nav-links">
        <a 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}
          href="#overview"
        >
          {t('overview')}
        </a>
        <a 
          className={activeTab === 'management' ? 'active' : ''} 
          onClick={(e) => { e.preventDefault(); setActiveTab('management'); }}
          href="#management"
        >
          {t('management')}
        </a>
        <a 
          className={activeTab === 'deliveryHistory' ? 'active' : ''} 
          onClick={(e) => { e.preventDefault(); setActiveTab('deliveryHistory'); }}
          href="#delivery-history"
        >
          {t('deliveryHistory')}
        </a>
        <a 
          className={activeTab === 'earningsHistory' ? 'active' : ''} 
          onClick={(e) => { e.preventDefault(); setActiveTab('earningsHistory'); }}
          href="#earnings-history"
        >
          {t('earnHistory')}
        </a>
      </nav>

      {/* Driver Card footer trigger also sets tab to profile */}
      <div 
        className="driver-card" 
        onClick={() => setActiveTab('profile')}
        title={t('personalProfile')}
        style={{ cursor: 'pointer' }}
      >
        {driverProfile && driverProfile.profilePhotoUrl ? (
          <img 
            src={driverProfile.profilePhotoUrl.startsWith('http') ? driverProfile.profilePhotoUrl : `${window.location.port === '5500' ? '' : 'http://127.0.0.1:5500'}${driverProfile.profilePhotoUrl}`}
            alt="Profile Avatar" 
            id="sidebarAvatar"
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.25)', flexShrink: 0 }}
          />
        ) : (
          <div className="avatar" id="sidebarAvatar">{initials}</div>
        )}
        <div className="driver-info">
          <strong id="sidebarDriverName">{name}</strong>
          <span id="sidebarDriverRole">{vehicle}</span>
        </div>
        {handleLogout && (
          <button 
            id="logoutBtn" 
            className="logout-btn" 
            title={t('logout') || "Log Out"} 
            aria-label="Log Out"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
          >
            <svg className="logout-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        )}
      </div>
    </aside>
  )
}
