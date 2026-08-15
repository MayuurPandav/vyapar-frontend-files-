import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const navbarTranslations = {
  en: {
    logout: "Logout",
    settings: "System Settings Panel",
    theme: "Select Visual Theme",
    lang: "Select System Language",
    light: "Light Theme",
    dark: "Dark Theme",
    notifications: "Actionable Notifications",
    no_notifications: "No critical alerts. Your accounts are fully reconciled!",
    notify_overdue: "Alert: You have {count} overdue customer invoices pending collection!",
    notify_expenses: "Alert: You have {count} business expenses awaiting manager verification!",
    save_settings: "Apply & Save Settings"
  },
  hi: {
    logout: "लॉगआउट",
    settings: "सिस्टम सेटिंग्स पैनल",
    theme: "थीम का चयन करें",
    lang: "सिस्टम भाषा चुनें",
    light: "लाइट थीम",
    dark: "डार्क थीम",
    notifications: "सक्रिय सूचनाएं",
    no_notifications: "कोई महत्वपूर्ण अलर्ट नहीं है। आपके खाते पूरी तरह से संतुलित हैं!",
    notify_overdue: "अलर्ट: आपके पास {count} बकाया ग्राहक चालान लंबित हैं!",
    notify_expenses: "अलर्ट: आपके पास {count} व्यावसायिक खर्च सत्यापन के लिए लंबित हैं!",
    save_settings: "सेटिंग्स लागू करें"
  },
  mr: {
    logout: "लॉगआउट",
    settings: "सिस्टम सेटिंग्स पॅनेल",
    theme: "थीम निवडा",
    lang: "सिस्टम भाषा निवडा",
    light: "लाइट थीम",
    dark: "डार्क थीम",
    notifications: "सक्रिय सूचना",
    no_notifications: "कोणत्याही गंभीर सूचना नाहीत. तुमची खाती पूर्णपणे जुळली आहेत!",
    notify_overdue: "सूचना: आपल्याकडे {count} थकीत ग्राहक इनव्हॉइस गोळा करणे बाकी आहे!",
    notify_expenses: "सूचना: आपल्याकडे {count} व्यावसायिक खर्च व्यवस्थापक पडताळणीसाठी प्रलंबित आहेत!",
    save_settings: "सेटिंग्ज जतन करा"
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState('light');
  const [brandTheme, setBrandTheme] = useState(localStorage.getItem('brandTheme') || 'indigo');

  // Global Search states
  const [customersList, setCustomersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Overlay states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpDetails, setShowHelpDetails] = useState(false);

  // Dynamic Dashboard Stats
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Navbar failed to fetch stats for dynamic badge', err);
    }
  };

  const [broadcasts, setBroadcasts] = useState([]);

  const fetchBroadcasts = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/admin/notifications/my?username=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const list = data.notifications || [];
          setBroadcasts(list);

          // Pop up alert for new unread messages
          const storageKey = `seen_accountant_notifs_${user.email}`;
          let seenIds = [];
          try {
            seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
          } catch (e) {}

          const newUnread = list.filter(n => !n.read && !seenIds.includes(String(n._id)));
          if (newUnread.length > 0) {
            const updatedSeen = [...seenIds, ...newUnread.map(n => String(n._id))];
            localStorage.setItem(storageKey, JSON.stringify(updatedSeen));

            newUnread.forEach(notif => {
              window.alert(`📢 Broadcast Message:\n\nTitle: ${notif.title}\n\n${notif.message}`);
              
              // Auto ack read
              fetch('/api/admin/notifications/ack/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.email, notificationId: notif._id })
              }).catch(err => console.error('Error auto-ack read:', err));
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', 'light');
    setTheme('light');

    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'en');
    };
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    const handleBrandChange = () => {
      setBrandTheme(localStorage.getItem('brandTheme') || 'indigo');
    };

    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('themeChange', handleThemeChange);
    window.addEventListener('brandThemeChange', handleBrandChange);

    // Fetch initial customer list for search
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomersList(res.data.data || []);
      } catch (err) {
        console.error('Navbar failed to load customers for global search', err);
      }
    };

    let interval;
    if (user) {
      fetchCustomers();
      fetchStats();
      fetchBroadcasts();
      interval = setInterval(fetchBroadcasts, 15000);
    }

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('brandThemeChange', handleBrandChange);
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Refresh stats when overlays open
  useEffect(() => {
    if (user && (showNotifications || showSettings)) {
      fetchStats();
      fetchBroadcasts();
    }
  }, [showNotifications, showSettings, user]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use a modern browser like Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN'; // Indian-accented English to better parse Indian names
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setSearchQuery(speechToText);

      if (speechToText && customersList.length > 0) {
        const query = speechToText.toLowerCase().trim();

        // Find best match (by exact name, prefix, or contains)
        const bestMatch = customersList.find(c =>
          c.name && (c.name.toLowerCase() === query || c.name.toLowerCase().includes(query) || query.includes(c.name.toLowerCase()))
        );

        if (bestMatch) {
          setSelectedCustomer(bestMatch);
          setSearchQuery('');
          setSuggestions([]);
        } else {
          // If no direct snapshot match, populate query in suggestions
          const filtered = customersList.filter(c =>
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.phone && c.phone.includes(query))
          );
          setSuggestions(filtered);
        }
      }
    };

    recognition.onerror = (err) => {
      console.error('Speech recognition error:', err.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length >= 1) {
      const filtered = customersList.filter(c =>
        (c.name && c.name.toLowerCase().includes(value.toLowerCase())) ||
        (c._id && c._id.toLowerCase().includes(value.toLowerCase())) ||
        (c.phone && c.phone.includes(value))
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Language trigger helper
  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  // Theme trigger helper
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new Event('themeChange'));
  };

  // Database Backup utility
  const handleSystemBackup = async () => {
    try {
      const [customersRes, ledgersRes, journalsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/ledgers'),
        api.get('/journals')
      ]);

      const backupData = {
        backupDate: new Date().toISOString(),
        suite: "KhataFlow Enterprise",
        version: "2.0.0",
        data: {
          customers: customersRes.data.data || [],
          ledgers: ledgersRes.data.data || [],
          journals: journalsRes.data.data || []
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `khataflow_system_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert("🎉 Database backup created and downloaded successfully as JSON!");
    } catch (err) {
      console.error('System backup failed:', err);
      alert("❌ Failed to compile system backup. Please check your network connection.");
    }
  };

  const isDark = theme === 'dark';
  const t = navbarTranslations[lang] || navbarTranslations.en;
  const unreadBroadcastsCount = broadcasts.filter(b => !b.read).length;
  const criticalCount = (stats?.overdueCount || 0) + (stats?.pendingExpenseApprovals || 0) + unreadBroadcastsCount;

  return (
    <header className="topbar topbar-accountant">
      {/* Global Customer Search Bar */}
      {user && (
        <div className="topbar__search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search customer by name, ID or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ paddingRight: '40px' }}
          />

          {/* Premium Voice Search Microphone */}
          <button
            type="button"
            onClick={startListening}
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: isListening ? '#ef4444' : 'var(--text-3)', 
              padding: '4px',
              animation: isListening ? 'pulseIcon 1.5s infinite ease-in-out' : 'none'
            }}
            title="Search customer by voice"
          >
            <i className="fas fa-microphone"></i>
          </button>

          {/* Voice Search Hint Banner */}
          {isListening && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg flex items-center justify-between z-[101] animate-pulse">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Listening... Speak customer name</span>
              </div>
              <button onClick={() => setIsListening(false)} className="opacity-80 hover:opacity-100 text-white font-extrabold ml-2">✕</button>
            </div>
          )}

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className={`absolute top-full left-0 mt-1.5 w-full border rounded-xl shadow-xl z-[100] overflow-hidden max-h-60 overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              {suggestions.map(c => (
                <div
                  key={c._id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className={`px-4 py-2.5 cursor-pointer flex flex-col transition border-b last:border-0 ${
                    isDark ? 'hover:bg-slate-800 border-slate-850' : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <span className={`font-extrabold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono truncate">ID: {c._id} | {c.phone || 'No Phone'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Header Utility Actions */}
      <div className="topbar__right" style={{ position: 'relative' }}>
        {user && (
          <>
            {/* Notification Bell Dropdown wrapper */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifications(prev => !prev);
                  setShowSettings(false);
                }}
                className="topbar__bell"
                title="Notifications"
              >
                <i className="far fa-bell"></i>
                {criticalCount > 0 && <span className="topbar__bell-dot"></span>}
              </button>

              {/* Dropdown 1: Global Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute top-full right-0 mt-2.5 w-80 sm:w-96 border rounded-2xl p-6 shadow-2xl z-[100] animate-fadeIn ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className={`flex justify-between items-start border-b pb-3 mb-4 ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="text-left">
                      <span className="text-[10px] font-black text-cyan-600 tracking-wider uppercase">Real-Time Alerts</span>
                      <h3 className="text-xl font-black tracking-tight mt-0.5">{t.notifications}</h3>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="btn--icon"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {criticalCount === 0 ? (
                      <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        🔔 {t.no_notifications}
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                        {/* Render broadcasts */}
                        {broadcasts.map((b, i) => (
                          <div
                            key={`b-${i}`}
                            onClick={async () => {
                              if (!b.read) {
                                try {
                                  await fetch('/api/admin/notifications/ack/read', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ username: user.email, notificationId: b._id })
                                  });
                                  fetchBroadcasts();
                                } catch (err) {
                                  console.error('Failed to ack read:', err);
                                }
                              }
                            }}
                            className={`p-4 border rounded-2xl cursor-pointer hover:shadow-md transition duration-200 flex items-center gap-4 ${
                              b.read
                                ? (isDark ? 'bg-slate-800/40 border-slate-750 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/50')
                                : (isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100/50')
                            }`}
                          >
                            <div className={`p-2.5 rounded-xl text-white flex items-center justify-center ${b.read ? 'bg-slate-400' : 'bg-blue-500'}`}>
                              <i className="fas fa-bullhorn"></i>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-1">
                                <p className="font-extrabold text-sm truncate">{b.title}</p>
                                {!b.read && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{b.message}</p>
                              <p className="text-[9px] text-slate-400 mt-1">{new Date(b.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}

                        {(stats?.overdueCount > 0) && (
                          <div
                            onClick={() => {
                              setShowNotifications(false);
                              localStorage.setItem('dashboardActivePage', 'overdue');
                              navigate('/');
                              window.dispatchEvent(new Event('dashboardActivePageChange'));
                            }}
                            className={`p-4 border rounded-2xl cursor-pointer hover:shadow-md transition duration-200 flex items-center gap-4 ${
                              isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-455 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50'
                            }`}
                          >
                            <div className="p-2.5 bg-rose-500 rounded-xl text-white flex items-center justify-center">
                              <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="font-extrabold text-sm truncate">{t.notify_overdue.replace('{count}', stats.overdueCount)}</p>
                              <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Click here to resolve outstanding invoices</p>
                            </div>
                          </div>
                        )}

                        {(stats?.pendingExpenseApprovals > 0) && (
                          <div
                            onClick={() => {
                              setShowNotifications(false);
                              localStorage.setItem('dashboardActivePage', 'expenses');
                              navigate('/');
                              window.dispatchEvent(new Event('dashboardActivePageChange'));
                            }}
                            className={`p-4 border rounded-2xl cursor-pointer hover:shadow-md transition duration-200 flex items-center gap-4 ${
                              isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-405 hover:bg-violet-500/20' : 'bg-violet-50 border-rose-200 text-violet-850 hover:bg-violet-100/50'
                            }`}
                          >
                            <div className="p-2.5 bg-violet-500 rounded-xl text-white flex items-center justify-center">
                              <i className="fas fa-receipt"></i>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="font-extrabold text-sm truncate">{t.notify_expenses.replace('{count}', stats.pendingExpenseApprovals)}</p>
                              <p className="text-[10px] text-violet-600 font-semibold mt-0.5">Click here to verify operating expenses</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="btn btn--block"
                    >
                      Dismiss Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear Dropdown wrapper */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowSettings(prev => !prev);
                  setShowNotifications(false);
                }}
                className="topbar__bell"
                title="Settings"
              >
                <i className="fas fa-gear"></i>
              </button>

              {/* Dropdown 2: Global Settings Dropdown */}
              {showSettings && (
                <div className={`absolute top-full right-0 mt-3 w-80 sm:w-[400px] border rounded-2xl p-6 shadow-2xl z-[100] animate-fadeIn ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className={`flex justify-between items-center border-b pb-4 mb-5 ${
                    isDark ? 'border-slate-850' : 'border-slate-100'
                  }`}>
                    <div className="text-left">
                      <span className="block text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-1">Global Preferences</span>
                      <h3 className="text-lg font-extrabold tracking-tight mt-0">{t.settings}</h3>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="btn--icon p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Language selection */}
                    <div className="text-left space-y-2.5">
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.lang}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button" onClick={() => changeLanguage('en')}
                          className={`py-2 text-center text-xs font-bold rounded-xl border transition-all duration-200 ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-300')}`}
                        >
                          English
                        </button>
                        <button
                          type="button" onClick={() => changeLanguage('hi')}
                          className={`py-2 text-center text-xs font-bold rounded-xl border transition-all duration-200 ${lang === 'hi' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750' : 'bg-white text-slate-655 hover:bg-slate-50 border-slate-300')}`}
                        >
                          हिंदी
                        </button>
                        <button
                          type="button" onClick={() => changeLanguage('mr')}
                          className={`py-2 text-center text-xs font-bold rounded-xl border transition-all duration-200 ${lang === 'mr' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750' : 'bg-white text-slate-655 hover:bg-slate-50 border-slate-300')}`}
                        >
                          मराठी
                        </button>
                      </div>
                    </div>

                    <div className={`border-t my-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                    {/* Operations & Utilities Panel */}
                    <div className="text-left space-y-3">
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{`${lang === 'hi' ? 'त्वरित उपयोगिताएँ' : (lang === 'mr' ? 'त्वरित उपयुक्तता' : 'System Operations & Utilities')}`}</label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Help & Contact Button */}
                        <button
                          type="button"
                          onClick={() => setShowHelpDetails(prev => !prev)}
                          className="btn w-full justify-center btn--outline text-xs py-2.5"
                        >
                          {showHelpDetails ? 'Hide Support' : 'Help & Contact'}
                        </button>

                        {/* System Backup Button */}
                        <button
                          type="button"
                          onClick={handleSystemBackup}
                          className="btn w-full justify-center btn--outline text-xs py-2.5"
                        >
                          Backup Database
                        </button>

                        {/* Logout Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowSettings(false);
                            logout();
                          }}
                          className="btn w-full justify-center btn--danger text-xs py-2.5"
                        >
                          Secure Sign Out
                        </button>
                      </div>

                      {/* Help Details Dropdown panel */}
                      {showHelpDetails && (
                        <div className={`p-4 rounded-xl border transition-all duration-300 text-[11px] text-left space-y-2 mt-2.5 leading-relaxed ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-655'
                          }`}>
                          <p className="font-extrabold text-blue-500 mb-1 text-left">📞 KHATAFLOW ENTERPRISE HELP CENTER</p>
                          <p>👥 **Account Operator Support Desk** is online Monday - Saturday: 9:00 AM - 7:00 PM IST.</p>
                          <p>✉️ **Email Support**: `support@khataflow.com` (Average response time: 2 hours)</p>
                          <p>📞 **Helpline Toll-Free**: `+91 1800 234 5678` / Direct Helpline: `+91 98765 43210`</p>
                          <p>💡 **Quick Tip**: You can use the Voice Search bar at the top global header to find any customer details instantly by clicking the mic icon and speaking their name.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`border-t mt-5 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                  <div className="text-center">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="btn w-full justify-center btn--primary text-xs py-2.5"
                    >
                      {t.save_settings}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Card & Dropdown */}
            <div className="topbar__profile" onClick={() => navigate('/profile')}>
              <img
                src={`https://ui-avatars.com/api/?name=${user?.name || 'Accountant'}&background=3b82f6&color=fff&size=64`}
                className="topbar__avatar"
                alt="Accountant"
              />
              <span className="topbar__name">{user?.name || 'Accountant'}</span>
              <i className="fas fa-chevron-down" style={{ fontSize: '10px', color: 'var(--text-3)' }}></i>
            </div>
          </>
        )}
      </div>

      {/* Global Customer Snapshot Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
            <div className={`flex justify-between items-start border-b pb-3 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
              <div>
                <span className="text-[10px] font-black text-cyan-600 tracking-wider uppercase">Party Profile Snapshot</span>
                <h3 className="text-2xl font-black tracking-tight mt-0.5">{selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn--icon"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border space-y-3 text-left ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                }`}>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Customer ID</span>
                  <span className={`text-xs font-mono font-bold select-all ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{selectedCustomer._id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedCustomer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Live Status</span>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${selectedCustomer.openingBalance > 0
                        ? (isDark ? 'bg-rose-500/20 text-rose-450' : 'bg-rose-100 text-rose-700')
                        : (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                      }`}>
                      {selectedCustomer.openingBalance > 0 ? 'Outstanding Dues' : 'Fully Settled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${selectedCustomer.openingBalance > 0
                  ? (isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-455' : 'bg-rose-500/10 border-rose-500/20 text-rose-800')
                  : (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600')
                }`}>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest block opacity-85">Outstanding Balance</span>
                  <span className="text-2xl font-black tracking-tight mt-0.5 block">
                    Rs. {Number(selectedCustomer.openingBalance || 0).toLocaleString()}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${selectedCustomer.openingBalance > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'} shadow-sm flex items-center justify-center`}>
                  <i className="fas fa-file-invoice"></i>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn btn--block"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
