import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { user, currentView, setCurrentView, handleLogout } = useApp();

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <aside className={`sidebar ${isSuperAdmin ? 'sa-sidebar' : ''}`}>
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon" style={{ backgroundColor: isSuperAdmin ? '#f64e60' : '' }}>
          <i className={isSuperAdmin ? 'fas fa-shield-halved' : 'fas fa-cube'}></i>
        </div>
        <span className="sidebar__logo-text">
          {isSuperAdmin ? 'MASTER CONTROL' : 'Vyapar'}
        </span>
      </div>

      <ul className="sidebar__nav">
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
              <a className={`sidebar__link ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>
                <i className="fas fa-chart-column"></i> Reports & AI
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
