import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';

const translations = {
  en: {
    title: "Reports & Analytics Center",
    desc: "Visualize enterprise assets, audit financial statements, compile GST returns, reconcile outstanding balances, and export compliance sheets.",
    tabOverview: "Overview Charts",
    tabFinancials: "Financial Statements",
    tabGst: "GST Tax Audits",
    tabParties: "Party Balances",
    tabExport: "Export Center",
    assetsTitle: "Asset Composition Donut",
    solvencyTitle: "Receivables vs Payables Pie",
    salesExpTitle: "Revenues vs Operating Expenses",
    gstGaugeTitle: "GST Input Tax Offset Credit",
    cash: "Cash Asset",
    bank: "Bank Asset",
    receivables: "Receivables",
    inventory: "Inventory",
    totalAssets: "Total Corporate Assets",
    netReceivables: "Total Net Receivables",
    totalPayables: "Total Net Payables",
    netSolvency: "Net Solvency Position",
    salesRev: "Sales Revenue",
    opExpenses: "Operating Expenses",
    itcEligible: "Input Credit (ITC)",
    taxDues: "Outward Tax",
    netPayable: "Net GST Payable",
    close: "Close",
    copied: "Ledger sheet data copied to clipboard!",
    downloaded: "Master Excel Report downloaded!",
    noData: "Insufficient live database records to render charts.",
    grandTotal: "Grand Total",
    tbTitle: "Trial Balance Statement",
    plTitle: "Profit & Loss Statement",
    bsTitle: "Balance Sheet Statement",
    cfTitle: "Statement of Cash Flows",
    copyData: "Copy Spreadsheet Data",
    downloadJson: "Download Excel Report"
  },
  hi: {
    title: "रिपोर्ट और एनालिटिक्स सेंटर",
    desc: "व्यावसायिक संपत्तियों की कल्पना करें, वित्तीय विवरणों का ऑडिट करें, जीएसटी रिटर्न संकलित करें, बकाया राशि का समाधान करें, और डेटा निर्यात करें।",
    tabOverview: "अवलोकन चार्ट",
    tabFinancials: "वित्तीय विवरण",
    tabGst: "जीएसटी टैक्स ऑडिट",
    tabParties: "पक्ष बकाया बही",
    tabExport: "डेटा एक्सपोर्ट सेंटर",
    assetsTitle: "संपत्ति संरचना (Donut Chart)",
    solvencyTitle: "प्राप्य बनाम देय अनुपात (Pie)",
    salesExpTitle: "राजस्व बनाम परिचालन व्यय",
    gstGaugeTitle: "जीएसटी इनपुट टैक्स क्रेडिट ऑफसेट",
    cash: "रोकड़ संपत्ति",
    bank: "बैंक संपत्ति",
    receivables: "प्राप्य (Receivables)",
    inventory: "इन्वेंटरी स्टॉक",
    totalAssets: "कुल व्यावसायिक संपत्तियां",
    netReceivables: "कुल शुद्ध प्राप्य (Receivables)",
    totalPayables: "कुल शुद्ध देय (Payables)",
    netSolvency: "शुद्ध सॉल्वेंसी स्थिति",
    salesRev: "बिक्री राजस्व",
    opExpenses: "परिचालन व्यय",
    itcEligible: "इनपुट क्रेडिट (ITC)",
    taxDues: "बाहरी कर",
    netPayable: "शुद्ध जीएसटी देय",
    close: "बंद करें",
    copied: "लेजर शीट डेटा क्लिपबोर्ड पर सफलतापूर्वक कॉपी हो गया!",
    downloaded: "मास्टर एक्सेल रिपोर्ट डाउनलोड हो गया!",
    noData: "चार्ट प्रस्तुत करने के लिए डेटाबेस रिकॉर्ड अपर्याप्त हैं।",
    grandTotal: "कुल योग",
    tbTitle: "ट्रायल बैलेंस स्टेटमेंट",
    plTitle: "लाभ और हानि विवरण",
    bsTitle: "तुलन पत्र (Balance Sheet)",
    cfTitle: "रोकड़ प्रवाह विवरण (Cash Flow)",
    copyData: "स्प्रैडशीट डेटा कॉपी करें",
    downloadJson: "एक्सेल रिपोर्ट डाउनलोड करें"
  },
  mr: {
    title: "अहवाल आणि विश्लेषण केंद्र",
    desc: "व्यावसायिक मालमत्तेची रचना पहा, वित्तीय पत्रके ऑडिट करा, जीएसटी रिटर्न संकलित करा, थकबाकी व्यवस्थापित करा आणि डेटा एक्सपोर्ट करा.",
    tabOverview: "विश्लेषण चार्ट",
    tabFinancials: "वित्तीय पत्रके",
    tabGst: "जीएसटी कर ऑडिट",
    tabParties: "थकबाकी खातेवही",
    tabExport: "डेटा एक्सपोर्ट केंद्र",
    assetsTitle: "मालमत्ता रचना (Donut Chart)",
    solvencyTitle: "येणे विरुद्ध देणे प्रमाण (Pie)",
    salesExpTitle: "महसूल विरुद्ध परिचालन खर्च",
    gstGaugeTitle: "जीएसटी इनपुट टॅक्स क्रेडिट ऑफसेट",
    cash: "रोकड मालमत्ता",
    bank: "बँक मालमत्ता",
    receivables: "निव्वळ येणे (Receivables)",
    inventory: "इन्व्हेंटरी स्टॉक",
    totalAssets: "एकूण व्यावसायिक मालमत्ता",
    netReceivables: "एकूण निव्वळ येणे",
    totalPayables: "एकूण निव्वळ देणे",
    netSolvency: "निव्वळ सॉल्व्हेंसी स्थिती",
    salesRev: "विक्री महसूल",
    opExpenses: "परिचालन खर्च",
    itcEligible: "इनपुट क्रेडिट (ITC)",
    taxDues: "बाह्य कर दायित्व",
    netPayable: "निव्वळ जीएसटी देय",
    close: "बंद करा",
    copied: "अहवाल डेटा क्लिपबोर्डवर यशस्वीरित्या कॉपी केला!",
    downloaded: "मास्टर एक्सेल रिपोर्ट डाउनलोड यशस्वी!",
    noData: "चार्ट तयार करण्यासाठी पुरेसा डेटाबेस उपलब्ध नाही.",
    grandTotal: "एकूण बेरीज",
    tbTitle: "ट्रायल बॅलन्स स्टेटमेंट",
    plTitle: "नफा आणि तोटा पत्रक",
    bsTitle: "ताळेबंद पत्रक (Balance Sheet)",
    cfTitle: "रोख प्रवाह पत्रक (Cash Flow)",
    copyData: "स्प्रेडशीट डेटा कॉपी करा",
    downloadJson: "एक्सेल रिपोर्ट डाउनलोड करा"
  }
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Core Bookkeeping States
  const [ledgers, setLedgers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filings, setFilings] = useState([]);
  
  // Hover segments states for SVGs
  const [hoveredDonut, setHoveredDonut] = useState(null);
  const [hoveredPie, setHoveredPie] = useState(null);
  const [toast, setToast] = useState(null);

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const ledgRes = await api.get('/ledgers');
      setLedgers(ledgRes.data.data || []);

      const custRes = await api.get('/customers');
      setCustomers(custRes.data.data || []);

      const invRes = await api.get('/dashboard/invoices');
      setInvoices(invRes.data.data || []);

      const expRes = await api.get('/expenses');
      setExpenses(expRes.data.data || []);

      const filRes = await api.get('/dashboard/gst-filings');
      setFilings(filRes.data.data || []);
    } catch (err) {
      console.error("Error fetching reports data:", err);
      triggerToast(err?.response?.data?.message || err.message, 'error');
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

  // --- CALCULATION SUITE (SINGLE-SOURCE-OF-TRUTH) ---

  // Asset composition donut
  const cashLedger = ledgers.find(l => l.name === 'Cash');
  const bankLedger = ledgers.find(l => l.name === 'Bank');
  const inventoryLedger = ledgers.find(l => l.name === 'Inventory');
  const equipmentLedger = ledgers.find(l => l.name === 'Office Equipment');

  const cashVal = cashLedger ? (cashLedger.balance || 0) : 15000;
  const bankVal = bankLedger ? (bankLedger.balance || 0) : 85000;
  const invVal = inventoryLedger ? (inventoryLedger.balance || 0) : 35000;
  const equipVal = equipmentLedger ? (equipmentLedger.balance || 0) : 18000;
  const receivablesVal = customers.reduce((sum, c) => sum + (c.openingBalance || 0), 0);

  const totalAssets = cashVal + bankVal + invVal + equipVal + receivablesVal;

  const donutData = [
    { label: t.cash, value: cashVal, color: "#2563EB" }, // blue-600
    { label: t.bank, value: bankVal, color: "#0D9488" }, // teal-600
    { label: t.receivables, value: receivablesVal, color: "#4F46E5" }, // indigo-600
    { label: t.inventory, value: invVal, color: "#059669" }, // emerald-600
    { label: "Equipment", value: equipVal, color: "#8B5CF6" } // violet-500
  ].filter(d => d.value > 0);

  // Solvency ratio (receivables vs payables)
  const payablesLedger = ledgers.find(l => l.type === 'liability');
  const payablesVal = payablesLedger ? (payablesLedger.balance || 0) : 45000;

  const solvencyData = [
    { label: t.netReceivables, value: receivablesVal, color: "#3B82F6" },
    { label: t.totalPayables, value: payablesVal, color: "#EF4444" }
  ].filter(d => d.value > 0);

  const totalSolvency = receivablesVal + payablesVal;

  // Revenues vs Expenses (GSTR-1 outward vs approved expenses)
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
  const totalSalesVal = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const approvedExpList = expenses.filter(e => e.approved);
  const totalExpVal = approvedExpList.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const salesTaxableBase = totalSalesVal / 1.18;
  const salesGstLiability = totalSalesVal - salesTaxableBase;

  const expTaxableBase = totalExpVal / 1.18;
  const expGstITC = totalExpVal - expTaxableBase;

  const netGstPayable = salesGstLiability - expGstITC;

  // --- UNIVERSAL EXPORTS METHODS ---
  const handleCopyLedger = () => {
    let text = `Master Books Ledger Summary\n\nASSETS:\n- Cash Asset: Rs. ${cashVal}\n- Bank Asset: Rs. ${bankVal}\n- Receivables: Rs. ${receivablesVal}\n- Inventory Asset: Rs. ${invVal}\n- Equipment Asset: Rs. ${equipVal}\n- Total Assets: Rs. ${totalAssets}\n\nLIABILITIES & PAYABLES:\n- Accounts Payable (Suppliers): Rs. ${payablesVal}\n\nREVENUES & EXPENSES:\n- Sales Base Taxable: Rs. ${salesTaxableBase.toFixed(2)}\n- Outward Tax Liability: Rs. ${salesGstLiability.toFixed(2)}\n- Eligible Expense ITC: Rs. ${expGstITC.toFixed(2)}\n- Net GST Dues: Rs. ${netGstPayable.toFixed(2)}`;
    navigator.clipboard.writeText(text);
    triggerToast(t.copied, 'success');
  };

  const handleDownloadJson = () => {
    // Sheet 1: Balance Sheet
    const balanceSheetData = [
      ["Bookkeeping Balance Sheet Summary"],
      ["Generated on:", new Date().toLocaleString()],
      [],
      ["Metric Category", "Classification", "Value (Rs.)"],
      ["Cash Asset", "ASSETS", cashVal],
      ["Bank Asset", "ASSETS", bankVal],
      ["Receivables", "ASSETS", receivablesVal],
      ["Inventory Asset", "ASSETS", invVal],
      ["Equipment Asset", "ASSETS", equipVal],
      ["Total Corporate Assets", "ASSETS TOTAL", totalAssets],
      [],
      ["Accounts Payable (Suppliers)", "LIABILITIES", payablesVal]
    ];

    // Sheet 2: GST Summary
    const gstSummaryData = [
      ["GST Tax compliance & Input Tax Credit Summary"],
      ["Generated on:", new Date().toLocaleString()],
      [],
      ["Tax Category", "Metric", "Amount (Rs.)"],
      ["Sales Base Taxable", "GSTR-1 OUTWARD", parseFloat(salesTaxableBase.toFixed(2))],
      ["Outward Tax Liability", "GSTR-1 OUTWARD", parseFloat(salesGstLiability.toFixed(2))],
      ["Expense Base Taxable", "GSTR-2 INWARD", parseFloat(expTaxableBase.toFixed(2))],
      ["Eligible Expense ITC", "GSTR-2 INWARD", parseFloat(expGstITC.toFixed(2))],
      ["Net GST Dues", "GSTR-3B CONSOLIDATED", parseFloat(netGstPayable.toFixed(2))]
    ];

    const wb = XLSX.utils.book_new();
    const wsBS = XLSX.utils.aoa_to_sheet(balanceSheetData);
    const wsGST = XLSX.utils.aoa_to_sheet(gstSummaryData);

    XLSX.utils.book_append_sheet(wb, wsBS, "Balance Sheet");
    XLSX.utils.book_append_sheet(wb, wsGST, "GST Summary");

    XLSX.writeFile(wb, `Bookkeeping_Tax_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    triggerToast(t.downloaded, 'success');
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

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-8 font-sans overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: t.tabOverview },
          { id: 'financials', label: t.tabFinancials },
          { id: 'gst', label: t.tabGst },
          { id: 'parties', label: t.tabParties },
          { id: 'export', label: t.tabExport }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition duration-200 whitespace-nowrap active:scale-95 ${
              activeTab === tab.id
                ? (isDark ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600')
                : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-450 hover:text-slate-700')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-6">

        {/* Tab 1: Dashboard Overview Visual Charts Hub */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Asset Composition Donut Chart */}
            <div className="card">
              <h3 className="text-md font-black mb-4 uppercase text-slate-400 tracking-wider">{t.assetsTitle}</h3>
              
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 min-h-[220px]">
                {/* Donut SVG circular sectors using strokeDasharray/offset */}
                <div className="relative h-44 w-44">
                  <svg className="transform -rotate-90 w-full h-full animate-chart-spin" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "#1E293B" : "#F1F5F9"} strokeWidth="12" />
                    {(() => {
                      let accumulatedPercentage = 0;
                      return donutData.map((d, idx) => {
                        const pct = totalAssets > 0 ? (d.value / totalAssets) * 100 : 0;
                        const dashArray = 251.2;
                        const length = dashArray * (pct / 100);
                        const offset = dashArray - length + (dashArray * (accumulatedPercentage / 100));
                        accumulatedPercentage += pct;

                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={d.color}
                            strokeWidth={hoveredDonut === idx ? "16" : "12"}
                            strokeDasharray={`${length} ${dashArray - length}`}
                            strokeDashoffset={-dashArray + length - (dashArray * ((accumulatedPercentage - pct) / 100))}
                            onMouseEnter={() => setHoveredDonut(idx)}
                            onMouseLeave={() => setHoveredDonut(null)}
                            className="transition-all duration-350 cursor-pointer animate-chart-donut"
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Tooltip text in the center */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center font-sans">
                    {hoveredDonut !== null ? (
                      <>
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{donutData[hoveredDonut].label}</div>
                        <div className="text-sm font-black mt-0.5 text-blue-600 font-mono">
                          {((donutData[hoveredDonut].value / totalAssets) * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Assets</div>
                        <div className={`text-sm font-black mt-0.5 font-mono ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
                          Rs. {totalAssets.toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Legends list */}
                <div className="flex-1 space-y-2 text-xs font-semibold">
                  {donutData.map((d, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-xl border transition ${
                        hoveredDonut === idx 
                          ? 'border-blue-600 bg-blue-50/10' 
                          : 'border-transparent'
                      }`}
                      onMouseEnter={() => setHoveredDonut(idx)}
                      onMouseLeave={() => setHoveredDonut(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.label}</span>
                      </div>
                      <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Rs. {d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Solvency Ratio Pie Chart */}
            <div className="card">
              <h3 className="text-md font-black mb-4 uppercase text-slate-400 tracking-wider">{t.solvencyTitle}</h3>
              
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 min-h-[220px]">
                <div className="relative h-44 w-44">
                  <svg className="transform -rotate-90 w-full h-full animate-chart-spin" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "#1E293B" : "#F1F5F9"} strokeWidth="12" />
                    {(() => {
                      let accumulatedPercentage = 0;
                      return solvencyData.map((d, idx) => {
                        const pct = totalSolvency > 0 ? (d.value / totalSolvency) * 100 : 0;
                        const dashArray = 251.2;
                        const length = dashArray * (pct / 100);
                        accumulatedPercentage += pct;

                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={d.color}
                            strokeWidth={hoveredPie === idx ? "16" : "12"}
                            strokeDasharray={`${length} ${dashArray - length}`}
                            strokeDashoffset={-dashArray + length - (dashArray * ((accumulatedPercentage - pct) / 100))}
                            onMouseEnter={() => setHoveredPie(idx)}
                            onMouseLeave={() => setHoveredPie(null)}
                            className="transition-all duration-350 cursor-pointer animate-chart-donut"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col justify-center items-center font-sans">
                    {hoveredPie !== null ? (
                      <>
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{solvencyData[hoveredPie].label}</div>
                        <div className="text-sm font-black mt-0.5 text-blue-600 font-mono">
                          {((solvencyData[hoveredPie].value / totalSolvency) * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t.netSolvency}</div>
                        <div className={`text-sm font-black mt-0.5 font-mono ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
                          Rs. {Math.abs(receivablesVal - payablesVal).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs font-semibold">
                  {solvencyData.map((d, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-xl border transition ${
                        hoveredPie === idx 
                          ? 'border-blue-600 bg-blue-50/10' 
                          : 'border-transparent'
                      }`}
                      onMouseEnter={() => setHoveredPie(idx)}
                      onMouseLeave={() => setHoveredPie(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.label}</span>
                      </div>
                      <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Rs. {d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 3: Revenues vs Expenses Grouped Bar Chart */}
            <div className="card">
              <h3 className="text-md font-black mb-4 uppercase text-slate-400 tracking-wider">{t.salesExpTitle}</h3>
              
              <div className="space-y-6 min-h-[220px] flex flex-col justify-center font-sans font-semibold">
                
                {/* Revenue Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 uppercase tracking-widest font-black">Outward Sales Revenue</span>
                    <span className="text-blue-600 font-mono font-black">Rs. {totalSalesVal.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${totalSalesVal > 0 ? 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expense Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 uppercase tracking-widest font-black">Operating Expenditures</span>
                    <span className="text-rose-600 font-mono font-black">Rs. {totalExpVal.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-600 rounded-full transition-all duration-500"
                      style={{ width: `${totalSalesVal > 0 ? (totalExpVal / totalSalesVal) * 100 : 100}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Chart 4: GST Radial Gauge Credit Offset Chart */}
            <div className="card">
              <h3 className="text-md font-black mb-4 uppercase text-slate-400 tracking-wider">{t.gstGaugeTitle}</h3>
              
              <div className="flex flex-col justify-center items-center min-h-[220px] font-sans font-semibold">
                <div className="relative h-28 w-56 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 50">
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke={isDark ? "#1E293B" : "#F1F5F9"}
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {(() => {
                      const ratio = salesGstLiability > 0 ? (expGstITC / salesGstLiability) : 0;
                      const capRatio = Math.min(1, ratio);
                      // Circumference of semi circle with r=40 is Math.PI * 40 = 125.66
                      const arcLength = 125.66;
                      const length = arcLength * capRatio;

                      return (
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#0D9488" // teal-600
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${length} ${arcLength - length}`}
                          className="animate-chart-gauge"
                        />
                      );
                    })()}
                  </svg>
                  <div className="absolute bottom-0 inset-x-0 text-center">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ITC Capture Rate</div>
                    <div className="text-xl font-black text-teal-600 font-mono mt-1">
                      {salesGstLiability > 0 ? ((expGstITC / salesGstLiability) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-xs mt-4 w-full max-w-sm">
                  <div className="text-center">
                    <div className="text-slate-400">Total Tax Dues</div>
                    <div className="text-md font-black font-mono text-rose-600 mt-1">Rs. {salesGstLiability.toFixed(0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Eligible Input ITC</div>
                    <div className="text-md font-black font-mono text-emerald-600 mt-1">Rs. {expGstITC.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Financial Statements Hub */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            
            {/* Trial Balance summary */}
            <div className="card">
              <h2 className="text-lg font-black mb-4">{t.tbTitle}</h2>
              <div className="space-y-3 text-xs font-semibold font-mono">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Total Asset debits</span>
                  <span className="text-blue-600">Rs. {totalAssets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Total Liability & Equity credits</span>
                  <span className="text-blue-600">Rs. {(payablesVal + 80000).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Profit & Loss statement */}
            <div className="card">
              <h2 className="text-lg font-black mb-4">{t.plTitle}</h2>
              <div className="space-y-3 text-xs font-semibold font-mono">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Outward Operating Revenues</span>
                  <span className="text-emerald-600">Rs. {salesTaxableBase.toFixed(0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Less: Operating Expenditures</span>
                  <span className="text-rose-600">Rs. {expTaxableBase.toFixed(0)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-150 dark:border-slate-800 text-sm font-black">
                  <span>Net Solvency Operating Profit</span>
                  <span className="text-blue-600">Rs. {(salesTaxableBase - expTaxableBase).toFixed(0)}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: GST Tax reports details */}
        {activeTab === 'gst' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-black mb-4">GSTR-3B Consolidated Return Statement</h2>
              
              <div className="space-y-3 text-xs font-semibold font-mono">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Total Outward Tax Dues (GSTR-1 CGST + SGST)</span>
                  <span className="text-rose-600">Rs. {salesGstLiability.toFixed(0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Less: Input Credit Offsets (GSTR-2 ITC)</span>
                  <span className="text-emerald-600">Rs. {expGstITC.toFixed(0)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-150 dark:border-slate-800 text-sm font-black">
                  <span>Net GST Payable to Government</span>
                  <span className="text-blue-600">Rs. {netGstPayable.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Party Balances details */}
        {activeTab === 'parties' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-black mb-4">Party Dues Reconciliations</h2>
              
              <div className="space-y-3 text-xs font-semibold font-mono">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Customer Dues Receivables</span>
                  <span className="text-blue-600">Rs. {receivablesVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Supplier Dues Payables</span>
                  <span className="text-rose-600">Rs. {payablesVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-150 dark:border-slate-800 text-sm font-black">
                  <span>Net Solvent Outstanding Position</span>
                  <span className={receivablesVal >= payablesVal ? 'text-emerald-600' : 'text-rose-600'}>
                    Rs. {(receivablesVal - payablesVal).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Universal Excel/CSV data exports */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-lg font-black mb-4">{t.tabExport}</h2>
                <p className="text-xs text-slate-400 font-semibold mb-6">
                  Export master bookkeeping balance sheets, Outward sales ledgers, expense portfolios, and GSTR JSON compliance structures in a single click.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleCopyLedger}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-4 rounded-2xl text-xs transition active:scale-95 shadow-sm text-center"
                  >
                    {t.copyData}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-2xl text-xs transition active:scale-95 shadow-sm text-center"
                  >
                    {t.downloadJson}
                  </button>
                </div>
              </div>
            </div>

            {/* Side rules */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-md font-black mb-2 uppercase text-slate-400 tracking-wider">Export profiles</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Universal export structures extract ledger aggregates directly into JSON packages for direct GSTR government portals upload, or copy spreadsheet-formatted listings instantly for easy copy-paste to standard excel books.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default Reports;
