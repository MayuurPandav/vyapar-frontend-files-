import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Bank Reconciliation",
    desc: "Match your internal Bank ledger transactions with physical bank statements and record bank service charges.",
    ledger_balance: "Ledger Bank Balance",
    stmt_balance: "Statement Balance",
    status_reconciled: "Reconciled",
    status_unreconciled: "Unreconciled",
    date: "Date",
    narration: "Narration",
    debit: "Debit (+)",
    credit: "Credit (-)",
    action: "Action",
    charges_title: "Post Bank Charges",
    amount: "Charges Amount (Rs.)",
    narration_label: "Charges Explanation",
    btn_post: "Record Charges",
    no_records: "No bank ledger entries logged."
  },
  hi: {
    title: "बैंक समाधान (Reconciliation)",
    desc: "अपने आंतरिक बैंक खाता बही लेनदेन को भौतिक बैंक विवरणों के साथ मिलान करें और बैंक सेवा शुल्क दर्ज करें।",
    ledger_balance: "लेजर बैंक शेष",
    stmt_balance: "स्टेटमेंट शेष",
    status_reconciled: "समाधानित",
    status_unreconciled: "असमाधानित",
    date: "तारीख",
    narration: "कथन",
    debit: "नाम (+)",
    credit: "जमा (-)",
    action: "कार्रवाई",
    charges_title: "बैंक शुल्क दर्ज करें",
    amount: "शुल्क राशि (Rs.)",
    narration_label: "शुल्क विवरण",
    btn_post: "शुल्क दर्ज करें",
    no_records: "कोई बैंक लेजर प्रविष्टि दर्ज नहीं है।"
  },
  mr: {
    title: "बँक जुळवणी (Reconciliation)",
    desc: "तुमचे अंतर्गत बँक खातेवहीचे व्यवहार प्रत्यक्ष बँक स्टेटमेंटशी जुळवा आणि बँक चार्जेस नोंदवा.",
    ledger_balance: "लेजर बँक शिल्लक",
    stmt_balance: "स्टेटमेंट शिल्लक",
    status_reconciled: "जुळवणी पूर्ण",
    status_unreconciled: "जुळवणी प्रलंबित",
    date: "दिनांक",
    narration: "स्पष्टीकरण / वर्णन",
    debit: "नावे (DR +)",
    credit: "जमा (CR -)",
    action: "कारवाई",
    charges_title: "बँक चार्जेस नोंदवा",
    amount: "चार्जेस रक्कम (Rs.)",
    narration_label: "चार्जेस वर्णन",
    btn_post: "चार्जेस नोंदवा",
    no_records: "बँकेची कोणतीही नोंद आढळली नाही."
  }
};

const BankReconciliation = () => {
  const [journals, setJournals] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [reconciledItems, setReconciledItems] = useState({}); // Trace reconciled state
  const [chargeForm, setChargeForm] = useState({ amount: '', narration: '' });
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [drillModal, setDrillModal] = useState(null);

  const showLedgerBalanceDrilldown = () => {
    const cols = ["Date", "Narration", "Flow Type", "Amount"];
    const rows = bankJournals.map(j => {
      const en = j.entries.find(e => e.ledger?.name === 'Bank' || e.ledger === bankLedger?._id);
      return [
        new Date(j.date).toLocaleDateString(),
        j.narration,
        en?.type === 'debit' ? 'Debit (DR +)' : 'Credit (CR -)',
        `Rs. ${en?.amount?.toLocaleString()}`
      ];
    });
    setDrillModal({
      title: "Bank Ledger Transactions",
      cols,
      rows
    });
  };

  const showStatementBalanceDrilldown = () => {
    const cols = ["Date", "Narration", "Reconciliation Effect", "Status"];
    const rows = bankJournals.map(j => {
      const en = j.entries.find(e => e.ledger?.name === 'Bank' || e.ledger === bankLedger?._id);
      const isReconciled = reconciledItems[j._id];
      let effect = 'No Change (Unreconciled)';
      if (isReconciled && en) {
        effect = en.type === 'debit' ? `-Rs. ${en.amount.toLocaleString()}` : `+Rs. ${en.amount.toLocaleString()}`;
      }
      return [
        new Date(j.date).toLocaleDateString(),
        j.narration,
        effect,
        isReconciled ? 'Reconciled' : 'Unreconciled'
      ];
    });
    setDrillModal({
      title: "Reconciled Statement Balance Adjustments",
      cols,
      rows
    });
  };

  const fetchData = async () => {
    try {
      const resL = await api.get('/ledgers');
      setLedgers(resL.data.data);
      const resJ = await api.get('/journals');
      setJournals(resJ.data.data);
    } catch (err) {
      console.error(err);
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

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const bankLedger = ledgers.find(l => l.name === 'Bank');
  const activeBalance = bankLedger ? (bankLedger.balance || 0) : 0;

  // Filter journals that affect Bank
  const bankJournals = journals.filter(j => 
    j.entries.some(e => e.ledger?.name === 'Bank' || e.ledger === bankLedger?._id)
  );

  const toggleReconciliation = (id) => {
    setReconciledItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePostCharges = async (e) => {
    e.preventDefault();
    try {
      const bankL = ledgers.find(l => l.name === 'Bank');
      const salesL = ledgers.find(l => l.name === 'Sales'); // Or Expense ledger
      if (!bankL || !salesL) return alert('Ledgers not found');

      // Adjust Bank balance: Credit Bank, Debit Expense/Sales
      bankL.balance = Math.max(0, (bankL.balance || 0) - Number(chargeForm.amount));
      await api.put(`/ledgers/${bankL._id}`, { balance: bankL.balance });

      await api.post('/journals', {
        narration: chargeForm.narration || 'Reconciliation Bank Service Charges',
        entries: [
          { ledger: salesL._id, type: 'debit', amount: Number(chargeForm.amount) },
          { ledger: bankL._id, type: 'credit', amount: Number(chargeForm.amount) }
        ]
      });

      alert('Bank charges posted successfully!');
      setChargeForm({ amount: '', narration: '' });
      fetchData();
    } catch (err) {
      alert('Error posting bank charges: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Reconciled Statement Balance (simulation based on checked items)
  let reconciledStmtSum = activeBalance;
  Object.keys(reconciledItems).forEach(id => {
    if (reconciledItems[id]) {
      const j = bankJournals.find(item => item._id === id);
      const en = j?.entries.find(e => e.ledger?.name === 'Bank' || e.ledger === bankLedger?._id);
      if (en) {
        if (en.type === 'debit') {
          reconciledStmtSum -= en.amount; // reverse internal debit to trace statement
        } else {
          reconciledStmtSum += en.amount; // reverse credit
        }
      }
    }
  });

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
      </header>

      {/* Reconciliation stats indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 font-sans">
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showLedgerBalanceDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.ledger_balance}</div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">Rs. {activeBalance.toLocaleString()}</div>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showStatementBalanceDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{t.stmt_balance} (Adjusted)</div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">Rs. {reconciledStmtSum.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">Bank Transactions Matcher</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t.date}</th>
                  <th>{t.narration}</th>
                  <th className="text-right">Ledger Flow</th>
                  <th className="text-center">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {bankJournals.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-400">{t.no_records}</td>
                  </tr>
                ) : (
                  bankJournals.map(j => {
                    const en = j.entries.find(e => e.ledger?.name === 'Bank' || e.ledger === bankLedger?._id);
                    const isReconciled = reconciledItems[j._id];
                    return (
                      <tr key={j._id}>
                        <td className="text-xs text-slate-400 font-mono">{new Date(j.date).toLocaleDateString()}</td>
                        <td className="font-black text-slate-800 dark:text-slate-100">{j.narration}</td>
                        <td className={`text-right font-bold font-mono ${en?.type === 'debit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {en?.type === 'debit' ? '+' : '-'}Rs. {en?.amount?.toLocaleString()}
                        </td>
                        <td className="text-center">
                          <button 
                            onClick={() => toggleReconciliation(j._id)}
                            className={`btn btn--sm ${isReconciled ? 'badge--green' : 'badge--yellow'}`}
                            style={{ border: 'none', cursor: 'pointer' }}
                          >
                            {isReconciled ? t.status_reconciled : t.status_unreconciled}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Charges Form */}
        <div>
          <div className="card shadow-sm">
            <h4 className="text-lg font-black mb-6">{t.charges_title}</h4>
            <form onSubmit={handlePostCharges} className="space-y-4 font-semibold">
              <div className="fg">
                <label>{t.amount}</label>
                <input 
                  type="number" required placeholder="Service Charges (Rs.)" 
                  value={chargeForm.amount} onChange={e => setChargeForm({...chargeForm, amount: e.target.value})}
                  className="fi"
                />
              </div>
              <div className="fg">
                <label>{t.narration_label}</label>
                <textarea 
                  required placeholder="Bank Monthly Charges, clearing commissions..." 
                  value={chargeForm.narration} onChange={e => setChargeForm({...chargeForm, narration: e.target.value})}
                  className="fi h-24"
                />
              </div>
              <button 
                type="submit" 
                className="btn btn--primary w-full"
                style={{ justifyContent: 'center' }}
              >
                {t.btn_post}
              </button>
            </form>
          </div>
        </div>
      </div>
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
              style={{ border: 'none', color: '#fff', backgroundColor: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;
