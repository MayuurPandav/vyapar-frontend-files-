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
            <li style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              General
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                <i className="fas fa-chart-line"></i> SA Dashboard
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'sa-analytics' ? 'active' : ''}`} onClick={() => setCurrentView('sa-analytics')}>
                <i className="fas fa-chart-column"></i> Analytics
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'companies' ? 'active' : ''}`} onClick={() => setCurrentView('companies')}>
                <i className="fas fa-building"></i> Manage Companies
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'shop-profile' ? 'active' : ''}`} onClick={() => setCurrentView('shop-profile')}>
                <i className="fas fa-store"></i> Shop Profile
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'business-oversight' ? 'active' : ''}`} onClick={() => setCurrentView('business-oversight')}>
                <i className="fas fa-chart-pie"></i> Business Oversight
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'shops' ? 'active' : ''}`} onClick={() => setCurrentView('shops')}>
                <i className="fas fa-shop"></i> Shop Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'users' ? 'active' : ''}`} onClick={() => setCurrentView('users')}>
                <i className="fas fa-users-gear"></i> Global Users
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'user-management' ? 'active' : ''}`} onClick={() => setCurrentView('user-management')}>
                <i className="fas fa-users-between-lines"></i> User Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'global-staff' ? 'active' : ''}`} onClick={() => setCurrentView('global-staff')}>
                <i className="fas fa-users-viewfinder"></i> Global Staff
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'security-settings' ? 'active' : ''}`} onClick={() => setCurrentView('security-settings')}>
                <i className="fas fa-shield-halved"></i> Security Policies
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'roles' ? 'active' : ''}`} onClick={() => setCurrentView('roles')}>
                <i className="fas fa-user-shield"></i> Role & Permissions
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'sa-team' ? 'active' : ''}`} onClick={() => setCurrentView('sa-team')}>
                <i className="fas fa-users-cog"></i> Team Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'master-data' ? 'active' : ''}`} onClick={() => setCurrentView('master-data')}>
                <i className="fas fa-database"></i> Master Data
              </a>
            </li>
            <li style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Plan Management
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'plans' ? 'active' : ''}`} onClick={() => setCurrentView('plans')}>
                <i className="fas fa-layer-group"></i> SaaS Plans
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'payments' ? 'active' : ''}`} onClick={() => setCurrentView('payments')}>
                <i className="fas fa-receipt"></i> Payment History
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'coupons' ? 'active' : ''}`} onClick={() => setCurrentView('coupons')}>
                <i className="fas fa-tags"></i> Coupons
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'refunds' ? 'active' : ''}`} onClick={() => setCurrentView('refunds')}>
                <i className="fas fa-undo"></i> Refunds
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'revenue' ? 'active' : ''}`} onClick={() => setCurrentView('revenue')}>
                <i className="fas fa-chart-pie"></i> Revenue Reports
              </a>
            </li>
            <li style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              System
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'support-helpdesk' ? 'active' : ''}`} onClick={() => setCurrentView('support-helpdesk')}>
                <i className="fas fa-headset"></i> Support & Helpdesk
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'security-audit' ? 'active' : ''}`} onClick={() => setCurrentView('security-audit')}>
                <i className="fas fa-shield-alt"></i> Audit & Security
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'sa-data-management' ? 'active' : ''}`} onClick={() => setCurrentView('sa-data-management')}>
                <i className="fas fa-database"></i> Data Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'integrations' ? 'active' : ''}`} onClick={() => setCurrentView('integrations')}>
                <i className="fas fa-plug"></i> Integrations & API
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'platform-reports' ? 'active' : ''}`} onClick={() => setCurrentView('platform-reports')}>
                <i className="fas fa-chart-line"></i> Platform Reports
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'sa-announcements' ? 'active' : ''}`} onClick={() => setCurrentView('sa-announcements')}>
                <i className="fas fa-bullhorn"></i> Broadcast Messages
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
              <a className={`sidebar__link ${currentView === 'sales' ? 'active' : ''}`} onClick={() => setCurrentView('sales')}>
                <i className="fas fa-file-invoice-dollar"></i> Sales & Billing
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
              <a className={`sidebar__link ${currentView === 'payments' ? 'active' : ''}`} onClick={() => setCurrentView('payments')}>
                <i className="fas fa-hand-holding-dollar"></i> Payment Management
              </a>
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'transactions' ? 'active' : ''}`} onClick={() => setCurrentView('transactions')}>
                <i className="fas fa-right-left"></i> Accounting & Khata
              </a>
            </li>

            {/* Additional Features / Utilities */}
            <li style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Utilities & Admin
            </li>
            <li>
              <a className={`sidebar__link ${currentView === 'business' ? 'active' : ''}`} onClick={() => setCurrentView('business')}>
                <i className="fas fa-building"></i> Business Profile
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
