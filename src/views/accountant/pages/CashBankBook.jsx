import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Cash & Bank Books",
    desc: "Active registers displaying cash balance, bank balance, and complete deposit/withdrawal logs.",
    cash_tab: "Cash Register",
    bank_tab: "Bank Register",
    balance: "Current Balance",
    date: "Date",
    narration: "Narration",
    flow: "Transaction Flow",
    no_records: "No transactions found for this account book."
  },
  hi: {
    title: "रोकड़ और बैंक बही",
    desc: "सक्रिय रजिस्टर रोकड़ शेष, बैंक शेष और पूर्ण जमा/निकासी लॉग प्रदर्शित करते हैं।",
    cash_tab: "कैश रजिस्टर",
    bank_tab: "बैंक रजिस्टर",
    balance: "वर्तमान शेष राशि",
    date: "तारीख",
    narration: "कथन",
    flow: "लेन-देन प्रवाह",
    no_records: "इस खाता बही के लिए कोई लेनदेन नहीं मिला।"
  },
  mr: {
    title: "रोकड आणि बँक बुक्स",
    desc: "कॅश शिल्लक, बँक शिल्लक आणि जमा/निकासी नोंदी दाखवणारी सक्रिय पुस्तके.",
    cash_tab: "कॅश रजिस्टर",
    bank_tab: "बँक रजिस्टर",
    balance: "चालू शिल्लक",
    date: "दिनांक",
    narration: "स्पष्टीकरण / वर्णन",
    flow: "व्यवहार प्रवाह",
    no_records: "या पुस्तकासाठी कोणतेही व्यवहार आढळले नाहीत."
  }
};

const CashBankBook = () => {
  const [activeTab, setActiveTab] = useState('cash'); // 'cash' or 'bank'
  const [ledgers, setLedgers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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

  const cashLedger = ledgers.find(l => l.name === 'Cash');
  const bankLedger = ledgers.find(l => l.name === 'Bank');

  const activeLedger = activeTab === 'cash' ? cashLedger : bankLedger;
  const activeBalance = activeLedger ? (activeLedger.balance || 0) : 0;

  const filteredJournals = journals.filter(j => 
    j.entries.some(e => e.ledger?.name === (activeTab === 'cash' ? 'Cash' : 'Bank') || e.ledger === activeLedger?._id)
  );

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-8 font-sans">
        {[
          { id: 'cash', label: t.cash_tab },
          { id: 'bank', label: t.bank_tab }
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

      {/* Active Balance Card */}
      <div className="card card--lift max-w-sm mb-8 font-sans">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
          {activeTab === 'cash' ? t.cash_tab : t.bank_tab} {t.balance}
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
          Rs. {activeBalance.toLocaleString()}
        </div>
      </div>

      {/* Ledger history list */}
      <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-black">{activeTab === 'cash' ? t.cash_tab : t.bank_tab} Transaction Flow</h2>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.narration}</th>
              <th className="text-right">{t.flow}</th>
            </tr>
          </thead>
          <tbody>
            {filteredJournals.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">{t.no_records}</td>
              </tr>
            ) : (
              filteredJournals.map(j => {
                const affectedEntry = j.entries.find(e => e.ledger?.name === (activeTab === 'cash' ? 'Cash' : 'Bank') || e.ledger === activeLedger?._id);
                return (
                  <tr key={j._id}>
                    <td className="text-xs text-slate-400 font-mono">{new Date(j.date).toLocaleDateString()}</td>
                    <td className="font-black text-slate-800 dark:text-slate-100">{j.narration}</td>
                    <td className={`text-right font-bold font-mono text-lg ${affectedEntry?.type === 'debit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {affectedEntry?.type === 'debit' ? '+' : '-'}Rs. {affectedEntry?.amount?.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashBankBook;
