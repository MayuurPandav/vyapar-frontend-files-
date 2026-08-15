import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const sidebarTranslations = {
  en: {
    title: "KhataFlow Suite",
    dashboard: "Dashboard",
    analytics_dashboard: "Analytics Dashboard",
    customers: "Customers",
    ledgers: "General Ledgers",
    journals: "Journal Entries",
    expenses: "Expense Tracking",
    profile: "My Profile",
    role: "Admin Operator",

    // Module groups
    sales_group: "Sales & Customers",
    acct_group: "Ledgers & Journals",
    khata_section: "Accounting & Khata",

    day_book: "Day Book Register",
    cash_bank: "Cash & Bank Books",
    reconcile: "Bank Reconciliation",
    cheques: "Cheque Management",
    petty_cash: "Petty Cash Book",
    financials: "Financial Statements",
    invoices: "Invoices & Billing",
    parties: "Party Management",
    gst_tax: "GST & Tax Control",
    income_tax: "Income Tax Control",
    reports: "Reports Center"
  },
  hi: {
    title: "खाताफ्लो सुइट",
    dashboard: "डैशबोर्ड",
    analytics_dashboard: "एनालिटिक्स डैशबोर्ड",
    customers: "ग्राहक सूची",
    ledgers: "खाता बही (Ledgers)",
    journals: "रोजनामचा (Journals)",
    expenses: "व्यय ट्रैकिंग",
    profile: "मेरी प्रोफाइल",
    role: "प्रशासक ऑपरेटर",

    // Module groups
    sales_group: "बिक्री और ग्राहक",
    acct_group: "बहीखाता और रोजनामचा",
    khata_section: "लेखा और खाता बुक",

    day_book: "डे बुक रजिस्टर",
    cash_bank: "रोकड़ और बैंक बही",
    reconcile: "बैंक समाधान",
    cheques: "चेक प्रबंधन",
    petty_cash: "लघु रोकड़ बही",
    financials: "वित्तीय विवरण (P&L, BS)",
    invoices: "चालान और बिलिंग",
    parties: "पक्ष प्रबंधन",
    gst_tax: "जीएसटी और टैक्स",
    income_tax: "आयकर विभाग",
    reports: "रिपोर्ट सेंटर"
  },
  mr: {
    title: "खाताफ्लो सुइट",
    dashboard: "डॅशबोर्ड",
    analytics_dashboard: "विश्लेषण डॅशबोर्ड",
    customers: "ग्राहक यादी",
    ledgers: "खातेवही (Ledgers)",
    journals: "रोजकिर्द नोंदी",
    expenses: "खर्च मागोवा",
    profile: "माझी प्रोफाइल",
    role: "प्रशासक ऑपरेटर",

    // Module groups
    sales_group: "विक्री आणि ग्राहक",
    acct_group: "खातेवही आणि रोजकिर्द",
    khata_section: "लेखा आणि खाते पुस्तक",

    day_book: "डे बुक रजिस्टर",
    cash_bank: "रोकड आणि बँक बुक्स",
    reconcile: "बँक जुळवणी",
    cheques: "धनादेश व्यवस्थापन",
    petty_cash: "किरकोळ रोकड पुस्तक",
    financials: "वित्तीय पत्रके (P&L, BS)",
    invoices: "इनव्हॉइस आणि बिलिंग",
    parties: "पक्ष व्यवस्थापन",
    gst_tax: "जीएसटी आणि कर",
    income_tax: "आयकर विभाग",
    reports: "अहवाल केंद्र"
  }
};

const brandThemes = {
  indigo: {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-650/20',
    text: 'text-indigo-500',
    accent: 'text-indigo-400'
  },
  teal: {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-650/20',
    text: 'text-teal-500',
    accent: 'text-teal-400'
  },
  emerald: {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-650/20',
    text: 'text-emerald-500',
    accent: 'text-emerald-400'
  },
  rose: {
    primary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-650/20',
    text: 'text-rose-500',
    accent: 'text-rose-400'
  },
  amber: {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-650/20',
    text: 'text-amber-500',
    accent: 'text-amber-400'
  },
  charcoal: {
    primary: 'bg-slate-700 hover:bg-slate-850 text-white shadow-slate-650/20',
    text: 'text-slate-400',
    accent: 'text-slate-300'
  }
};

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const t = sidebarTranslations[lang] || sidebarTranslations.en;

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    window.addEventListener('languageChange', handleLangChange);
    return () => {
      window.removeEventListener('languageChange', handleLangChange);
    };
  }, []);

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
  }, [location.pathname]);

  if (!user) return null;

  return (
    <aside className="sidebar sidebar-accountant">
      <div className="sidebar__indicator" style={{ top: indicatorStyle.top, height: indicatorStyle.height, opacity: indicatorStyle.opacity }} />
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <i className="fas fa-file-invoice-dollar"></i>
        </div>
        <span className="sidebar__logo-text">KhataFlow</span>
      </div>

      <ul className="sidebar__nav" ref={containerRef}>
        <li style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t.title}
        </li>
        <li>
          <Link to="/admin-dashboard" className={`sidebar__link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}>
            <i className="fas fa-th-large"></i> {t.dashboard}
          </Link>
        </li>
        <li>
          <Link to="/khataflow" className={`sidebar__link ${location.pathname === '/khataflow' || location.pathname === '/' ? 'active' : ''}`}>
            <i className="fas fa-chart-line"></i> {t.analytics_dashboard}
          </Link>
        </li>

        <li style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t.sales_group}
        </li>
        <li>
          <Link to="/invoices" className={`sidebar__link ${location.pathname === '/invoices' ? 'active' : ''}`}>
            <i className="fas fa-receipt"></i> {t.invoices}
          </Link>
        </li>
        <li>
          <Link to="/customers" className={`sidebar__link ${location.pathname === '/customers' ? 'active' : ''}`}>
            <i className="fas fa-user-friends"></i> {t.customers}
          </Link>
        </li>
        <li>
          <Link to="/parties" className={`sidebar__link ${location.pathname === '/parties' ? 'active' : ''}`}>
            <i className="fas fa-handshake"></i> {t.parties}
          </Link>
        </li>

        <li style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t.acct_group}
        </li>
        <li>
          <Link to="/ledgers" className={`sidebar__link ${location.pathname === '/ledgers' ? 'active' : ''}`}>
            <i className="fas fa-book"></i> {t.ledgers}
          </Link>
        </li>
        <li>
          <Link to="/journals" className={`sidebar__link ${location.pathname === '/journals' ? 'active' : ''}`}>
            <i className="fas fa-pen-fancy"></i> {t.journals}
          </Link>
        </li>
        <li>
          <Link to="/expenses" className={`sidebar__link ${location.pathname === '/expenses' ? 'active' : ''}`}>
            <i className="fas fa-wallet"></i> {t.expenses}
          </Link>
        </li>

        <li style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t.khata_section}
        </li>
        <li>
          <Link to="/day-book" className={`sidebar__link ${location.pathname === '/day-book' ? 'active' : ''}`}>
            <i className="fas fa-calendar-day"></i> {t.day_book}
          </Link>
        </li>
        <li>
          <Link to="/cash-bank" className={`sidebar__link ${location.pathname === '/cash-bank' ? 'active' : ''}`}>
            <i className="fas fa-university"></i> {t.cash_bank}
          </Link>
        </li>
        <li>
          <Link to="/reconcile" className={`sidebar__link ${location.pathname === '/reconcile' ? 'active' : ''}`}>
            <i className="fas fa-balance-scale"></i> {t.reconcile}
          </Link>
        </li>
        <li>
          <Link to="/cheques" className={`sidebar__link ${location.pathname === '/cheques' ? 'active' : ''}`}>
            <i className="fas fa-money-check"></i> {t.cheques}
          </Link>
        </li>
        <li>
          <Link to="/petty-cash" className={`sidebar__link ${location.pathname === '/petty-cash' ? 'active' : ''}`}>
            <i className="fas fa-coins"></i> {t.petty_cash}
          </Link>
        </li>
        <li>
          <Link to="/financials" className={`sidebar__link ${location.pathname === '/financials' ? 'active' : ''}`}>
            <i className="fas fa-file-alt"></i> {t.financials}
          </Link>
        </li>
        <li>
          <Link to="/gst-tax" className={`sidebar__link ${location.pathname === '/gst-tax' ? 'active' : ''}`}>
            <i className="fas fa-percent"></i> {t.gst_tax}
          </Link>
        </li>
        <li>
          <Link to="/income-tax" className={`sidebar__link ${location.pathname === '/income-tax' ? 'active' : ''}`}>
            <i className="fas fa-file-invoice-dollar"></i> {t.income_tax}
          </Link>
        </li>
        <li>
          <Link to="/reports" className={`sidebar__link ${location.pathname === '/reports' ? 'active' : ''}`}>
            <i className="fas fa-chart-bar"></i> {t.reports}
          </Link>
        </li>
      </ul>

      <div className="sidebar__footer">
        <Link to="/profile" className={`sidebar__link ${location.pathname === '/profile' ? 'active' : ''}`} style={{ marginBottom: '8px' }}>
          <i className="fas fa-user-circle"></i> {t.profile}
        </Link>
        <a className="sidebar__link" onClick={logout} style={{ color: '#ef4444', cursor: 'pointer' }}>
          <i className="fas fa-sign-out-alt" style={{ color: '#ef4444' }}></i> {lang === 'hi' ? 'लॉगआउट' : (lang === 'mr' ? 'लॉगआउट' : 'Logout')}
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
