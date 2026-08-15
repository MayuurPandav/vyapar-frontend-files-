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
import ShopProfileManagement from './views/ShopProfileManagement';
import UserManagement from './views/UserManagement';
import GlobalStaff from './views/GlobalStaff';
import SecuritySettings from './views/SecuritySettings';
import RoleManagement from './views/RoleManagement';
import MasterDataManagement from './views/MasterDataManagement';
import SADashboard from './views/SADashboard';
import DeliveryBoyApp from './views/driver/DeliveryBoyApp';
import StaffApp from './views/staff/StaffApp';
import AccountantApp from './views/accountant/AccountantApp';
import BusinessOversight from './views/BusinessOversight';
import SuperAdminTeam from './views/SuperAdminTeam';
import SupportHelpdesk from './views/SupportHelpdesk';
import SecurityAudit from './views/SecurityAudit';
import SADataManagement from './views/SADataManagement';
import IntegrationsAPI from './views/IntegrationsAPI';
import PlatformReports from './views/PlatformReports';
import Invoices from './views/Invoices';
import BroadcastAdmin from './views/BroadcastAdmin';



function AppContent() {
  const { token, user, viewOnly, backToSuperAdmin, isSuperAdmin, currentView, handleLogout } = useApp();
  const [globalSearch, setGlobalSearch] = React.useState('');

  // 1. If not logged in, render the login view
  if (!token || !user) {
    return <Login />;
  }

  const normalizedRole = (user && user.role || '').toString().toLowerCase().replace(/[-_]/g, '');

  // 1.25 If delivery boy role, render DeliveryBoyApp
  if (normalizedRole === 'deliveryboy') {
    return <DeliveryBoyApp token={token} user={user} handleLogout={handleLogout} />;
  }

  // 1.3 If staff or cashier role, render StaffApp
  if (normalizedRole === 'staff' || normalizedRole === 'cashier') {
    return <StaffApp token={token} user={user} handleLogout={handleLogout} />;
  }

  // 1.4 If accountant role, render AccountantApp
  if (normalizedRole === 'accountant') {
    return <AccountantApp token={token} user={user} handleLogout={handleLogout} />;
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
          currentView === 'shop-profile' ? <ShopProfileManagement /> : 
          currentView === 'user-management' ? <UserManagement /> : 
          currentView === 'global-staff' ? <GlobalStaff /> :
          currentView === 'security-settings' ? <SecuritySettings /> :
          currentView === 'roles' ? <RoleManagement /> :
          currentView === 'master-data' ? <MasterDataManagement /> :
          currentView === 'business-oversight' ? <BusinessOversight /> :
          currentView === 'support-helpdesk' ? <SupportHelpdesk /> :
          currentView === 'sa-team' ? <SuperAdminTeam /> :
          currentView === 'security-audit' ? <SecurityAudit /> :
          currentView === 'sa-data-management' ? <SADataManagement /> :
          currentView === 'integrations' ? <IntegrationsAPI /> :
          currentView === 'platform-reports' ? <PlatformReports /> :
          currentView === 'sa-analytics' ? <SADashboard /> :
          currentView === 'sa-announcements' ? <BroadcastAdmin /> :
          <SuperAdmin />
        ) : (
          // Regular Admin & simulated tenant views
          <main className="main">
            <Topbar onSearch={setGlobalSearch} />
            {/** render view based on currentView state (dashboard default) */}
            {(() => {
              switch (currentView) {
                case 'invoices': return <Invoices />;
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
