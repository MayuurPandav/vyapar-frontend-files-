import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Cheque Management",
    desc: "Track received and issued cheques, deposit dates, clearing codes, and bounced check actions.",
    form_title: "Log Cheque Record",
    cheque_no: "Cheque Number",
    party: "Party / Payee Name",
    amount: "Amount (Rs.)",
    date: "Issue Date",
    type: "Cheque Type",
    received: "Received (Customer Check)",
    issued: "Issued (Supplier Payment Check)",
    bank: "Clearing Bank Name",
    notes: "Notes",
    btn_save: "Log Cheque",
    status_pending: "Pending",
    status_cleared: "Cleared",
    status_bounced: "Bounced",
    clear_action: "Clear Check",
    bounce_action: "Bounce Check",
    no_records: "No cheques registered in the ledger register."
  },
  hi: {
    title: "चेक प्रबंधन",
    desc: "प्राप्त और जारी किए गए चेक, जमा तिथियों, समाशोधन कोड और बाउंस चेक क्रियाओं को ट्रैक करें।",
    form_title: "चेक रिकॉर्ड दर्ज करें",
    cheque_no: "चेक नंबर",
    party: "पार्टी / प्राप्तकर्ता का नाम",
    amount: "राशि (Rs.)",
    date: "जारी करने की तिथि",
    type: "चेक का प्रकार",
    received: "प्राप्त (ग्राहक चेक)",
    issued: "जारी (आपूर्तिकर्ता भुगतान चेक)",
    bank: "समाशोधन बैंक नाम",
    notes: "टिप्पणी",
    btn_save: "चेक दर्ज करें",
    status_pending: "लंबित",
    status_cleared: "क्लियर हो गया",
    status_bounced: "बाउंस हो गया",
    clear_action: "चेक क्लियर करें",
    bounce_action: "बाउंस घोषित करें",
    no_records: "लेजर रजिस्टर में कोई चेक पंजीकृत नहीं है।"
  },
  mr: {
    title: "धनादेश (Cheque) व्यवस्थापन",
    desc: "मिळालेले आणि जारी केलेले धनादेश, ठेव तारखा, मंजुरी आणि बाऊन्स झालेल्या धनादेशांचा मागोवा घ्या.",
    form_title: "धनादेश नोंदवा",
    cheque_no: "धनादेश क्रमांक",
    party: "पार्टी / प्राप्तकर्त्याचे नाव",
    amount: "धनादेश रक्कम (Rs.)",
    date: "जारी तारीख",
    type: "धनादेश प्रकार",
    received: "मिळालेला (ग्राहक धनादेश)",
    issued: "जारी केलेला (विक्रेता धनादेश)",
    bank: "बँकेचे नाव",
    notes: "टीप",
    btn_save: "धनादेश जतन करा",
    status_pending: "प्रलंबित",
    status_cleared: "स्वीकृत (Cleared)",
    status_bounced: "नाकारलेला (Bounced)",
    clear_action: "धनादेश स्वीकृत करा",
    bounce_action: "नाकारलेला घोषित करा",
    no_records: "रजिस्टरमध्ये कोणतेही धनादेश आढळले नाहीत."
  }
};

const ChequeManagement = () => {
  const [cheques, setCheques] = useState([]);
  const [form, setForm] = useState({ chequeNumber: '', partyName: '', amount: '', issueDate: '', type: 'received', bankName: '', notes: '' });
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchCheques = async () => {
    try {
      const res = await api.get('/cheques');
      setCheques(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCheques();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cheques', form);
      alert('Cheque record logged successfully!');
      setForm({ chequeNumber: '', partyName: '', amount: '', issueDate: '', type: 'received', bankName: '', notes: '' });
      fetchCheques();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/cheques/${id}/status`, { status });
      alert(`Cheque status updated to ${status}!`);
      fetchCheques();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cheques ledger view */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">Cheque Register</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cheque No.</th>
                  <th>Party</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cheques.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">{t.no_records}</td>
                  </tr>
                ) : (
                  cheques.map(c => (
                    <tr key={c._id}>
                      <td className="font-mono font-bold text-slate-600">{c.chequeNumber}</td>
                      <td className="font-black text-slate-850 dark:text-slate-100">
                        {c.partyName}
                        <span className="block text-xs text-slate-400 font-medium">{new Date(c.issueDate).toLocaleDateString()} • {c.bankName || 'N/A'}</span>
                      </td>
                      <td className="text-right font-bold font-mono">Rs. {c.amount?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${c.status === 'cleared' ? 'badge--green' : c.status === 'bounced' ? 'badge--red' : 'badge--yellow'}`}>
                          {c.status === 'cleared' ? t.status_cleared : c.status === 'bounced' ? t.status_bounced : t.status_pending}
                        </span>
                      </td>
                      <td className="text-right space-x-2 whitespace-nowrap">
                        {c.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateStatus(c._id, 'cleared')}
                              className="btn btn--primary btn--sm"
                              style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                            >
                              {t.clear_action}
                            </button>
                            <button 
                              onClick={() => updateStatus(c._id, 'bounced')}
                              className="btn btn--primary btn--sm"
                              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                            >
                              {t.bounce_action}
                            </button>
                          </>
                        )}
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
            <form onSubmit={handleSubmit} className="space-y-4 font-semibold">
              <div className="fg">
                <label>{t.cheque_no}</label>
                <input 
                  type="text" required placeholder="Cheque number" 
                  value={form.chequeNumber} onChange={e => setForm({...form, chequeNumber: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.party}</label>
                <input 
                  type="text" required placeholder="Party / payee name" 
                  value={form.partyName} onChange={e => setForm({...form, partyName: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.amount}</label>
                <input 
                  type="number" required placeholder="0.00" 
                  value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.date}</label>
                <input 
                  type="date" required 
                  value={form.issueDate} onChange={e => setForm({...form, issueDate: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.type}</label>
                <select 
                  value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="fi"
                >
                  <option value="received">{t.received}</option>
                  <option value="issued">{t.issued}</option>
                </select>
              </div>

              <div className="fg">
                <label>{t.bank}</label>
                <input 
                  type="text" placeholder="e.g. State Bank of India" 
                  value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})}
                  className="fi"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn--primary w-full"
                style={{ justifyContent: 'center' }}
              >
                {t.btn_save}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChequeManagement;
