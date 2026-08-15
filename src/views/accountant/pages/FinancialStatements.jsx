import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Financial Statements",
    desc: "Real-time, double-entry compliant Trial Balance, Profit & Loss, Balance Sheet, and Cash Flow calculations.",
    trial_tab: "Trial Balance",
    pl_tab: "Profit & Loss",
    bs_tab: "Balance Sheet",
    cf_tab: "Cash Flow",
    name: "Account Ledger / Details",
    type: "Classification",
    debit: "Debit (DR)",
    credit: "Credit (CR)",
    total: "TOTAL",
    net_profit: "Net Profit / Loss",
    income: "Operating Income / Revenue",
    expenses: "Operating Expenses",
    assets: "ACTIVE ASSETS",
    liabilities: "LIABILITIES (Payables)",
    equity: "SHAREHOLDERS' EQUITY",
    total_assets: "TOTAL ACTIVE ASSETS",
    total_liab_eq: "TOTAL LIABILITIES & EQUITY",
    balanced_msg: "Balanced! (Assets = Liabilities + Equity)",
    unbalanced_msg: "Warning: Accounts are unbalanced. Reconcile entries.",
    operating: "Operating Activities (Revenue & Payments)",
    investing: "Investing Activities (Assets Purchase/Sales)",
    financing: "Financing Activities (Capital & Equity)",
    net_cf: "Net Change in Cash Flow",
    no_records: "No financial logs computed.",
    export_excel: "Export to MS Excel"
  },
  hi: {
    title: "वित्तीय विवरण (Financial Statements)",
    desc: "वास्तविक समय, दोहरी प्रविष्टि शिकायत परीक्षण शेष, लाभ और हानि, बैलेंस शीट, और कैश फ्लो गणना।",
    trial_tab: "परीक्षण शेष (Trial Balance)",
    pl_tab: "लाभ और हानि (P&L)",
    bs_tab: "तुलन पत्र (Balance Sheet)",
    cf_tab: "कैश फ्लो",
    name: "खाता बही / विवरण",
    type: "वर्गीकरण",
    debit: "नाम (Debit)",
    credit: "जमा (Credit)",
    total: "कुल योग",
    net_profit: "शुद्ध लाभ / हानि",
    income: "परिचालन आय / राजस्व",
    expenses: "परिचालन व्यय",
    assets: "सक्रिय संपत्ति",
    liabilities: "देनदारियां (Payables)",
    equity: "शेयरधारकों की इक्विटी",
    total_assets: "कुल सक्रिय संपत्ति",
    total_liab_eq: "कुल देनदारियां और इक्विटी",
    balanced_msg: "संतुलित! (संपत्ति = देनदारियां + इक्विटी)",
    unbalanced_msg: "चेतावनी: खाते असंतुलित हैं। मिलान करें।",
    operating: "परिचालन गतिविधियां",
    investing: "निवेश गतिविधियां",
    financing: "वित्तीय गतिविधियां",
    net_cf: "कैश फ्लो में कुल बदलाव",
    no_records: "कोई वित्तीय लॉग नहीं मिला।",
    export_excel: "एमएस एक्सेल में निर्यात करें"
  },
  mr: {
    title: "वित्तीय पत्रके (Financial Statements)",
    desc: "रिअल-टाइम, डबल-एंट्री सुसंगत ट्रायल बॅलन्स, नफा आणि तोटा, ताळेबंद (बॅलन्स शीट) आणि कॅश फ्लो गणना.",
    trial_tab: "चाचणी शिल्लक (Trial Balance)",
    pl_tab: "नफा आणि तोटा (P&L)",
    bs_tab: "ताळेबंद (Balance Sheet)",
    cf_tab: "कॅश फ्लो",
    name: "खातेवही / तपशील",
    type: "वर्गीकरण",
    debit: "नावे (Debit)",
    credit: "जमा (Credit)",
    total: "एकूण",
    net_profit: "निव्वळ नफा / तोटा",
    income: "उत्पन्न / महसूल",
    expenses: "खर्च",
    assets: "सक्रिय मालमत्ता (Assets)",
    liabilities: "दायित्व (Liabilities)",
    equity: "भागभांडवल (Equity)",
    total_assets: "एकूण मालमत्ता",
    total_liab_eq: "एकूण दायित्व आणि भागभांडवल",
    balanced_msg: "ताळेबंद जुळला! (मालमत्ता = दायित्व + भागभांडवल)",
    unbalanced_msg: "चेतावणी: खाती जुळलेली नाहीत. पडताळणी करा.",
    operating: "ऑपरेटिंग क्रियाकलाप",
    investing: "गुंतवणूक क्रियाकलाप",
    financing: "वित्तीय क्रियाकलाप",
    net_cf: "कॅश फ्लो मधील एकूण बदल",
    no_records: "कोणतीही वित्तीय पत्रके उपलब्ध नाहीत.",
    export_excel: "एमएस एक्सेल मध्ये एक्सपोर्ट करा"
  }
};

const FinancialStatements = () => {
  const [activeTab, setActiveTab] = useState('trial'); // 'trial', 'pl', 'bs', 'cf'
  const [trial, setTrial] = useState(null);
  const [pl, setPl] = useState(null);
  const [bs, setBs] = useState(null);
  const [cf, setCf] = useState(null);
  const [loading, setLoading] = useState(true);

  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchStatements = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trial') {
        const res = await api.get('/financials/trial-balance');
        setTrial(res.data.data);
      } else if (activeTab === 'pl') {
        const res = await api.get('/financials/profit-loss');
        setPl(res.data.data);
      } else if (activeTab === 'bs') {
        const res = await api.get('/financials/balance-sheet');
        setBs(res.data.data);
      } else if (activeTab === 'cf') {
        const res = await api.get('/financials/cash-flow');
        setCf(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [activeTab]);

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    const handleThemeChange = () => setTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToExcel = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM so Excel opens it with correct encoding
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    if (activeTab === 'trial' && trial) {
      csvContent += `TRIAL BALANCE\n`;
      csvContent += `Exported on: ${dateStr} ${timeStr}\n\n`;
      csvContent += `${escapeCSV(t.name)},${escapeCSV(t.type)},${escapeCSV(t.debit)},${escapeCSV(t.credit)}\n`;
      
      trial.rows.forEach(r => {
        csvContent += `${escapeCSV(r.name)},${escapeCSV(r.type)},${r.debit || 0},${r.credit || 0}\n`;
      });
      
      csvContent += `\n`;
      csvContent += `${escapeCSV(t.total)},,${trial.debitsTotal || 0},${trial.creditsTotal || 0}\n`;
    } else if (activeTab === 'pl' && pl) {
      csvContent += `PROFIT & LOSS STATEMENT\n`;
      csvContent += `Exported on: ${dateStr} ${timeStr}\n\n`;
      
      // Income Section
      csvContent += `${escapeCSV(t.income.toUpperCase())}\n`;
      csvContent += `${escapeCSV(t.name)},Amount (Rs.)\n`;
      pl.incomeRows.forEach(r => {
        csvContent += `${escapeCSV(r.name)},${r.balance || 0}\n`;
      });
      csvContent += `${escapeCSV(t.total)} ${escapeCSV(t.income)},${pl.totalIncome || 0}\n\n`;
      
      // Expenses Section
      csvContent += `${escapeCSV(t.expenses.toUpperCase())}\n`;
      csvContent += `${escapeCSV(t.name)},Amount (Rs.)\n`;
      pl.expenseRows.forEach(r => {
        csvContent += `${escapeCSV(r.name)},${r.balance || 0}\n`;
      });
      csvContent += `${escapeCSV(t.total)} ${escapeCSV(t.expenses)},${pl.totalExpenses || 0}\n\n`;
      
      // Net Profit Section
      csvContent += `${escapeCSV(t.net_profit)},${pl.netProfit || 0}\n`;
    } else if (activeTab === 'bs' && bs) {
      csvContent += `BALANCE SHEET\n`;
      csvContent += `Exported on: ${dateStr} ${timeStr}\n`;
      csvContent += `Status: ${bs.balanced ? t.balanced_msg : t.unbalanced_msg}\n\n`;
      
      // Stacked Assets
      csvContent += `${escapeCSV(t.assets.toUpperCase())}\n`;
      csvContent += `${escapeCSV(t.name)},Amount (Rs.)\n`;
      bs.assets.forEach(a => {
        csvContent += `${escapeCSV(a.name)},${a.balance || 0}\n`;
      });
      csvContent += `${escapeCSV(t.total_assets)},${bs.totalAssets || 0}\n\n`;
      
      // Stacked Liabilities
      csvContent += `${escapeCSV(t.liabilities.toUpperCase())}\n`;
      csvContent += `${escapeCSV(t.name)},Amount (Rs.)\n`;
      if (bs.liabilities.length === 0) {
        csvContent += `No liabilities logged,0\n`;
      } else {
        bs.liabilities.forEach(l => {
          csvContent += `${escapeCSV(l.name)},${l.balance || 0}\n`;
        });
      }
      csvContent += `Total Liabilities,${bs.totalLiabilities || 0}\n\n`;
      
      // Stacked Equity
      csvContent += `${escapeCSV(t.equity.toUpperCase())}\n`;
      csvContent += `${escapeCSV(t.name)},Amount (Rs.)\n`;
      bs.equity.forEach(e => {
        csvContent += `${escapeCSV(e.name)},${e.balance || 0}\n`;
      });
      csvContent += `Total Equity,${bs.totalEquity || 0}\n\n`;
      
      // Total Liabilities & Equity
      csvContent += `${escapeCSV(t.total_liab_eq)},${(bs.totalLiabilities + bs.totalEquity) || 0}\n`;
    } else if (activeTab === 'cf' && cf) {
      csvContent += `CASH FLOW STATEMENT\n`;
      csvContent += `Exported on: ${dateStr} ${timeStr}\n\n`;
      
      // Operating Section
      csvContent += `${escapeCSV(t.operating.toUpperCase())}\n`;
      csvContent += `Narration,Amount (Rs.)\n`;
      if (cf.operatingActivities.length === 0) {
        csvContent += `No Operating cash flows logged,0\n`;
      } else {
        cf.operatingActivities.forEach(op => {
          csvContent += `${escapeCSV(op.narration)},${op.amount || 0}\n`;
        });
      }
      csvContent += `Total Operating,${cf.operatingTotal || 0}\n\n`;

      // Investing Section
      csvContent += `${escapeCSV(t.investing.toUpperCase())}\n`;
      csvContent += `Narration,Amount (Rs.)\n`;
      if (cf.investingActivities.length === 0) {
        csvContent += `No Investing cash flows logged,0\n`;
      } else {
        cf.investingActivities.forEach(inv => {
          csvContent += `${escapeCSV(inv.narration)},${inv.amount || 0}\n`;
        });
      }
      csvContent += `Total Investing,${cf.investingTotal || 0}\n\n`;

      // Financing Section
      csvContent += `${escapeCSV(t.financing.toUpperCase())}\n`;
      csvContent += `Narration,Amount (Rs.)\n`;
      if (cf.financingActivities.length === 0) {
        csvContent += `No Financing cash flows logged,0\n`;
      } else {
        cf.financingActivities.forEach(fin => {
          csvContent += `${escapeCSV(fin.narration)},${fin.amount || 0}\n`;
        });
      }
      csvContent += `Total Financing,${cf.financingTotal || 0}\n\n`;

      // Net Cash Flow
      csvContent += `Net Cash Flow,${cf.netCashFlow || 0}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
          <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={exportToExcel}
            className="btn btn--primary"
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
            {t.export_excel}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-8 font-sans">
        {[
          { id: 'trial', label: t.trial_tab },
          { id: 'pl', label: t.pl_tab },
          { id: 'bs', label: t.bs_tab },
          { id: 'cf', label: t.cf_tab }
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

      {loading ? (
        <div className="flex py-16 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ================= TAB: TRIAL BALANCE ================= */}
          {activeTab === 'trial' && trial && (
            <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold">{t.trial_tab}</h3>
              </div>
              <table className="tbl font-semibold">
                <thead>
                  <tr>
                    <th>{t.name}</th>
                    <th>{t.type}</th>
                    <th className="text-right">{t.debit}</th>
                    <th className="text-right">{t.credit}</th>
                  </tr>
                </thead>
                <tbody>
                  {trial.rows.map(r => (
                    <tr key={r._id}>
                      <td>{r.name}</td>
                      <td>
                        <span className={`badge ${r.type === 'asset' ? 'badge--blue' : r.type === 'expense' ? 'badge--red' : r.type === 'income' ? 'badge--green' : 'badge--yellow'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="text-right text-emerald-600 font-extrabold font-mono">{r.debit > 0 ? `Rs. ${r.debit.toLocaleString()}` : '-'}</td>
                      <td className="text-right text-indigo-600 font-extrabold font-mono">{r.credit > 0 ? `Rs. ${r.credit.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-black bg-slate-50/50 dark:bg-slate-900/60">
                    <td colSpan="2">{t.total}</td>
                    <td className="text-right text-emerald-700 font-black text-lg font-mono">Rs. {trial.debitsTotal?.toLocaleString()}</td>
                    <td className="text-right text-indigo-700 font-black text-lg font-mono">Rs. {trial.creditsTotal?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ================= TAB: PROFIT & LOSS ================= */}
          {activeTab === 'pl' && pl && (
            <div className="space-y-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income */}
                <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.income}</h2>
                  </div>
                  <table className="tbl font-semibold">
                    <tbody>
                      {pl.incomeRows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td className="text-right font-black text-emerald-600 font-mono">Rs. {r.balance?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-extrabold border-t bg-slate-50/50 dark:bg-slate-900/50">
                        <td>Total Revenue</td>
                        <td className="text-right text-emerald-600 font-mono">Rs. {pl.totalIncome?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Expenses */}
                <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.expenses}</h2>
                  </div>
                  <table className="tbl font-semibold">
                    <tbody>
                      {pl.expenseRows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td className="text-right font-black text-rose-600 font-mono">Rs. {r.balance?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-extrabold border-t bg-slate-50/50 dark:bg-slate-900/50">
                        <td>Total Expenses</td>
                        <td className="text-right text-rose-600 font-mono">Rs. {pl.totalExpenses?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className={`card flex justify-between items-center font-black text-xl border-t-4 ${pl.netProfit >= 0 ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/50 text-rose-800 dark:text-rose-300 dark:bg-rose-950/20'}`}>
                <span>{t.net_profit}</span>
                <span className="font-mono">Rs. {pl.netProfit?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* ================= TAB: BALANCE SHEET ================= */}
          {activeTab === 'bs' && bs && (
            <div className="space-y-6 font-sans">
              <div className="flex justify-between items-center">
                <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase ${bs.balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 animate-pulse'}`}>
                  {bs.balanced ? t.balanced_msg : t.unbalanced_msg}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.assets}</h2>
                  </div>
                  <table className="tbl font-semibold">
                    <tbody>
                      {bs.assets.map((a, i) => (
                        <tr key={i}>
                          <td>{a.name}</td>
                          <td className="text-right font-extrabold font-mono">Rs. {a.balance?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-black border-t bg-slate-50/50 dark:bg-slate-900/50 text-md">
                        <td>{t.total_assets}</td>
                        <td className="text-right font-mono">Rs. {bs.totalAssets?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-6">
                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.liabilities}</h2>
                    </div>
                    <table className="tbl font-semibold">
                      <tbody>
                        {bs.liabilities.length === 0 ? (
                          <tr><td className="text-slate-455 text-center p-4">No liabilities logged</td></tr>
                        ) : (
                          bs.liabilities.map((l, i) => (
                            <tr key={i}>
                              <td>{l.name}</td>
                              <td className="text-right font-extrabold font-mono">Rs. {l.balance?.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                        <tr className="font-black border-t bg-slate-50/50 dark:bg-slate-900/50 text-md">
                          <td>Total Liabilities</td>
                          <td className="text-right font-mono">Rs. {bs.totalLiabilities?.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">{t.equity}</h2>
                    </div>
                    <table className="tbl font-semibold">
                      <tbody>
                        {bs.equity.map((e, i) => (
                          <tr key={i}>
                            <td>{e.name}</td>
                            <td className="text-right font-extrabold font-mono">Rs. {e.balance?.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="font-black border-t bg-slate-50/50 dark:bg-slate-900/50 text-md">
                          <td>{t.total_liab_eq}</td>
                          <td className="text-right font-mono">Rs. {(bs.totalLiabilities + bs.totalEquity)?.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: CASH FLOW ================= */}
          {activeTab === 'cf' && cf && (
            <div className="space-y-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Operating */}
                <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.operating}</h2>
                  </div>
                  <table className="tbl font-semibold">
                    <tbody>
                      {cf.operatingActivities.length === 0 ? (
                        <tr><td className="text-slate-455 text-center p-4">No Operating cash flows</td></tr>
                      ) : (
                        cf.operatingActivities.map((op, i) => (
                          <tr key={i}>
                            <td>{op.narration}</td>
                            <td className={`text-right font-bold font-mono ${op.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {op.amount >= 0 ? '+' : '-'}Rs. {Math.abs(op.amount)?.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="font-extrabold border-t bg-slate-50/50 dark:bg-slate-900/50">
                        <td>Total Operating</td>
                        <td className={`text-right font-mono ${cf.operatingTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Rs. {cf.operatingTotal?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Investing */}
                <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.investing}</h2>
                  </div>
                  <table className="tbl font-semibold">
                    <tbody>
                      {cf.investingActivities.length === 0 ? (
                        <tr><td className="text-slate-455 text-center p-4">No Investing cash flows</td></tr>
                      ) : (
                        cf.investingActivities.map((inv, i) => (
                          <tr key={i}>
                            <td>{inv.narration}</td>
                            <td className={`text-right font-bold font-mono ${inv.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {inv.amount >= 0 ? '+' : '-'}Rs. {Math.abs(inv.amount)?.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="font-extrabold border-t bg-slate-50/50 dark:bg-slate-900/50">
                        <td>Total Investing</td>
                        <td className={`text-right font-mono ${cf.investingTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Rs. {cf.investingTotal?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Financing */}
                <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.financing}</h2>
                  </div>
                  <table className="tbl font-semibold">
                    <tbody>
                      {cf.financingActivities.length === 0 ? (
                        <tr><td className="text-slate-455 text-center p-4">No Financing cash flows</td></tr>
                      ) : (
                        cf.financingActivities.map((fin, i) => (
                          <tr key={i}>
                            <td>{fin.narration}</td>
                            <td className={`text-right font-bold font-mono ${fin.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {fin.amount >= 0 ? '+' : '-'}Rs. {Math.abs(fin.amount)?.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="font-extrabold border-t bg-slate-50/50 dark:bg-slate-900/50">
                        <td>Total Financing</td>
                        <td className={`text-right font-mono ${cf.financingTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Rs. {cf.financingTotal?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Cash Flow Statement */}
              <div className={`card flex justify-between items-center font-black text-xl border-t-4 ${cf.netCashFlow >= 0 ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/50 text-rose-800 dark:text-rose-300 dark:bg-rose-950/20'}`}>
                <span>{t.net_cf}</span>
                <span className="font-mono">Rs. {cf.netCashFlow?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialStatements;
