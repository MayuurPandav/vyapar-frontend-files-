import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { user, currentView, setCurrentView, handleLogout, isSuperAdmin } = useApp();
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

  if (!user) return null;

  // `isSuperAdmin` comes from context (normalized role)

  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current;
      if (!container) return setIndicatorStyle(s => ({ ...s, opacity: 0 }));
      const active = container.querySelector('.sidebar__link.active');
      if (!active) return setIndicatorStyle(s => ({ ...s, opacity: 0 }));
      const contRect = container.getBoundingClientRect();
      const actRect = active.getBoundingClientRect();
      const top = actRect.top - contRect.top + container.scrollTop;
      setIndicatorStyle({ top: top + 12, height: actRect.height - 12, opacity: 1 });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    const obs = (containerRef.current && new MutationObserver(updateIndicator));
    if (obs && containerRef.current) {
      obs.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
    }
    return () => {
      window.removeEventListener('resize', updateIndicator);
      if (obs) obs.disconnect();
    };
  }, [currentView]);

  return (
    <aside className={`sidebar ${isSuperAdmin ? 'sa-sidebar' : ''}`}>
      <div className="sidebar__indicator" style={{ top: indicatorStyle.top, height: indicatorStyle.height, opacity: indicatorStyle.opacity }} />
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon" style={{ backgroundColor: isSuperAdmin ? '#f64e60' : '' }}>
          <i className={isSuperAdmin ? 'fas fa-shield-halved' : 'fas fa-cube'}></i>
        </div>
        <span className="sidebar__logo-text">
          {isSuperAdmin ? 'MASTER CONTROL' : 'Vyapar'}
        </span>
      </div>

      <ul className="sidebar__nav" ref={containerRef}>
        {isSuperAdmin ? (
          // Super Admin Navigation
          <>
            <li>
              <a className={`sidebar__link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                <i className="fas fa-chart-line"></i> SA Dashboard
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'companies' ? 'active' : ''}`} onClick={() => setCurrentView('companies')}>
                <i className="fas fa-building"></i> Manage Companies
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'users' ? 'active' : ''}`} onClick={() => setCurrentView('users')}>
                <i className="fas fa-users-gear"></i> Global Users
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'plans' ? 'active' : ''}`} onClick={() => setCurrentView('plans')}>
                <i className="fas fa-bolt"></i> SaaS Plans
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'payments' ? 'active' : ''}`} onClick={() => setCurrentView('payments')}>
                <i className="fas fa-receipt"></i> Payment History
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}>
                  <i className="fas fa-cog"></i> System Settings
                </a>
            </li>
          </>
        ) : (
          // Regular Admin Navigation
          <>
            <li>
              <a className={`sidebar__link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                <i className="fas fa-th-large"></i> Dashboard
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'business' ? 'active' : ''}`} onClick={() => setCurrentView('business')}>
                <i className="fas fa-building"></i> Business Profile
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'sales' ? 'active' : ''}`} onClick={() => setCurrentView('sales')}>
                <i className="fas fa-file-invoice-dollar"></i> Sales & Billing
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'invoices' ? 'active' : ''}`} onClick={() => setCurrentView('invoices')}>
                <i className="fas fa-receipt"></i> Invoices
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'delivery' ? 'active' : ''}`} onClick={() => setCurrentView('delivery')}>
                <i className="fas fa-truck"></i> Delivery
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'barcodes' ? 'active' : ''}`} onClick={() => setCurrentView('barcodes')}>
                <i className="fas fa-barcode"></i> Barcodes & QR
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'purchase' ? 'active' : ''}`} onClick={() => setCurrentView('purchase')}>
                <i className="fas fa-cart-shopping"></i> Purchase
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => setCurrentView('inventory')}>
                <i className="fas fa-boxes-stacked"></i> Inventory
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'parties' ? 'active' : ''}`} onClick={() => setCurrentView('parties')}>
                <i className="fas fa-users"></i> Parties
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'financial' ? 'active' : ''}`} onClick={() => setCurrentView('financial')}>
                <i className="fas fa-indian-rupee-sign"></i> Financial
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'transactions' ? 'active' : ''}`} onClick={() => setCurrentView('transactions')}>
                <i className="fas fa-right-left"></i> Transactions
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'gst' ? 'active' : ''}`} onClick={() => setCurrentView('gst')}>
                <i className="fas fa-file-invoice"></i> GST & Taxes
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'expenses' ? 'active' : ''}`} onClick={() => setCurrentView('expenses')}>
                <i className="fas fa-money-bill-transfer"></i> Expenses
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'offers' ? 'active' : ''}`} onClick={() => setCurrentView('offers')}>
                <i className="fas fa-tags"></i> Offers & Discounts
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'notifications' ? 'active' : ''}`} onClick={() => setCurrentView('notifications')}>
                <i className="fas fa-bell"></i> Notifications
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>
                <i className="fas fa-chart-column"></i> Reports & AI
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'data' ? 'active' : ''}`} onClick={() => setCurrentView('data')}>
                <i className="fas fa-database"></i> Data Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'staff' ? 'active' : ''}`} onClick={() => setCurrentView('staff')}>
                <i className="fas fa-user-tie"></i> Staff Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'subscription' ? 'active' : ''}`} onClick={() => setCurrentView('subscription')}>
                <i className="fas fa-star"></i> Subscription
              </a>
            </li>
          </>
        )}
      </ul>

      <div className="sidebar__footer" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {!isSuperAdmin && (
          <a className={`sidebar__link ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}>
            <i className="fas fa-gear"></i> Settings
          </a>
        )}
        <a className="sidebar__link" onClick={handleLogout} style={{ color: '#ef4444', cursor: 'pointer' }}>
          <i className="fas fa-sign-out-alt" style={{ color: '#ef4444' }}></i> Logout
        </a>
      </div>
    </aside>
  );
}
