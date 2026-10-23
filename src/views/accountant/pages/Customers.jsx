import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const customerTranslations = {
  en: {
    title: "Customer Directory & Outstanding Ledger",
    desc: "Manage customer profiles, contact numbers, and outstanding balances. All updates sync instantly with MongoDB Atlas.",
    search_placeholder: "Search customer by name or phone...",
    register_btn: "Register New Customer",
    col_id: "Customer ID",
    col_name: "Customer Name",
    col_phone: "Phone Number",
    col_balance: "Outstanding Balance",
    col_actions: "Actions",
    no_customers: "No customers matching search query.",
    add_modal_title: "Register New Customer Profile",
    edit_modal_title: "Modify Customer Profile Details",
    lbl_name: "Customer Full Name",
    lbl_phone: "Contact Phone Number",
    lbl_balance: "Outstanding Balance (Rs.)",
    btn_cancel: "Cancel",
    btn_save: "Save Changes",
    btn_create: "Register Customer",
    confirm_delete: "Are you sure you want to delete this customer? This action is permanent and cannot be undone.",
    toast_added: "🎉 Customer registered successfully!",
    toast_updated: "🎉 Customer profile updated successfully!",
    toast_deleted: "🗑️ Customer profile deleted successfully!",
  },
  hi: {
    title: "ग्राहक निर्देशिका और बकाया बही",
    desc: "ग्राहक प्रोफाइल, संपर्क नंबर और बकाया राशि प्रबंधित करें। सभी अपडेट मोंगोडीबी एटलस के साथ तुरंत सिंक होते हैं।",
    search_placeholder: "नाम या फोन द्वारा ग्राहक खोजें...",
    register_btn: "नया ग्राहक पंजीकृत करें",
    col_id: "ग्राहक आईडी",
    col_name: "ग्राहक का नाम",
    col_phone: "फ़ोन नंबर",
    col_balance: "बकाया राशि",
    col_actions: "कार्रवाई",
    no_customers: "खोज से मेल खाने वाला कोई ग्राहक नहीं मिला।",
    add_modal_title: "नया ग्राहक प्रोफाइल पंजीकृत करें",
    edit_modal_title: "ग्राहक प्रोफाइल विवरण संशोधित करें",
    lbl_name: "ग्राहक का पूरा नाम",
    lbl_phone: "संपर्क फ़ोन नंबर",
    lbl_balance: "बकाया राशि (Rs.)",
    btn_cancel: "रद्द करें",
    btn_save: "परिवर्तन सहेजें",
    btn_create: "ग्राहक पंजीकृत करें",
    confirm_delete: "क्या आप निश्चित रूप से इस ग्राहक को हटाना चाहते हैं? यह कार्रवाई अस्थायी है और इसे पूर्ववत नहीं किया जा सकता।",
    toast_added: "🎉 ग्राहक सफलतापूर्वक पंजीकृत किया गया!",
    toast_updated: "🎉 ग्राहक प्रोफाइल सफलतापूर्वक अपडेट की गई!",
    toast_deleted: "🗑️ ग्राहक प्रोफाइल सफलतापूर्वक हटा दी गई!",
  },
  mr: {
    title: "ग्राहक निर्देशिका आणि थकीत खातेवही",
    desc: "ग्राहक प्रोफाइल, संपर्क क्रमांक आणि थकीत शिल्लक व्यवस्थापित करा. सर्व अद्यतने मोंगोडीबी ॲटलससह त्वरित सिंक होते.",
    search_placeholder: "नाव किंवा फोनद्वारे ग्राहक शोधा...",
    register_btn: "नवीन ग्राहक नोंदणी करा",
    col_id: "ग्राहकाचे नाव",
    col_name: "ग्राहकाचे नाव",
    col_phone: "फोन नंबर",
    col_balance: "थकीत शिल्लक",
    col_actions: "कृती",
    no_customers: "शोधाशी जुळणारा कोणताही ग्राहक आढळला नाही.",
    add_modal_title: "नवीन ग्राहक प्रोफाइल नोंदणी करा",
    edit_modal_title: "ग्राहक प्रोफाइल तपशील सुधारित करा",
    lbl_name: "ग्राहकाचे पूर्ण नाव",
    lbl_phone: "संपर्क फोन नंबर",
    lbl_balance: "थकीत शिल्लक (Rs.)",
    btn_cancel: "रद्द करा",
    btn_save: "बदल जतन करा",
    btn_create: "ग्राहक नोंदणी करा",
    confirm_delete: "तुम्हाला खात्री आहे की तुम्ही हा ग्राहक हटवू इच्छिता? ही कृती कायमस्वरूपी आहे आणि परत केली जाऊ शकत नाही.",
    toast_added: "🎉 ग्राहकाची नोंदणी यशस्वीरित्या झाली!",
    toast_updated: "🎉 ग्राहक प्रोफाइल यशस्वीरित्या अद्यतनित केले गेले!",
    toast_deleted: "🗑️ ग्राहक प्रोफाइल यशस्वीरित्या हटवले गेले!",
  }
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', openingBalance: '' });

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  useEffect(() => {
    fetchCustomers();

    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    const handleThemeChange = () => setTheme(localStorage.getItem('theme') || 'light');

    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', customerForm);
      alert(t.toast_added);
      setCustomerForm({ name: '', phone: '', openingBalance: '' });
      setShowAddModal(false);
      fetchCustomers();
    } catch (err) {
      alert("Error adding customer: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleEditClick = (c) => {
    setSelectedCustomer(c);
    setCustomerForm({
      name: c.name || '',
      phone: c.phone || '',
      openingBalance: c.openingBalance || '0'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/customers/${selectedCustomer._id}`, customerForm);
      alert(t.toast_updated);
      setCustomerForm({ name: '', phone: '', openingBalance: '' });
      setShowEditModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      alert("Error updating customer: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeleteClick = async (id) => {
    if (await window.confirm(t.confirm_delete)) {
      try {
        await api.delete(`/customers/${id}`);
        alert(t.toast_deleted);
        fetchCustomers();
      } catch (err) {
        alert("Error deleting customer: " + (err?.response?.data?.message || err.message));
      }
    }
  };

  const isDark = theme === 'dark';
  const t = customerTranslations[lang] || customerTranslations.en;

  // Sort by createdAt or _id to ensure stable sequential mapping
  const sortedCustomers = [...customers].sort((a, b) => {
    return (a.createdAt || a._id || '').localeCompare(b.createdAt || b._id || '');
  });

  const getCustomerCode = (customerId) => {
    const idx = sortedCustomers.findIndex(c => c._id === customerId);
    if (idx === -1) return 'CUST-???';
    return `CUST-${String(idx + 1).padStart(3, '0')}`;
  };

  // Filter customers by query (supporting name, phone, raw _id, and user-friendly CUST-XXX code!)
  const filteredCustomers = customers.filter(c => {
    const code = getCustomerCode(c._id).toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c._id && c._id.toLowerCase().includes(query)) ||
      code.includes(query)
    );
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-8 transition-colors duration-300 font-sans`}>
      {/* Customers Table Container */}
      <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>{t.col_id}</th>
              <th>{t.col_name}</th>
              <th>{t.col_phone}</th>
              <th style={{ textAlign: 'right' }}>{t.col_balance}</th>
              <th style={{ textAlign: 'center' }}>{t.col_actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-xs">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">
                  🔍 {t.no_customers}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(c => (
                <tr 
                  key={c._id} 
                  className="transition duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                >
                  <td>
                    <span 
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black select-all tracking-wider shadow-sm border ${
                        isDark 
                          ? 'bg-slate-800/80 border-slate-700/60 text-cyan-400' 
                          : 'bg-blue-50 border-blue-100 text-blue-600'
                      }`}
                      title={`System ID: ${c._id} (Double click to select)`}
                    >
                      {getCustomerCode(c._id)}
                    </span>
                  </td>
                  <td className={`font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{c.name}</td>
                  <td className="text-slate-500 font-bold">{c.phone || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }} className="font-black text-blue-600 dark:text-cyan-400 text-sm">
                    Rs. {Number(c.openingBalance || 0).toLocaleString()}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(c)}
                        className={`p-2 rounded-lg border transition duration-200 active:scale-95 ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 hover:bg-blue-600/10 hover:border-blue-500 text-blue-450 hover:text-blue-400' 
                            : 'bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-400 text-blue-600 hover:text-blue-700'
                        }`}
                        title="Edit Customer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(c._id)}
                        className={`p-2 rounded-lg border transition duration-200 active:scale-95 ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 hover:bg-rose-600/10 hover:border-rose-500 text-rose-450 hover:text-rose-400' 
                            : 'bg-slate-50 border-slate-200 hover:bg-rose-50 hover:border-rose-400 text-rose-600 hover:text-rose-700'
                        }`}
                        title="Delete Customer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <form 
            onSubmit={handleAddSubmit}
            className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all duration-305 text-left ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className={`flex justify-between items-start border-b pb-3 mb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div>
                <span className="text-[10px] font-black text-cyan-600 tracking-wider uppercase">Register Party</span>
                <h3 className="text-2xl font-black tracking-tight mt-0.5">{t.add_modal_title}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`p-1.5 rounded-full transition text-slate-400 ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lbl_name}</label>
                <input 
                  type="text" required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. Sharma Sweets"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lbl_phone}</label>
                <input 
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lbl_balance}</label>
                <input 
                  type="number" required
                  value={customerForm.openingBalance}
                  onChange={(e) => setCustomerForm({...customerForm, openingBalance: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. 4500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  isDark ? 'bg-slate-850 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                }`}
              >
                {t.btn_cancel}
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 transition active:scale-95"
              >
                {t.btn_create}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Customer Modal Overlay */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <form 
            onSubmit={handleEditSubmit}
            className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all duration-305 text-left ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className={`flex justify-between items-start border-b pb-3 mb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div>
                <span className="text-[10px] font-black text-indigo-500 tracking-wider uppercase">Edit Profile</span>
                <h3 className="text-2xl font-black tracking-tight mt-0.5">{t.edit_modal_title}</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCustomer(null);
                }}
                className={`p-1.5 rounded-full transition text-slate-400 ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lbl_name}</label>
                <input 
                  type="text" required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lbl_phone}</label>
                <input 
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. 9999999999"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lbl_balance}</label>
                <input 
                  type="number" required
                  value={customerForm.openingBalance}
                  onChange={(e) => setCustomerForm({...customerForm, openingBalance: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-850 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="e.g. 4993"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCustomer(null);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  isDark ? 'bg-slate-850 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                }`}
              >
                {t.btn_cancel}
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 transition active:scale-95"
              >
                {t.btn_save}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Customers;
