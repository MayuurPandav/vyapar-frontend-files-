import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Party Management",
    desc: "Manage customer ledgers, supplier payments, collections, and ageing analysis.",
    customersTab: "Customer Ledgers",
    suppliersTab: "Supplier Ledgers",
    remindersTab: "Reminders & Collections",
    ageingTab: "Outstanding & Ageing",
    customerList: "Customer Ledgers",
    supplierList: "Supplier Ledgers",
    outstanding: "Outstanding Balance",
    owed: "Owed Balance",
    actions: "Actions",
    recordReceived: "Record Payment Received",
    recordMade: "Record Payment Made",
    sendReminder: "Send Reminder",
    totalReceivables: "Total Net Receivables",
    totalPayables: "Total Net Payables",
    netPosition: "Net Position",
    ageingAnalysis: "Invoice Ageing Analysis Matrix",
    bucketCurrent: "Current",
    bucket1_30: "1 - 30 Days",
    bucket31_60: "31 - 60 Days",
    bucket61_90: "61 - 90 Days",
    bucket90Plus: "90+ Days",
    total: "Total",
    close: "Close",
    amountLabel: "Amount (Rs.)",
    dateLabel: "Transaction Date",
    paymentMode: "Payment Mode (Cash/Bank)",
    narration: "Narration",
    save: "Save Transaction",
    selectCustomer: "Select Customer",
    selectSupplier: "Select Supplier Ledger",
    reminderSent: "Reminder dispatched successfully!",
    paymentRecorded: "Payment recorded and double-entry logged in Day Book!",
    createSupplier: "Add New Supplier Ledger",
    supplierName: "Supplier/Liability Name",
    ledgerCreated: "Supplier ledger created successfully!",
    noCustomers: "No customers registered.",
    noSuppliers: "No supplier accounts found.",
    noOverdues: "No outstanding customer invoices found.",
    invoiceNo: "Invoice No.",
    customerName: "Customer Name",
    dueDate: "Due Date",
    daysOverdue: "Days Overdue",
    status: "Status"
  },
  hi: {
    title: "पक्ष प्रबंधन",
    desc: "ग्राहक बहीखाता, आपूर्तिकर्ता भुगतान, संग्रह और उम्र बढ़ने के विश्लेषण का प्रबंधन करें।",
    customersTab: "ग्राहक बहीखाता",
    suppliersTab: "आपूर्तिकर्ता बहीखाता",
    remindersTab: "रिमाइंडर और संग्रह",
    ageingTab: "बकाया और आयु रिपोर्ट",
    customerList: "ग्राहक खाता बही",
    supplierList: "आपूर्तिकर्ता खाता बही",
    outstanding: "बकाया राशि",
    owed: "देय राशि",
    actions: "कार्रवाई",
    recordReceived: "भुगतान प्राप्त दर्ज करें",
    recordMade: "भुगतान भुगतान दर्ज करें",
    sendReminder: "रिमाइंडर भेजें",
    totalReceivables: "कुल शुद्ध प्राप्य (Receivables)",
    totalPayables: "कुल शुद्ध देय (Payables)",
    netPosition: "शुद्ध बकाया स्थिति",
    ageingAnalysis: "चालान आयु विश्लेषण मैट्रिक्स",
    bucketCurrent: "चालू",
    bucket1_30: "1 - 30 दिन",
    bucket31_60: "31 - 60 दिन",
    bucket61_90: "61 - 90 दिन",
    bucket90Plus: "90+ दिन",
    total: "कुल",
    close: "बंद करें",
    amountLabel: "राशि (Rs.)",
    dateLabel: "लेनदेन की तिथि",
    paymentMode: "भुगतान मोड (रोकड़/बैंक)",
    narration: "विवरण",
    save: "लेनदेन सहेजें",
    selectCustomer: "ग्राहक चुनें",
    selectSupplier: "आपूर्तिकर्ता बही चुनें",
    reminderSent: "रिमाइंडर सफलतापूर्वक भेजा गया!",
    paymentRecorded: "भुगतान दर्ज किया गया और रोजनामचा में डबल-एंट्री लॉग की गई!",
    createSupplier: "नया आपूर्तिकर्ता बही जोड़ें",
    supplierName: "आपूर्तिकर्ता/देयता नाम",
    ledgerCreated: "आपूर्तिकर्ता खाता बही सफलतापूर्वक बनाई गई!",
    noCustomers: "कोई ग्राहक पंजीकृत नहीं है।",
    noSuppliers: "कोई आपूर्तिकर्ता खाता नहीं मिला।",
    noOverdues: "कोई बकाया ग्राहक चालान नहीं मिला।",
    invoiceNo: "चालान संख्या",
    customerName: "ग्राहक का नाम",
    dueDate: "नियत तारीख",
    daysOverdue: "देरी के दिन",
    status: "स्थिति"
  },
  mr: {
    title: "पक्ष व्यवस्थापन",
    desc: "ग्राहक खातेवही, पुरवठादार पेमेंट, संग्रह आणि थकबाकी विश्लेषण व्यवस्थापित करा.",
    customersTab: "ग्राहक खातेवही",
    suppliersTab: "पुरवठादार खातेवही",
    remindersTab: "रिमाइंडर आणि संग्रह",
    ageingTab: "थकबाकी आणि एजिंग रिपोर्ट",
    customerList: "ग्राहक खातेवही",
    supplierList: "पुरवठादार खातेवही",
    outstanding: "थकबाकी रक्कम",
    owed: "देणी रक्कम",
    actions: "कृती",
    recordReceived: "पेमेंट मिळाल्याची नोंद करा",
    recordMade: "पेमेंट केल्याची नोंद करा",
    sendReminder: "रिमाइंडर पाठवा",
    totalReceivables: "एकूण निव्वळ येणे (Receivables)",
    totalPayables: "एकूण निव्वळ देणे (Payables)",
    netPosition: "निव्वळ थकबाकी स्थिती",
    ageingAnalysis: "इनव्हॉइस थकबाकी विश्लेषण मॅट्रिक्स",
    bucketCurrent: "चालू (Current)",
    bucket1_30: "1 - 30 दिवस",
    bucket31_60: "31 - 60 दिवस",
    bucket61_90: "61 - 90 दिवस",
    bucket90Plus: "90+ दिवस",
    total: "एकूण",
    close: "बंद करा",
    amountLabel: "रक्कम (Rs.)",
    dateLabel: "व्यवहार तारीख",
    paymentMode: "पेमेंट मोड (रोकड/बँक)",
    narration: "तपशील",
    save: "व्यवहार जतन करा",
    selectCustomer: "ग्राहक निवडा",
    selectSupplier: "पुरवठादार खातेवही निवडा",
    reminderSent: "रिमाइंडर यशस्वीरित्या पाठवला!",
    paymentRecorded: "पेमेंट नोंदवले गेले आणि रोजकिर्द मध्ये डबल-एंट्री लॉग केली!",
    createSupplier: "नवीन पुरवठादार खातेवही जोडा",
    supplierName: "पुरवठादार/देयता नाव",
    ledgerCreated: "पुरवठादार खातेवही यशस्वीरित्या तयार केली!",
    noCustomers: "ग्राहक यादी आढळली नाही.",
    noSuppliers: "पुरवठादार खाती आढळली नाहीत.",
    noOverdues: "थकबाकी असलेले कोणतेही ग्राहक इनव्हॉइस आढळले नाहीत.",
    invoiceNo: "इनव्हॉइस क्र.",
    customerName: "ग्राहकाचे नाव",
    dueDate: "देय तारीख",
    daysOverdue: "विलंब दिवस",
    status: "स्थिती"
  }
};

const Parties = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'suppliers', 'reminders', 'ageing'
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [drillModal, setDrillModal] = useState(null);

  // Core Data
  const [customers, setCustomers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  // Custom non-blocking visual Toast Notification State
  const [toast, setToast] = useState(null);

  // Modals & Forms State
  const [showRecModal, setShowRecModal] = useState(false);
  const [showMadeModal, setShowMadeModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Form states
  const [paymentRecForm, setPaymentRecForm] = useState({
    customerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    cashBankLedgerId: '',
    narration: ''
  });

  const [paymentMadeForm, setPaymentMadeForm] = useState({
    supplierLedgerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    cashBankLedgerId: '',
    narration: ''
  });

  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    balance: ''
  });

  const [selectedReminder, setSelectedReminder] = useState(null);
  const [reminderTemplate, setReminderTemplate] = useState({
    channel: 'sms',
    message: ''
  });

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchData = async () => {
    try {
      const custRes = await api.get('/customers');
      setCustomers(custRes.data.data || []);

      const ledgRes = await api.get('/ledgers');
      setLedgers(ledgRes.data.data || []);

      const invRes = await api.get('/dashboard/invoices');
      setInvoices(invRes.data.data || []);
    } catch (err) {
      console.error("Error fetching parties data:", err);
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  useEffect(() => {
    fetchData();

    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    const handleThemeChange = () => setTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Filter accounts
  const cashBankLedgers = ledgers.filter(l => l.name === 'Cash' || l.name === 'Bank');
  const supplierLedgers = ledgers.filter(l => l.type === 'liability');
  const receivablesLedger = ledgers.find(l => l.name.toLowerCase().includes('receivable')) || ledgers.find(l => l.name === 'Cash');

  // Trigger forms opening
  const openPaymentReceived = (customer) => {
    setPaymentRecForm({
      customerId: customer._id,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      cashBankLedgerId: cashBankLedgers[0]?._id || '',
      narration: `Payment received from ${customer.name}`
    });
    setShowRecModal(true);
  };

  const openPaymentMade = (supplier) => {
    setPaymentMadeForm({
      supplierLedgerId: supplier._id,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      cashBankLedgerId: cashBankLedgers[0]?._id || '',
      narration: `Payment made to ${supplier.name}`
    });
    setShowMadeModal(true);
  };

  // Submit payment received from Customer
  const handlePaymentRecSubmit = async (e) => {
    e.preventDefault();
    const { customerId, amount, date, cashBankLedgerId, narration } = paymentRecForm;

    if (!customerId || !amount || !cashBankLedgerId) {
      triggerToast("Please fill all required fields", "error");
      return;
    }

    try {
      const selectedCustomer = customers.find(c => c._id === customerId);
      if (!selectedCustomer) return;

      // 1. Create a Journal Entry
      await api.post('/journals', {
        date,
        narration: narration || `Cash receipt from customer ${selectedCustomer.name}`,
        entries: [
          { ledger: cashBankLedgerId, type: 'debit', amount: Number(amount) },
          { ledger: receivablesLedger?._id || cashBankLedgerId, type: 'credit', amount: Number(amount) }
        ]
      });

      // 2. Reduce Customer opening Balance
      const newBal = Math.max(0, (selectedCustomer.openingBalance || 0) - Number(amount));
      await api.put(`/customers/${customerId}`, { openingBalance: newBal });

      triggerToast(t.paymentRecorded, 'success');
      setShowRecModal(false);
      fetchData();
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  // Submit payment made to Supplier
  const handlePaymentMadeSubmit = async (e) => {
    e.preventDefault();
    const { supplierLedgerId, amount, date, cashBankLedgerId, narration } = paymentMadeForm;

    if (!supplierLedgerId || !amount || !cashBankLedgerId) {
      triggerToast("Please fill all required fields", "error");
      return;
    }

    try {
      const selectedSupplier = ledgers.find(l => l._id === supplierLedgerId);
      if (!selectedSupplier) return;

      // 1. Create a Journal Entry
      await api.post('/journals', {
        date,
        narration: narration || `Cash payment to supplier ${selectedSupplier.name}`,
        entries: [
          { ledger: supplierLedgerId, type: 'debit', amount: Number(amount) },
          { ledger: cashBankLedgerId, type: 'credit', amount: Number(amount) }
        ]
      });

      // 2. Deduct from Liability Ledger balance directly in the database
      const newBal = Math.max(0, (selectedSupplier.balance || 0) - Number(amount));
      await api.put(`/ledgers/${supplierLedgerId}`, { balance: newBal });

      triggerToast(t.paymentRecorded, 'success');
      setShowMadeModal(false);
      fetchData();
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  // Create Supplier Ledger
  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    const { name, balance } = newSupplierForm;
    if (!name) {
      triggerToast("Name is required", "error");
      return;
    }

    try {
      await api.post('/ledgers', {
        name,
        type: 'liability',
        balance: Number(balance || 0)
      });

      triggerToast(t.ledgerCreated, 'success');
      setShowAddSupplierModal(false);
      setNewSupplierForm({ name: '', balance: '' });
      fetchData();
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  // Open Payment Reminder Modal
  const openReminderModal = (invoice) => {
    setSelectedReminder(invoice);
    const dateStr = new Date(invoice.dueDate).toLocaleDateString();
    setReminderTemplate({
      channel: 'sms',
      message: `Dear ${invoice.customerName}, this is a friendly reminder that invoice ${invoice.invoiceNumber} for Rs. ${invoice.amount} was due on ${dateStr}. Please settle the outstanding amount at your earliest convenience. Thank you!`
    });
    setShowReminderModal(true);
  };

  const handleReminderChannelChange = (channel) => {
    if (!selectedReminder) return;
    const dateStr = new Date(selectedReminder.dueDate).toLocaleDateString();
    const msg = channel === 'sms' 
      ? `Dear ${selectedReminder.customerName}, this is a friendly reminder that invoice ${selectedReminder.invoiceNumber} for Rs. ${selectedReminder.amount} was due on ${dateStr}. Please settle it at your earliest convenience. Thank you!`
      : `Subject: Overdue Payment Notice - ${selectedReminder.invoiceNumber}\n\nDear ${selectedReminder.customerName},\n\nWe would like to remind you that your invoice ${selectedReminder.invoiceNumber} totaling Rs. ${selectedReminder.amount} remains unpaid. The due date was ${dateStr}.\n\nPlease arrange for payment as soon as possible.\n\nWarm regards,\nAccounts Team`;
    
    setReminderTemplate({ channel, message: msg });
  };

  const dispatchReminder = () => {
    if (!selectedReminder) return;

    const custId = selectedReminder.customer?._id || selectedReminder.customer;
    const customerObj = customers.find(c => c._id === custId);

    if (reminderTemplate.channel === 'sms') {
      let cleanedPhone = (customerObj?.phone || '').replace(/\D/g, '');
      if (cleanedPhone.length === 10) {
        cleanedPhone = '91' + cleanedPhone;
      }
      
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(reminderTemplate.message)}`;
      window.open(waUrl, '_blank');
      triggerToast("Opening WhatsApp...", "success");
    } else {
      const emailAddress = customerObj?.email || '';
      const subject = `Overdue Payment Notice - ${selectedReminder.invoiceNumber}`;
      const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reminderTemplate.message)}`;
      window.location.href = mailtoUrl;
      triggerToast("Opening Email Client...", "success");
    }

    setShowReminderModal(false);
  };

  // Calculations for Ageing & Summary Cards
  const totalReceivables = customers.reduce((sum, c) => sum + (c.openingBalance || 0), 0);
  const totalPayables = supplierLedgers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const netPosition = totalReceivables - totalPayables;

  // Process Invoices for Ageing Matrix
  const processedAgeing = () => {
    const today = new Date();
    
    // Group by customer ID
    const customerAgeing = {};

    // Initialise customer rows
    customers.forEach(cust => {
      customerAgeing[cust._id] = {
        name: cust.name,
        current: 0,
        age1_30: 0,
        age31_60: 0,
        age61_90: 0,
        age90Plus: 0,
        total: 0
      };
    });

    invoices.forEach(inv => {
      if (inv.status === 'paid') return;
      const custId = inv.customer?._id || inv.customer;
      if (!customerAgeing[custId]) return;

      const dueDate = new Date(inv.dueDate);
      const diffTime = today - dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const amount = Number(inv.amount || 0);

      if (diffDays <= 0) {
        customerAgeing[custId].current += amount;
      } else if (diffDays <= 30) {
        customerAgeing[custId].age1_30 += amount;
      } else if (diffDays <= 60) {
        customerAgeing[custId].age31_60 += amount;
      } else if (diffDays <= 90) {
        customerAgeing[custId].age61_90 += amount;
      } else {
        customerAgeing[custId].age90Plus += amount;
      }
      customerAgeing[custId].total += amount;
    });

    return Object.values(customerAgeing).filter(item => item.total > 0 || customers.some(c => c.name === item.name && c.openingBalance > 0));
  };

  const ageingRows = processedAgeing();
  const ageingGrandTotals = ageingRows.reduce((acc, row) => {
    acc.current += row.current;
    acc.age1_30 += row.age1_30;
    acc.age31_60 += row.age31_60;
    acc.age61_90 += row.age61_90;
    acc.age90Plus += row.age90Plus;
    acc.total += row.total;
    return acc;
  }, { current: 0, age1_30: 0, age31_60: 0, age61_90: 0, age90Plus: 0, total: 0 });

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notification Element */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn">
          <div className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-xl border text-sm font-black font-sans uppercase tracking-wider ${
            toast.type === 'error' 
              ? 'bg-rose-50 text-rose-600 border-rose-100' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            <span className="h-2 w-2 rounded-full bg-current"></span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Receivables Card */}
        <div 
          className="card card--lift" 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={() => setDrillModal({
            title: t.totalReceivables || "Total Net Receivables",
            cols: ['Customer Name', 'Email', 'Phone', 'Outstanding Dues'],
            rows: customers.filter(c => (c.openingBalance || 0) > 0).map(c => [c.name, c.email || '-', c.phone || '-', `Rs. ${Number(c.openingBalance || 0).toLocaleString()}`])
          })}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.totalReceivables}</div>
          <div className="text-3xl font-black text-blue-600 font-mono">Rs. {totalReceivables.toLocaleString()}</div>
        </div>

        {/* Payables Card */}
        <div 
          className="card card--lift" 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={() => setDrillModal({
            title: t.totalPayables || "Total Net Payables",
            cols: ['Supplier Name', 'Account Type', 'Owed Balance'],
            rows: supplierLedgers.filter(s => (s.balance || 0) > 0).map(s => [s.name, s.type?.toUpperCase() || '-', `Rs. ${Number(s.balance || 0).toLocaleString()}`])
          })}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.totalPayables}</div>
          <div className="text-3xl font-black text-rose-600 font-mono">Rs. {totalPayables.toLocaleString()}</div>
        </div>

        {/* Net Outstanding Card */}
        <div 
          className="card card--lift" 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={() => setDrillModal({
            title: t.netPosition || "Net Position",
            cols: ['Party Name', 'Party Type', 'Balance'],
            rows: [
              ...customers.filter(c => (c.openingBalance || 0) > 0).map(c => [c.name, 'Customer', `Rs. ${Number(c.openingBalance || 0).toLocaleString()}`]),
              ...supplierLedgers.filter(s => (s.balance || 0) > 0).map(s => [s.name, 'Supplier', `Rs. -${Number(s.balance || 0).toLocaleString()}`])
            ]
          })}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.netPosition}</div>
          <div className={`text-3xl font-black font-mono ${netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            Rs. {netPosition.toLocaleString()}
          </div>
        </div>

      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-8 font-sans">
        {[
          { id: 'customers', label: t.customersTab },
          { id: 'suppliers', label: t.suppliersTab },
          { id: 'reminders', label: t.remindersTab },
          { id: 'ageing', label: t.ageingTab }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold border-b-2 border-0 transition duration-200 whitespace-nowrap active:scale-95 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-205'
            }`}
            style={{ background: 'none' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">

        {/* Tab 1: Customer Ledgers */}
        {activeTab === 'customers' && (
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">{t.customerList}</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th className="text-right">{t.outstanding}</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-400">{t.noCustomers}</td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c._id}>
                      <td className="font-black">{c.name}</td>
                      <td className="text-xs text-slate-400">
                        {c.email && <div className="font-mono">{c.email}</div>}
                        {c.phone && <div>{c.phone}</div>}
                      </td>
                      <td className="text-right font-black text-blue-600 font-mono">Rs. {c.openingBalance?.toLocaleString()}</td>
                      <td className="text-right">
                        <button
                          onClick={() => openPaymentReceived(c)}
                          className="btn btn--primary btn--sm"
                        >
                          {t.recordReceived}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Supplier Ledgers */}
        {activeTab === 'suppliers' && (
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">{t.supplierList}</h2>
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="btn btn--primary btn--sm"
                style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none' }}
              >
                {t.createSupplier}
              </button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Account Type</th>
                  <th className="text-right">{t.owed}</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {supplierLedgers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-400">{t.noSuppliers}</td>
                  </tr>
                ) : (
                  supplierLedgers.map(s => (
                    <tr key={s._id}>
                      <td className="font-black">{s.name}</td>
                      <td className="text-xs text-slate-400 uppercase tracking-widest font-black">{s.type}</td>
                      <td className="text-right font-black text-rose-600 font-mono">Rs. {s.balance?.toLocaleString()}</td>
                      <td className="text-right">
                        <button
                          onClick={() => openPaymentMade(s)}
                          className="btn btn--primary btn--sm"
                          style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none' }}
                        >
                          {t.recordMade}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Reminders & Collections */}
        {activeTab === 'reminders' && (
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">Outstanding Invoices (Receivables)</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t.invoiceNo}</th>
                  <th>{t.customerName}</th>
                  <th className="text-right">{t.amountLabel}</th>
                  <th>{t.dueDate}</th>
                  <th className="text-center">{t.status}</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.filter(inv => inv.status !== 'paid').length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">{t.noOverdues}</td>
                  </tr>
                ) : (
                  invoices.filter(inv => inv.status !== 'paid').map(inv => {
                    const overdue = new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv._id}>
                        <td className="font-mono font-bold text-slate-600">{inv.invoiceNumber}</td>
                        <td className="font-black">{inv.customerName || (inv.customer && inv.customer.name)}</td>
                        <td className="text-right font-black text-slate-800 dark:text-slate-100 font-mono">Rs. {inv.amount?.toLocaleString()}</td>
                        <td className="text-xs text-slate-400 font-mono">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="text-center">
                          <span className={`badge ${overdue ? 'badge--red' : 'badge--yellow'}`}>
                            {overdue ? 'Overdue' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => openReminderModal(inv)}
                            className="btn btn--primary btn--sm"
                            style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none' }}
                          >
                            {t.sendReminder}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Ageing & Outstanding Report */}
        {activeTab === 'ageing' && (
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">{t.ageingAnalysis}</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Customer Party Name</th>
                  <th className="text-right">{t.bucketCurrent}</th>
                  <th className="text-right">{t.bucket1_30}</th>
                  <th className="text-right">{t.bucket31_60}</th>
                  <th className="text-right">{t.bucket61_90}</th>
                  <th className="text-right">{t.bucket90Plus}</th>
                  <th className="text-right font-black">{t.total}</th>
                </tr>
              </thead>
              <tbody>
                {ageingRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">All invoices fully settled! No outstanding balances.</td>
                  </tr>
                ) : (
                  ageingRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-black">{row.name}</td>
                      <td className={`text-right font-mono ${row.current > 0 ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-400'}`}>
                        {row.current > 0 ? `Rs. ${row.current.toLocaleString()}` : '-'}
                      </td>
                      <td className={`text-right font-mono ${row.age1_30 > 0 ? 'text-blue-500 font-bold' : 'text-slate-400'}`}>
                        {row.age1_30 > 0 ? `Rs. ${row.age1_30.toLocaleString()}` : '-'}
                      </td>
                      <td className={`text-right font-mono ${row.age31_60 > 0 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                        {row.age31_60 > 0 ? `Rs. ${row.age31_60.toLocaleString()}` : '-'}
                      </td>
                      <td className={`text-right font-mono ${row.age61_90 > 0 ? 'text-orange-500 font-bold' : 'text-slate-400'}`}>
                        {row.age61_90 > 0 ? `Rs. ${row.age61_90.toLocaleString()}` : '-'}
                      </td>
                      <td className={`text-right font-mono ${row.age90Plus > 0 ? 'text-rose-600 font-black' : 'text-slate-400'}`}>
                        {row.age90Plus > 0 ? `Rs. ${row.age90Plus.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right text-blue-600 font-black font-mono">Rs. {row.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
                {/* Grand Totals */}
                {ageingRows.length > 0 && (
                  <tr className={`border-t-2 font-black ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100/50'}`}>
                    <td className="p-4">Grand Total</td>
                    <td className="text-right font-mono">Rs. {ageingGrandTotals.current.toLocaleString()}</td>
                    <td className="text-right font-mono text-blue-500">Rs. {ageingGrandTotals.age1_30.toLocaleString()}</td>
                    <td className="text-right font-mono text-amber-500">Rs. {ageingGrandTotals.age31_60.toLocaleString()}</td>
                    <td className="text-right font-mono text-orange-500">Rs. {ageingGrandTotals.age61_90.toLocaleString()}</td>
                    <td className="text-right font-mono text-rose-600">Rs. {ageingGrandTotals.age90Plus.toLocaleString()}</td>
                    <td className="text-right text-blue-600 font-mono">Rs. {ageingGrandTotals.total.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* Modal 1: Record Payment Received */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t.recordReceived}</h3>
              <button onClick={() => setShowRecModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            <form onSubmit={handlePaymentRecSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.selectCustomer}</label>
                <select
                  disabled
                  value={paymentRecForm.customerId}
                  onChange={e => setPaymentRecForm({ ...paymentRecForm, customerId: e.target.value })}
                  className="fi"
                >
                  <option value="">-- Choose --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} (Outstanding: Rs. {c.openingBalance})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.amountLabel}</label>
                  <input
                    type="number" required placeholder="0.00"
                    value={paymentRecForm.amount}
                    onChange={e => setPaymentRecForm({ ...paymentRecForm, amount: e.target.value })}
                    className="fi"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.dateLabel}</label>
                  <input
                    type="date" required
                    value={paymentRecForm.date}
                    onChange={e => setPaymentRecForm({ ...paymentRecForm, date: e.target.value })}
                    className="fi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.paymentMode}</label>
                <select
                  required
                  value={paymentRecForm.cashBankLedgerId}
                  onChange={e => setPaymentRecForm({ ...paymentRecForm, cashBankLedgerId: e.target.value })}
                  className="fi"
                >
                  <option value="">-- Select Asset Book --</option>
                  {cashBankLedgers.map(l => (
                    <option key={l._id} value={l._id}>{l.name} Book (Bal: Rs. {l.balance})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.narration}</label>
                <input
                  type="text" placeholder="Transaction details..."
                  value={paymentRecForm.narration}
                  onChange={e => setPaymentRecForm({ ...paymentRecForm, narration: e.target.value })}
                  className="fi"
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary w-full"
                style={{ border: 'none', padding: '14px', justifyContent: 'center' }}
              >
                {t.save}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record Payment Made */}
      {showMadeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t.recordMade}</h3>
              <button onClick={() => setShowMadeModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            <form onSubmit={handlePaymentMadeSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.selectSupplier}</label>
                <select
                  disabled
                  value={paymentMadeForm.supplierLedgerId}
                  onChange={e => setPaymentMadeForm({ ...paymentMadeForm, supplierLedgerId: e.target.value })}
                  className="fi"
                >
                  <option value="">-- Choose --</option>
                  {supplierLedgers.map(s => (
                    <option key={s._id} value={s._id}>{s.name} Ledger (Owed: Rs. {s.balance})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.amountLabel}</label>
                  <input
                    type="number" required placeholder="0.00"
                    value={paymentMadeForm.amount}
                    onChange={e => setPaymentMadeForm({ ...paymentMadeForm, amount: e.target.value })}
                    className="fi"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.dateLabel}</label>
                  <input
                    type="date" required
                    value={paymentMadeForm.date}
                    onChange={e => setPaymentMadeForm({ ...paymentMadeForm, date: e.target.value })}
                    className="fi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.paymentMode}</label>
                <select
                  required
                  value={paymentMadeForm.cashBankLedgerId}
                  onChange={e => setPaymentMadeForm({ ...paymentMadeForm, cashBankLedgerId: e.target.value })}
                  className="fi"
                >
                  <option value="">-- Select Book --</option>
                  {cashBankLedgers.map(l => (
                    <option key={l._id} value={l._id}>{l.name} Book (Bal: Rs. {l.balance})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.narration}</label>
                <input
                  type="text" placeholder="Transaction details..."
                  value={paymentMadeForm.narration}
                  onChange={e => setPaymentMadeForm({ ...paymentMadeForm, narration: e.target.value })}
                  className="fi"
                />
              </div>

              <button
                type="submit"
                className="btn w-full"
                style={{ border: 'none', padding: '14px', justifyContent: 'center', backgroundColor: '#8b5cf6', color: '#ffffff' }}
              >
                {t.save}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Supplier Ledger */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t.createSupplier}</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            <form onSubmit={handleAddSupplierSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.supplierName}</label>
                <input
                  type="text" required placeholder="e.g. Acme Supplier Ltd"
                  value={newSupplierForm.name}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                  className="fi"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Initial Opening Balance Owed (Rs.)</label>
                <input
                  type="number" placeholder="0.00"
                  value={newSupplierForm.balance}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, balance: e.target.value })}
                  className="fi"
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary w-full"
                style={{ border: 'none', padding: '14px', justifyContent: 'center' }}
              >
                {t.createSupplier}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Payment Reminder Details */}
      {showReminderModal && selectedReminder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Prepare Collection Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            
            <div className="space-y-4">
              
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => handleReminderChannelChange('sms')}
                  className={`flex-1 p-3 text-center transition duration-150 ${
                    reminderTemplate.channel === 'sms'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-300'
                  }`}
                  style={{ border: 'none' }}
                >
                  SMS / WhatsApp Format
                </button>
                <button
                  type="button"
                  onClick={() => handleReminderChannelChange('email')}
                  className={`flex-1 p-3 text-center transition duration-150 ${
                    reminderTemplate.channel === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-300'
                  }`}
                  style={{ border: 'none' }}
                >
                  Email Format
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Message Body</label>
                <textarea
                  rows="6"
                  value={reminderTemplate.message}
                  onChange={e => setReminderTemplate({ ...reminderTemplate, message: e.target.value })}
                  className="fi"
                  style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(reminderTemplate.message);
                    triggerToast("Template copied to clipboard!");
                  }}
                  className="btn flex-1 text-center justify-center"
                  style={{ border: 'none', padding: '12px', background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#475569' }}
                >
                  Copy Message
                </button>
                <button
                  type="button"
                  onClick={dispatchReminder}
                  className="btn btn--primary flex-1 text-center justify-center"
                  style={{ border: 'none', padding: '12px' }}
                >
                  Dispatch Reminder
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global Drill-down Modal */}
      {drillModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
          onClick={(e) => e.target === e.currentTarget && setDrillModal(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl transition-all duration-300 text-slate-800" 
            style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '85vh' }}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase" style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics Detailed Breakdown</span>
                <h3 className="text-xl font-black mt-0.5" style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>{drillModal.title}</h3>
              </div>
              <button
                onClick={() => setDrillModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '55vh', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {drillModal.cols.map((col, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillModal.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : '#fafafa'
                      }}
                    >
                      {row.map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '12px 16px', color: '#475569' }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                  {drillModal.rows.length === 0 && (
                    <tr>
                      <td colSpan={drillModal.cols.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setDrillModal(null)}
              className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs py-3 rounded-full transition"
              style={{ width: '100%', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Parties;
