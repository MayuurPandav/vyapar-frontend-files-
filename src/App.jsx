import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './views/Login';
import Onboarding from './views/Onboarding';
import Dashboard from './views/Dashboard';
import SuperAdmin from './views/SuperAdmin';
import Delivery from './views/Delivery';
import Barcodes from './views/Barcodes';
import Reports from './views/Reports';
import Offers from './views/Offers';
import Notifications from './views/Notifications';
import DataManagement from './views/DataManagement';


function AppContent() {
  const { token, user, viewOnly, backToSuperAdmin, isSuperAdmin, currentView } = useApp();
  const [globalSearch, setGlobalSearch] = React.useState('');

  // 1. If not logged in, render the login view
  if (!token || !user) {
    return <Login />;
  }

  // 1.5 If user needs onboarding (profile + subscription), show onboarding
  if (user && user.onboardingRequired) {
    return <Onboarding />;
  }

  // `isSuperAdmin` is provided by AppContext (normalizes role strings)



  return (
    <div className="app">
      {/* Global Sidebar (adapts automatically to regular vs super admin tabs) */}
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Simulating Tenant Session Warning Banner */}
        {viewOnly && (
          <div 
            style={{ 
              background: 'linear-gradient(90deg, #f59e0b, #d97706)', 
              color: '#fff', 
              padding: '12px 24px', 
              fontWeight: 'bold', 
              fontSize: '14px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              boxShadow: '0 4px 12px rgba(245,158,11,0.2)', 
              zIndex: 1000, 
              marginLeft: '250px' 
            }}
          >
            <span>
              <i className="fas fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
              ⛔ VIEW-ONLY SIMULATION: Simulated Tenant Session (<b>{user.username}</b>). All mutation edits are blocked.
            </span>
            <button 
              className="btn btn--sm" 
              style={{ 
                backgroundColor: '#fff', 
                color: '#d97706', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold', 
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }} 
              onClick={backToSuperAdmin}
            >
              <i className="fas fa-arrow-left"></i> Exit Simulator & Return to Master Control
            </button>
          </div>
        )}

        {/* Core Layout Routing */}
        {isSuperAdmin && !viewOnly ? (
          // Master Admin views
          <SuperAdmin />
        ) : (
          // Regular Admin & simulated tenant views
          <main className="main">
            <Topbar onSearch={setGlobalSearch} />
            {/** render view based on currentView state (dashboard default) */}
            {(() => {
              switch (currentView) {
                case 'delivery': return <Delivery />;
                case 'barcodes': return <Barcodes />;
                case 'reports': return <Reports />;
                case 'offers': return <Offers />;
                case 'notifications': return <Notifications />;
                case 'data': return <DataManagement />;
                default: return <Dashboard globalSearch={globalSearch} />;
              }
            })()}
          </main>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
