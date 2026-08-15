import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    title: "Day Book Ledger",
    desc: "A consolidated chronological stream of all system ledger journals.",
    search_placeholder: "Search transactions by narration...",
    date: "Date",
    narration: "Narration",
    breakdown: "Debit vs Credit Entries",
    no_records: "No transaction journals recorded for the selected search.",
    export_excel: "Export to MS Excel"
  },
  hi: {
    title: "डे बुक बही",
    desc: "सभी सिस्टम खाता बही रोजनामचा प्रविष्टियों का एक समेकित कालानुक्रमिक प्रवाह।",
    search_placeholder: "कथन द्वारा लेनदेन खोजें...",
    date: "तारीख",
    narration: "कथन",
    breakdown: "नाम (Debit) बनाम जमा (Credit) प्रविष्टियां",
    no_records: "चयनित खोज के लिए कोई लेनदेन रोजनामचा दर्ज नहीं है।",
    export_excel: "एमएस एक्सेल में निर्यात करें"
  },
  mr: {
    title: "डे बुक खातेवही",
    desc: "सर्व सिस्टम खातेवही रोजकिर्द नोंदींचा एकत्रित कालानुक्रमिक प्रवाह.",
    search_placeholder: "वर्णनानुसार व्यवहार शोधा...",
    date: "दिनांक",
    narration: "स्पष्टीकरण / वर्णन",
    breakdown: "नावे (Debit) विरुद्ध जमा (Credit) नोंदी",
    no_records: "निवडलेल्या शोधासाठी कोणतेही व्यवहार रोजकिर्द आढळले नाहीत.",
    export_excel: "एमएस एक्सेल मध्ये एक्सपोर्ट करा"
  }
};

const DayBook = () => {
  const [journals, setJournals] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'day', 'week', 'month', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const fetchJournals = async () => {
    try {
      const res = await api.get('/journals');
      setJournals(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJournals();
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

  // Filter journals by selected Date Range
  const filteredByDate = journals.filter(j => {
    const itemDate = new Date(j.date);
    if (isNaN(itemDate.getTime())) return true;
    const now = new Date();

    switch (dateFilter) {
      case 'day': {
        return itemDate.toDateString() === now.toDateString();
      }
      case 'week': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return itemDate >= sevenDaysAgo && itemDate <= now;
      }
      case 'month': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return itemDate >= thirtyDaysAgo && itemDate <= now;
      }
      case 'year': {
        const oneYearAgo = new Date();
        oneYearAgo.setDate(now.getDate() - 365);
        return itemDate >= oneYearAgo && itemDate <= now;
      }
      case 'custom': {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= adjustedEnd;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          return itemDate <= adjustedEnd;
        }
        return true;
      }
      case 'all':
      default:
        return true;
    }
  });

  const filtered = filteredByDate.filter(j => 
    j.narration?.toLowerCase().includes(search.toLowerCase()) ||
    j.entries.some(e => e.ledger?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToExcel = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM so Excel opens Hindi/Marathi characters correctly
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    csvContent += `DAY BOOK LEDGER\n`;
    csvContent += `Exported on: ${dateStr} ${timeStr}\n\n`;
    csvContent += `Date,Narration,Ledger/Account,Type,Amount (Rs.)\n`;

    filtered.forEach(j => {
      const formattedDate = `${new Date(j.date).toLocaleDateString()} ${new Date(j.date).toLocaleTimeString()}`;
      const narration = j.narration || '';
      
      j.entries.forEach(en => {
        const ledgerName = en.ledger?.name || en.ledger || '';
        const type = en.type === 'debit' ? 'DR' : 'CR';
        const amount = en.amount || 0;
        
        csvContent += `${escapeCSV(formattedDate)},${escapeCSV(narration)},${escapeCSV(ledgerName)},${type},${amount}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KhataFlow_DayBook_${dateStr.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
          <p className="text-slate-400 font-semibold mt-1">{t.desc}</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={exportToExcel}
            className="btn btn--primary"
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
            {t.export_excel}
          </button>
        </div>
      </header>

      {/* Date Filter Panel */}
      <div className="card mb-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Filter Ledger by Period</h4>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'day', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'Last 30 Days' },
              { id: 'year', label: 'Last 365 Days' },
              { id: 'custom', label: 'Custom Calendar' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition duration-200 active:scale-95 border-0 ${
                  dateFilter === opt.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : `bg-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`
                }`}
                style={{ background: dateFilter === opt.id ? '' : 'none', border: 'none' }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 text-xs animate-fadeIn">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="fi"
                style={{ padding: '6px 12px', width: 'auto' }}
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="fi"
                style={{ padding: '6px 12px', width: 'auto' }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 max-w-md fg">
        <input 
          type="text" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder={t.search_placeholder}
          className="fi"
        />
      </div>

      <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-black">Chronological Transaction Stream</h2>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.narration}</th>
              <th>{t.breakdown}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">{t.no_records}</td>
              </tr>
            ) : (
              filtered.map(j => (
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
  );
};

export default DayBook;
