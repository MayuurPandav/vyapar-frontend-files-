import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Topbar({ onSearch }) {
  const { user, syncStatus, currentView, notifications, handleLogout } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [listening, setListening] = useState(false);

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';
  const name = user.username.split('@')[0].toUpperCase();

  const handleVoiceAssistant = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('⚠️ Speech Recognition API is not supported by your current browser. Please try using Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const cmd = event.results[0][0].transcript.toLowerCase();
      setListening(false);
      
      const c = cmd.replace('please', '').replace('open', '').replace('go to', '').replace('dikhao', '').replace('chalo', '').trim();
      
      if (c.includes('dashboard') || c.includes('overview') || c.includes('home') || c.includes('main')) {
        setCurrentView('dashboard');
      } else if (c.includes('sale') || c.includes('billing') || c.includes('invoice') || c.includes('becho')) {
        setCurrentView('sales');
      } else if (c.includes('purchase') || c.includes('order') || c.includes('khareedo')) {
        setCurrentView('purchase');
      } else if (c.includes('inventory') || c.includes('stock') || c.includes('product') || c.includes('maal')) {
        setCurrentView('inventory');
      } else if (c.includes('party') || c.includes('customer') || c.includes('supplier') || c.includes('log')) {
        setCurrentView('parties');
      } else if (c.includes('financial') || c.includes('money') || c.includes('cash') || c.includes('paisa')) {
        setCurrentView('financial');
      } else if (c.includes('report') || c.includes('insight') || c.includes('analysis') || c.includes('khata')) {
        setCurrentView('reports');
      } else if (c.includes('transaction') || c.includes('history') || c.includes('ledger')) {
        setCurrentView('transactions');
      } else if (c.includes('settings') || c.includes('profile') || c.includes('business')) {
        setCurrentView('business');
      } else if (c.includes('search')) {
        const q = c.replace('search', '').replace('for', '').trim();
        setSearchValue(q);
        if (onSearch) onSearch(q);
      } else {
        alert(`🎙️ Voice Assistant heard: "${cmd}" but no matching navigation tab was found.`);
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return isSuperAdmin ? 'SA Dashboard' : 'Business Overview';
      case 'companies': return 'Manage Companies';
      case 'users': return 'Global Users';
      case 'plans': return 'SaaS Plans';
      case 'payments': return 'Payment History';
      case 'settings': return isSuperAdmin ? 'System Settings' : 'Application Settings';
      case 'business': return 'Business Profile';
      case 'sales': return 'Sales & Billing';
      case 'purchase': return 'Purchase Management';
      case 'inventory': return 'Inventory Management';
      case 'parties': return 'Party Management';
      case 'financial': return 'Financial Management';
      case 'transactions': return 'Transaction Ledger';
      case 'reports': return 'Reports & AI Insights';
      default: return 'Vyapar';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'dashboard': return isSuperAdmin ? 'Performance and growth metrics.' : "Welcome back! Here's what's happening with your store today.";
      case 'companies': return 'Business lifecycle control.';
      case 'users': return 'Administrative accounts.';
      case 'plans': return 'Fixed pricing and features.';
      case 'payments': return 'Transaction ledger.';
      case 'settings': return isSuperAdmin ? 'Global configuration.' : 'Manage your interface preferences and system security.';
      case 'business': return 'Manage your official company identity, verification status, and subscription.';
      case 'sales': return 'Create invoices, track sales, and manage billing.';
      case 'purchase': return 'Record purchases, track vendor orders, and manage procurement.';
      case 'inventory': return 'Track catalog items, categories, and low stock values.';
      case 'parties': return 'Manage customers, suppliers, and payment records.';
      case 'financial': return 'Track P&L, cash flow, expenses, and due payments.';
      case 'transactions': return 'Detailed history of all financial activities.';
      case 'reports': return 'Financial reports, analytics, and AI-powered recommendations.';
      default: return '';
    }
  };

  return (
    <header className={`topbar ${isSuperAdmin ? 'sa-topbar' : ''}`}>
      <button className="btn--icon mobile-menu-btn" id="mobile-menu-toggle" style={{ display: 'none', marginRight: '12px' }}>
        <i className="fas fa-bars"></i>
      </button>

      {isSuperAdmin ? (
        // Super Admin Header info
        <div className="topbar__left">
          <h1 id="view-title">{getTitle()}</h1>
          <p id="view-subtitle">{getSubtitle()}</p>
        </div>
      ) : (
        // Regular Admin Search Bar
        <div className="topbar__search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search products, invoices, customers..."
            value={searchValue}
            onChange={handleSearchChange}
            style={{ paddingRight: '40px' }}
          />
          <button 
            id="voice-assistant-btn" 
            title="AI Voice Assistant" 
            onClick={handleVoiceAssistant}
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: listening ? '#ef4444' : 'var(--text-3)', 
              padding: '4px',
              animation: listening ? 'pulseIcon 1.5s infinite ease-in-out' : 'none'
            }}
          >
            <i className="fas fa-microphone"></i>
          </button>
        </div>
      )}

      <div className="topbar__right" style={{ position: 'relative' }}>
        {/* Sync Indicator */}
        {!isSuperAdmin && (
          <div id="sync-status" style={{ display: 'flex', fontSize: '12px', marginRight: '15px', alignItems: 'center', gap: '6px' }}>
            <i className={syncStatus.includes('Syncing') ? 'fas fa-spinner fa-spin' : syncStatus.includes('Error') ? 'fas fa-times-circle' : 'fas fa-check-circle'} style={{ color: syncStatus.includes('Error') ? 'var(--red)' : syncStatus.includes('Sync OK') ? 'var(--green)' : 'var(--yellow)' }}></i>
            {syncStatus}
          </div>
        )}

        {/* Notifications Icon & Panel */}
        {!isSuperAdmin && (
          <>
            <button className="topbar__bell" onClick={() => setPanelOpen(!panelOpen)}>
              <i className="far fa-bell"></i>
              {notifications.length > 0 && <span className="topbar__bell-dot"></span>}
            </button>
            {panelOpen && (
              <div id="notification-panel" style={{ position: 'absolute', top: '56px', right: '60px', width: '320px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 18px 50px rgba(15,23,42,.15)', zIndex: 250, padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <strong>Notifications</strong>
                  <button className="btn--icon" onClick={() => setPanelOpen(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div id="notification-content" style={{ maxHeight: '300px', overflowY: 'auto', color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.55' }}>
                  {notifications.length === 0 ? (
                    'No notifications available.'
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} style={{ borderRadius: '12px', padding: '12px', marginBottom: '10px', backgroundColor: n.type === 'warning' ? '#fff4e5' : '#eef6ff', border: `1px solid ${n.type === 'warning' ? '#fde8c3' : '#dbeafe'}` }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px' }}>{n.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{n.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Profile Card & Dropdown */}
        <div className="topbar__profile" onClick={() => setDropdownOpen(!dropdownOpen)} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={`https://ui-avatars.com/api/?name=${name}&background=${isSuperAdmin ? 'f64e60' : '10b981'}&color=fff&size=64`}
            className="topbar__avatar"
            alt={name}
          />
          <span className="topbar__name">{isSuperAdmin ? 'Master Admin' : name}</span>
          <i className="fas fa-chevron-down" style={{ fontSize: '10px', color: 'var(--text-3)' }}></i>

          {dropdownOpen && (
            <div id="profile-dropdown" style={{ position: 'absolute', top: '100%', right: 0, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow)', minWidth: '150px', zIndex: 100, marginTop: '8px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}>
                {isSuperAdmin ? 'Master Suite' : 'Admin Account'}
              </div>
              <a href="#" onClick={handleLogout} style={{ display: 'block', padding: '12px 16px', color: '#ef4444', textDecoration: 'none', fontSize: '14px' }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i> Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
