import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Double-Entry Journal Logs",
    desc: "Post manual adjustment entries, asset acquisitions, and capital distributions verifying debits match credits.",
    form_title: "Post New Journal Entry",
    narration_label: "Narration (Transaction Description)",
    ledger_select: "Select Ledger Account",
    type_select: "Flow Type",
    debit_option: "Debit (DR)",
    credit_option: "Credit (CR)",
    amount: "Amount (Rs.)",
    add_row: "Add Row (+)",
    save_btn: "Authorize & Save Journal",
    th_narr: "Transaction Narration",
    th_break: "Ledger Entries",
    no_records: "No journals posted."
  },
  hi: {
    title: "दोहरी प्रविष्टि रोजनामचा (Journals)",
    desc: "मैनुअल समायोजन प्रविष्टियां, संपत्ति अधिग्रहण, और पूंजी वितरण दर्ज करें, यह सत्यापित करते हुए कि नाम (debit) और जमा (credit) बराबर हैं।",
    form_title: "नया रोजनामचा दर्ज करें",
    narration_label: "कथन (लेनदेन विवरण)",
    ledger_select: "खाता चुनें (Select Ledger)",
    type_select: "प्रवाह प्रकार",
    debit_option: "नाम (Debit)",
    credit_option: "जमा (Credit)",
    amount: "राशि (Rs.)",
    add_row: "पंक्ति जोड़ें (+)",
    save_btn: "रोजनामचा अधिकृत करें",
    th_narr: "लेनदेन विवरण",
    th_break: "खाता प्रविष्टियां",
    no_records: "कोई रोजनामचा दर्ज नहीं है।"
  },
  mr: {
    title: "रोजकिर्द नोंदी (Journals)",
    desc: "डबल-एंट्री नियमांनुसार अचूक रोजकिर्द नोंदी करा. नावे (debit) आणि जमा (credit) जुळणे अनिवार्य आहे.",
    form_title: "नवीन रोजकिर्द नोंद करा",
    narration_label: "स्पष्टीकरण (व्यवहार वर्णन)",
    ledger_select: "खाते निवडा (Select Ledger)",
    type_select: "प्रवाह प्रकार",
    debit_option: "नावे (Debit)",
    credit_option: "जमा (Credit)",
    amount: "रक्कम (Rs.)",
    add_row: "नोंद ओळ जोडा (+)",
    save_btn: "रोजकिर्द नोंद जतन करा",
    th_narr: "व्यवहार स्पष्टीकरण",
    th_break: "खाते नोंदी",
    no_records: "कोणत्याही रोजकिर्द नोंदी आढळल्या नाहीत."
  }
};

const Journals = () => {
  const [journals, setJournals] = useState([]);
  const [narration, setNarration] = useState('');
  const [entries, setEntries] = useState([{ ledger: '', type: 'debit', amount: '' }, { ledger: '', type: 'credit', amount: '' }]);
  const [ledgers, setLedgers] = useState([]);

  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchData = async () => {
    try {
      const resJ = await api.get('/journals');
      setJournals(resJ.data.data);
      const resL = await api.get('/ledgers');
      setLedgers(resL.data.data);
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

  const addEntryRow = () => setEntries(prev => [...prev, { ledger: '', type: 'debit', amount: '' }]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/journals', { narration, entries });
      alert(lang === 'hi' ? 'रोजनामचा सफलतापूर्वक दर्ज किया गया!' : lang === 'mr' ? 'रोजकिर्द नोंद यशस्वीरित्या पूर्ण झाली!' : 'Journal saved successfully!');
      setNarration('');
      setEntries([{ ledger: '', type: 'debit', amount: '' }, { ledger: '', type: 'credit', amount: '' }]);
      fetchData();
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
        
        {/* Journals logs listing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">Journal Entries</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>{t.th_narr}</th>
                  <th>{t.th_break}</th>
                </tr>
              </thead>
              <tbody>
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-400">{t.no_records}</td>
                  </tr>
                ) : (
                  journals.map(j => (
                    <tr key={j._id}>
                      <td className="font-mono text-xs text-slate-400 whitespace-nowrap">
                        {new Date(j.date).toLocaleDateString()} {new Date(j.date).toLocaleTimeString()}
                      </td>
                      <td className="font-black text-slate-800 dark:text-slate-100">{j.narration}</td>
                      <td className="space-y-1">
                        {j.entries.map((en, idx) => (
                          <div key={idx} className="flex justify-between max-w-sm text-sm border-b border-slate-100 dark:border-slate-800 pb-1">
                            <span className="font-semibold text-slate-500">{en.ledger?.name || en.ledger}</span>
                            <span className={en.type === 'debit' ? 'text-emerald-600 font-black' : 'text-indigo-600 font-black'}>
                              {en.type === 'debit' ? 'DR ' : 'CR '}Rs. {en.amount?.toLocaleString()}
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
        </div>

        {/* Input Form */}
        <div>
          <div className="card shadow-sm">
            <h4 className="text-lg font-black mb-6">{t.form_title}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="fg">
                <label>{t.narration_label}</label>
                <input 
                  type="text" required placeholder="Narration" 
                  value={narration} onChange={e => setNarration(e.target.value)}
                  className="fi"
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
                {entries.map((row, i) => (
                  <div key={i} className={`flex flex-col gap-1.5 p-3.5 border rounded-2xl shadow-inner ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <select 
                      required value={row.ledger} 
                      onChange={e => { const v = e.target.value; setEntries(prev => { prev[i].ledger = v; return [...prev]; })}} 
                      className="fi"
                    >
                      <option value="">{t.ledger_select}</option>
                      {ledgers.map(l => <option key={l._id} value={l._id}>{l.name} (Rs. {l.balance})</option>)}
                    </select>

                    <div className="flex gap-2 w-full">
                      <select 
                        value={row.type} 
                        onChange={e => { const v = e.target.value; setEntries(prev => { prev[i].type = v; return [...prev]; })}} 
                        className="fi w-1/2"
                      >
                        <option value="debit">{t.debit_option}</option>
                        <option value="credit">{t.credit_option}</option>
                      </select>
                      <input 
                        type="number" required placeholder={t.amount} 
                        value={row.amount} 
                        onChange={e => { const v = e.target.value; setEntries(prev => { prev[i].amount = v; return [...prev]; })}} 
                        className="fi w-1/2"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" onClick={addEntryRow} 
                  className="btn flex-1"
                  style={{ justifyContent: 'center' }}
                >
                  {t.add_row}
                </button>
                <button 
                  type="submit" 
                  className="btn btn--primary flex-1"
                  style={{ justifyContent: 'center' }}
                >
                  {t.save_btn}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Journals;
