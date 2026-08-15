import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const translations = {
  en: {
    title: "My Profile & Settings",
    desc: "View admin operator credentials, change security passwords, and adjust system language settings.",
    personalTitle: "Personal Operator Credentials",
    secTitle: "Security & Access Control",
    name: "Full Operator Name",
    email: "Account Email Reference",
    role: "Assigned Authorization",
    phone: "Phone Number",
    employeeId: "Employee ID (Admin Managed)",
    btnSaveDetails: "Save Profile Details",
    successDetails: "Profile details updated successfully!",
    lockedBadge: "Locked by Admin",
    oldPass: "Current Security Password",
    newPass: "New Security Password",
    confirmPass: "Confirm New Password",
    btnSave: "Update Security Password",
    successPass: "Password updated successfully!",
    errorMatch: "New password and confirmation do not match!",
    errorFields: "Please fill all password fields.",
    placeholderOld: "Enter current password",
    placeholderNew: "Enter new password",
    placeholderConfirm: "Repeat new password"
  },
  hi: {
    title: "मेरी प्रोफाइल और सेटिंग्स",
    desc: "व्यवस्थापक ऑपरेटर क्रेडेंशियल्स देखें, सुरक्षा पासवर्ड बदलें, और सिस्टम सेटिंग्स समायोजित करें।",
    personalTitle: "व्यक्तिगत ऑपरेटर क्रेडेंशियल्स",
    secTitle: "सुरक्षा और पहुँच नियंत्रण",
    name: "ऑपरेटर का पूरा नाम",
    email: "खाता ईमेल संदर्भ",
    role: "असाइन किया गया प्राधिकरण",
    phone: "फोन नंबर",
    employeeId: "कर्मचारी आईडी (प्रशासक द्वारा प्रबंधित)",
    btnSaveDetails: "प्रोफ़ाइल विवरण सहेजें",
    successDetails: "प्रोफ़ाइल विवरण सफलतापूर्वक अपडेट किया गया!",
    lockedBadge: "एडमिन द्वारा लॉक",
    oldPass: "वर्तमान सुरक्षा पासवर्ड",
    newPass: "नया सुरक्षा पासवर्ड",
    confirmPass: "नए पासवर्ड की पुष्टि करें",
    btnSave: "सुरक्षा पासवर्ड अपडेट करें",
    successPass: "पासवर्ड सफलतापूर्वक अपडेट किया गया!",
    errorMatch: "नया पासवर्ड और पुष्टि मेल नहीं खाते हैं!",
    errorFields: "कृपया सभी पासवर्ड फ़ील्ड भरें।",
    placeholderOld: "वर्तमान पासवर्ड दर्ज करें",
    placeholderNew: "नया पासवर्ड दर्ज करें",
    placeholderConfirm: "नया पासवर्ड दोहराएं"
  },
  mr: {
    title: "माझी प्रोफाइल आणि सेटिंग्स",
    desc: "प्रशासक ऑपरेटर क्रेडेंशियल्स पहा, सुरक्षा पासवर्ड बदला आणि सिस्टम सेटिंग्स व्यवस्थापित करा.",
    personalTitle: "वैयक्तिक ऑपरेटर क्रेडेंशियल्स",
    secTitle: "सुरक्षा आणि प्रवेश नियंत्रण",
    name: "ऑपरेटरचे पूर्ण नाव",
    email: "खाते ईमेल संदर्भ",
    role: "नियुक्त केलेले प्राधिकृत",
    phone: "दूरध्वनी क्रमांक",
    employeeId: "कर्मचारी आयडी (प्रशासकाद्वारे व्यवस्थापित)",
    btnSaveDetails: "प्रोफाइल तपशील जतन करा",
    successDetails: "प्रोफाइल तपशील यशस्वीरित्या अद्यतनित केले गेले!",
    lockedBadge: "प्रशासकाद्वारे लॉक",
    oldPass: "सध्याचा सुरक्षा पासवर्ड",
    newPass: "नवीन सुरक्षा पासवर्ड",
    confirmPass: "नवीन पासवर्डची खात्री करा",
    btnSave: "सुरक्षा पासवर्ड अद्यतनित करा",
    successPass: "पासवर्ड यशस्वीरित्या अद्यतनित केला गेला!",
    errorMatch: "नवीन पासवर्ड आणि पुष्टीकरण जुळत नाही!",
    errorFields: "कृपया सर्व पासवर्ड फील्ड भरा.",
    placeholderOld: "सध्याचा पासवर्ड प्रविष्ट करा",
    placeholderNew: "नवीन पासवर्ड प्रविष्ट करा",
    placeholderConfirm: "नवीन पासवर्ड पुन्हा प्रविष्ट करा"
  }
};

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Custom non-blocking Toast alert
  const [toast, setToast] = useState(null);

  // Profile details state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: ''
  });

  // Password fields
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        employeeId: user.employeeId || ''
      });
    }
  }, [user]);

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

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone } = profileForm;

    if (!name || !email) {
      triggerToast(lang === 'hi' ? 'नाम और ईमेल आवश्यक हैं।' : lang === 'mr' ? 'नाव आणि ईमेल आवश्यक आहेत.' : 'Name and Email are required.', 'error');
      return;
    }

    try {
      const res = await api.put('/auth/profile', { name, email, phone });
      setUser(res.data.data);
      triggerToast(t.successDetails, 'success');
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      triggerToast(t.errorFields, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerToast(t.errorMatch, 'error');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      triggerToast(t.successPass, 'success');
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notifier */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
        
        {/* Personal Details Form */}
        <form onSubmit={handleDetailsSubmit} className="card">
          <h2 className="text-lg font-black mb-6 border-b pb-3 border-slate-100 dark:border-slate-800">{t.personalTitle}</h2>
          
          <div className="space-y-4 font-semibold">
            {/* Locked Employee ID Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {t.employeeId}
                </label>
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  {t.lockedBadge}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  readOnly
                  value={profileForm.employeeId || "EMP-2026-0001"}
                  className="fi"
                  style={{ fontFamily: 'monospace', opacity: 0.7 }}
                />
              </div>
            </div>

            {/* Operator Name Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {t.name} <span className="text-rose-500 font-bold text-xs">*</span>
              </label>
              <input
                type="text" required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="fi"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {t.email} <span className="text-rose-500 font-bold text-xs">*</span>
              </label>
              <input
                type="email" required
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="fi"
              />
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {t.phone}
              </label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="fi"
              />
            </div>

            {/* Read-Only Role Badge */}
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">{t.role}</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {user?.role === 'admin' ? "Admin Operator" : "Operator Partner"}
              </div>
            </div>

            {/* Save details Button */}
            <button
              type="submit"
              className="btn btn--primary w-full"
              style={{ border: 'none', padding: '14px', justifyContent: 'center' }}
            >
              {t.btnSaveDetails}
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordSubmit} className="card">
          <h2 className="text-lg font-black mb-6 border-b pb-3 border-slate-100 dark:border-slate-800">{t.secTitle}</h2>
          
          <div className="space-y-4 font-semibold">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {t.oldPass} <span className="text-rose-500 font-bold text-xs">*</span>
              </label>
              <input
                type="password" required placeholder={t.placeholderOld}
                value={passForm.oldPassword}
                onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
                className="fi"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {t.newPass} <span className="text-rose-500 font-bold text-xs">*</span>
              </label>
              <input
                type="password" required placeholder={t.placeholderNew}
                value={passForm.newPassword}
                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                className="fi"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {t.confirmPass} <span className="text-rose-500 font-bold text-xs">*</span>
              </label>
              <input
                type="password" required placeholder={t.placeholderConfirm}
                value={passForm.confirmPassword}
                onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
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
          </div>
        </form>

      </div>

    </div>
  );
};

export default Profile;
