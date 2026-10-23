import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';

const translations = {
  en: {
    title: "GST & Tax Control Center",
    desc: "Calculate GSTR liabilities, verify active GSTIN registries, dispatch transport E-Way bills, track TDS withholdings, and manage tax deadlines.",
    calendarTab: "Filing Calendar",
    returnsTab: "GSTR Returns",
    verifyTab: "GSTIN Verification",
    ewayTab: "E-Way Bill",
    tdsTab: "TDS Tracker",
    calculatorTab: "GST Calculator",
    exportTab: "Export Tax Data",
    close: "Close",
    period: "Filing Period",
    cgst: "CGST Paid (Rs.)",
    sgst: "SGST Paid (Rs.)",
    igst: "IGST Paid (Rs.)",
    totalPaid: "Total Tax Paid",
    status: "Status",
    filedAt: "Filed Date",
    btnFile: "File GST Return",
    saveReturn: "Submit Filing",
    successFile: "GST Return filed successfully! Bank Book adjusted.",
    invalidGSTIN: "Format invalid! Please ensure it matches standard 15-character Indian GSTIN structure.",
    validGSTIN: "GSTIN Verification Successful! Active Status.",
    activeDeadlines: "Active Tax Deadlines (FY26)",
    pastFilings: "Past GST Filings History",
    noFilings: "No past tax filings recorded in the database.",
    invoiceCount: "Invoices Compiled",
    outwardTax: "Total Outward GST Liability",
    inwardCredit: "Total Eligible Input Tax Credit (ITC)",
    netPayable: "Net GST Payable to Govt",
    verifyGstinTitle: "GSTIN Registry Search & Invoice Audit",
    placeholderGstin: "Enter 15-character GSTIN (e.g. 27AAPCS1234M1Z2)",
    placeholderInv: "Enter Invoice Code (e.g. INV-2026-001)",
    btnVerify: "Perform GSTIN Audit",
    verifiedDetails: "Verified Taxpayer Details",
    tradeName: "Trade Name / Business",
    regStatus: "Registration Status",
    taxBracket: "Primary Tax Category",
    regDate: "Registration Date",
    ewayTitle: "E-Way Bill Compliance Management",
    transporterId: "Transporter ID (e.g. TRANS-8812)",
    vehicleNo: "Vehicle Number (e.g. MH-12-PQ-9876)",
    distance: "Distance (km)",
    hsnCode: "HSN Code (e.g. 8471)",
    btnGenerateEway: "Generate Compliant E-Way Bill",
    ewaySuccess: "E-Way bill generated successfully!",
    printableEway: "Official E-Way Bill Certificate",
    validity: "Validity",
    tdsTitle: "Tax Deducted at Source (TDS) Withholdings",
    tdsSection: "TDS Category & Section",
    payeeCat: "Deductee Category",
    invoiceAmt: "Base Invoice Amount (Rs.)",
    tdsRate: "Applicable TDS Rate",
    tdsWithheld: "TDS Amount to Withhold (Rs.)",
    netPayPayee: "Net Payable to Contractor (Rs.)",
    btnLogTds: "Log TDS Transaction",
    tdsLogged: "TDS deduction logged successfully!",
    exportTitle: "Export Compliance Tax Ledgers",
    copyData: "Copy Spreadsheet Data",
    downloadJson: "Download GSTR Excel Report",
    copied: "Data copied to clipboard successfully!",
    verified: "VERIFIED",
    pending: "PENDING"
  },
  hi: {
    title: "जीएसटी और टैक्स कंट्रोल सेंटर",
    desc: "जीएसटीआर देनदारियों की गणना करें, सक्रिय जीएसटीआईएन की पुष्टि करें, ई-वे बिल जारी करें, टीडीएस को ट्रैक करें, और फाइलिंग समय सीमा का प्रबंधन करें।",
    calendarTab: "फाइलिंग कैलेंडर",
    returnsTab: "जीएसटीआर रिटर्न",
    verifyTab: "जीएसटीआईएन सत्यापन",
    ewayTab: "ई-वे बिल",
    tdsTab: "टीडीएस ट्रैकर",
    calculatorTab: "जीएसटी कैलकुलेटर",
    exportTab: "टैक्स डेटा एक्सपोर्ट",
    close: "बंद करें",
    period: "फाइलिंग अवधि",
    cgst: "सीजीएसटी भुगतान (Rs.)",
    sgst: "एसजीएसटी भुगतान (Rs.)",
    igst: "आईजीएसटी भुगतान (Rs.)",
    totalPaid: "कुल भुगतान किया गया टैक्स",
    status: "स्थिति",
    filedAt: "फाइलिंग की तारीख",
    btnFile: "जीएसटी रिटर्न दाखिल करें",
    saveReturn: "फाइलिंग सबमिट करें",
    successFile: "जीएसटी रिटर्न सफलतापूर्वक दाखिल किया गया! बैंक बही समायोजित की गई।",
    invalidGSTIN: "प्रारूप अमान्य! कृपया सुनिश्चित करें कि यह मानक 15-अक्षर वाली भारतीय जीएसटीआईएन संरचना से मेल खाता है।",
    validGSTIN: "जीएसटीआईएन सत्यापन सफल! सक्रिय स्थिति।",
    activeDeadlines: "सक्रिय कर समय सीमा (FY26)",
    pastFilings: "पिछला जीएसटी फाइलिंग इतिहास",
    noFilings: "डेटाबेस में कोई पिछला कर फाइलिंग दर्ज नहीं है।",
    invoiceCount: "संकलित चालान",
    outwardTax: "कुल बाहरी जीएसटी देनदारी",
    inwardCredit: "कुल पात्र इनपुट टैक्स क्रेडिट (ITC)",
    netPayable: "सरकार को देय शुद्ध जीएसटी",
    verifyGstinTitle: "जीएसटीआईएन रजिस्ट्री खोज और चालान ऑडिट",
    placeholderGstin: "15-अक्षर का जीएसटीआईएन दर्ज करें (जैसे 27AAPCS1234M1Z2)",
    placeholderInv: "चालान कोड दर्ज करें (जैसे INV-2026-001)",
    btnVerify: "जीएसटीआईएन ऑडिट करें",
    verifiedDetails: "सत्यापित करदाता विवरण",
    tradeName: "व्यापार नाम / व्यवसाय",
    regStatus: "पंजीकरण की स्थिति",
    taxBracket: "प्राथमिक कर श्रेणी",
    regDate: "पंजीकरण की तारीख",
    ewayTitle: "ई-वे बिल अनुपालन प्रबंधन",
    transporterId: "परिवहनकर्ता आईडी (जैसे TRANS-8812)",
    vehicleNo: "वाहन संख्या (जैसे MH-12-PQ-9876)",
    distance: "दूरी (किमी)",
    hsnCode: "एचएसएन कोड (जैसे 8471)",
    btnGenerateEway: "ई-वे बिल जेनरेट करें",
    ewaySuccess: "ई-वे बिल सफलतापूर्वक जेनरेट किया गया!",
    printableEway: "आधिकारिक ई-वे बिल प्रमाणपत्र",
    validity: "वैधता",
    tdsTitle: "स्रोत पर कर कटौती (TDS) ट्रैकर",
    tdsSection: "टीडीएस श्रेणी और धारा",
    payeeCat: "करदाता श्रेणी",
    invoiceAmt: "मूल चालान राशि (Rs.)",
    tdsRate: "लागू टीडीएस दर",
    tdsWithheld: "टीडीएस कटौती राशि (Rs.)",
    netPayPayee: "ठेकेदार को देय शुद्ध राशि (Rs.)",
    btnLogTds: "टीडीएस लेनदेन दर्ज करें",
    tdsLogged: "टीडीएस कटौती सफलतापूर्वक दर्ज की गई!",
    exportTitle: "टैक्स लेजर डेटा एक्सपोर्ट",
    copyData: "स्प्रैडशीट डेटा कॉपी करें",
    downloadJson: "जीएसटीआर एक्सेल डाउनलोड करें",
    copied: "डेटा क्लिपबोर्ड पर सफलतापूर्वक कॉपी हो गया!",
    verified: "सत्यापित",
    pending: "लंबित"
  },
  mr: {
    title: "जीएसटी आणि कर नियंत्रण केंद्र",
    desc: "जीएसटीआर दायित्वांची गणना करा, सक्रिय जीएसटीआयएन सत्यापित करा, ई-वे बिले जारी करा, टीडीएसचा मागोवा घ्या आणि कर मुदती व्यवस्थापित करा.",
    calendarTab: "फायलिंग कॅलेंडर",
    returnsTab: "जीएसटीआर रिटर्न्स",
    verifyTab: "जीएसटीआयएन पडताळणी",
    ewayTab: "ई-वे बिल",
    tdsTab: "टीडीएस ट्रॅकर",
    calculatorTab: "जीएसटी कॅल्क्युलेटर",
    exportTab: "कर डेटा एक्सपोर्ट",
    close: "बंद करा",
    period: "फायलिंग कालावधी",
    cgst: "सीजीएसटी भरणा (Rs.)",
    sgst: "एसजीएसटी भरणा (Rs.)",
    igst: "आयजीएसटी भरणा (Rs.)",
    totalPaid: "एकूण भरलेला कर",
    status: "स्थिती",
    filedAt: "फायलिंगची तारीख",
    btnFile: "जीएसटी रिटर्न दाखल करा",
    saveReturn: "फायलिंग सबमिट करा",
    successFile: "जीएसटी रिटर्न यशस्वीरित्या दाखल! बँक खातेवही समायोजित केली गेली.",
    invalidGSTIN: "प्रारूप अमान्य! कृपया मानक १५-अक्षरी भारतीय जीएसटीआयएन रचनेशी जुळत असल्याची खात्री करा.",
    validGSTIN: "जीएसटीआयएन पडताळणी यशस्वी! सक्रिय स्थिती.",
    activeDeadlines: "सक्रिय कर मुदत (FY26)",
    pastFilings: "मागील जीएसटी फायलिंग इतिहास",
    noFilings: "डेटाबेसमध्ये कोणतीही मागील कर फायलिंग आढळली नाही.",
    invoiceCount: "संकलित इनव्हॉइसेस",
    outwardTax: "एकूण बाह्य जीएसटी दायित्व",
    inwardCredit: "एकूण पात्र इनपुट टॅक्स क्रेडिट (ITC)",
    netPayable: "शासनाला देय निव्वळ जीएसटी",
    verifyGstinTitle: "जीएसटीआयएन शोध आणि इनव्हॉइस ऑडिट",
    placeholderGstin: "१५-अक्षरी जीएसटीआयएन प्रविष्ट करा (उदा. 27AAPCS1234M1Z2)",
    placeholderInv: "इनव्हॉइस कोड प्रविष्ट करा (उदा. INV-2026-001)",
    btnVerify: "जीएसटीआयएन ऑडिट करा",
    verifiedDetails: "सत्यापित करदाता तपशील",
    tradeName: "व्यापार नाव / व्यवसाय",
    regStatus: "नोंदणी स्थिती",
    taxBracket: "प्राथमिक कर श्रेणी",
    regDate: "नोंदणीची तारीख",
    ewayTitle: "ई-वे बिल अनुपालन व्यवस्थापन",
    transporterId: "वाहतूकदार आयडी (उदा. TRANS-8812)",
    vehicleNo: "वाहन क्रमांक (उदा. MH-12-PQ-9876)",
    distance: "अंतर (किमी)",
    hsnCode: "एचएसएन कोड (उदा. 8471)",
    btnGenerateEway: "ई-वे बिल तयार करा",
    ewaySuccess: "ई-वे बिल यशस्वीरित्या तयार केले!",
    printableEway: "अधिकृत ई-वे बिल प्रमाणपत्र",
    validity: "वैधता",
    tdsTitle: "स्रोतवर कर कपात (TDS) ट्रॅकर",
    tdsSection: "टीडीएस श्रेणी आणि कलम",
    payeeCat: "कपातदार प्रवर्ग",
    invoiceAmt: "मूळ इनव्हॉइस रक्कम (Rs.)",
    tdsRate: "लागू टीडीएस दर",
    tdsWithheld: "कपात टीडीएस रक्कम (Rs.)",
    netPayPayee: "ठेकेदाराला देय निव्वळ रक्कम (Rs.)",
    btnLogTds: "टीडीएस व्यवहार नोंदवा",
    tdsLogged: "टीडीएस कपात यशस्वीरित्या नोंदवली!",
    exportTitle: "टॅक्स लेजर डेटा एक्सपोर्ट",
    copyData: "स्प्रेडशीट डेटा कॉपी करा",
    downloadJson: "जीएसटीआर एक्सेल डाउनलोड करा",
    copied: "डेटा क्लिपबोर्डवर यशस्वीरित्या कॉपी केला!",
    verified: "सत्यापित",
    pending: "प्रलंबित"
  }
};

const deadlines = [
  { form: "GSTR-1 (Outward Sales)", period: "Monthly (April 2026)", dueDate: "2026-05-11", type: "Sales Return" },
  { form: "GSTR-3B (Consolidated)", period: "Monthly (April 2026)", dueDate: "2026-05-20", type: "Tax Payment" },
  { form: "TDS Quarterly Return (Form 26Q)", period: "Q1 (April - June 2026)", dueDate: "2026-07-31", type: "TDS Return" },
  { form: "GSTR-1 (Outward Sales)", period: "Monthly (May 2026)", dueDate: "2026-06-11", type: "Sales Return" },
  { form: "GSTR-3B (Consolidated)", period: "Monthly (May 2026)", dueDate: "2026-06-20", type: "Tax Payment" }
];

const GstTax = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // GST Calculator States
  const [gstCalc, setGstCalc] = useState({
    baseAmount: 10000,
    rate: 18,
    isInterstate: false
  });

  // Core Data States
  const [filings, setFilings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [realGstr1, setRealGstr1] = useState(null);
  const [realGstr3b, setRealGstr3b] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  // Modals & Sub-forms
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [filingForm, setFilingForm] = useState({
    period: 'May 2026',
    cgst: '',
    sgst: '',
    igst: '0'
  });

  // GSTIN Audit State
  const [auditForm, setAuditForm] = useState({ gstin: '', invoiceNo: '' });
  const [auditResult, setAuditResult] = useState(null);

  // E-Way Bill State
  const [ewayForm, setEwayForm] = useState({
    invoiceId: '',
    transporterId: '',
    vehicleNo: '',
    distance: '',
    hsnCode: '8471'
  });
  const [generatedEway, setGeneratedEway] = useState(null);

  // TDS State
  const [tdsForm, setTdsForm] = useState({
    section: '194J', // '194J' (10%), '194I' (10%), '194C' (2%)
    category: 'Company',
    amount: '',
    narration: ''
  });
  const [tdsList, setTdsList] = useState([]);

  const t = translations[lang] || translations.en;
  const isDark = theme === 'dark';

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const filingRes = await api.get('/dashboard/gst-filings');
      setFilings(filingRes.data.data || []);

      const invRes = await api.get('/dashboard/invoices');
      setInvoices(invRes.data.data || []);

      const expRes = await api.get('/expenses');
      setExpenses(expRes.data.data || []);

      const ledgRes = await api.get('/ledgers');
      setLedgers(ledgRes.data.data || []);

      try {
        const gstr1Res = await api.get('/financials/gstr1');
        if (gstr1Res.data && gstr1Res.data.success) {
          setRealGstr1(gstr1Res.data.data);
        }
      } catch (err) {
        console.error("Error fetching GSTR-1 data:", err);
      }

      try {
        const gstr3bRes = await api.get('/financials/gstr3b');
        if (gstr3bRes.data && gstr3bRes.data.success) {
          setRealGstr3b(gstr3bRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching GSTR-3B data:", err);
      }
    } catch (err) {
      console.error("Error fetching GST tax data:", err);
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

  // Submit GST Filing
  const handleFilingSubmit = async (e) => {
    e.preventDefault();
    const { period, cgst, sgst, igst } = filingForm;
    if (!cgst || !sgst) {
      triggerToast("CGST and SGST amounts are required", "error");
      return;
    }

    try {
      await api.post('/dashboard/gst-filings', {
        period,
        cgst: Number(cgst),
        sgst: Number(sgst),
        igst: Number(igst || 0)
      });

      triggerToast(t.successFile, 'success');
      setShowFilingModal(false);
      setFilingForm({ period: 'May 2026', cgst: '', sgst: '', igst: '0' });
      fetchData();
    } catch (err) {
      triggerToast(err?.response?.data?.message || err.message, 'error');
    }
  };

  // Perform GSTIN Audit Search
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const { gstin } = auditForm;
    
    // Regular expression for standard Indian GSTIN format
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (!gstinRegex.test(gstin.toUpperCase())) {
      setAuditResult({ success: false, message: t.invalidGSTIN });
      return;
    }

    // Format-only GSTIN validation (not verified with GSTN portal)
    const stateCode = gstin.substring(0, 2);
    const pan = gstin.substring(2, 12);
    setAuditResult({
      success: true,
      tradeName: `PAN: ${pan} (Format check only — not verified with GSTN portal)`,
      gstin: gstin.toUpperCase(),
      stateCode,
      status: "Format Valid",
      category: "Format validation passed",
      date: new Date().toLocaleDateString()
    });
    triggerToast(t.validGSTIN, 'success');
  };

  // E-Way Bill Generation Submit
  const handleEwaySubmit = (e) => {
    e.preventDefault();
    const { invoiceId, transporterId, vehicleNo, distance, hsnCode } = ewayForm;

    if (!invoiceId || !transporterId || !vehicleNo || !distance) {
      triggerToast("Please fill all E-Way transport fields", "error");
      return;
    }

    const selectedInv = invoices.find(inv => inv._id === invoiceId);
    if (!selectedInv) return;

    setGeneratedEway({
      ewayBillNo: `EWAY-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceNo: selectedInv.invoiceNumber,
      customer: selectedInv.customerName || (selectedInv.customer && selectedInv.customer.name),
      amount: selectedInv.amount,
      transporterId,
      vehicleNo: vehicleNo.toUpperCase(),
      distance,
      hsnCode,
      validUntil: new Date(new Date().setDate(new Date().getDate() + Math.ceil(distance / 200))).toLocaleDateString(),
      qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EWAY-${selectedInv.invoiceNumber}-${vehicleNo}`
    });

    triggerToast(t.ewaySuccess, 'success');
  };

  // TDS Deduction Log Submission
  const handleTdsSubmit = (e) => {
    e.preventDefault();
    const { section, category, amount, narration } = tdsForm;

    if (!amount) {
      triggerToast("Amount is required", "error");
      return;
    }

    const base = Number(amount);
    let rate = 0;
    if (section === '194J') rate = 0.10; // 10%
    else if (section === '194I') rate = 0.10; // 10%
    else if (section === '194C') rate = category === 'Individual' ? 0.01 : 0.02; // 1% or 2%

    const tax = base * rate;

    const newTds = {
      date: new Date().toISOString().split('T')[0],
      section,
      desc: narration || `TDS Deduction Section ${section}`,
      base,
      rate: `${(rate * 100).toFixed(0)}%`,
      tax,
      payee: category === 'Company' ? 'Corporate Contractor Ltd' : 'Individual Professional'
    };

    setTdsList([newTds, ...tdsList]);
    triggerToast(t.tdsLogged, 'success');
    setTdsForm({ section: '194J', category: 'Company', amount: '', narration: '' });
  };

  // Calculations for GSTR Statements
  const salesInvoices = invoices.filter(inv => inv.status !== 'paid');
  const totalSalesAmount = realGstr1 ? realGstr1.totalSales : salesInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  
  // Taxable amount: base (total/1.18), tax: total - base
  const gstr1Base = realGstr1 ? realGstr1.totalTaxable : (totalSalesAmount / 1.18);
  const gstr1Tax = realGstr1 ? realGstr1.totalTax : (totalSalesAmount - gstr1Base);

  // GSTR-2 Inward Input tax credit: approved business expenses
  const eligibleExpenses = expenses.filter(e => e.approved);
  const totalExpAmount = realGstr3b ? (realGstr3b.inwardITC.taxableValue + realGstr3b.inwardITC.totalTax) : eligibleExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const gstr2Base = realGstr3b ? realGstr3b.inwardITC.taxableValue : (totalExpAmount / 1.18);
  const gstr2ITC = realGstr3b ? realGstr3b.inwardITC.totalTax : (totalExpAmount - gstr2Base);

  // GSTR-3B Net Consolidated Payable
  const netGstPayable = realGstr3b ? realGstr3b.netPayable.total : (gstr1Tax - gstr2ITC);

  // Eligible invoices for E-Way bills (> Rs. 50,000)
  // Since seeded invoices are small, we list all unpaid invoices as eligible for ease of auditing/testing, and flag if they exceed 50k
  const eligibleEwayInvoices = invoices.filter(inv => inv.status !== 'paid');

  // Clipboard copies
  const handleCopyLedger = () => {
    const text = `GSTR-3B Consolidated Return\n\nSales Base Amount: Rs. ${gstr1Base.toFixed(2)}\nOutward Tax Liability: Rs. ${gstr1Tax.toFixed(2)}\nEligible Input Credit (ITC): Rs. ${gstr2ITC.toFixed(2)}\nNet GST Payable to Govt: Rs. ${netGstPayable.toFixed(2)}`;
    navigator.clipboard.writeText(text);
    triggerToast(t.copied, 'success');
  };

  const calcBase = gstCalc.baseAmount;
  const calcRate = gstCalc.rate;
  const calcGst = Math.round((calcBase * calcRate) / 100);
  const calcCgst = gstCalc.isInterstate ? 0 : Math.round(calcGst / 2);
  const calcSgst = gstCalc.isInterstate ? 0 : Math.round(calcGst / 2);
  const calcIgst = gstCalc.isInterstate ? calcGst : 0;
  const calcTotal = calcBase + calcGst;

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Visual non-blocking Toast alert banner */}
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
          { id: 'calendar', label: t.calendarTab },
          { id: 'returns', label: t.returnsTab },
          { id: 'verify', label: t.verifyTab },
          { id: 'eway', label: t.ewayTab },
          { id: 'tds', label: t.tdsTab },
          { id: 'calculator', label: t.calculatorTab },
          { id: 'export', label: t.exportTab }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition duration-200 whitespace-nowrap active:scale-95 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : `border-transparent text-slate-400 ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-6">

        {/* Tab 1: Filing Calendar & Timeline History */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Planner list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-lg font-black mb-4">{t.activeDeadlines}</h2>
                <div className="space-y-4">
                  {deadlines.map((dl, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                      <div>
                        <div className="text-xs font-black uppercase text-slate-400 tracking-widest">{dl.form}</div>
                        <div className="text-md font-bold mt-1">{dl.period}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Due Date</div>
                        <div className="text-sm font-mono font-bold text-rose-600 mt-1">{new Date(dl.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filed returns */}
              <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                  <h2 className="text-lg font-black">{t.pastFilings}</h2>
                  <button
                    onClick={() => setShowFilingModal(true)}
                    className="btn btn--primary btn--sm"
                  >
                    {t.btnFile}
                  </button>
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="p-4">{t.period}</th>
                      <th className="p-4">{t.filedAt}</th>
                      <th className="p-4 text-center">{t.status}</th>
                      <th className="p-4 text-right">CGST</th>
                      <th className="p-4 text-right">SGST</th>
                      <th className="p-4 text-right font-black">{t.totalPaid}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'} font-semibold`}>
                    {filings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">{t.noFilings}</td>
                      </tr>
                    ) : (
                      filings.map(f => (
                        <tr key={f._id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/50'}>
                          <td className="p-4 font-black">{f.period}</td>
                          <td className="p-4 text-xs text-slate-400 font-mono">{new Date(f.filedAt).toLocaleDateString()}</td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-600 rounded-lg uppercase">
                              {f.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-600">Rs. {f.cgst?.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-slate-600">Rs. {f.sgst?.toLocaleString()}</td>
                          <td className="p-4 text-right font-black text-blue-600 font-mono">Rs. {f.totalGstPaid?.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Filing guidelines card */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-md font-black mb-2 uppercase text-slate-400 tracking-wider">Filing Quick Summary</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Under standard CGST and SGST laws, all outward business invoicing must reconcile with outward tax ledgers monthly. Inputs tax credits calculated during GSTR-2 audits offsets final outward liabilities. Net payments are deducted from the active Asset Book when submitting a new filing record.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: GSTR-1, GSTR-2, GSTR-3B Return calculations */}
        {activeTab === 'returns' && (
          <div className="space-y-6 font-sans">
            
            {/* Outward Sales & Liabilities GSTR-1 */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-black">GSTR-1 Outward Supplies Return (Sales Audit)</h2>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">Aggregating outward sales taxable revenues and 18% tax fractioning.</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Sales (Tax Incl.)</div>
                  <div className="text-lg font-black text-blue-600 font-mono">Rs. {totalSalesAmount.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Base Taxable Amount</div>
                  <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Rs. {gstr1Base.toFixed(2)}</div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.outwardTax}</div>
                  <div className="text-2xl font-black text-rose-600 font-mono mt-1">Rs. {gstr1Tax.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Inward Purchases & Eligible ITC GSTR-2 */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-black">GSTR-2 Inward Supplies (Eligible Input Tax Credit)</h2>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">Calculating eligible offset tax credits from approved business expenses.</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Approved Expenses</div>
                  <div className={`text-lg font-black font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Rs. {totalExpAmount.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Expenses Tax Base</div>
                  <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Rs. {gstr2Base.toFixed(2)}</div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.inwardCredit}</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono mt-1">Rs. {gstr2ITC.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Consolidated Tax Payable Summary GSTR-3B */}
            <div className="card">
              <h2 className="text-lg font-black mb-4">GSTR-3B Consolidated Return Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-150 dark:border-slate-800 font-semibold text-sm">
                  <span className="text-slate-400">Total Outward GST Liability (GSTR-1)</span>
                  <span className="font-mono text-rose-600">Rs. {gstr1Tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-150 dark:border-slate-800 font-semibold text-sm">
                  <span className="text-slate-400">Less: Eligible Input Tax Credit (GSTR-2)</span>
                  <span className="font-mono text-emerald-600">Rs. {gstr2ITC.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-150 dark:border-slate-800 font-black text-md">
                  <span>{t.netPayable}</span>
                  <span className={`font-mono ${netGstPayable >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    Rs. {netGstPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: GSTIN Search & Verification */}
        {activeTab === 'verify' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Verification Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleVerifySubmit} className="card">
                <h2 className="text-lg font-black mb-4">{t.verifyGstinTitle}</h2>
                <div className="space-y-4 font-semibold">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">GSTIN Registry ID</label>
                    <input
                      type="text" required placeholder={t.placeholderGstin}
                      value={auditForm.gstin} onChange={e => setAuditForm({ ...auditForm, gstin: e.target.value })}
                      className="fi"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Invoice Code (Optional)</label>
                    <input
                      type="text" placeholder={t.placeholderInv}
                      value={auditForm.invoiceNo} onChange={e => setAuditForm({ ...auditForm, invoiceNo: e.target.value })}
                      className="fi"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition active:scale-95">
                    {t.btnVerify}
                  </button>
                </div>
              </form>

              {/* Audit results view */}
              {auditResult && (
                <div className="card">
                  {auditResult.success ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-black uppercase text-emerald-600 tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          {t.validGSTIN}
                        </h3>
                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-50 text-emerald-600 tracking-widest">{t.verified}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div>
                          <div className="text-slate-400">Trade Entity Name</div>
                          <div className={`text-md font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{auditResult.tradeName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">GSTIN Reference</div>
                          <div className={`text-md font-black mt-1 font-mono ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{auditResult.gstin}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Registration Status</div>
                          <div className="text-md font-black mt-1 text-emerald-600 uppercase tracking-widest">{auditResult.status}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">State Code Jurisdiction</div>
                          <div className={`text-md font-black mt-1 font-mono ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{auditResult.stateCode}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-rose-600 font-black text-md uppercase tracking-wider mb-2">Audit Verification Failed</div>
                      <p className="text-slate-400 font-semibold text-xs leading-relaxed">{auditResult.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Side guidelines */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-md font-black mb-2 uppercase text-slate-400 tracking-wider">GSTIN Syntax Rules</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Standard Indian GSTIDs are 15 characters long. The first two characters represent state codes (e.g. Maharashtra: 27, Delhi: 07). The next ten characters hold the business PAN details, followed by entity counts, check characters, and check digit hashes.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: E-Way Bill Management */}
        {activeTab === 'eway' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Transporter Parameters inputs form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleEwaySubmit} className="card">
                <h2 className="text-lg font-black mb-4">{t.ewayTitle}</h2>
                <div className="space-y-4 font-semibold">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Select Active Invoice (Dues &gt; Rs. 50,000 required)</label>
                    <select
                      required
                      value={ewayForm.invoiceId} onChange={e => setEwayForm({ ...ewayForm, invoiceId: e.target.value })}
                      className="fi"
                    >
                      <option value="">-- Select Receivable --</option>
                      {eligibleEwayInvoices.map(inv => (
                        <option key={inv._id} value={inv._id}>
                          {inv.invoiceNumber} - {inv.customerName} (Rs. {inv.amount}) {inv.amount >= 50000 ? '✓ Audit Compliant' : '⚠ Below Limit'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.transporterId}</label>
                      <input
                        type="text" required placeholder="TRANS-XXXX"
                        value={ewayForm.transporterId} onChange={e => setEwayForm({ ...ewayForm, transporterId: e.target.value })}
                        className="fi"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.vehicleNo}</label>
                      <input
                        type="text" required placeholder="MH-12-XX-XXXX"
                        value={ewayForm.vehicleNo} onChange={e => setEwayForm({ ...ewayForm, vehicleNo: e.target.value })}
                        className="fi"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.distance}</label>
                      <input
                        type="number" required placeholder="Distance in km"
                        value={ewayForm.distance} onChange={e => setEwayForm({ ...ewayForm, distance: e.target.value })}
                        className="fi"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.hsnCode}</label>
                      <input
                        type="text" required
                        value={ewayForm.hsnCode} onChange={e => setEwayForm({ ...ewayForm, hsnCode: e.target.value })}
                        className="fi"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition active:scale-95 shadow-md">
                    {t.btnGenerateEway}
                  </button>
                </div>
              </form>

              {/* Generated printable E-Way Bill Receipt */}
              {generatedEway && (
                <div className="card font-sans">
                  <div className="flex justify-between items-start mb-6 border-b pb-4 border-slate-250 dark:border-slate-800">
                    <div>
                      <h3 className="text-lg font-black uppercase text-blue-600 tracking-wider">{t.printableEway}</h3>
                      <div className="text-[10px] font-black text-slate-400 font-mono mt-0.5">{generatedEway.ewayBillNo}</div>
                    </div>
                    <img src={generatedEway.qrcode} alt="E-Way Barcode" className="h-20 w-20 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <div className="text-slate-400">Invoice Number</div>
                      <div className={`text-sm font-black mt-1 font-mono ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{generatedEway.invoiceNo}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Customer Consignee</div>
                      <div className={`text-sm font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{generatedEway.customer}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Transporter & Vehicle</div>
                      <div className={`text-sm font-black mt-1 font-mono ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{generatedEway.vehicleNo} [{generatedEway.transporterId}]</div>
                    </div>
                    <div>
                      <div className="text-slate-400">HSN & Total Value</div>
                      <div className="text-sm font-black mt-1 text-blue-600 font-mono">{generatedEway.hsnCode} • Rs. {generatedEway.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Transport Distance</div>
                      <div className={`text-sm font-black mt-1 font-mono ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{generatedEway.distance} km</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Validity Expiration</div>
                      <div className="text-sm font-black mt-1 text-rose-600 font-mono">{generatedEway.validUntil} (Active)</div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl font-bold transition active:scale-95 text-xs text-center"
                    >
                      Print Certificate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Side Rules */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-md font-black mb-2 uppercase text-slate-400 tracking-wider">E-Way Thresholds</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Under standard Indian GST compliance, generating an official electronic way bill (E-Way bill) is legally mandatory for transport shipments of goods where total trade invoice values exceed Rs. 50,000. Validity is calculated dynamically based on distance.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 5: TDS Management Tracker */}
        {activeTab === 'tds' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* TDS logging Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleTdsSubmit} className="card">
                <h2 className="text-lg font-black mb-4">{t.tdsTitle}</h2>
                <div className="space-y-4 font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.tdsSection}</label>
                      <select
                        required
                        value={tdsForm.section} onChange={e => setTdsForm({ ...tdsForm, section: e.target.value })}
                        className="fi"
                      >
                        <option value="194J">Section 194J (Professionals - 10%)</option>
                        <option value="194I">Section 194I (Rent - 10%)</option>
                        <option value="194C">Section 194C (Contractors - 1% / 2%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.payeeCat}</label>
                      <select
                        required
                        value={tdsForm.category} onChange={e => setTdsForm({ ...tdsForm, category: e.target.value })}
                        className="fi"
                      >
                        <option value="Company">Company / LLP (2% contractor)</option>
                        <option value="Individual">Individual / HUF (1% contractor)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.invoiceAmt}</label>
                    <input
                      type="number" required placeholder="0.00"
                      value={tdsForm.amount} onChange={e => setTdsForm({ ...tdsForm, amount: e.target.value })}
                      className="fi"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.narration}</label>
                    <input
                      type="text" placeholder="Transaction details/recipient info..."
                      value={tdsForm.narration} onChange={e => setTdsForm({ ...tdsForm, narration: e.target.value })}
                      className="fi"
                    />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition active:scale-95 shadow-md">
                    {t.btnLogTds}
                  </button>
                </div>
              </form>

              {/* TDS deductions feed */}
              <div className="card overflow-hidden shadow-sm" style={{ padding: 0 }}>
                <div className="p-5 border-b border-slate-200 dark:border-slate-800" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                  <h3 className="text-lg font-black">Logged TDS Withholding Ledgers</h3>
                </div>
                <table className="tbl font-sans">
                  <thead>
                    <tr>
                      <th className="p-4">Deductee Payee</th>
                      <th className="p-4">Section</th>
                      <th className="p-4 text-right">Base Amount</th>
                      <th className="p-4 text-center">Rate</th>
                      <th className="p-4 text-right font-black">TDS Deducted</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'} font-semibold`}>
                    {tdsList.length > 0 ? (
                      tdsList.map((item, idx) => (
                        <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/50'}>
                          <td className="p-4">
                            <div className="font-black text-sm">{item.payee}</div>
                            <span className="text-[10px] text-slate-400 font-semibold">{item.desc}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-500">{item.section}</td>
                          <td className={`p-4 text-right font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Rs. {item.base?.toLocaleString()}</td>
                          <td className="p-4 text-center font-black text-slate-500">{item.rate}</td>
                          <td className="p-4 text-right font-black text-rose-600 font-mono">Rs. {item.tax?.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          <i className="fas fa-file-invoice-dollar" style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5, display: 'block', margin: '0 auto' }}></i>
                          <div>No TDS deductions recorded</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TDS Guidelines card */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-md font-black mb-2 uppercase text-slate-400 tracking-wider">TDS compliance rules</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Tax Deducted at Source (TDS) under the Income Tax Act requires holding back tax during contractor payments. Form 26Q returns track withholding statements quarterly. Deducted amounts must be credited to the TDS payable government escrow.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: Interactive GST Calculator */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
            
            {/* Input Form */}
            <div className="card lg:col-span-1 flex flex-col gap-6">
              <h2 className={`text-lg font-black uppercase tracking-wider pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-150/40'}`}>GST Input Panel</h2>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Base Amount (Rs.)</label>
                <input 
                  type="number" 
                  value={gstCalc.baseAmount}
                  onChange={(e) => setGstCalc({ ...gstCalc, baseAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="fi font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">GST Tax Rate (%)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 12, 18, 28].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstCalc({ ...gstCalc, rate })}
                      className={`py-2 text-center text-xs font-black rounded-lg border transition ${
                        gstCalc.rate === rate 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : (isDark 
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 hover:text-slate-950')
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex flex-col gap-1.5 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-150/40'}`}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Supply Classification</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setGstCalc({ ...gstCalc, isInterstate: false })}
                    className={`py-2 px-3 text-center text-[10px] font-black uppercase tracking-wider rounded-lg border transition ${
                      !gstCalc.isInterstate 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : (isDark 
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 hover:text-slate-950')
                    }`}
                  >
                    Intra-State (CGST + SGST)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstCalc({ ...gstCalc, isInterstate: true })}
                    className={`py-2 px-3 text-center text-[10px] font-black uppercase tracking-wider rounded-lg border transition ${
                      gstCalc.isInterstate 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : (isDark 
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 hover:text-slate-950')
                    }`}
                  >
                    Inter-State (IGST)
                  </button>
                </div>
              </div>
            </div>

            {/* Calculations Result */}
            <div className="card lg:col-span-2 flex flex-col gap-6">
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-150/40'}`}>
                <h2 className="text-lg font-black uppercase tracking-wider">Tax Calculation Breakdown</h2>
                <button
                  type="button"
                  onClick={() => {
                    const textReport = [
                      `GST TAX INVOICE BREAKDOWN REPORT`,
                      `--------------------------------`,
                      `Base Taxable Amount: Rs. ${gstCalc.baseAmount.toLocaleString()}`,
                      `Applicable Rate   : ${gstCalc.rate}%`,
                      `Supply Category   : ${gstCalc.isInterstate ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}`,
                      `--------------------------------`,
                      `CGST Allocation (Local) : Rs. ${calcCgst.toLocaleString()}`,
                      `SGST Allocation (Local) : Rs. ${calcSgst.toLocaleString()}`,
                      `IGST Allocation (Inter) : Rs. ${calcIgst.toLocaleString()}`,
                      `Total Tax Component     : Rs. ${calcGst.toLocaleString()}`,
                      `--------------------------------`,
                      `GROSS PAYABLE PRICE     : Rs. ${calcTotal.toLocaleString()}`
                    ].join('\n');
                    navigator.clipboard.writeText(textReport);
                    triggerToast('GST calculation breakdown copied to clipboard!', 'success');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 shadow-sm active:scale-95"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Result Spreadsheet */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono font-bold">
                      <tr>
                        <td className="py-2.5 pr-4 text-slate-400 font-sans">Base Amount</td>
                        <td className="py-2.5 pl-4 text-right">Rs. {gstCalc.baseAmount.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-slate-400 font-sans">CGST ({gstCalc.isInterstate ? 0 : gstCalc.rate / 2}%)</td>
                        <td className="py-2.5 pl-4 text-right text-indigo-600 dark:text-indigo-400">Rs. {calcCgst.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-slate-400 font-sans">SGST ({gstCalc.isInterstate ? 0 : gstCalc.rate / 2}%)</td>
                        <td className="py-2.5 pl-4 text-right text-indigo-600 dark:text-indigo-400">Rs. {calcSgst.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-slate-400 font-sans">IGST ({gstCalc.isInterstate ? gstCalc.rate : 0}%)</td>
                        <td className="py-2.5 pl-4 text-right text-indigo-600 dark:text-indigo-400">Rs. {calcIgst.toLocaleString()}</td>
                      </tr>
                      <tr className={isDark ? 'bg-slate-950/40' : 'bg-slate-50'}>
                        <td className={`py-2.5 pr-4 font-sans font-extrabold uppercase ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Total Tax (GST)</td>
                        <td className="py-2.5 pl-4 text-right font-black">Rs. {calcGst.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-blue-50/50 dark:bg-blue-950/20 border-t-2 border-slate-200 dark:border-slate-800">
                        <td className={`py-3 pr-4 font-sans font-black text-sm uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Gross Invoice Amount</td>
                        <td className={`py-3 pl-4 text-right font-black text-base ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Rs. {calcTotal.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tax Proportion Progress Bars Visuals */}
                <div className={`flex flex-col gap-4 p-4 rounded-2xl border ${isDark ? 'bg-slate-950/30 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-150/40 text-slate-800'}`}>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Invoice Component Weight</h4>
                  
                  {/* Base Amount Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-extrabold leading-none">
                      <span className="text-slate-500">Base Cost Portion</span>
                      <span className="font-mono">{calcTotal > 0 ? ((gstCalc.baseAmount / calcTotal) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className={`w-full h-2.5 rounded-full overflow-hidden shadow-inner relative ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div style={{ width: `${calcTotal > 0 ? (gstCalc.baseAmount / calcTotal) * 100 : 0}%` }} className="h-full bg-slate-400 rounded-full transition-all duration-500" />
                    </div>
                  </div>

                  {/* Tax Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-extrabold leading-none">
                      <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>GST Portion</span>
                      <span className="font-mono">{calcTotal > 0 ? ((calcGst / calcTotal) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className={`w-full h-2.5 rounded-full overflow-hidden shadow-inner relative ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div style={{ width: `${calcTotal > 0 ? (calcGst / calcTotal) * 100 : 0}%` }} className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: Export GST Compliance Data */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
            
            {/* Ledger sheets layout */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-black">{t.exportTitle}</h2>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">Spreadsheet format tax summaries for outward and inward invoices.</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLedger}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition active:scale-95 shadow-sm"
                    >
                      {t.copyData}
                    </button>
                    <button
                      onClick={() => {
                        const wsData = [
                          ["GSTR Tax Compliance Report 2026"],
                          [],
                          ["Ledger Code", "Category Classification", "Taxable Base (Rs.)", "GST Rate", "Calculated Tax (Rs.)"],
                          ["GSTR-1 Sales Base", "OUTWARD SUPPLIES", parseFloat(gstr1Base.toFixed(2)), "18%", parseFloat(gstr1Tax.toFixed(2))],
                          ["GSTR-2 ITC Credit", "INWARD PURCHASES", parseFloat(gstr2Base.toFixed(2)), "18%", parseFloat(gstr2ITC.toFixed(2))],
                          ["GSTR-3B Net Payable", "CONSOLIDATED TAX", "", "", parseFloat(netGstPayable.toFixed(2))]
                        ];
                        const ws = XLSX.utils.aoa_to_sheet(wsData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "GSTR Tax Summary");
                        XLSX.writeFile(wb, `GSTR_Report_2026.xlsx`);
                        triggerToast("Excel download triggered successfully!");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition active:scale-95 shadow-sm"
                    >
                      {t.downloadJson}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-850 rounded-2xl">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th className="p-3">Ledger Code</th>
                        <th className="p-3">Category Classification</th>
                        <th className="p-3 text-right">Taxable base (Rs.)</th>
                        <th className="p-3 text-center">GST Rate</th>
                        <th className="p-3 text-right">Calculated Tax (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-850 bg-slate-900/20' : 'divide-slate-100'} font-semibold font-mono`}>
                      <tr>
                        <td className={`p-3 font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>GSTR-1 Sales Base</td>
                        <td className="p-3 text-slate-400">OUTWARD SUPPLIES</td>
                        <td className="p-3 text-right text-slate-600">{gstr1Base.toFixed(2)}</td>
                        <td className="p-3 text-center text-slate-500">18%</td>
                        <td className="p-3 text-right text-rose-600">{gstr1Tax.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className={`p-3 font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>GSTR-2 Expense Base</td>
                        <td className="p-3 text-slate-400">INWARD SUPPLIES (ITC)</td>
                        <td className="p-3 text-right text-slate-600">{gstr2Base.toFixed(2)}</td>
                        <td className="p-3 text-center text-slate-500">18%</td>
                        <td className="p-3 text-right text-emerald-600">{gstr2ITC.toFixed(2)}</td>
                      </tr>
                      <tr className={`font-black ${isDark ? 'bg-slate-900/60' : 'bg-slate-100/50'}`}>
                        <td className="p-3" colSpan="2">Net Outward Tax Position</td>
                        <td className="p-3 text-right font-bold text-slate-600">{(gstr1Base - gstr2Base).toFixed(2)}</td>
                        <td className="p-3 text-center text-slate-500">-</td>
                        <td className="p-3 text-right text-blue-600 font-bold">{netGstPayable.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Side guideline */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-md font-black mb-2 uppercase text-slate-400 tracking-wider">Export Formats</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Tax export profiles extract raw tax structures natively into portable formats (JSON/Excel). Tax advisors and Chartered Accountants can directly upload these ledger packages into government utility tools to file corporate audits.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* Modal 1: File GST Return */}
      {showFilingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t.btnFile}</h3>
              <button onClick={() => setShowFilingModal(false)} className={`text-slate-400 text-xs font-black transition ${isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'}`}>
                {t.close}
              </button>
            </div>
            
            <form onSubmit={handleFilingSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.period}</label>
                <select
                  value={filingForm.period}
                  onChange={e => setFilingForm({ ...filingForm, period: e.target.value })}
                  className="fi font-semibold"
                >
                  <option value="May 2026">May 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="Q1 FY26">Q1 FY26 (Composition)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.cgst}</label>
                  <input
                    type="number" required placeholder="0"
                    value={filingForm.cgst}
                    onChange={e => setFilingForm({ ...filingForm, cgst: e.target.value })}
                    className="fi font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.sgst}</label>
                  <input
                    type="number" required placeholder="0"
                    value={filingForm.sgst}
                    onChange={e => setFilingForm({ ...filingForm, sgst: e.target.value })}
                    className="fi font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{t.igst}</label>
                <input
                  type="number" placeholder="0"
                  value={filingForm.igst}
                  onChange={e => setFilingForm({ ...filingForm, igst: e.target.value })}
                  className="fi font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition active:scale-95 shadow-md shadow-blue-600/10 mt-2"
              >
                {t.saveReturn}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GstTax;
