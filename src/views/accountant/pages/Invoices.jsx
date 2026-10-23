import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Invoices & Billing",
    desc: "Deploy new customer invoices, track collections, outstanding receivables, and record real-time settlements.",
    deploy_title: "Deploy Customer Invoice",
    inv_code: "Invoice Code (e.g. INV-2026-104)",
    select_cust: "Select Billing Customer",
    amount: "Total Invoice Amount (Rs.)",
    due_date: "Invoice Due Date",
    btn_deploy: "Deploy Invoice",
    list_title: "Outstanding and Overdue Customer Invoices",
    th_inv_id: "Invoice ID",
    th_cust: "Customer",
    th_due: "Due Date",
    th_amt: "Amount",
    th_status: "Status",
    th_action: "Action",
    btn_mark_paid: "Mark Paid",
    status_paid: "Paid",
    status_unpaid: "Unpaid",
    status_overdue: "Overdue",
    no_records: "No invoices logged in database."
  },
  hi: {
    title: "चालान और बिलिंग",
    desc: "नए ग्राहक चालान तैनात करें, संग्रह को ट्रैक करें, और वास्तविक समय में भुगतान निपटान दर्ज करें।",
    deploy_title: "ग्राहक चालान तैनात करें",
    inv_code: "चालान कोड (जैसे INV-2026-104)",
    select_cust: "बिलिंग ग्राहक का चयन करें",
    amount: "कुल चालान राशि (Rs.)",
    due_date: "चालान देय तिथि",
    btn_deploy: "चालान तैनात करें",
    list_title: "बकाया और अतिदेय ग्राहक चालान",
    th_inv_id: "चालान आईडी",
    th_cust: "ग्राहक",
    th_due: "देय तिथि",
    th_amt: "राशि",
    th_status: "स्थिति",
    th_action: "कार्रवाई",
    btn_mark_paid: "भुगतान चिह्नित करें",
    status_paid: "भुगतानित",
    status_unpaid: "अवैतनिक",
    status_overdue: "अतिदेय",
    no_records: "डेटाबेस में कोई चालान नहीं मिला।"
  },
  mr: {
    title: "इनव्हॉइस आणि बिलिंग",
    desc: "नवीन ग्राहक इनव्हॉइस तयार करा, संकलन ट्रॅक करा आणि रिअल-टाइम पेमेंट सेटलमेंट रेकॉर्ड करा.",
    deploy_title: "ग्राहक इनव्हॉइस तयार करा",
    inv_code: "इनव्हॉइस कोड (उदा. INV-2026-104)",
    select_cust: "बिलिंग ग्राहक निवडा",
    amount: "एकूण इनव्हॉइस रक्कम (Rs.)",
    due_date: "इनव्हॉइस देय तारीख",
    btn_deploy: "इनव्हॉइस तयार करा",
    list_title: "थकीत ग्राहक इनव्हॉइस",
    th_inv_id: "इनव्हॉइस आयडी",
    th_cust: "ग्राहक",
    th_due: "देय तारीख",
    th_amt: "रक्कम",
    th_status: "स्थिती",
    th_action: "कृती",
    btn_mark_paid: "भरलेले म्हणून चिन्हांकित करा",
    status_paid: "सशुल्क",
    status_unpaid: "थकीत",
    status_overdue: "अतिदेय",
    no_records: "डेटाबेसमध्ये कोणतेही इनव्हॉइस आढळले नाही."
  }
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ invoiceNumber: '', customerId: '', amount: '', dueDate: '' });
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const resInv = await api.get('/dashboard/invoices');
      setInvoices(resInv.data.data);
      const resCust = await api.get('/customers');
      setCustomers(resCust.data.data);
    } catch (err) {
      console.error('Error fetching invoices/customers', err);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/invoices', form);
      alert(lang === 'hi' ? 'चालान सफलतापूर्वक तैनात किया गया!' : lang === 'mr' ? 'इनव्हॉइस यशस्वीरित्या तयार केले!' : 'Invoice deployed successfully!');
      setForm({ invoiceNumber: '', customerId: '', amount: '', dueDate: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSettle = async (id) => {
    try {
      await api.put(`/dashboard/invoices/${id}/settle`);
      alert(lang === 'hi' ? 'चालान का सफलतापूर्वक निपटान किया गया!' : lang === 'mr' ? 'इनव्हॉइस यशस्वीरित्या सेटल केले!' : 'Invoice settled and recorded successfully!');
      fetchData();
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black">{t.list_title}</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t.th_inv_id}</th>
                  <th>{t.th_cust}</th>
                  <th>{t.th_due}</th>
                  <th className="text-right">{t.th_amt}</th>
                  <th className="text-center">{t.th_status}</th>
                  <th className="text-right">{t.th_action}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">{t.no_records}</td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv._id}>
                      <td className="font-mono font-bold text-slate-600">{inv.invoiceNumber}</td>
                      <td className="font-bold">{inv.customerName || inv.customer?.name}</td>
                      <td className="text-xs text-slate-400 font-mono">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="text-right font-bold font-mono">Rs. {inv.amount?.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge ${inv.status === 'paid' ? 'badge--green' : new Date(inv.dueDate) < new Date() ? 'badge--red' : 'badge--yellow'}`}>
                          {inv.status === 'paid' ? t.status_paid : new Date(inv.dueDate) < new Date() ? t.status_overdue : t.status_unpaid}
                        </span>
                      </td>
                      <td className="text-right">
                        {inv.status !== 'paid' && (
                          <button 
                            onClick={() => handleSettle(inv._id)}
                            className="btn btn--primary btn--sm"
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                          >
                            {t.btn_mark_paid}
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

        {/* Deploy Invoice Form */}
        <div>
          <div className="card shadow-sm">
            <h4 className="text-lg font-black mb-6">{t.deploy_title}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="fg">
                <label>{t.inv_code}</label>
                <input 
                  type="text" required placeholder="e.g. INV-2026-001" 
                  value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})}
                  className="fi"
                />
              </div>

              <div className="fg">
                <label>{t.select_cust}</label>
                <select 
                  required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}
                  className="fi"
                >
                  <option value="">{t.select_cust}</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
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
                <label>{t.due_date}</label>
                <input 
                  type="date" required 
                  value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                  className="fi"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn--primary w-full"
                style={{ justifyContent: 'center' }}
              >
                {t.btn_deploy}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
