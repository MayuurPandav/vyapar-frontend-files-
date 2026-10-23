import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "General Ledger Management",
    desc: "Create and track double-entry accountant general ledgers and balances.",
    form_title: "Create Ledger Account",
    name: "Ledger Account Name",
    type: "Account Classification",
    balance: "Opening Balance (Rs.)",
    btn_add: "Add Ledger Account",
    th_name: "Ledger Name",
    th_type: "Type",
    th_bal: "Ledger Balance",
    no_records: "No ledgers created in database."
  },
  hi: {
    title: "सामान्य खाता बही प्रबंधन",
    desc: "दोहरी प्रविष्टि एकाउंटेंट सामान्य खाता बही और शेष राशि बनाएं और ट्रैक करें।",
    form_title: "खाता बही (Ledger) बनाएं",
    name: "खाता बही का नाम",
    type: "खाता वर्गीकरण",
    balance: "प्रारंभिक शेष (Rs.)",
    btn_add: "खाता बही जोड़ें",
    th_name: "खाता नाम",
    th_type: "प्रकार",
    th_bal: "खाता बही शेष",
    no_records: "डेटाबेस में कोई खाता बही नहीं बनाई गई है।"
  },
  mr: {
    title: "सामान्य खातेवही व्यवस्थापन",
    desc: "डबल-एंट्री सुसंगत खातेवही खाती तयार करा आणि शिल्लक रक्कम ट्रॅक करा.",
    form_title: "नवीन खातेवही खाते तयार करा",
    name: "खातेवही नाव",
    type: "खाते वर्गीकरण",
    balance: "प्रारंभिक शिल्लक (Rs.)",
    btn_add: "खातेवही जोडा",
    th_name: "खाते नाव",
    th_type: "प्रकार",
    th_bal: "खाते शिल्लक",
    no_records: "डेटाबेसमध्ये कोणतीही खातेवही आढळली नाही."
  }
};

const Ledgers = () => {
  const [ledgers, setLedgers] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('asset');
  const [balance, setBalance] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchLedgers = async () => {
    try {
      const res = await api.get('/ledgers');
      setLedgers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPdf = async (ledgerId, ledgerName) => {
    try {
      const res = await api.get(`/financials/ledger/${ledgerId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ledger_${ledgerName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download ledger PDF: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLedgers();
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

  const add = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/ledgers', { name, type, balance: Number(balance || 0) });
      setLedgers(prev => [res.data.data, ...prev]);
      setName('');
      setBalance('');
      alert('Ledger created successfully!');
    } catch (err) {
      alert('Failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ledger Balance Sheet table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">Ledger Accounts</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t.th_name}</th>
                  <th>{t.th_type}</th>
                  <th className="text-right">{t.th_bal}</th>
                  <th className="text-right" style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-400">{t.no_records}</td>
                  </tr>
                ) : (
                  ledgers.map(l => (
                    <tr key={l._id}>
                      <td className="font-black text-slate-850 dark:text-slate-100">{l.name}</td>
                      <td className="capitalize text-xs">
                        <span className={`badge ${l.type === 'asset' ? 'badge--blue' : l.type === 'expense' ? 'badge--red' : l.type === 'income' ? 'badge--green' : 'badge--yellow'}`}>
                          {l.type}
                        </span>
                      </td>
                      <td className={`text-right font-bold font-mono text-slate-800 dark:text-slate-100`}>
                        Rs. {l.balance?.toLocaleString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => downloadPdf(l._id, l.name)}
                          className="btn btn--sm"
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Download Ledger PDF Statement"
                        >
                          <i className="fas fa-file-pdf text-rose-600"></i>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Form */}
        <div>
          <div className="card shadow-sm">
            <h4 className="text-lg font-black mb-6">{t.form_title}</h4>
            <form onSubmit={add} className="space-y-4">
              <div className="fg">
                <label>{t.name}</label>
                <input 
                  type="text" required placeholder="e.g. Petty Cash" 
                  value={name} onChange={e => setName(e.target.value)}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.type}</label>
                <select 
                  value={type} onChange={e => setType(e.target.value)}
                  className="fi"
                >
                  <option value="asset">Asset (सम्पत्ति)</option>
                  <option value="liability">Liability (दायित्व)</option>
                  <option value="income">Income (आय)</option>
                  <option value="expense">Expense (खर्च)</option>
                  <option value="equity">Equity (इक्विटी)</option>
                </select>
              </div>

              <div className="fg">
                <label>{t.balance}</label>
                <input 
                  type="number" placeholder="0.00" 
                  value={balance} onChange={e => setBalance(e.target.value)}
                  className="fi"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn--primary w-full"
                style={{ justifyContent: 'center' }}
              >
                {t.btn_add}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Ledgers;
