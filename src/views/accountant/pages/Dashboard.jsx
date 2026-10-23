import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';

// Comprehensive localized translations
const translations = {
  en: {
    today: "TODAY",
    dashboard: "KhataFlow Dashboard",
    stats_overview: "Statistics Overview",
    stats_desc: "A breakdown of your daily accounting performance, assets, and liabilities.",
    receivables: "Total Receivables",
    receivables_sub: "Customer Dues",
    payables: "Total Payables",
    payables_sub: "Supplier AP",
    cash: "Cash In Hand",
    cash_sub: "Cash Balance",
    bank: "Bank Balance",
    bank_sub: "Bank Ledger",
    transactions: "Today's Transactions",
    transactions_sub: "Today's Activity",
    overdue: "Overdue Payments",
    overdue_sub: "Action Required",
    gst: "GST Filing Status",
    gst_sub: "Tax Filing",
    expenses: "Pending Expenses",
    expenses_sub: "Needs Review",
    back: "← Back to Dashboard",
    settings: "System Settings Panel",
    theme: "Select Visual Theme",
    lang: "Select System Language",
    light: "Light Theme",
    dark: "Dark Theme",
    notifications: "Actionable Notifications",
    performance: "ASSET COMPOSITION",
    performance_sub: "Assets Ratio Breakdown",
    welcome: "Welcome to KhataFlow Panel",
    welcome_sub: "Use the stats cards to open dedicated, solid management pages. All changes sync in real-time with MongoDB Atlas.",
    no_notifications: "No critical alerts. Your accounts are fully reconciled!",
    notify_overdue: "Alert: You have {count} overdue customer invoices pending collection!",
    notify_expenses: "Alert: You have {count} business expenses awaiting manager verification!",
    save_settings: "Apply & Save Settings",
    analytics_title: "Financial Intelligence Hub",
    analytics_desc: "Visual analysis of your company liquidity, locked capital, and debt cover.",
    liquidity_ratio: "Cash-to-Debt Cover",
    health_excellent: "Excellent",
    health_stable: "Stable",
    health_caution: "Caution",
    asset: "Asset Pool",
    total_sales: "Total Sales Revenue",
    win_rate: "Net Profit Margin",
    close_rate: "Collection Rate",
    days_to_close: "Avg Days Outstanding",
    pipeline_value: "Pipeline Receivables",
    open_deals: "Active Invoices",
    weighted_value: "Liquid Reserves",
    avg_deal_age: "Avg Invoice Value",
    won_deals_title: "Sales vs Operating Expenses (Last 12 Months)",
    projection_title: "Cash Flow Projections (Future 12 Months)",
    pipeline_title: "Asset Distribution Pipeline",
    loss_reasons_title: "Expense Allocations By Category"
  },
  hi: {
    today: "आज",
    dashboard: "खाताफ्लो डैशबोर्ड",
    stats_overview: "सांख्यिकी अवलोकन",
    stats_desc: "आपके दैनिक लेखांकन प्रदर्शन, संपत्ति और देनदारियों का विवरण।",
    receivables: "कुल प्राप्य",
    receivables_sub: "ग्राहकों का बकाया",
    payables: "कुल देय",
    payables_sub: "आपूर्तिकर्ताओं का बकाया",
    cash: "हस्तगत रोकड़",
    cash_sub: "कैश बैलेंस",
    bank: "बैंक शेष",
    bank_sub: "बैंक खाता",
    transactions: "आज के लेन-देन",
    transactions_sub: "आज की गतिविधि",
    overdue: "बकाया भुगतान",
    overdue_sub: "कार्रवाई आवश्यक",
    gst: "जीएसटी फाइलिंग स्थिति",
    gst_sub: "कर फाइलिंग",
    expenses: "लंबित खर्च",
    expenses_sub: "सत्यापन आवश्यक",
    back: "← डैशबोर्ड पर वापस जाएं",
    settings: "सिस्टम सेटिंग्स पैनल",
    theme: "थीम का चयन करें",
    lang: "सिस्टम भाषा चुनें",
    light: "लाइट थीम",
    dark: "डार्क थीम",
    notifications: "सक्रिय सूचनाएं",
    performance: "संपत्ति संरचना",
    performance_sub: "संपत्ति अनुपात विवरण",
    welcome: "खाताफ्लो (KhataFlow) पैनल में आपका स्वागत है",
    welcome_sub: "विशिष्ट सॉलिड प्रबंधन पृष्ठों को खोलने के लिए सांख्यिकी कार्ड का उपयोग करें। सभी परिवर्तन सीधे मोंगोडीबी एटलस के साथ सिंक होते हैं।",
    no_notifications: "कोई महत्वपूर्ण अलर्ट नहीं है। आपके खाते पूरी तरह से संतुलित हैं!",
    notify_overdue: "अलर्ट: आपके पास {count} बकाया ग्राहक चालान लंबित हैं!",
    notify_expenses: "अलर्ट: आपके पास {count} व्यावसायिक खर्च सत्यापन के लिए लंबित हैं!",
    save_settings: "सेटिंग्स लागू करें",
    analytics_title: "वित्तीय खुफिया हब",
    analytics_desc: "आपकी कंपनी की तरलता, बंद पूंजी और ऋण कवर का दृश्य विश्लेषण।",
    liquidity_ratio: "नकद-से-ऋण कवर",
    health_excellent: "उत्कृष्ट",
    health_stable: "स्थिर",
    health_caution: "चेतावनी",
    asset: "परिसंपत्ति पूल",
    total_sales: "कुल बिक्री राजस्व",
    win_rate: "शुद्ध लाभ मार्जिन",
    close_rate: "संग्रह दर",
    days_to_close: "औसत बकाया दिन",
    pipeline_value: "पाइपलाइन प्राप्य",
    open_deals: "सक्रिय चालान",
    weighted_value: "तरल भंडार",
    avg_deal_age: "औसत चालान मूल्य",
    won_deals_title: "बिक्री बनाम परिचालन व्यय (पिछले 12 महीने)",
    projection_title: "नकद प्रवाह अनुमान (अगले 12 महीने)",
    pipeline_title: "संपत्ति वितरण पाइपलाइन",
    loss_reasons_title: "श्रेणी के अनुसार व्यय आवंटन"
  },
  mr: {
    today: "आज",
    dashboard: "खाताफ्लो डॅशबोर्ड",
    stats_overview: "सांख्यिकी विहंगावलोकन",
    stats_desc: "तुमच्या दैनंदिन लेखा कामगिरी, मालमत्ता आणि दायित्वांचे तपशील.",
    receivables: "एकूण येणे",
    receivables_sub: "ग्राहकांचे देणे",
    payables: "एकूण देणे",
    payables_sub: "विक्रेत्यांचे देणे",
    cash: "हातात रोकड",
    cash_sub: "कॅश शिल्लक",
    bank: "बँक शिल्लक",
    bank_sub: "बँक खाते",
    transactions: "आजचे व्यवहार",
    transactions_sub: "आजची क्रियाशीलता",
    overdue: "थकीत रक्कम",
    overdue_sub: "कारवाई आवश्यक",
    gst: "जीएसटी दाखल करण्याची स्थिती",
    gst_sub: "कर भरणे",
    expenses: "प्रलंबित खर्च",
    expenses_sub: "पुनरावलोकन आवश्यक",
    back: "← डॅशबोर्डवर परत जा",
    settings: "सिस्टम सेटिंग्स पॅनेल",
    theme: "थीम निवडा",
    lang: "सिस्टम भाषा निवडा",
    light: "लाइट थीम",
    dark: "डार्क थीम",
    notifications: "सक्रिय सूचना",
    performance: "मालमत्ता रचना",
    performance_sub: "मालमत्ता प्रमाण तपशील",
    welcome: "खाताफ्लो (KhataFlow) पॅनेलमध्ये आपले स्वागत आहे",
    welcome_sub: "विशिष्ट सॉलिड व्यवस्थापन पृष्ठे उघडण्यासाठी आकडेवारी कार्ड वापरा. सर्व बदल मोंगोडीबी ॲटलससह रिअल-टाइममध्ये सिंक होतात.",
    no_notifications: "कोणत्याही गंभीर सूचना नाहीत. तुमची खाती पूर्णपणे जुळली आहेत!",
    notify_overdue: "सूचना: आपल्याकडे {count} थकीत ग्राहक इनव्हॉइस गोळा करणे बाकी आहे!",
    notify_expenses: "सूचना: आपल्याकडे {count} व्यावसायिक खर्च व्यवस्थापक पडताळणीसाठी प्रलंबित आहेत!",
    save_settings: "सेटिंग्ज जतन करा",
    analytics_title: "वित्तीय बुद्धिमत्ता हब",
    analytics_desc: "तुमच्या कंपनीची तरलता, लॉक केलेले भांडवल आणि कर्ज कव्हरचे दृश्य विश्लेषण.",
    liquidity_ratio: "रोकड-ते-कर्ज कव्हर",
    health_excellent: "उत्कृष्ट",
    health_stable: "स्थिर",
    health_caution: "सावधान",
    asset: "मालमत्ता पूल",
    total_sales: "एकूण विक्री महसूल",
    win_rate: "निव्वळ नफा मार्जिन",
    close_rate: "वसुली दर",
    days_to_close: "सरासरी थकीत दिवस",
    pipeline_value: "पाइपलाइन येणे",
    open_deals: "सक्रिय इनव्हॉइसेस",
    weighted_value: "तरल राखीव निधी",
    avg_deal_age: "सरासरी इनव्हॉइस मूल्य",
    won_deals_title: "विक्री विरुद्ध परिचालन खर्च (मागील १२ महिने)",
    projection_title: "रोकड प्रवाह अंदाज (पुढील १२ महिने)",
    pipeline_title: "मालमत्ता वितरण पाइपलाइन",
    loss_reasons_title: "वर्गानुसार खर्च वाटप"
  }
};

const brandThemes = {
  indigo: {
    primary: 'bg-blue-600 hover:bg-blue-700',
    primaryBg: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    gradient: 'from-blue-600 to-indigo-600',
    lightGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    glowingGlow: 'hover:shadow-blue-500/15',
    accentColor: '#3b82f6', // blue-600
    subtext: 'text-blue-200'
  },
  blue: {
    primary: 'bg-blue-600 hover:bg-blue-700',
    primaryBg: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    gradient: 'from-blue-600 to-indigo-600',
    lightGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    glowingGlow: 'hover:shadow-blue-500/15',
    accentColor: '#3b82f6', // blue-600
    subtext: 'text-blue-200'
  },
  teal: {
    primary: 'bg-teal-650 hover:bg-teal-700',
    primaryBg: 'bg-teal-650',
    text: 'text-teal-650 dark:text-teal-400',
    border: 'border-teal-500/20',
    gradient: 'from-teal-600 to-cyan-600',
    lightGradient: 'from-teal-500/10 via-cyan-500/5 to-transparent',
    glowingGlow: 'hover:shadow-teal-500/15',
    accentColor: '#0D9488', // teal-600
    subtext: 'text-teal-205'
  },
  emerald: {
    primary: 'bg-emerald-650 hover:bg-emerald-700',
    primaryBg: 'bg-emerald-650',
    text: 'text-emerald-650 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-600 to-teal-600',
    lightGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    glowingGlow: 'hover:shadow-emerald-500/15',
    accentColor: '#059669', // emerald-600
    subtext: 'text-emerald-205'
  },
  rose: {
    primary: 'bg-rose-650 hover:bg-rose-700',
    primaryBg: 'bg-rose-650',
    text: 'text-rose-650 dark:text-rose-400',
    border: 'border-rose-500/20',
    gradient: 'from-rose-600 to-pink-600',
    lightGradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
    glowingGlow: 'hover:shadow-rose-500/15',
    accentColor: '#E11D48', // rose-600
    subtext: 'text-rose-205'
  },
  amber: {
    primary: 'bg-amber-650 hover:bg-amber-700',
    primaryBg: 'bg-amber-650',
    text: 'text-amber-650 dark:text-amber-400',
    border: 'border-amber-500/20',
    gradient: 'from-amber-600 to-orange-500',
    lightGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    glowingGlow: 'hover:shadow-amber-500/15',
    accentColor: '#D97706', // amber-600
    subtext: 'text-amber-205'
  },
  charcoal: {
    primary: 'bg-slate-750 hover:bg-slate-800',
    primaryBg: 'bg-slate-750',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/20',
    gradient: 'from-slate-700 to-slate-900',
    lightGradient: 'from-slate-700/10 via-slate-800/5 to-transparent',
    glowingGlow: 'hover:shadow-slate-500/15',
    accentColor: '#334155', // slate-700
    subtext: 'text-slate-300'
  }
};

const Dashboard = () => {
  const { logout } = useContext(AuthContext);
  // Localization & Theme states
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [brandTheme, setBrandTheme] = useState(localStorage.getItem('brandTheme') || 'blue');
  const [showHelpDetails, setShowHelpDetails] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null); // 'receivables', 'payables', 'cash', 'bank', 'transactions', 'overdue', 'gst', 'expenses', 'settings', 'notifications'

  const [navbarHidden, setNavbarHidden] = useState(localStorage.getItem('hideNavbar') === 'true');

  const toggleNavbarVisibility = () => {
    const nextVal = !navbarHidden;
    setNavbarHidden(nextVal);
    localStorage.setItem('hideNavbar', String(nextVal));
    window.dispatchEvent(new Event('navbarToggle'));
  };

  const handleSystemBackup = async () => {
    try {
      const [customersRes, ledgersRes, journalsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/ledgers'),
        api.get('/journals')
      ]);

      const rawCustomers = customersRes.data.data || [];
      const mappedCustomers = rawCustomers.map(c => ({
        "Customer ID": c.customerId || c._id,
        "Customer Name": c.name,
        "Phone Number": c.phone,
        "Opening Balance (Rs.)": c.openingBalance
      }));

      const rawLedgers = ledgersRes.data.data || [];
      const mappedLedgers = rawLedgers.map(l => ({
        "Ledger ID": l._id,
        "Ledger Name": l.name,
        "Account Type": l.type,
        "Current Balance (Rs.)": l.balance
      }));

      const rawJournals = journalsRes.data.data || [];
      const mappedJournals = rawJournals.map(j => ({
        "Journal ID": j._id,
        "Transaction Date": new Date(j.date).toLocaleDateString(),
        "Description": j.description,
        "Amount (Rs.)": j.amount
      }));

      const wb = XLSX.utils.book_new();
      const wsCust = XLSX.utils.json_to_sheet(mappedCustomers);
      const wsLedg = XLSX.utils.json_to_sheet(mappedLedgers);
      const wsJourn = XLSX.utils.json_to_sheet(mappedJournals);

      XLSX.utils.book_append_sheet(wb, wsCust, "Customers");
      XLSX.utils.book_append_sheet(wb, wsLedg, "Ledgers");
      XLSX.utils.book_append_sheet(wb, wsJourn, "Journals");

      XLSX.writeFile(wb, `khataflow_database_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert("🎉 Database backup created and downloaded successfully as MS Excel Workbook!");
    } catch (err) {
      console.error('System backup failed:', err);
      alert("❌ Failed to compile system backup. Please check your network connection.");
    }
  };

  // Modal data states
  const [customers, setCustomers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [gstFilings, setGstFilings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [journals, setJournals] = useState([]);

  // Interactive date filter states
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'day', 'week', 'month', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form input states
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', openingBalance: '' });
  const [customerPayment, setCustomerPayment] = useState({ customerId: '', amount: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', balance: '' });
  const [supplierPayment, setSupplierPayment] = useState({ ledgerId: '', amount: '' });
  const [cashForm, setCashForm] = useState({ type: 'deposit', amount: '', narration: '' });
  const [bankForm, setBankForm] = useState({ type: 'deposit', amount: '', narration: '' });
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: '', customerId: '', amount: '', dueDate: '' });
  const [gstForm, setGstForm] = useState({ period: '', cgst: '', sgst: '', igst: '0' });

  const t = translations[lang] || translations.en;

  const fetchStats = async () => {
    try {
      const [statsRes, expensesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/expenses')
      ]);
      setStats(statsRes.data.data);
      setExpenses(expensesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Dispatch system events when language/theme loads initially
    localStorage.setItem('lang', lang);
    localStorage.setItem('theme', theme);
  }, [lang, theme]);

  useEffect(() => {
    const handleActivePageChange = () => {
      const page = localStorage.getItem('dashboardActivePage');
      if (page) {
        openPage(page);
        localStorage.removeItem('dashboardActivePage');
      }
    };
    const handleBrandChange = () => {
      setBrandTheme(localStorage.getItem('brandTheme') || 'indigo');
    };
    handleActivePageChange(); // check on mount/mount redirect
    window.addEventListener('dashboardActivePageChange', handleActivePageChange);
    window.addEventListener('brandThemeChange', handleBrandChange);
    return () => {
      window.removeEventListener('dashboardActivePageChange', handleActivePageChange);
      window.removeEventListener('brandThemeChange', handleBrandChange);
    };
  }, []);

  const openPage = async (pageName) => {
    setActivePage(pageName);
    try {
      if (pageName === 'receivables') {
        const res = await api.get('/customers');
        setCustomers(res.data.data);
      } else if (pageName === 'payables') {
        const res = await api.get('/ledgers');
        setLedgers(res.data.data);
      } else if (pageName === 'cash' || pageName === 'bank') {
        const resLedgers = await api.get('/ledgers');
        setLedgers(resLedgers.data.data);
        const resJournals = await api.get('/journals');
        setJournals(resJournals.data.data);
      } else if (pageName === 'transactions') {
        const res = await api.get('/journals');
        setJournals(res.data.data);
      } else if (pageName === 'overdue') {
        const resInv = await api.get('/dashboard/invoices');
        setInvoices(resInv.data.data);
        const resCust = await api.get('/customers');
        setCustomers(resCust.data.data);
      } else if (pageName === 'gst') {
        const res = await api.get('/dashboard/gst-filings');
        setGstFilings(res.data.data);
        const resLedgers = await api.get('/ledgers');
        setLedgers(resLedgers.data.data);
      } else if (pageName === 'expenses') {
        const res = await api.get('/expenses');
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error(`Error loading data for page ${pageName}`, err);
    }
  };

  const closePage = () => {
    setActivePage(null);
    fetchStats();
  };

  // Language trigger helper
  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  // Theme trigger helper
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new Event('themeChange'));
  };

  // 1. Receivables actions
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', customerForm);
      alert(lang === 'hi' ? 'ग्राहक सफलतापूर्वक जोड़ा गया!' : lang === 'mr' ? 'ग्राहक यशस्वीरित्या जोडला गेला!' : 'Customer added successfully!');
      setCustomerForm({ name: '', phone: '', openingBalance: '' });
      openPage('receivables');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCustomerPayment = async (e) => {
    e.preventDefault();
    try {
      const selected = customers.find(c => c._id === customerPayment.customerId);
      if (!selected) return alert('Select customer');
      const newBal = Math.max(0, (selected.openingBalance || 0) - Number(customerPayment.amount));

      await api.put(`/customers/${selected._id}`, { openingBalance: newBal });

      const cashLedger = ledgers.find(l => l.name === 'Cash');
      const salesLedger = ledgers.find(l => l.name === 'Sales');
      if (cashLedger && salesLedger) {
        await api.post('/journals', {
          narration: `Payment received from customer ${selected.name}`,
          entries: [
            { ledger: cashLedger._id, type: 'debit', amount: customerPayment.amount },
            { ledger: salesLedger._id, type: 'credit', amount: customerPayment.amount }
          ]
        });
      }

      alert(lang === 'hi' ? 'भुगतान सफलतापूर्वक दर्ज किया गया!' : lang === 'mr' ? 'पेमेंट यशस्वीरित्या नोंदवले गेले!' : 'Payment recorded successfully!');
      setCustomerPayment({ customerId: '', amount: '' });
      openPage('receivables');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  // 2. Payables actions
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ledgers', {
        name: supplierForm.name,
        type: 'liability',
        balance: Number(supplierForm.balance)
      });
      alert('Supplier accounts payable created!');
      setSupplierForm({ name: '', balance: '' });
      openPage('payables');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSupplierPayment = async (e) => {
    e.preventDefault();
    try {
      const selected = ledgers.find(l => l._id === supplierPayment.ledgerId);
      if (!selected) return alert('Select supplier');
      const newBal = Math.max(0, (selected.balance || 0) - Number(supplierPayment.amount));

      await api.put(`/ledgers/${selected._id}`, { balance: newBal });

      const cashLedger = ledgers.find(l => l.name === 'Cash');
      if (cashLedger) {
        await api.post('/journals', {
          narration: `Settled payment to supplier ${selected.name}`,
          entries: [
            { ledger: selected._id, type: 'debit', amount: supplierPayment.amount },
            { ledger: cashLedger._id, type: 'credit', amount: supplierPayment.amount }
          ]
        });
      }

      alert('Supplier payment recorded successfully!');
      setSupplierPayment({ ledgerId: '', amount: '' });
      openPage('payables');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  // 3. Cash adjustment
  const handleCashAdjustment = async (e) => {
    e.preventDefault();
    try {
      const cashLedger = ledgers.find(l => l.name === 'Cash');
      const salesLedger = ledgers.find(l => l.name === 'Sales');
      if (!cashLedger || !salesLedger) {
        return alert('Cash or Sales ledger not found. Run seeder first.');
      }

      if (cashForm.type === 'deposit') {
        await api.post('/journals', {
          narration: cashForm.narration || 'Cash Deposit Adjustment',
          entries: [
            { ledger: cashLedger._id, type: 'debit', amount: Number(cashForm.amount) },
            { ledger: salesLedger._id, type: 'credit', amount: Number(cashForm.amount) }
          ]
        });
      } else {
        await api.post('/journals', {
          narration: cashForm.narration || 'Cash Spend Adjustment',
          entries: [
            { ledger: salesLedger._id, type: 'debit', amount: Number(cashForm.amount) },
            { ledger: cashLedger._id, type: 'credit', amount: Number(cashForm.amount) }
          ]
        });
      }

      alert('Cash adjusted successfully!');
      setCashForm({ type: 'deposit', amount: '', narration: '' });
      openPage('cash');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  // 4. Bank adjustment
  const handleBankAdjustment = async (e) => {
    e.preventDefault();
    try {
      let bankLedger = ledgers.find(l => l.name === 'Bank');
      if (!bankLedger) {
        const newBank = await api.post('/ledgers', { name: 'Bank', type: 'asset', balance: 0 });
        bankLedger = newBank.data.data;
      }
      const cashLedger = ledgers.find(l => l.name === 'Cash');
      if (!cashLedger) return alert('Cash ledger not found');

      if (bankForm.type === 'deposit') {
        await api.post('/journals', {
          narration: bankForm.narration || 'Cash deposit into Bank',
          entries: [
            { ledger: bankLedger._id, type: 'debit', amount: Number(bankForm.amount) },
            { ledger: cashLedger._id, type: 'credit', amount: Number(bankForm.amount) }
          ]
        });
      } else {
        await api.post('/journals', {
          narration: bankForm.narration || 'Cash withdrawal from Bank',
          entries: [
            { ledger: cashLedger._id, type: 'debit', amount: Number(bankForm.amount) },
            { ledger: bankLedger._id, type: 'credit', amount: Number(bankForm.amount) }
          ]
        });
      }

      alert('Bank transaction recorded!');
      setBankForm({ type: 'deposit', amount: '', narration: '' });
      openPage('bank');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  // 6. Overdue invoice actions
  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/invoices', invoiceForm);
      alert('Invoice generated successfully!');
      setInvoiceForm({ invoiceNumber: '', customerId: '', amount: '', dueDate: '' });
      openPage('overdue');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSettleInvoice = async (invoiceId) => {
    try {
      await api.put(`/dashboard/invoices/${invoiceId}/settle`);
      alert('Invoice settled and paid!');
      openPage('overdue');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  // 7. GST Filing
  const handleFileGst = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/gst-filings', gstForm);
      alert(`GST Return for ${gstForm.period} filed successfully!`);
      setGstForm({ period: '', cgst: '', sgst: '', igst: '0' });
      openPage('gst');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  // 8. Expense approvals
  const handleApproveExpense = async (expenseId) => {
    try {
      await api.post(`/expenses/${expenseId}/approve`);
      alert('Expense approved successfully!');
      openPage('expenses');
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-400 font-bold text-lg">Loading KhataFlow Dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate critical alerts count
  const criticalCount = (stats?.overdueCount || 0) + (stats?.pendingExpenseApprovals || 0);

  // Filter journals by selected Date Range
  const filteredJournals = journals.filter(j => {
    const itemDate = new Date(j.date);
    if (isNaN(itemDate.getTime())) return true;
    const now = new Date();

    switch (dateFilter) {
      case 'day':
        return itemDate.toDateString() === now.toDateString();
      case 'week': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return itemDate >= sevenDaysAgo && itemDate <= now;
      }
      case 'month': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return itemDate >= thirtyDaysAgo && itemDate <= now;
      }
      case 'year': {
        const oneYearAgo = new Date();
        oneYearAgo.setDate(now.getDate() - 365);
        return itemDate >= oneYearAgo && itemDate <= now;
      }
      case 'custom': {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= adjustedEnd;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          return itemDate <= adjustedEnd;
        }
        return true;
      }
      case 'all':
      default:
        return true;
    }
  });

  // Asset values for Donut Chart
  const recVal = stats?.totalReceivables || 0;
  const cashVal = stats?.cashInHand || 0;
  const bankVal = stats?.bankBalance || 0;
  const totalAssetsVal = recVal + cashVal + bankVal;

  // Percentages for Donut segments
  const recPercent = totalAssetsVal > 0 ? (recVal / totalAssetsVal) * 100 : 0;
  const cashPercent = totalAssetsVal > 0 ? (cashVal / totalAssetsVal) * 100 : 0;
  const bankPercent = totalAssetsVal > 0 ? (bankVal / totalAssetsVal) * 100 : 0;

  // Calculate expenses by category dynamically
  const categoryTotals = {};
  let totalExpensesVal = 0;
  (expenses || []).forEach(e => {
    const cat = e.category || 'Other';
    const normalizedCat = cat.toLowerCase().trim();
    const amt = Number(e.amount) || 0;
    categoryTotals[normalizedCat] = (categoryTotals[normalizedCat] || 0) + amt;
    totalExpensesVal += amt;
  });

  let utilitiesVal = 0;
  let officeVal = 0;
  let techVal = 0;
  let otherVal = 0;

  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (cat.includes('util') || cat.includes('water') || cat.includes('electricity') || cat.includes('power')) {
      utilitiesVal += amt;
    } else if (cat.includes('office') || cat.includes('rent') || cat.includes('supplies') || cat.includes('stationery') || cat.includes('furniture')) {
      officeVal += amt;
    } else if (cat.includes('tech') || cat.includes('soft') || cat.includes('internet') || cat.includes('cloud') || cat.includes('subscription')) {
      techVal += amt;
    } else {
      otherVal += amt;
    }
  });

  const utilPercent = totalExpensesVal > 0 ? (utilitiesVal / totalExpensesVal) * 100 : 0;
  const offPercent = totalExpensesVal > 0 ? (officeVal / totalExpensesVal) * 100 : 0;
  const tecPercent = totalExpensesVal > 0 ? (techVal / totalExpensesVal) * 100 : 0;
  const othPercent = totalExpensesVal > 0 ? (otherVal / totalExpensesVal) * 100 : 0;

  const totalLiquidCash = cashVal + bankVal;
  const liquidityCoverRatio = totalLiquidCash / (stats?.totalPayables || 1);
  const lockedCapitalRatio = totalAssetsVal > 0 ? (recVal / totalAssetsVal) * 100 : 0;
  const cashToBankRatio = bankVal > 0 ? (cashVal / bankVal) * 100 : 0;

  let liquidCashHealth = 'stable';
  if (liquidityCoverRatio >= 1.5) {
    liquidCashHealth = 'excellent';
  } else if (liquidityCoverRatio < 1.0) {
    liquidCashHealth = 'caution';
  }

  const maxVal = Math.max(totalLiquidCash, recVal, stats?.totalPayables || 0, 1000);
  const liquidWidth = maxVal > 0 ? (totalLiquidCash / maxVal) * 100 : 0;
  const recWidth = maxVal > 0 ? (recVal / maxVal) * 100 : 0;
  const payWidth = maxVal > 0 ? ((stats?.totalPayables || 0) / maxVal) * 100 : 0;

  // Circle circumferences for SVG Donut (2 * PI * r, r=40 -> ~251.2)
  const strokeDasharray = 251.2;
  const recStrokeDashoffset = strokeDasharray - (strokeDasharray * recPercent) / 100;
  const cashStrokeDashoffset = strokeDasharray - (strokeDasharray * cashPercent) / 100;
  const bankStrokeDashoffset = strokeDasharray - (strokeDasharray * bankPercent) / 100;

  const isDark = theme === 'dark';
  const brand = brandThemes[brandTheme] || brandThemes.indigo;

  const getFilterButtonStyle = (isActive) => ({
    border: 'none',
    padding: '10px 18px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? '#3b82f6' : (isDark ? '#334155' : '#f1f5f9'),
    color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-8 transition-colors duration-300 font-sans`}>

      {/* SOLID SUB-PAGE HEADER (If any sub-page is active, render it in a clean full screen view) */}
      {activePage ? (
        <div className="card w-full" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={closePage}
              className="btn btn--sm flex items-center gap-2"
              style={{ border: 'none', background: isDark ? 'var(--bg-input)' : '#f1f5f9', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <i className="fas fa-arrow-left"></i> {t.back}
            </button>
          </div>

          {/* ================= SOLID PAGE: RECEIVABLES ================= */}
          {activePage === 'receivables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.receivables} - {t.receivables_sub}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Customer Outstanding Balance sheet</h4>
                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Customer Name</th>
                          <th>Phone</th>
                          <th className="text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.length === 0 ? (
                          <tr><td colSpan="3" className="p-4 text-center text-slate-400">No customers found</td></tr>
                        ) : (
                          customers.map(c => (
                            <tr key={c._id}>
                              <td className="font-bold">{c.name}</td>
                              <td className="text-slate-500 font-bold">{c.phone || 'N/A'}</td>
                              <td className="text-right font-extrabold text-blue-600">Rs. {c.openingBalance?.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <form onSubmit={handleAddCustomer} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Register New Customer</h4>
                    <div className="space-y-4">
                      <div className="fg">
                        <label>Customer Full Name</label>
                        <input
                          type="text" required placeholder="Customer Full Name"
                          value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg">
                        <label>Contact Phone</label>
                        <input
                          type="text" placeholder="Contact Phone"
                          value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg">
                        <label>Opening Outstanding Balance (Rs.)</label>
                        <input
                          type="number" required placeholder="Opening Outstanding Balance (Rs.)"
                          value={customerForm.openingBalance} onChange={e => setCustomerForm({ ...customerForm, openingBalance: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', border: 'none', padding: '12px' }}>
                        Register Customer
                      </button>
                    </div>
                  </form>

                  <form onSubmit={handleCustomerPayment} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Record Received Payment</h4>
                    <div className="space-y-4">
                      <div className="fg">
                        <label>Select Paying Customer</label>
                        <select
                          required value={customerPayment.customerId} onChange={e => setCustomerPayment({ ...customerPayment, customerId: e.target.value })}
                          className="fi"
                        >
                          <option value="">Select Paying Customer</option>
                          {customers.map(c => (
                            <option key={c._id} value={c._id}>{c.name} (Rs. {c.openingBalance})</option>
                          ))}
                        </select>
                      </div>
                      <div className="fg">
                        <label>Payment Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="Payment Amount (Rs.)"
                          value={customerPayment.amount} onChange={e => setCustomerPayment({ ...customerPayment, amount: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', backgroundColor: '#10b981', border: 'none', padding: '12px' }}>
                        Record Payment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: PAYABLES ================= */}
          {activePage === 'payables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.payables} - {t.payables_sub}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Supplier Liability Balance sheet</h4>
                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Accounts Payable Supplier</th>
                          <th className="text-right">Owed Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgers.filter(l => l.type === 'liability').length === 0 ? (
                          <tr><td colSpan="2" className="p-4 text-center text-slate-400">No liability accounts found</td></tr>
                        ) : (
                          ledgers.filter(l => l.type === 'liability').map(l => (
                            <tr key={l._id}>
                              <td className="font-bold">{l.name}</td>
                              <td className="text-right font-extrabold text-indigo-600">Rs. {l.balance?.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <form onSubmit={handleAddSupplier} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Register Supplier Accounts Payable</h4>
                    <div className="space-y-4">
                      <div className="fg">
                        <label>Supplier Name</label>
                        <input
                          type="text" required placeholder="Supplier Name"
                          value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg">
                        <label>Owed Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="Owed Amount (Rs.)"
                          value={supplierForm.balance} onChange={e => setSupplierForm({ ...supplierForm, balance: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', border: 'none', padding: '12px' }}>
                        Register Liability Ledger
                      </button>
                    </div>
                  </form>

                  <form onSubmit={handleSupplierPayment} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Record Supplier Payment Settled</h4>
                    <div className="space-y-4">
                      <div className="fg">
                        <label>Select Liability Ledger</label>
                        <select
                          required value={supplierPayment.ledgerId} onChange={e => setSupplierPayment({ ...supplierPayment, ledgerId: e.target.value })}
                          className="fi"
                        >
                          <option value="">Select Liability Ledger</option>
                          {ledgers.filter(l => l.type === 'liability').map(l => (
                            <option key={l._id} value={l._id}>{l.name} (Rs. {l.balance})</option>
                          ))}
                        </select>
                      </div>
                      <div className="fg">
                        <label>Settled Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="Settled Amount (Rs.)"
                          value={supplierPayment.amount} onChange={e => setSupplierPayment({ ...supplierPayment, amount: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', backgroundColor: '#10b981', border: 'none', padding: '12px' }}>
                        Record Settlement
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: CASH ================= */}
          {activePage === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.cash} - {t.cash_sub}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Recent Cash Book Logs</h4>
                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Narration</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journals.filter(j => j.entries.some(e => e.ledger?.name === 'Cash' || e.ledger === ledgers.find(l => l.name === 'Cash')?._id)).length === 0 ? (
                          <tr><td colSpan="3" className="p-4 text-center text-slate-400">No cash transactions logged</td></tr>
                        ) : (
                          journals.filter(j => j.entries.some(e => e.ledger?.name === 'Cash' || e.ledger === ledgers.find(l => l.name === 'Cash')?._id)).map(j => {
                            const cashEntry = j.entries.find(e => e.ledger?.name === 'Cash' || e.ledger === ledgers.find(l => l.name === 'Cash')?._id);
                            return (
                              <tr key={j._id}>
                                <td>{new Date(j.date).toLocaleDateString()}</td>
                                <td className="font-bold">{j.narration}</td>
                                <td className={`text-right font-extrabold ${cashEntry?.type === 'debit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {cashEntry?.type === 'debit' ? '+' : '-'}Rs. {cashEntry?.amount}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <form onSubmit={handleCashAdjustment} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Record Cash Adjustment</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Adjustment Action</label>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button" onClick={() => setCashForm({ ...cashForm, type: 'deposit' })}
                            className="btn flex-1 justify-center"
                            style={{
                              border: 'none',
                              padding: '12px',
                              backgroundColor: cashForm.type === 'deposit' ? '#10b981' : (isDark ? '#334155' : '#f1f5f9'),
                              color: cashForm.type === 'deposit' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569')
                            }}
                          >
                            Deposit Cash (Income)
                          </button>
                          <button
                            type="button" onClick={() => setCashForm({ ...cashForm, type: 'withdraw' })}
                            className="btn flex-1 justify-center"
                            style={{
                              border: 'none',
                              padding: '12px',
                              backgroundColor: cashForm.type === 'withdraw' ? '#ef4444' : (isDark ? '#334155' : '#f1f5f9'),
                              color: cashForm.type === 'withdraw' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569')
                            }}
                          >
                            Spend Cash (Expense)
                          </button>
                        </div>
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Adjustment Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="Adjustment Amount (Rs.)"
                          value={cashForm.amount} onChange={e => setCashForm({ ...cashForm, amount: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Narration (Explanation)</label>
                        <textarea
                          required placeholder="Narration (Explanation)"
                          value={cashForm.narration} onChange={e => setCashForm({ ...cashForm, narration: e.target.value })}
                          className="fi"
                          style={{ height: '96px' }}
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', border: 'none', padding: '12px' }}>
                        Log Cash Entry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: BANK ================= */}
          {activePage === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.bank} - {t.bank_sub}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Recent Bank Book Logs</h4>
                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Narration</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journals.filter(j => j.entries.some(e => e.ledger?.name === 'Bank' || e.ledger === ledgers.find(l => l.name === 'Bank')?._id)).length === 0 ? (
                          <tr><td colSpan="3" className="p-4 text-center text-slate-400">No bank transactions logged</td></tr>
                        ) : (
                          journals.filter(j => j.entries.some(e => e.ledger?.name === 'Bank' || e.ledger === ledgers.find(l => l.name === 'Bank')?._id)).map(j => {
                            const bankEntry = j.entries.find(e => e.ledger?.name === 'Bank' || e.ledger === ledgers.find(l => l.name === 'Bank')?._id);
                            return (
                              <tr key={j._id}>
                                <td>{new Date(j.date).toLocaleDateString()}</td>
                                <td className="font-bold">{j.narration}</td>
                                <td className={`text-right font-extrabold ${bankEntry?.type === 'debit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {bankEntry?.type === 'debit' ? '+' : '-'}Rs. {bankEntry?.amount}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <form onSubmit={handleBankAdjustment} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Record Bank Transfer / Reconciliation</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reconciliation Action</label>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button" onClick={() => setBankForm({ ...bankForm, type: 'deposit' })}
                            className="btn flex-1 justify-center"
                            style={{
                              border: 'none',
                              padding: '12px',
                              backgroundColor: bankForm.type === 'deposit' ? '#06b6d4' : (isDark ? '#334155' : '#f1f5f9'),
                              color: bankForm.type === 'deposit' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569')
                            }}
                          >
                            Deposit Cash to Bank
                          </button>
                          <button
                            type="button" onClick={() => setBankForm({ ...bankForm, type: 'withdraw' })}
                            className="btn flex-1 justify-center"
                            style={{
                              border: 'none',
                              padding: '12px',
                              backgroundColor: bankForm.type === 'withdraw' ? '#ef4444' : (isDark ? '#334155' : '#f1f5f9'),
                              color: bankForm.type === 'withdraw' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569')
                            }}
                          >
                            Withdraw Bank to Cash
                          </button>
                        </div>
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Transfer Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="Transfer Amount (Rs.)"
                          value={bankForm.amount} onChange={e => setBankForm({ ...bankForm, amount: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Narration (Explanation)</label>
                        <textarea
                          required placeholder="Narration (Explanation)"
                          value={bankForm.narration} onChange={e => setBankForm({ ...bankForm, narration: e.target.value })}
                          className="fi"
                          style={{ height: '96px' }}
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', border: 'none', padding: '12px' }}>
                        Log Bank Transaction
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: TRANSACTIONS ================= */}
          {activePage === 'transactions' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-3xl font-extrabold">{t.transactions} - {t.transactions_sub}</h2>

              {/* Date Filter Panel */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Filter Transactions by Period</h4>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 font-black">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setDateFilter('all')}
                      style={getFilterButtonStyle(dateFilter === 'all')}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setDateFilter('day')}
                      style={getFilterButtonStyle(dateFilter === 'day')}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setDateFilter('week')}
                      style={getFilterButtonStyle(dateFilter === 'week')}
                    >
                      Last 7 Days (Week)
                    </button>
                    <button
                      onClick={() => setDateFilter('month')}
                      style={getFilterButtonStyle(dateFilter === 'month')}
                    >
                      Last 30 Days (Month)
                    </button>
                    <button
                      onClick={() => setDateFilter('year')}
                      style={getFilterButtonStyle(dateFilter === 'year')}
                    >
                      Last 365 Days (Year)
                    </button>
                    <button
                      onClick={() => setDateFilter('custom')}
                      style={getFilterButtonStyle(dateFilter === 'custom')}
                    >
                      Custom Calendar Range
                    </button>
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 text-xs animate-fadeIn">
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="fi"
                        style={{ padding: '8px 12px', width: 'auto' }}
                      />
                      <span className="text-slate-400 font-bold">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="fi"
                        style={{ padding: '8px 12px', width: 'auto' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Narration</th>
                      <th>Double-Entry Breakdown (Debit vs Credit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournals.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-slate-400">No journal logs found for the selected period</td></tr>
                    ) : (
                      filteredJournals.map(j => (
                        <tr key={j._id} className="hover:bg-slate-50">
                          <td className="p-4 text-slate-500 font-mono text-sm whitespace-nowrap">{new Date(j.date).toLocaleDateString()} {new Date(j.date).toLocaleTimeString()}</td>
                          <td className="p-4 font-bold text-slate-800">{j.narration}</td>
                          <td className="p-4 space-y-1">
                            {j.entries.map((en, idx) => (
                              <div key={idx} className="flex justify-between max-w-sm text-sm border-b border-slate-50 pb-1">
                                <span className="font-semibold text-slate-600">{en.ledger?.name || en.ledger}</span>
                                <span className={en.type === 'debit' ? 'text-emerald-600 font-black' : 'text-indigo-600 font-black'}>
                                  {en.type === 'debit' ? 'DR ' : 'CR '}Rs. {en.amount}
                                </span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-center pt-4">
                <a href="#/journals" className="btn btn--primary" style={{ border: 'none', padding: '12px 24px', display: 'inline-flex' }}>
                  Open Advanced Journal Creator
                </a>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: OVERDUE ================= */}
          {activePage === 'overdue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.overdue} - {t.overdue_sub}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 className="text-lg font-bold">Outstanding and Overdue customer Invoices</h4>
                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Customer</th>
                          <th>Due Date</th>
                          <th className="text-right">Amount</th>
                          <th className="text-center">Status</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr><td colSpan="6" className="p-4 text-center text-slate-400">No invoices logged</td></tr>
                        ) : (
                          invoices.map(inv => (
                            <tr key={inv._id}>
                              <td className="font-mono font-bold">{inv.invoiceNumber}</td>
                              <td className="font-bold">{inv.customerName || inv.customer?.name}</td>
                              <td className="text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                              <td className="text-right font-extrabold">Rs. {inv.amount?.toLocaleString()}</td>
                              <td className="text-center">
                                <span className={`badge ${inv.status === 'paid' ? 'badge--green' : new Date(inv.dueDate) < new Date() ? 'badge--red animate-pulse' : 'badge--yellow'}`}>
                                  {inv.status === 'paid' ? 'Paid' : new Date(inv.dueDate) < new Date() ? 'Overdue' : 'Unpaid'}
                                </span>
                              </td>
                              <td className="text-right">
                                {inv.status !== 'paid' && (
                                  <button
                                    onClick={() => handleSettleInvoice(inv._id)}
                                    className="btn btn--primary btn--sm"
                                    style={{ border: 'none' }}
                                  >
                                    Mark Paid
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <form onSubmit={handleAddInvoice} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">Deploy Customer Invoice</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Invoice Code</label>
                        <input
                          type="text" required placeholder="Invoice Code (e.g. INV-2026-104)"
                          value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Billing Customer</label>
                        <select
                          required value={invoiceForm.customerId} onChange={e => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                          className="fi"
                        >
                          <option value="">Select Billing Customer</option>
                          {customers.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Total Invoice Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="Total Invoice Amount (Rs.)"
                          value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Invoice Due Date</label>
                        <input
                          type="date" required
                          value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', border: 'none', padding: '12px' }}>
                        Deploy Invoice
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: GST ================= */}
          {activePage === 'gst' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.gst} - {t.gst_sub}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-bold mb-3">Estimated GST Liability Breakdown</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="card" style={{ padding: '16px', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                        <p className="text-xs font-bold text-slate-400">Total CGST (9%)</p>
                        <p className="text-2xl font-black mt-1">Rs. {(stats?.totalReceivables * 0.09).toFixed(0)}</p>
                      </div>
                      <div className="card" style={{ padding: '16px', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                        <p className="text-xs font-bold text-slate-400">Total SGST (9%)</p>
                        <p className="text-2xl font-black mt-1">Rs. {(stats?.totalReceivables * 0.09).toFixed(0)}</p>
                      </div>
                      <div className="card" style={{ padding: '16px', backgroundColor: isDark ? 'rgba(20, 184, 166, 0.1)' : 'rgba(20, 184, 166, 0.05)', borderColor: '#14b8a6' }}>
                        <p className="text-xs font-bold text-teal-600">Net Tax Payable (18%)</p>
                        <p className="text-2xl font-black text-teal-500 mt-1">Rs. {(stats?.totalReceivables * 0.18).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 className="text-lg font-bold">Filing Return History logs</h4>
                    <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Filing Period</th>
                            <th>Date Filed</th>
                            <th className="text-right">CGST</th>
                            <th className="text-right">SGST</th>
                            <th className="text-right">Total Paid</th>
                            <th className="text-center">Filing Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gstFilings.length === 0 ? (
                            <tr><td colSpan="6" className="p-4 text-center text-slate-400">No filed returns logged</td></tr>
                          ) : (
                            gstFilings.map(filing => (
                              <tr key={filing._id}>
                                <td className="font-bold">{filing.period}</td>
                                <td className="text-slate-500">{new Date(filing.filedAt).toLocaleDateString()}</td>
                                <td className="text-right">Rs. {filing.cgst}</td>
                                <td className="text-right">Rs. {filing.sgst}</td>
                                <td className="text-right font-extrabold text-teal-600">Rs. {filing.totalGstPaid}</td>
                                <td className="text-center">
                                  <span className="badge badge--green">
                                    {filing.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div>
                  <form onSubmit={handleFileGst} className="card" style={{ padding: '24px' }}>
                    <h4 className="text-lg font-extrabold mb-3">File GST Return</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>Filing Period</label>
                        <input
                          type="text" required placeholder="Filing Period (e.g. May 2026)"
                          value={gstForm.period} onChange={e => setGstForm({ ...gstForm, period: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>CGST Filed Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="CGST Filed Amount (Rs.)"
                          value={gstForm.cgst} onChange={e => setGstForm({ ...gstForm, cgst: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>SGST Filed Amount (Rs.)</label>
                        <input
                          type="number" required placeholder="SGST Filed Amount (Rs.)"
                          value={gstForm.sgst} onChange={e => setGstForm({ ...gstForm, sgst: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <div className="fg" style={{ marginBottom: 0 }}>
                        <label>IGST Filed Amount (Rs.)</label>
                        <input
                          type="number" placeholder="IGST Filed Amount (Rs.)"
                          value={gstForm.igst} onChange={e => setGstForm({ ...gstForm, igst: e.target.value })}
                          className="fi"
                        />
                      </div>
                      <button type="submit" className="btn btn--primary w-full" style={{ justifyContent: 'center', border: 'none', padding: '12px' }}>
                        Authorize Return Filing
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: EXPENSES ================= */}
          {activePage === 'expenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="text-3xl font-extrabold">{t.expenses} - {t.expenses_sub}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {expenses.filter(e => !e.approved).length === 0 ? (
                  <div className="col-span-2 p-12 text-center text-slate-400 bg-slate-50 border-2 border-dashed rounded-3xl" style={{ borderStyle: 'dashed', borderWidth: '2px', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                    🎉 Excellent! All business expenses have been fully approved.
                  </div>
                ) : (
                  expenses.filter(e => !e.approved).map(e => (
                    <div key={e._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                      <div>
                        <div className="flex justify-between items-start">
                          <h5 className="font-extrabold text-xl">{e.title}</h5>
                          <span className="badge badge--blue" style={{ textTransform: 'capitalize' }}>
                            {e.category || 'General'}
                          </span>
                        </div>
                        <p className="text-3xl font-black mt-2">Rs. {e.amount?.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(e.date).toLocaleDateString()}</p>
                        {e.notes && <p className="text-sm mt-3 italic card" style={{ padding: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: 'none' }}>"{e.notes}"</p>}
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={() => handleApproveExpense(e._id)}
                          className="btn btn--primary w-full"
                          style={{ border: 'none', padding: '12px', justifyContent: 'center', backgroundColor: '#8b5cf6' }}
                        >
                          Verify & Approve Expense
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: SETTINGS ================= */}
          {activePage === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
              <h2 className="text-3xl font-extrabold tracking-tight text-center">{t.settings}</h2>

              <div className={`p-8 rounded-3xl shadow-lg border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                } space-y-8`}>

                {/* 1. Basic Layout Settings (Theme & Language side-by-side in grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Theme */}
                  <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t.theme}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button" onClick={() => changeTheme('light')}
                        className={`py-2.5 text-center text-xs font-extrabold rounded-xl border transition-all duration-200 ${!isDark ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-755 hover:text-slate-200'}`}
                      >
                        ☀ {t.light}
                      </button>
                      <button
                        type="button" onClick={() => changeTheme('dark')}
                        className={`py-2.5 text-center text-xs font-extrabold rounded-xl border transition-all duration-200 ${isDark ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'}`}
                      >
                        🌙 {t.dark}
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t.lang}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button" onClick={() => changeLanguage('en')}
                        className={`py-2.5 text-center text-[10px] font-extrabold rounded-xl border transition-all duration-200 ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-755' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300')}`}
                      >
                        English
                      </button>
                      <button
                        type="button" onClick={() => changeLanguage('hi')}
                        className={`py-2.5 text-center text-[10px] font-extrabold rounded-xl border transition-all duration-200 ${lang === 'hi' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-755' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300')}`}
                      >
                        हिंदी
                      </button>
                      <button
                        type="button" onClick={() => changeLanguage('mr')}
                        className={`py-2.5 text-center text-[10px] font-extrabold rounded-xl border transition-all duration-200 ${lang === 'mr' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-755' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300')}`}
                      >
                        मराठी
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Premium Inline Action Utilities (All in one line) */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-150'} space-y-4`}>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t.lang === 'hi' ? 'त्वरित उपयोगिताएँ' : (t.lang === 'mr' ? 'त्वरित उपयुक्तता' : 'System Operations & Utilities')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Help & Contact Button */}
                    <button
                      type="button"
                      onClick={() => setShowHelpDetails(prev => !prev)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-xs transition active:scale-95 shadow-sm ${isDark
                          ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-750'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {showHelpDetails ? 'Hide Support' : 'Help & Contact'}
                    </button>

                    {/* System Backup Button */}
                    <button
                      type="button"
                      onClick={handleSystemBackup}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-xs transition active:scale-95 shadow-sm ${isDark
                          ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-750'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Backup Database
                    </button>

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={logout}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition active:scale-95 shadow-sm shadow-rose-600/10"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Secure Sign Out
                    </button>
                  </div>

                  {/* Help Details Dropdown panel */}
                  {showHelpDetails && (
                    <div className={`p-4 rounded-xl border transition-all duration-300 text-xs text-left space-y-2 mt-2 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                      <p className="font-extrabold text-blue-500 mb-1">📞 KHATAFLOW ENTERPRISE HELP CENTER</p>
                      <p>👥 **Account Operator Support Desk** is online Monday - Saturday: 9:00 AM - 7:00 PM IST.</p>
                      <p>✉️ **Email Support**: `support@khataflow.com` (Average response time: 2 hours)</p>
                      <p>📞 **Helpline Toll-Free**: `+91 1800 234 5678` / Direct Helpline: `+91 98765 43210`</p>
                      <p>💡 **Quick Tip**: You can use the Voice Search bar at the top global header to find any customer details instantly by clicking the mic icon and speaking their name.</p>
                    </div>
                  )}
                </div>

                {/* Save & Apply Settings */}
                <button
                  onClick={closePage}
                  className="w-full bg-blue-600 text-white p-4 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition duration-200 shadow-md shadow-blue-600/10 active:scale-[0.99]"
                >
                  {t.save_settings}
                </button>
              </div>
            </div>
          )}

          {/* ================= SOLID PAGE: NOTIFICATIONS ================= */}
          {activePage === 'notifications' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl font-extrabold">{t.notifications}</h2>
              <div className="space-y-4">
                {criticalCount === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-100 rounded-3xl border">
                    🔔 {t.no_notifications}
                  </div>
                ) : (
                  <>
                    {(stats?.overdueCount > 0) && (
                      <div
                        onClick={() => openPage('overdue')}
                        className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl cursor-pointer hover:shadow-md transition flex items-center gap-4"
                      >
                        <div className="p-3 bg-rose-500 rounded-xl text-white">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-md">{t.notify_overdue.replace('{count}', stats.overdueCount)}</p>
                          <p className="text-xs text-rose-500 font-semibold mt-0.5">Click here to navigate to Overdues resolver</p>
                        </div>
                      </div>
                    )}

                    {(stats?.pendingExpenseApprovals > 0) && (
                      <div
                        onClick={() => openPage('expenses')}
                        className="p-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl cursor-pointer hover:shadow-md transition flex items-center gap-4"
                      >
                        <div className="p-3 bg-blue-500 rounded-xl text-white">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-md">{t.notify_expenses.replace('{count}', stats.pendingExpenseApprovals)}</p>
                          <p className="text-xs text-blue-500 font-semibold mt-0.5">Click here to navigate to Approvals sheet</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* OVERVIEW DASHBOARD VIEW (SwiftDrop Format) - HIGH DENSITY SINGLE PAGE FRAME */
        <div className="space-y-3.5 animate-fadeIn">

          {/* Header Bar */}
          <header className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div>
              <span className="text-[10px] font-black tracking-widest text-cyan-600 block mb-0.5 uppercase">
                {t.today}
              </span>
              <h1 className={`text-2xl font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.dashboard}
              </h1>
            </div>

            {/* Space utility */}
            <div className="w-4" />
          </header>

          {/* Statistics Section and Performance Ring Row */}
          <div className="space-y-3.5">

            {/* Top Grid of 8 High-Impact Clickable Cards (CRM Dashboard Theme) - Premium Spacious Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

              {/* Card 1: Total Receivables */}
              <div
                onClick={() => openPage('receivables')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view customer receivables"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Rs. {(stats?.totalReceivables ?? 0).toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Receivables</p>
                  <p className="text-[11px] text-slate-400 font-medium">Outstanding collections</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Total Payables */}
              <div
                onClick={() => openPage('payables')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view supplier payables"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Rs. {(stats?.totalPayables ?? 0).toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Payables</p>
                  <p className="text-[11px] text-slate-400 font-medium">Owed to suppliers</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Cash In Hand */}
              <div
                onClick={() => openPage('cash')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view cash book"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Rs. {(stats?.cashInHand ?? 0).toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Cash In Hand</p>
                  <p className="text-[11px] text-slate-400 font-medium">Physical cash balance</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Bank Balance */}
              <div
                onClick={() => openPage('bank')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view bank ledger"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Rs. {(stats?.bankBalance ?? 0).toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Bank Balance</p>
                  <p className="text-[11px] text-slate-400 font-medium">Reconciled bank ledger</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              {/* Card 5: Today's Transactions Summary */}
              <div
                onClick={() => openPage('transactions')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view today's transactions"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{(stats?.todaysTransactions ?? 0)} Logs</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Today's Transactions</p>
                  <p className="text-[11px] text-slate-400 font-medium">View transactions log</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                </div>
              </div>

              {/* Card 6: Overdue Payments Count */}
              <div
                onClick={() => openPage('overdue')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view overdue collections"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{(stats?.overdueCount ?? 0)} Overdue</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overdue Payments</p>
                  <p className="text-[11px] text-slate-400 font-medium">Requires collection action</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Card 7: GST Filing Status */}
              <div
                onClick={() => openPage('gst')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view GST logs"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{(stats?.gstFilingStatus ? stats.gstFilingStatus.replace('Filed for ', '') : 'Pending Filing')}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">GST Filing Status</p>
                  <p className="text-[11px] text-slate-400 font-medium">Tax filing logs</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              {/* Card 8: Pending Expense Approvals */}
              <div
                onClick={() => openPage('expenses')}
                className="card card--lift cursor-pointer flex items-center justify-between"
                title="Click to view pending expenses"
              >
                <div className="space-y-2.5">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{(stats?.pendingExpenseApprovals ?? 0)} Awaiting</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Expenses</p>
                  <p className="text-[11px] text-slate-400 font-medium">Needs review & signoff</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                </div>
              </div>

            </div>
            {/* Core Visual Panels Row - Compact 2-Column Layout, featuring massive premium donut visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="card flex flex-col justify-between h-[310px]">
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.pipeline_title}</h4>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mt-4 w-full">
                    {/* SVG Segment Donut (Scaled up to h-[180px] w-[180px] to fill space!) */}
                    <div className="relative flex items-center justify-center h-[180px] w-[180px] shrink-0">
                      <svg className="h-full w-full transform -rotate-90 animate-chart-spin" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />

                        {/* Receivables segment */}
                        {recPercent > 0 && (
                          <circle
                            onClick={() => openPage('receivables')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#3B82F6" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * recPercent) / 100}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-blue-700 transition duration-305 animate-chart-donut"
                            title="Click to view Receivables ledger"
                          />
                        )}

                        {/* Cash segment */}
                        {cashPercent > 0 && (
                          <circle
                            onClick={() => openPage('cash')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#10B981" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * cashPercent) / 100}
                            transform={`rotate(${(recPercent / 100) * 360} 50 50)`}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-emerald-700 transition duration-305 animate-chart-donut"
                            title="Click to view Cash Book"
                          />
                        )}

                        {/* Bank segment */}
                        {bankPercent > 0 && (
                          <circle
                            onClick={() => openPage('bank')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#06B6D4" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * bankPercent) / 100}
                            transform={`rotate(${((recPercent + cashPercent) / 100) * 360} 50 50)`}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-cyan-700 transition duration-305 animate-chart-donut"
                            title="Click to view Bank Book"
                          />
                        )}
                      </svg>

                      {/* Absolute Center Count text - scaled up */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                          Rs. {(totalAssetsVal / 1000).toFixed(0)}k
                        </span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                          {t.asset}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend - Larger font and wider margins */}
                    <div className="space-y-2.5 text-sm font-extrabold text-slate-500 flex-1 max-w-sm w-full">
                      <div onClick={() => openPage('receivables')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0"></span>Receivables</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">{recPercent.toFixed(0)}%</span>
                      </div>
                      <div onClick={() => openPage('cash')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"></span>Cash</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">{cashPercent.toFixed(0)}%</span>
                      </div>
                      <div onClick={() => openPage('bank')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shrink-0"></span>Bank</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">{bankPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card flex flex-col justify-between h-[310px]">
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.loss_reasons_title}</h4>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mt-4 w-full">
                    {/* SVG Segment Pie/Donut (Scaled up to h-[180px] w-[180px] to fill space!) */}
                    <div className="relative flex items-center justify-center h-[180px] w-[180px] shrink-0">
                      <svg className="h-full w-full transform -rotate-90 animate-chart-spin" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />

                        {/* Utility segment */}
                        {utilPercent > 0 && (
                          <circle
                            onClick={() => openPage('expenses')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#3b82f6" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * utilPercent) / 100}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-blue-600 transition duration-300 animate-chart-donut"
                            title="Click to view utilities expenses"
                          />
                        )}

                        {/* Office segment */}
                        {offPercent > 0 && (
                          <circle
                            onClick={() => openPage('expenses')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#1d4ed8" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * offPercent) / 100}
                            transform={`rotate(${(utilPercent) * 3.6} 50 50)`}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-blue-800 transition duration-300 animate-chart-donut"
                            title="Click to view office expenses"
                          />
                        )}

                        {/* Technology segment */}
                        {tecPercent > 0 && (
                          <circle
                            onClick={() => openPage('expenses')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#60a5fa" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * tecPercent) / 100}
                            transform={`rotate(${(utilPercent + offPercent) * 3.6} 50 50)`}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-blue-400 transition duration-300 animate-chart-donut"
                            title="Click to view technology expenses"
                          />
                        )}

                        {/* Other segment */}
                        {othPercent > 0 && (
                          <circle
                            onClick={() => openPage('expenses')}
                            cx="50" cy="50" r="40"
                            fill="transparent" stroke="#93c5fd" strokeWidth="14"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * othPercent) / 100}
                            transform={`rotate(${(utilPercent + offPercent + tecPercent) * 3.6} 50 50)`}
                            strokeLinecap="round"
                            className="cursor-pointer hover:stroke-blue-300 transition duration-305 animate-chart-donut"
                            title="Click to view other expenses"
                          />
                        )}
                      </svg>

                      {/* Absolute Center text */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                          {totalExpensesVal >= 1000 ? `Rs. ${(totalExpensesVal / 1000).toFixed(1)}k` : `Rs. ${totalExpensesVal}`}
                        </span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                          Expenses
                        </span>
                      </div>
                    </div>

                    {/* Pie Legend */}
                    <div className="space-y-2.5 text-sm font-extrabold text-slate-500 flex-1 max-w-sm w-full">
                      <div onClick={() => openPage('expenses')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0"></span>Utilities ({utilPercent.toFixed(0)}%)</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">Rs. {utilitiesVal.toLocaleString()}</span>
                      </div>
                      <div onClick={() => openPage('expenses')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-blue-700 shrink-0"></span>Office ({offPercent.toFixed(0)}%)</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">Rs. {officeVal.toLocaleString()}</span>
                      </div>
                      <div onClick={() => openPage('expenses')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-blue-400 shrink-0"></span>Tech ({tecPercent.toFixed(0)}%)</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">Rs. {techVal.toLocaleString()}</span>
                      </div>
                      {othPercent > 0 && (
                        <div onClick={() => openPage('expenses')} className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                          <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 rounded-full bg-blue-300 shrink-0"></span>Other ({othPercent.toFixed(0)}%)</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg text-[11px]">Rs. {otherVal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>


        </div>

      )}
    </div>
  );
};

export default Dashboard;
