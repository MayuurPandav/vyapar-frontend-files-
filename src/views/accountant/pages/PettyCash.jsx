import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Petty Cash Book",
    desc: "Track micro business expenses, office refreshments, daily postage, and supervisor cash approvals.",
    form_title: "Add Petty Cash Voucher",
    voucher_no: "Voucher Number (e.g. PC-102)",
    voucher_title: "Voucher Details / Description",
    amount: "Amount (Rs.)",
    paid_to: "Paid To (Recipient Name)",
    category: "Expense Category",
    notes: "Notes",
    btn_save: "Log Voucher",
    approve_action: "Approve Voucher",
    status_pending: "Awaiting Review",
    status_approved: "Approved & Paid",
    no_records: "No petty cash vouchers recorded."
  },
  hi: {
    title: "लघु रोकड़ बही (Petty Cash)",
    desc: "सूक्ष्म व्यावसायिक खर्च, कार्यालय जलपान, दैनिक डाक और पर्यवेक्षक नकद अनुमोदन को ट्रैक करें।",
    form_title: "लघु रोकड़ वाउचर जोड़ें",
    voucher_no: "वाउचर संख्या (जैसे PC-102)",
    voucher_title: "वाउचर विवरण",
    amount: "राशि (Rs.)",
    paid_to: "भुगतान किया गया (प्राप्तकर्ता)",
    category: "खर्च की श्रेणी",
    notes: "टिप्पणी",
    btn_save: "वाउचर दर्ज करें",
    status_pending: "सत्यापन लंबित",
    status_approved: "स्वीकृत और भुगतानित",
    no_records: "कोई लघु रोकड़ वाउचर दर्ज नहीं है।"
  },
  mr: {
    title: "किरकोळ रोकड पुस्तक (Petty Cash)",
    desc: "लहान व्यावसायिक खर्च, ऑफिस चहा-पान, दैनिक टपाल आणि पर्यवेक्षक रोख मंजुरींचा मागोवा घ्या.",
    form_title: "किरकोळ रोख व्हाउचर जोडा",
    voucher_no: "व्हाउचर क्रमांक (उदा. PC-102)",
    voucher_title: "व्हाउचर तपशील",
    amount: "व्हाउचर रक्कम (Rs.)",
    paid_to: "कोणाला दिले (नाव)",
    category: "खर्चाचा प्रकार",
    notes: "नोंद",
    btn_save: "व्हाउचर जतन करा",
    approve_action: "व्हाउचर मंजूर करा",
    status_pending: "पडताळणी प्रलंबित",
    status_approved: "मंजूर आणि सशुल्क",
    no_records: "किरकोळ रोख व्हाउचर आढळले नाहीत."
  }
};

const PettyCash = () => {
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState({ voucherNumber: '', title: '', amount: '', paidTo: '', category: 'General', notes: '' });
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/petty-cash');
      setVouchers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVouchers();
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
      await api.post('/petty-cash', form);
      alert('Voucher added successfully!');
      setForm({ voucherNumber: '', title: '', amount: '', paidTo: '', category: 'General', notes: '' });
      fetchVouchers();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const approveVoucher = async (id) => {
    try {
      await api.put(`/petty-cash/${id}/approve`);
      alert('Voucher approved and recorded to Cash book!');
      fetchVouchers();
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
        
        {/* Vouchers feed list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">Petty Cash Vouchers</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Recipient & Details</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">{t.no_records}</td>
                  </tr>
                ) : (
                  vouchers.map(v => (
                    <tr key={v._id}>
                      <td className="font-mono font-bold text-slate-600">{v.voucherNumber}</td>
                      <td className="font-black text-slate-850 dark:text-slate-100">
                        {v.title}
                        <span className="block text-xs text-slate-400 font-medium">{v.paidTo ? `Paid to: ${v.paidTo}` : ''} • {v.category}</span>
                      </td>
                      <td className="text-right font-bold font-mono text-rose-600">Rs. {v.amount?.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge ${v.approved ? 'badge--green' : 'badge--yellow'}`}>
                          {v.approved ? t.status_approved : t.status_pending}
                        </span>
                      </td>
                      <td className="text-right">
                        {!v.approved && (
                          <button 
                            onClick={() => approveVoucher(v._id)}
                            className="btn btn--primary btn--sm"
                            style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none' }}
                          >
                            {t.approve_action}
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

        {/* Input Form */}
        <div>
          <div className="card shadow-sm">
            <h4 className="text-lg font-black mb-6">{t.form_title}</h4>
            <form onSubmit={handleSubmit} className="space-y-4 font-semibold">
              <div className="fg">
                <label>{t.voucher_no}</label>
                <input 
                  type="text" required placeholder="Voucher number" 
                  value={form.voucherNumber} onChange={e => setForm({...form, voucherNumber: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.voucher_title}</label>
                <input 
                  type="text" required placeholder="Voucher description" 
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}
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
                <label>{t.paid_to}</label>
                <input 
                  type="text" placeholder="Recipient name" 
                  value={form.paidTo} onChange={e => setForm({...form, paidTo: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.category}</label>
                <input 
                  type="text" placeholder="e.g. Refreshments" 
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
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

export default PettyCash;
