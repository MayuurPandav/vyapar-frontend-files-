import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Expense Control & Audit",
    desc: "Log business outlays, manage department budgets, approve cash vouchers, and view visual category breakdowns.",
    tabRegister: "Expense Register",
    tabAnalysis: "Category Analysis",
    tabReport: "Expense Reports",
    addExpense: "Log New Expense",
    outlayTitle: "Outlay Title / Purpose (e.g. Office Cartridges)",
    amount: "Amount (Rs.)",
    category: "Expense Category",
    notes: "Notes / Description",
    btnSave: "Record Expense",
    approveAction: "Approve Outlay",
    approved: "Approved & Booked",
    pending: "Awaiting Audit",
    noRecords: "No corporate expenses logged.",
    totalLogged: "Total Logged Expenses",
    totalApproved: "Approved & Offset",
    totalPending: "Pending Audit",
    categoryBreakdown: "Category-Wise Outlay Analysis",
    actions: "Actions",
    selectBook: "Select Cash/Bank Ledger for Payment",
    confirmApprove: "Confirm Approval",
    close: "Close",
    successAdd: "Expense logged successfully!",
    successApprove: "Expense approved and Cash Book/General Ledger adjusted!",
    copyReport: "Copy Report Data",
    copied: "Report copied to clipboard!",
    hsnCode: "Tax Category",
    date: "Date",
    filterOutlays: "Filter Outlays:",
    allTime: "All Time",
    lastWeek: "Last Week",
    lastMonth: "Last Month",
    lastYear: "Last Year",
    customCalendar: "Custom Calendar",
    from: "From",
    to: "To"
  },
  hi: {
    title: "व्यय नियंत्रण और ऑडिट",
    desc: "व्यावसायिक खर्च दर्ज करें, विभाग के बजट का प्रबंधन करें, नकद वाउचर स्वीकृत करें, और श्रेणी-वार व्यय विश्लेषण देखें।",
    tabRegister: "व्यय रजिस्टर",
    tabAnalysis: "श्रेणी विश्लेषण",
    tabReport: "व्यय रिपोर्ट",
    addExpense: "नया व्यय दर्ज करें",
    outlayTitle: "व्यय शीर्षक / उद्देश्य (जैसे ऑफिस स्टेशनरी)",
    amount: "राशि (Rs.)",
    category: "व्यय की श्रेणी",
    notes: "टिप्पणी / विवरण",
    btnSave: "व्यय दर्ज करें",
    approveAction: "व्यय स्वीकृत करें",
    approved: "स्वीकृत और बुक किया गया",
    pending: "सत्यापन लंबित",
    noRecords: "कोई व्यावसायिक व्यय दर्ज नहीं है।",
    totalLogged: "कुल दर्ज व्यय",
    totalApproved: "स्वीकृत और ऑफसेट",
    totalPending: "लंबित ऑडिट",
    categoryBreakdown: "श्रेणी-वार व्यय विश्लेषण",
    actions: "कार्रवाई",
    selectBook: "भुगतान के लिए रोकड़/बैंक बही चुनें",
    confirmApprove: "स्वीकृति की पुष्टि करें",
    close: "बंद करें",
    successAdd: "व्यय सफलतापूर्वक दर्ज किया गया!",
    successApprove: "व्यय स्वीकृत किया गया और रोकड़ बही/खाता बही को समायोजित किया गया!",
    copyReport: "रिपोर्ट कॉपी करें",
    copied: "रिपोर्ट क्लिपबोर्ड पर कॉपी की गई!",
    hsnCode: "कर श्रेणी",
    date: "तारीख",
    filterOutlays: "व्यय फ़िल्टर करें:",
    allTime: "सभी समय",
    lastWeek: "पिछले सप्ताह",
    lastMonth: "पिछले महीने",
    lastYear: "पिछले वर्ष",
    customCalendar: "कस्टम कैलेंडर",
    from: "से",
    to: "तक"
  },
  mr: {
    title: "खर्च नियंत्रण आणि ऑडिट",
    desc: "व्यावसायिक खर्च नोंदवा, विभागाचे बजेट व्यवस्थापित करा, रोख व्हाउचर मंजूर करा आणि श्रेणी-निहाय खर्च पहा.",
    tabRegister: "खर्च रजिस्टर",
    tabAnalysis: "श्रेणी विश्लेषण",
    tabReport: "खर्च अहवाल",
    addExpense: "नवीन खर्च नोंदवा",
    outlayTitle: "खर्चाचे शीर्षक / उद्देश (उदा. ऑफिस प्रिंटर शाई)",
    amount: "व्हाउचर रक्कम (Rs.)",
    category: "खर्चाचा प्रकार",
    notes: "नोंद / वर्णन",
    btnSave: "खर्च जतन करा",
    approveAction: "खर्च मंजूर करा",
    approved: "मंजूर आणि बुक केले",
    pending: "पडताळणी प्रलंबित",
    noRecords: "व्यावसायिक खर्च आढळले नाहीत.",
    totalLogged: "एकूण नोंदवलेला खर्च",
    totalApproved: "मंजूर आणि ऑफसेट",
    totalPending: "प्रलंबित ऑडिट",
    categoryBreakdown: "श्रेणी-निहाय खर्च विश्लेषण",
    actions: "कृती",
    selectBook: "पेमेंटसाठी रोकड/बँक बही निवडा",
    confirmApprove: "मंजुरीची खात्री करा",
    close: "बंद करा",
    successAdd: "खर्च यशस्वीरित्या नोंदवला गेला!",
    successApprove: "खर्च मंजूर केला गेला आणि रोकड/खातेवही समायोजित केली गेली!",
    copyReport: "अहवाल कॉपी करा",
    copied: "अहवाल क्लिपबोर्डवर कॉपी केला!",
    hsnCode: "कर श्रेणी",
    date: "तारीख",
    filterOutlays: "खर्च फिल्टर करा:",
    allTime: "सर्व वेळ",
    lastWeek: "मागील आठवडा",
    lastMonth: "मागील महिना",
    lastYear: "मागील वर्ष",
    customCalendar: "कस्टम कॅलेंडर",
    from: "पासून",
    to: "पर्यंत"
  }
};

const CategoriesList = ["Office", "Utilities", "Rent", "Salaries", "Technology", "Travel", "Refreshment", "Marketing", "Others"];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [drillModal, setDrillModal] = useState(null);
  
  // Custom non-blocking Toast alert
  const [toast, setToast] = useState(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'analysis', 'report'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Forms state
  const [addForm, setAddForm] = useState({
    title: '',
    amount: '',
    category: 'Office',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [approveForm, setApproveForm] = useState({
    cashBankLedgerId: ''
  });

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const expRes = await api.get('/expenses');
      setExpenses(expRes.data.data || []);

      const ledgRes = await api.get('/ledgers');
      setLedgers(ledgRes.data.data || []);
    } catch (err) {
      console.error("Error fetching expense data:", err);
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

  // Filter ledgers for payments
  const cashBankLedgers = ledgers.filter(l => l.name === 'Cash' || l.name === 'Bank');
  const rentLedger = ledgers.find(l => l.name.toLowerCase().includes('rent')) || ledgers[0];
  const salariesLedger = ledgers.find(l => l.name.toLowerCase().includes('salaries')) || ledgers[0];

  // Submit log expense
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const { title, amount, category, notes, date } = addForm;

    if (!title || !amount) {
      triggerToast("Title and Amount are required", "error");
      return;
    }

    try {
      await api.post('/expenses', {
        title,
        amount: Number(amount),
        category,
        notes,
        date
      });

      triggerToast(t.successAdd, 'success');
      setShowAddModal(false);
      setAddForm({ title: '', amount: '', category: 'Office', notes: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  // Open Approval Confirmation
  const openApprovalModal = (expense) => {
    setSelectedExpense(expense);
    setApproveForm({
      cashBankLedgerId: cashBankLedgers[0]?._id || ''
    });
    setShowApproveModal(true);
  };

  // Execute approval
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    const { cashBankLedgerId } = approveForm;

    if (!selectedExpense || !cashBankLedgerId) {
      triggerToast("Please select a Cash/Bank ledger book", "error");
      return;
    }

    try {
      // 1. Call approve endpoint in the database
      await api.post(`/expenses/${selectedExpense._id}/approve`);

      // 2. Post a Journal Entry (Debit: Expense, Credit: Cash/Bank asset)
      // We dynamically map the expense category to seeded ledgers
      let debitLedgerId = rentLedger?._id; // default
      if (selectedExpense.category === 'Rent') debitLedgerId = rentLedger?._id;
      else if (selectedExpense.category === 'Salaries') debitLedgerId = salariesLedger?._id;
      else debitLedgerId = rentLedger?._id; // fallback to Rent Expense or general

      await api.post('/journals', {
        date: selectedExpense.date || new Date(),
        narration: `Approved business expense: ${selectedExpense.title || selectedExpense.description || selectedExpense.category} [${selectedExpense.category}]`,
        entries: [
          { ledger: debitLedgerId, type: 'debit', amount: selectedExpense.amount },
          { ledger: cashBankLedgerId, type: 'credit', amount: selectedExpense.amount }
        ]
      });

      // 3. Deduct Cash/Bank asset ledger balance directly
      const selectedCashLedger = ledgers.find(l => l._id === cashBankLedgerId);
      if (selectedCashLedger) {
        const newBal = Math.max(0, (selectedCashLedger.balance || 0) - selectedExpense.amount);
        await api.put(`/ledgers/${cashBankLedgerId}`, { balance: newBal });
      }

      triggerToast(t.successApprove, 'success');
      setShowApproveModal(false);
      setSelectedExpense(null);
      fetchData();
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  // Dynamic Date Filter Logic
  const getFilteredExpenses = () => {
    if (dateFilter === 'all') return expenses;

    const now = new Date();
    return expenses.filter(e => {
      if (!e.date) return false;
      const eDate = new Date(e.date);

      if (dateFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return eDate >= oneWeekAgo && eDate <= now;
      }
      if (dateFilter === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return eDate >= oneMonthAgo && eDate <= now;
      }
      if (dateFilter === 'year') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return eDate >= oneYearAgo && eDate <= now;
      }
      if (dateFilter === 'custom') {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          return eDate >= start && eDate <= adjustedEnd;
        } else if (start) {
          return eDate >= start;
        } else if (end) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          return eDate <= adjustedEnd;
        }
        return true;
      }
      return true;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculations for Expense metrics
  const totalLogged = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalApproved = filteredExpenses.filter(e => e.approved).reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPending = filteredExpenses.filter(e => !e.approved).reduce((sum, e) => sum + (e.amount || 0), 0);

  // Category wise aggregates
  const categoryAnalysis = () => {
    const data = {};
    CategoriesList.forEach(cat => {
      data[cat] = 0;
    });

    filteredExpenses.filter(e => e.approved).forEach(e => {
      const cat = e.category || 'Others';
      data[cat] = (data[cat] || 0) + (e.amount || 0);
    });

    return Object.keys(data).map(cat => ({
      category: cat,
      amount: data[cat],
      percentage: totalApproved > 0 ? ((data[cat] / totalApproved) * 100).toFixed(0) : 0
    })).filter(item => item.amount > 0 || item.category === 'Others');
  };

  const categoryRows = categoryAnalysis();

  const handleCopyReport = () => {
    let text = `Expense Control Audit Summary\n\nTotal Logged Expenses: Rs. ${totalLogged}\nApproved & Offset: Rs. ${totalApproved}\nPending Audit: Rs. ${totalPending}\n\nCategory Breakdown:\n`;
    categoryRows.forEach(row => {
      text += `- ${row.category}: Rs. ${row.amount} (${row.percentage}%)\n`;
    });
    navigator.clipboard.writeText(text);
    triggerToast(t.copied, 'success');
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Alert Banner */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-sans">
        <div 
          className="card card--lift" 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={() => setDrillModal({
            title: t.totalLogged || "Total Logged Expenses",
            cols: ['Title/Purpose', 'Category', 'Date', 'Amount', 'Status'],
            rows: filteredExpenses.map(e => [e.title || e.description || e.category, e.category || 'General', new Date(e.date).toLocaleDateString(), `Rs. ${e.amount.toLocaleString()}`, e.approved ? 'Approved' : 'Pending'])
          })}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.totalLogged}</div>
          <div className="text-3xl font-black font-mono text-blue-600">Rs. {totalLogged.toLocaleString()}</div>
        </div>

        <div 
          className="card card--lift" 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={() => setDrillModal({
            title: t.totalApproved || "Approved Expenses",
            cols: ['Title/Purpose', 'Category', 'Date', 'Amount'],
            rows: filteredExpenses.filter(e => e.approved).map(e => [e.title || e.description || e.category, e.category || 'General', new Date(e.date).toLocaleDateString(), `Rs. ${e.amount.toLocaleString()}`])
          })}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.totalApproved}</div>
          <div className="text-3xl font-black text-emerald-600 font-mono">Rs. {totalApproved.toLocaleString()}</div>
        </div>

        <div 
          className="card card--lift" 
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={() => setDrillModal({
            title: t.totalPending || "Pending Audit Expenses",
            cols: ['Title/Purpose', 'Category', 'Date', 'Amount'],
            rows: filteredExpenses.filter(e => !e.approved).map(e => [e.title || e.description || e.category, e.category || 'General', new Date(e.date).toLocaleDateString(), `Rs. ${e.amount.toLocaleString()}`])
          })}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.totalPending}</div>
          <div className="text-3xl font-black text-amber-600 font-mono">Rs. {totalPending.toLocaleString()}</div>
        </div>
      </div>

      {/* Dynamic Date Filter Bar */}
      <div className="card flex flex-wrap gap-4 items-center justify-between font-sans mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-2">{t.filterOutlays}</span>
          {[
            { id: 'all', label: t.allTime },
            { id: 'week', label: t.lastWeek },
            { id: 'month', label: t.lastMonth },
            { id: 'year', label: t.lastYear },
            { id: 'custom', label: t.customCalendar }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setDateFilter(opt.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition duration-200 active:scale-95 border-0 ${
                dateFilter === opt.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : `bg-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`
              }`}
              style={{ background: dateFilter === opt.id ? '' : 'none', border: 'none' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">{t.from}</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`p-2 text-xs font-bold rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">{t.to}</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`p-2 text-xs font-bold rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab bar navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-8 font-sans">
        {[
          { id: 'register', label: t.tabRegister },
          { id: 'analysis', label: t.tabAnalysis },
          { id: 'report', label: t.tabReport }
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

        {/* Tab 1: Expense Register */}
        {activeTab === 'register' && (
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">{t.tabRegister}</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn--primary btn--sm"
              >
                <i className="fas fa-plus"></i> {t.addExpense}
              </button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="p-4">Description Purpose</th>
                  <th className="p-4">{t.category}</th>
                  <th className="p-4">{t.date}</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">{t.noRecords}</td>
                  </tr>
                ) : (
                  filteredExpenses.map(e => (
                    <tr key={e._id}>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{e.title || e.description || e.category}</div>
                        {e.notes && <span className="text-xs text-slate-400 font-medium">{e.notes}</span>}
                      </td>
                      <td className="p-4">
                        <span className="badge badge--blue">{e.category || 'General'}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-455">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-bold font-mono text-slate-800 dark:text-slate-100">Rs. {e.amount?.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`badge ${e.approved ? 'badge--green' : 'badge--yellow'}`}>
                          {e.approved ? t.approved : t.pending}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!e.approved && (
                          <button
                            onClick={() => openApprovalModal(e)}
                            className="btn btn--primary btn--sm"
                            style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none' }}
                          >
                            {t.approveAction}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Category Analysis */}
        {activeTab === 'analysis' && (
          <div className={`border p-6 rounded-3xl shadow-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white text-slate-800 border-slate-200'}`}>
            <h2 className="text-lg font-black mb-6">{t.categoryBreakdown}</h2>
            
            <div className="space-y-6 font-sans">
              {categoryRows.length === 0 ? (
                <div className="text-center p-8 text-slate-400">No approved expense records to analyze. Approved expenses offset sales profit.</div>
              ) : (
                categoryRows.map((row, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{row.category}</span>
                      <span className="font-mono text-slate-500">Rs. {row.amount.toLocaleString()} ({row.percentage}%)</span>
                    </div>
                    {/* Visual Progress Bar Percentage */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${row.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Report */}
        {activeTab === 'report' && (
          <div className="card" style={{ padding: '24px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black">Audit Compliance Expense Report</h2>
              <button
                onClick={handleCopyReport}
                className="btn btn--sm"
                style={{ border: 'none' }}
              >
                {t.copyReport}
              </button>
            </div>

            <div className="space-y-4 font-sans font-semibold text-sm">
              <div className="flex justify-between py-2.5 border-b border-slate-150 dark:border-slate-850">
                <span className="text-slate-400">Total Logged Expense Vouchers</span>
                <span className="font-mono">Rs. {totalLogged.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-150 dark:border-slate-850">
                <span className="text-slate-400">Approved Expense offset (Profit & Loss reduction)</span>
                <span className="font-mono text-emerald-600">Rs. {totalApproved.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-150 dark:border-slate-850">
                <span className="text-slate-400">Pending Review Audits (No ledger effect)</span>
                <span className="font-mono text-amber-600 font-bold">Rs. {totalPending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* Modal 1: Log New Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t.addExpense}</h3>
              <button onClick={() => setShowAddModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 font-semibold">
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.outlayTitle}</label>
                <input
                  type="text" required placeholder="e.g. Technology Subscription"
                  value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                  className="fi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.amount}</label>
                  <input
                    type="number" required placeholder="0.00"
                    value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })}
                    className="fi"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.category}</label>
                  <select
                    value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                    className="fi"
                  >
                    {CategoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.date}</label>
                <input
                  type="date" required
                  value={addForm.date} onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                  className="fi"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.notes}</label>
                <textarea
                  rows="3" placeholder="Additional voucher notes..."
                  value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                  className="fi"
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary w-full"
                style={{ border: 'none', padding: '14px', justifyContent: 'center' }}
              >
                {t.btnSave}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Approval Select Ledger */}
      {showApproveModal && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t.confirmApprove}</h3>
              <button onClick={() => setShowApproveModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            
            <form onSubmit={handleApproveSubmit} className="space-y-4 font-semibold">
              <div className="p-4 rounded-2xl border bg-slate-950/20 text-xs border-slate-800/40">
                <div className="text-slate-400 uppercase tracking-widest">Outlay to Approve</div>
                <div className={`text-sm font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{selectedExpense.title || selectedExpense.description || selectedExpense.category}</div>
                <div className="text-lg font-black text-rose-600 font-mono mt-1">Rs. {selectedExpense.amount}</div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.selectBook}</label>
                <select
                  required
                  value={approveForm.cashBankLedgerId} onChange={e => setApproveForm({ ...approveForm, cashBankLedgerId: e.target.value })}
                  className="fi"
                >
                  <option value="">-- Choose Book --</option>
                  {cashBankLedgers.map(l => (
                    <option key={l._id} value={l._id}>{l.name} Book (Bal: Rs. {l.balance})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn--primary w-full"
                style={{ border: 'none', padding: '14px', justifyContent: 'center', backgroundColor: '#8b5cf6' }}
              >
                {t.approveAction}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Global Drill-down Modal */}
      {drillModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 9999, padding: '16px' }}
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

export default Expenses;
