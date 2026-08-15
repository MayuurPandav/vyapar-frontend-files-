import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Profile from './pages/Profile';
import Ledgers from './pages/Ledgers';
import Journals from './pages/Journals';
import DayBook from './pages/DayBook';
import CashBankBook from './pages/CashBankBook';
import BankReconciliation from './pages/BankReconciliation';
import ChequeManagement from './pages/ChequeManagement';
import PettyCash from './pages/PettyCash';
import FinancialStatements from './pages/FinancialStatements';
import Invoices from './pages/Invoices';
import Parties from './pages/Parties';
import GstTax from './pages/GstTax';
import IncomeTax from './pages/IncomeTax';
import Reports from './pages/Reports';
import Khataflow from './pages/Khataflow';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';

function AccountantRoutes() {
  const location = useLocation();
  const [hideNavbar, setHideNavbar] = React.useState(localStorage.getItem('hideNavbar') === 'true');

  React.useEffect(() => {
    const handleNavbarToggle = () => {
      setHideNavbar(localStorage.getItem('hideNavbar') === 'true');
    };
    window.addEventListener('navbarToggle', handleNavbarToggle);
    return () => {
      window.removeEventListener('navbarToggle', handleNavbarToggle);
    };
  }, []);

  const isDashboard = location.pathname === '/admin-dashboard';
  const isKhataflowPage = location.pathname === '/' || location.pathname === '/khataflow';
  const shouldHideNavbar = (isDashboard || isKhataflowPage) && hideNavbar;

  return (
    <div className="app">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main className="main">
          {!shouldHideNavbar && <Navbar />}
          <div style={{ flex: 1, marginTop: '24px' }}>
            <Routes>
              <Route path="/admin-dashboard" element={<Dashboard />} />
              <Route path="/" element={<Khataflow />} />
              <Route path="/khataflow" element={<Khataflow />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/parties" element={<Parties />} />
              <Route path="/gst-tax" element={<GstTax />} />
              <Route path="/income-tax" element={<IncomeTax />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/ledgers" element={<Ledgers />} />
              <Route path="/journals" element={<Journals />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/day-book" element={<DayBook />} />
              <Route path="/cash-bank" element={<CashBankBook />} />
              <Route path="/reconcile" element={<BankReconciliation />} />
              <Route path="/cheques" element={<ChequeManagement />} />
              <Route path="/petty-cash" element={<PettyCash />} />
              <Route path="/financials" element={<FinancialStatements />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AccountantApp() {
  return (
    <HashRouter>
      <AuthProvider>
        <AccountantRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
