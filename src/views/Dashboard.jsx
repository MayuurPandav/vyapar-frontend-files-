import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement, ArcElement);

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli",
  "Daman & Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh"
];

const STATE_CITY_PINCODES = {
  "Andhra Pradesh": [
    { city: "Visakhapatnam", pincode: "530001" },
    { city: "Vijayawada", pincode: "520001" },
    { city: "Guntur", pincode: "522001" },
    { city: "Nellore", pincode: "524001" },
    { city: "Tirupati", pincode: "517501" }
  ],
  "Arunachal Pradesh": [
    { city: "Itanagar", pincode: "791111" },
    { city: "Naharlagun", pincode: "791110" },
    { city: "Pasighat", pincode: "791102" },
    { city: "Tawang", pincode: "790104" }
  ],
  "Assam": [
    { city: "Guwahati", pincode: "781001" },
    { city: "Dibrugarh", pincode: "786001" },
    { city: "Silchar", pincode: "788001" },
    { city: "Jorhat", pincode: "785001" },
    { city: "Tezpur", pincode: "784001" }
  ],
  "Bihar": [
    { city: "Patna", pincode: "800001" },
    { city: "Gaya", pincode: "823001" },
    { city: "Bhagalpur", pincode: "812001" },
    { city: "Muzaffarpur", pincode: "842001" },
    { city: "Darbhanga", pincode: "846001" }
  ],
  "Chhattisgarh": [
    { city: "Raipur", pincode: "492001" },
    { city: "Bilaspur", pincode: "495001" },
    { city: "Bhilai", pincode: "490001" },
    { city: "Korba", pincode: "495677" },
    { city: "Jagdalpur", pincode: "494001" }
  ],
  "Goa": [
    { city: "Panaji", pincode: "403001" },
    { city: "Margao", pincode: "403601" },
    { city: "Vasco da Gama", pincode: "403802" },
    { city: "Mapusa", pincode: "403507" },
    { city: "Ponda", pincode: "403401" }
  ],
  "Gujarat": [
    { city: "Ahmedabad", pincode: "380001" },
    { city: "Surat", pincode: "395003" },
    { city: "Vadodara", pincode: "390001" },
    { city: "Rajkot", pincode: "360001" },
    { city: "Gandhinagar", pincode: "382010" }
  ],
  "Haryana": [
    { city: "Gurgaon", pincode: "122001" },
    { city: "Faridabad", pincode: "121001" },
    { city: "Panipat", pincode: "132103" },
    { city: "Ambala", pincode: "133001" },
    { city: "Rohtak", pincode: "124001" }
  ],
  "Himachal Pradesh": [
    { city: "Shimla", pincode: "171001" },
    { city: "Manali", pincode: "175131" },
    { city: "Dharamshala", pincode: "176215" },
    { city: "Solan", pincode: "173212" },
    { city: "Mandi", pincode: "175001" }
  ],
  "Jammu & Kashmir": [
    { city: "Srinagar", pincode: "190001" },
    { city: "Jammu", pincode: "180001" },
    { city: "Anantnag", pincode: "192101" },
    { city: "Baramulla", pincode: "193101" },
    { city: "Kathua", pincode: "184101" }
  ],
  "Jharkhand": [
    { city: "Ranchi", pincode: "834001" },
    { city: "Jamshedpur", pincode: "831001" },
    { city: "Dhanbad", pincode: "826001" },
    { city: "Bokaro", pincode: "827001" },
    { city: "Deoghar", pincode: "814112" }
  ],
  "Karnataka": [
    { city: "Bengaluru", pincode: "560001" },
    { city: "Mysuru", pincode: "570001" },
    { city: "Hubballi", pincode: "580020" },
    { city: "Mangaluru", pincode: "575001" },
    { city: "Belagavi", pincode: "590001" }
  ],
  "Kerala": [
    { city: "Thiruvananthapuram", pincode: "695001" },
    { city: "Kochi", pincode: "682001" },
    { city: "Kozhikode", pincode: "673001" },
    { city: "Thrissur", pincode: "680001" },
    { city: "Kollam", pincode: "691001" }
  ],
  "Madhya Pradesh": [
    { city: "Bhopal", pincode: "462001" },
    { city: "Indore", pincode: "452001" },
    { city: "Jabalpur", pincode: "482001" },
    { city: "Gwalior", pincode: "474001" },
    { city: "Ujjain", pincode: "456001" }
  ],
  "Maharashtra": [
    { city: "Mumbai", pincode: "400001" },
    { city: "Pune", pincode: "411001" },
    { city: "Nagpur", pincode: "440001" },
    { city: "Nashik", pincode: "422001" },
    { city: "Aurangabad", pincode: "431001" }
  ],
  "Manipur": [
    { city: "Imphal", pincode: "795001" },
    { city: "Thoubal", pincode: "795138" },
    { city: "Bishnupur", pincode: "795126" },
    { city: "Churachandpur", pincode: "795128" }
  ],
  "Meghalaya": [
    { city: "Shillong", pincode: "793001" },
    { city: "Tura", pincode: "794001" },
    { city: "Jowai", pincode: "793150" },
    { city: "Nongpoh", pincode: "793102" }
  ],
  "Mizoram": [
    { city: "Aizawl", pincode: "796001" },
    { city: "Lunglei", pincode: "796701" },
    { city: "Champhai", pincode: "796321" },
    { city: "Serchhip", pincode: "796181" }
  ],
  "Nagaland": [
    { city: "Kohima", pincode: "797001" },
    { city: "Dimapur", pincode: "797112" },
    { city: "Mokokchung", pincode: "798601" },
    { city: "Wokha", pincode: "797111" }
  ],
  "Odisha": [
    { city: "Bhubaneswar", pincode: "751001" },
    { city: "Cuttack", pincode: "753001" },
    { city: "Rourkela", pincode: "769001" },
    { city: "Sambalpur", pincode: "768001" },
    { city: "Puri", pincode: "752001" }
  ],
  "Punjab": [
    { city: "Ludhiana", pincode: "141001" },
    { city: "Amritsar", pincode: "143001" },
    { city: "Jalandhar", pincode: "144001" },
    { city: "Patiala", pincode: "147001" },
    { city: "Bathinda", pincode: "151001" }
  ],
  "Rajasthan": [
    { city: "Jaipur", pincode: "302001" },
    { city: "Jodhpur", pincode: "342001" },
    { city: "Udaipur", pincode: "313001" },
    { city: "Kota", pincode: "324001" },
    { city: "Ajmer", pincode: "305001" }
  ],
  "Sikkim": [
    { city: "Gangtok", pincode: "737101" },
    { city: "Namchi", pincode: "737126" },
    { city: "Geyzing", pincode: "737111" },
    { city: "Mangan", pincode: "737116" }
  ],
  "Tamil Nadu": [
    { city: "Chennai", pincode: "600001" },
    { city: "Coimbatore", pincode: "641001" },
    { city: "Madurai", pincode: "625001" },
    { city: "Tiruchirappalli", pincode: "620001" },
    { city: "Salem", pincode: "636001" }
  ],
  "Telangana": [
    { city: "Hyderabad", pincode: "500001" },
    { city: "Warangal", pincode: "506001" },
    { city: "Nizamabad", pincode: "503001" },
    { city: "Karimnagar", pincode: "505001" },
    { city: "Khammam", pincode: "507001" }
  ],
  "Tripura": [
    { city: "Agartala", pincode: "799001" },
    { city: "Dharmanagar", pincode: "799250" },
    { city: "Udaipur Tripura", pincode: "799120" },
    { city: "Kailasahar", pincode: "799277" }
  ],
  "Uttar Pradesh": [
    { city: "Lucknow", pincode: "226001" },
    { city: "Kanpur", pincode: "208001" },
    { city: "Noida", pincode: "201301" },
    { city: "Agra", pincode: "282001" },
    { city: "Varanasi", pincode: "221001" }
  ],
  "Uttarakhand": [
    { city: "Dehradun", pincode: "248001" },
    { city: "Haridwar", pincode: "249401" },
    { city: "Haldwani", pincode: "263139" },
    { city: "Roorkee", pincode: "247667" },
    { city: "Nainital", pincode: "263001" }
  ],
  "West Bengal": [
    { city: "Kolkata", pincode: "700001" },
    { city: "Howrah", pincode: "711101" },
    { city: "Durgapur", pincode: "713201" },
    { city: "Siliguri", pincode: "734001" },
    { city: "Asansol", pincode: "713301" }
  ],
  "Andaman & Nicobar Islands": [
    { city: "Port Blair", pincode: "744101" },
    { city: "Havelock", pincode: "744211" },
    { city: "Car Nicobar", pincode: "744301" }
  ],
  "Chandigarh": [
    { city: "Chandigarh", pincode: "160017" },
    { city: "Sector 17", pincode: "160017" },
    { city: "Manimajra", pincode: "160101" }
  ],
  "Dadra & Nagar Haveli": [
    { city: "Silvassa", pincode: "396230" },
    { city: "Dadra", pincode: "396193" },
    { city: "Naroli", pincode: "396235" }
  ],
  "Daman & Diu": [
    { city: "Daman", pincode: "396210" },
    { city: "Diu", pincode: "362520" },
    { city: "Bhimpore", pincode: "396210" }
  ],
  "Delhi": [
    { city: "New Delhi", pincode: "110001" },
    { city: "Dwarka", pincode: "110075" },
    { city: "Rohini", pincode: "110085" },
    { city: "Karol Bagh", pincode: "110005" },
    { city: "Okhla", pincode: "110020" }
  ],
  "Lakshadweep": [
    { city: "Kavaratti", pincode: "682555" },
    { city: "Minicoy", pincode: "682559" },
    { city: "Andrott", pincode: "682551" }
  ],
  "Puducherry": [
    { city: "Puducherry", pincode: "605001" },
    { city: "Karaikal", pincode: "609602" },
    { city: "Mahe", pincode: "673310" },
    { city: "Yanam", pincode: "533464" }
  ],
  "Ladakh": [
    { city: "Leh", pincode: "194101" },
    { city: "Kargil", pincode: "194103" },
    { city: "Diskit", pincode: "194101" }
  ]
};

export default function Dashboard({ globalSearch = '' }) {
  const { currentView, setCurrentView, dbData, setDbData, saveDB, viewOnly } = useApp();
  
  // Dashboard Metrics
  const totalSales = dbData.sales.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalPurchases = dbData.purchases.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const profit = totalSales - totalPurchases;
  
  const getCashInHand = () => {
    return dbData.transactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0) - (parseFloat(t.debit) || 0), 0);
  };
  const cashInHand = getCashInHand();

  // Modals / Form toggles
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [txnSubTab, setTxnSubTab] = useState('flat'); // 'flat' or 'tchart'

  // Form states
  const [prodForm, setProdForm] = useState({ name: '', sku: '', category: 'Electronics', stock: 0, price: 0, notes: '', image: '', taxSlab: '18%', isTaxInclusive: false, hsnSac: '' });
  const [partyForm, setPartyForm] = useState({ name: '', type: 'Customer', phone: '+91 ', balance: 0, notes: '', state: 'Karnataka' });

  // Sales Form items builder
  const [saleItems, setSaleItems] = useState([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }]);
  const [saleCust, setSaleCust] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [saleMode, setSaleMode] = useState('Cash');
  const [saleNotes, setSaleNotes] = useState('');

  // Purchase Form items builder
  const [purItems, setPurItems] = useState([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }]);
  const [purSupp, setPurSupp] = useState('');
  const [purDate, setPurDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [purMode, setPurMode] = useState('Cash');
  const [purNotes, setPurNotes] = useState('');

  // Verification & Profile forms
  const [profileForm, setProfileForm] = useState({ bizName: '', email: '', phone: '+91 ', address: '', city: '', state: '', pincode: '', gstin: '', currency: 'INR (₹)' });
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [gstStatusMsg, setGstStatusMsg] = useState('');
  const [isGstVerified, setIsGstVerified] = useState(0);
  // OTP UI extended state
  const [phoneOtpMsg, setPhoneOtpMsg] = useState('');   // inline status message for phone OTP
  const [emailOtpMsg, setEmailOtpMsg] = useState('');   // inline status message for email OTP
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);
  const [isPhoneVerified, setIsPhoneVerified] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(0);

  // Sync profile fields from settings on view switch
  useEffect(() => {
    if (currentView === 'business' && dbData.settings) {
      const s = dbData.settings;
      setProfileForm({
        bizName: s.bizName || '',
        email: s.email || '',
        phone: s.phone || '+91 ',
        address: s.address || '',
        city: s.city || '',
        state: s.state || '',
        pincode: s.pincode || '',
        gstin: s.gstin || '',
        currency: s.currency || 'INR (₹)'
      });
      setIsGstVerified(s.isGstVerified || 0);
      setIsPhoneVerified(s.isPhoneVerified || 0);
      setIsEmailVerified(s.isEmailVerified || 0);
    }
  }, [currentView, dbData.settings]);

  // Format Helper
  const getCurrencySymbol = () => {
    const c = dbData.settings?.currency || 'INR (₹)';
    const match = c.match(/\((.*?)\)/);
    return match ? match[1] : '₹';
  };

  const fmt = (n) => {
    const num = Number(n) || 0;
    const sym = getCurrencySymbol();
    const isINR = sym === '₹';
    const absValStr = Math.abs(num).toLocaleString(isINR ? 'en-IN' : 'en-US');
    if (num < 0) return '-' + sym + absValStr;
    return sym + absValStr;
  };

  // Real-time tax and pricing calculations
  const calculateLineItem = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    let slabPercent = 0;
    if (item.taxSlab && item.taxSlab !== 'Exempt') {
      slabPercent = parseFloat(item.taxSlab) || 0;
    }
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    if (item.isTaxInclusive) {
      total = qty * rate;
      subtotal = total / (1 + (slabPercent / 100));
      taxAmount = total - subtotal;
    } else {
      subtotal = qty * rate;
      taxAmount = subtotal * (slabPercent / 100);
      total = subtotal + taxAmount;
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  // Product Autocomplete handlers
  const handleSaleProductNameChange = (idx, value) => {
    const copy = [...saleItems];
    copy[idx].name = value;
    const match = dbData.products.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (match) {
      copy[idx].rate = match.price;
      copy[idx].taxSlab = match.taxSlab || '18%';
      copy[idx].isTaxInclusive = match.isTaxInclusive === true || match.isTaxInclusive === 'true';
      copy[idx].hsnSac = match.hsnSac || '';
    }
    setSaleItems(copy);
  };

  const handlePurProductNameChange = (idx, value) => {
    const copy = [...purItems];
    copy[idx].name = value;
    const match = dbData.products.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (match) {
      copy[idx].rate = match.price;
      copy[idx].taxSlab = match.taxSlab || '18%';
      copy[idx].isTaxInclusive = match.isTaxInclusive === true || match.isTaxInclusive === 'true';
      copy[idx].hsnSac = match.hsnSac || '';
    }
    setPurItems(copy);
  };

  const getSaleFormTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    saleItems.forEach(item => {
      const m = calculateLineItem(item);
      subtotal += m.subtotal;
      taxAmount += m.taxAmount;
      total += m.total;
    });
    const customerParty = dbData.parties.find(p => p.name === saleCust);
    const isLocal = (customerParty?.state || 'Karnataka').toLowerCase() === (dbData.settings?.state || 'Karnataka').toLowerCase();
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      isLocal,
      cgst: isLocal ? taxAmount / 2 : 0,
      sgst: isLocal ? taxAmount / 2 : 0,
      igst: !isLocal ? taxAmount : 0
    };
  };

  const getPurFormTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    purItems.forEach(item => {
      const m = calculateLineItem(item);
      subtotal += m.subtotal;
      taxAmount += m.taxAmount;
      total += m.total;
    });
    const supplierParty = dbData.parties.find(p => p.name === purSupp);
    const isLocal = (supplierParty?.state || 'Karnataka').toLowerCase() === (dbData.settings?.state || 'Karnataka').toLowerCase();
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      isLocal,
      cgst: isLocal ? taxAmount / 2 : 0,
      sgst: isLocal ? taxAmount / 2 : 0,
      igst: !isLocal ? taxAmount : 0
    };
  };

  // CRUD Mutations
  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const newId = Math.max(0, ...dbData.products.map(p => p.id)) + 1;
    const updated = {
      ...dbData,
      products: [...dbData.products, {
        ...prodForm,
        id: newId,
        stock: parseInt(prodForm.stock),
        price: parseFloat(prodForm.price),
        taxSlab: prodForm.taxSlab || '18%',
        isTaxInclusive: prodForm.isTaxInclusive === true || prodForm.isTaxInclusive === 'true',
        hsnSac: prodForm.hsnSac || ''
      }]
    };
    saveDB(updated);
    setShowProductModal(false);
    setProdForm({ name: '', sku: '', category: 'Electronics', stock: 0, price: 0, notes: '', image: '', taxSlab: '18%', isTaxInclusive: false, hsnSac: '' });
  };

  const handlePartySubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const newId = Math.max(0, ...dbData.parties.map(p => p.id)) + 1;
    const todayStr = new Date().toISOString().substring(0, 10);
    const balanceNum = parseFloat(partyForm.balance) || 0;
    const updated = {
      ...dbData,
      parties: [...dbData.parties, { ...partyForm, id: newId, balance: balanceNum, lastTxn: todayStr, state: partyForm.state || 'Karnataka' }]
    };
    saveDB(updated);
    setShowPartyModal(false);
    setPartyForm({ name: '', type: 'Customer', phone: '+91 ', balance: 0, notes: '', state: 'Karnataka' });
  };

  // Delete Handlers
  const deleteProduct = (id) => {
    if (viewOnly || !window.confirm('Delete this product?')) return;
    const updated = { ...dbData, products: dbData.products.filter(p => p.id !== id) };
    saveDB(updated);
  };

  const deleteParty = (id) => {
    if (viewOnly || !window.confirm('Delete this party?')) return;
    const updated = { ...dbData, parties: dbData.parties.filter(p => p.id !== id) };
    saveDB(updated);
  };

  const deleteSale = (id) => {
    if (viewOnly || !window.confirm('Delete this invoice?')) return;
    const updated = { ...dbData, sales: dbData.sales.filter(s => s.id !== id) };
    saveDB(updated);
  };

  const deletePurchase = (id) => {
    if (viewOnly || !window.confirm('Delete this purchase?')) return;
    const updated = { ...dbData, purchases: dbData.purchases.filter(p => p.id !== id) };
    saveDB(updated);
  };

  // Sales Submit Handler
  const handleSalesSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');

    let totalSubtotal = 0;
    let totalTax = 0;
    let totalAmount = 0;

    const items = saleItems.filter(item => item.name.trim()).map(item => {
      const lineMath = calculateLineItem(item);
      totalSubtotal += lineMath.subtotal;
      totalTax += lineMath.taxAmount;
      totalAmount += lineMath.total;
      return {
        ...item,
        qty: parseInt(item.qty) || 1,
        rate: parseFloat(item.rate) || 0,
        taxSlab: item.taxSlab || '18%',
        isTaxInclusive: item.isTaxInclusive === true || item.isTaxInclusive === 'true',
        hsnSac: item.hsnSac || '',
        subtotal: lineMath.subtotal,
        taxAmount: lineMath.taxAmount,
        total: lineMath.total
      };
    });

    if (items.length === 0) return alert('Please add at least one valid product.');

    const grandTotal = Math.round(totalAmount);

    // AI Limit warning simulation
    if (saleMode === 'Credit (Due)') {
      const party = dbData.parties.find(p => p.name === saleCust);
      if (party && party.balance < -50000) {
        if (!window.confirm(`⚠️ AI Warning: ${saleCust} already has outstanding dues (${fmt(Math.abs(party.balance))}). Proceed anyway?`)) return;
      }
    }

    const nextSaleId = Math.max(0, ...dbData.sales.map(s => parseInt(s.id.replace('INV-', '')) || 0)) + 1;
    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '')) || 0)) + 1;

    // Split taxes based on states mapping
    const customerParty = dbData.parties.find(p => p.name === saleCust);
    const isLocal = (customerParty?.state || 'Karnataka').toLowerCase() === (dbData.settings?.state || 'Karnataka').toLowerCase();
    const cgst = isLocal ? totalTax / 2 : 0;
    const sgst = isLocal ? totalTax / 2 : 0;
    const igst = !isLocal ? totalTax : 0;

    const newSale = {
      id: `INV-${nextSaleId}`,
      customer: saleCust,
      date: saleDate,
      amount: grandTotal,
      mode: saleMode,
      status: saleMode === 'Credit (Due)' ? 'Pending' : 'Paid',
      notes: saleNotes,
      items: items,
      subtotal: Math.round(totalSubtotal * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100
    };

    // Double-Entry bookkeeping ledger account resolution
    let debitAccount = '';
    const creditAccount = 'Sales Revenue (Income)';
    if (saleMode === 'Credit (Due)') {
      debitAccount = 'Accounts Receivable (Asset)';
    } else if (saleMode === 'Cash') {
      debitAccount = 'Cash in Hand (Asset)';
    } else {
      debitAccount = 'Bank Account (Asset)';
    }

    const newTxn = {
      id: `TXN-${nextTxnId}`,
      date: saleDate,
      type: 'Sale',
      party: saleCust,
      debit: 0,
      credit: grandTotal,
      balance: (dbData.transactions[0]?.balance || 0) + grandTotal,
      debitAccount,
      creditAccount
    };

    // Update product stock levels
    const updatedProducts = dbData.products.map(p => {
      const matched = items.find(item => item.name.toLowerCase() === p.name.toLowerCase());
      if (matched) return { ...p, stock: Math.max(0, p.stock - matched.qty) };
      return p;
    });

    // Update customer balance if Credit
    const updatedParties = dbData.parties.map(p => {
      if (saleMode === 'Credit (Due)' && p.name.toLowerCase() === saleCust.toLowerCase()) {
        return {
          ...p,
          balance: p.balance - grandTotal,
          lastTxn: saleDate
        };
      }
      return p;
    });

    const updated = {
      ...dbData,
      products: updatedProducts,
      parties: updatedParties,
      sales: [newSale, ...dbData.sales],
      transactions: [newTxn, ...dbData.transactions]
    };

    saveDB(updated);
    setShowSalesForm(false);
    setSaleItems([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }]);
    setSaleCust('');
    setSaleNotes('');
  };

  // Purchase Submit Handler
  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');

    let totalSubtotal = 0;
    let totalTax = 0;
    let totalAmount = 0;

    const items = purItems.filter(item => item.name.trim()).map(item => {
      const lineMath = calculateLineItem(item);
      totalSubtotal += lineMath.subtotal;
      totalTax += lineMath.taxAmount;
      totalAmount += lineMath.total;
      return {
        ...item,
        qty: parseInt(item.qty) || 1,
        rate: parseFloat(item.rate) || 0,
        taxSlab: item.taxSlab || '18%',
        isTaxInclusive: item.isTaxInclusive === true || item.isTaxInclusive === 'true',
        hsnSac: item.hsnSac || '',
        subtotal: lineMath.subtotal,
        taxAmount: lineMath.taxAmount,
        total: lineMath.total
      };
    });

    if (items.length === 0) return alert('Please add at least one valid product.');

    const grandTotal = Math.round(totalAmount);

    const nextPurId = Math.max(0, ...dbData.purchases.map(p => parseInt(p.id.replace('PO-', '')) || 0)) + 1;
    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '')) || 0)) + 1;

    // Split taxes based on states mapping
    const supplierParty = dbData.parties.find(p => p.name === purSupp);
    const isLocal = (supplierParty?.state || 'Karnataka').toLowerCase() === (dbData.settings?.state || 'Karnataka').toLowerCase();
    const cgst = isLocal ? totalTax / 2 : 0;
    const sgst = isLocal ? totalTax / 2 : 0;
    const igst = !isLocal ? totalTax : 0;

    const newPur = {
      id: `PO-${nextPurId}`,
      supplier: purSupp,
      date: purDate,
      amount: grandTotal,
      mode: purMode,
      status: purMode === 'Credit (Due)' ? 'Pending' : 'Paid',
      notes: purNotes,
      items: items,
      subtotal: Math.round(totalSubtotal * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100
    };

    // Double-Entry bookkeeping ledger account resolution
    const debitAccount = 'Cost of Goods Sold (Expense)';
    let creditAccount = '';
    if (purMode === 'Credit (Due)') {
      creditAccount = 'Accounts Payable (Liability)';
    } else if (purMode === 'Cash') {
      creditAccount = 'Cash in Hand (Asset)';
    } else {
      creditAccount = 'Bank Account (Asset)';
    }

    const newTxn = {
      id: `TXN-${nextTxnId}`,
      date: purDate,
      type: 'Purchase',
      party: purSupp,
      debit: grandTotal,
      credit: 0,
      balance: (dbData.transactions[0]?.balance || 0) - grandTotal,
      debitAccount,
      creditAccount
    };

    // Update product stock levels
    const updatedProducts = dbData.products.map(p => {
      const matched = items.find(item => item.name.toLowerCase() === p.name.toLowerCase());
      if (matched) return { ...p, stock: p.stock + matched.qty };
      return p;
    });

    // Update supplier balance if Credit
    const updatedParties = dbData.parties.map(p => {
      if (purMode === 'Credit (Due)' && p.name.toLowerCase() === purSupp.toLowerCase()) {
        return {
          ...p,
          balance: p.balance + grandTotal,
          lastTxn: purDate
        };
      }
      return p;
    });

    const updated = {
      ...dbData,
      products: updatedProducts,
      parties: updatedParties,
      purchases: [newPur, ...dbData.purchases],
      transactions: [newTxn, ...dbData.transactions]
    };

    saveDB(updated);
    setShowPurchaseForm(false);
    setPurItems([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }]);
    setPurSupp('');
    setPurNotes('');
  };

  // Verify GSTIN via API
  const handleGSTVerify = async () => {
    if (!profileForm.gstin) return setGstStatusMsg('Please enter a GSTIN first.');
    setGstStatusMsg('Verifying...');
    try {
      const res = await fetch('/api/verify-gst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstin: profileForm.gstin })
      });
      const data = await res.json();
      if (res.ok) {
        setIsGstVerified(1);
        setGstStatusMsg(`✓ Verified: ${data.data.state} | PAN: ${data.data.pan}`);
        const updated = {
          ...dbData,
          settings: { ...dbData.settings, gstin: profileForm.gstin, isGstVerified: 1 }
        };
        saveDB(updated);
      } else {
        setIsGstVerified(2);
        setGstStatusMsg(`✗ ${data.message}`);
      }
    } catch {
      setGstStatusMsg('Verification server unreachable.');
    }
  };

  // Helper: start a 60-second resend countdown for a channel
  const startOtpCountdown = (field) => {
    const setCount = field === 'phone' ? setPhoneOtpCountdown : setEmailOtpCountdown;
    setCount(60);
    const iv = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Send Profile OTPs
  const handleSendOTP = async (field) => {
    const rawValue = field === 'phone' ? profileForm.phone : profileForm.email;
    // Strip country code prefixes like +91, 0091 etc. for the phone channel
    const value = field === 'phone'
      ? rawValue.replace(/^\+91\s*/, '').replace(/^0091\s*/, '').trim()
      : rawValue.trim();
    const setMsg = field === 'phone' ? setPhoneOtpMsg : setEmailOtpMsg;
    const setSending = field === 'phone' ? setPhoneOtpSending : setEmailOtpSending;

    if (!value || value.length < 5) {
      setMsg(`⚠️ Please enter a valid ${field === 'phone' ? 'phone number' : 'email address'} first.`);
      return;
    }
    setMsg('');
    setSending(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: dbData.settings.username, field, value })
      });
      const data = await res.json();
      setSending(false);
      if (res.ok) {
        if (field === 'email') {
          setShowEmailOtp(true);
          if (data.otp) setEmailOtp(data.otp);
          setEmailOtpMsg('✅ OTP sent to your email. Enter it below to verify.');
        }
        if (field === 'phone') {
          setShowPhoneOtp(true);
          if (data.otp) setPhoneOtp(data.otp);
          setPhoneOtpMsg('✅ OTP sent via SMS. Enter it below to verify.');
        }
        if (data.note) {
          setMsg(`ℹ️ ${data.note} Check server console for the OTP.`);
        }
        startOtpCountdown(field);
      } else {
        setMsg(`❌ ${data.message || 'Failed to send OTP. Try again.'}`);
      }
    } catch (err) {
      setSending(false);
      setMsg('❌ Network error. Please check your connection.');
    }
  };

  // Verify Profile OTPs
  const handleVerifyOTP = async (field) => {
    const code = field === 'phone' ? phoneOtp : emailOtp;
    const setMsg = field === 'phone' ? setPhoneOtpMsg : setEmailOtpMsg;

    if (!code || code.trim().length < 4) {
      setMsg('⚠️ Please enter the 6-digit OTP.');
      return;
    }
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: dbData.settings.username, field, code: code.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ ${field === 'phone' ? 'Phone number' : 'Email'} verified successfully!`);
        const statusKey = `is${field.charAt(0).toUpperCase() + field.slice(1)}Verified`;
        const updated = {
          ...dbData,
          settings: { ...dbData.settings, [statusKey]: 1 }
        };
        saveDB(updated);
        if (field === 'email') { setShowEmailOtp(false); setIsEmailVerified(1); }
        if (field === 'phone') { setShowPhoneOtp(false); setIsPhoneVerified(1); }
      } else {
        setMsg(`❌ ${data.message || 'Invalid OTP. Please try again.'}`);
      }
    } catch (err) {
      setMsg('❌ Network error. Verification failed.');
    }
  };

  // Dynamic state/city pincode handlers
  const handleStateChange = (stateVal) => {
    const cities = STATE_CITY_PINCODES[stateVal] || [{ city: `${stateVal} Capital`, pincode: "100001" }];
    const firstCity = cities[0];
    setProfileForm({
      ...profileForm,
      state: stateVal,
      city: firstCity.city,
      pincode: firstCity.pincode
    });
  };

  const handleCityChange = (cityVal) => {
    const cities = STATE_CITY_PINCODES[profileForm.state] || [{ city: `${profileForm.state} Capital`, pincode: "100001" }];
    const match = cities.find(c => c.city === cityVal);
    setProfileForm({
      ...profileForm,
      city: cityVal,
      pincode: match ? match.pincode : profileForm.pincode
    });
  };

  // Save Settings Form
  const handleProfileSave = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const updated = {
      ...dbData,
      settings: {
        ...dbData.settings,
        ...profileForm,
        isGstVerified
      }
    };
    saveDB(updated);
    alert('Business Profile updated successfully!');
  };

  // Chart data preps
  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Sales Revenue',
      data: [12000, 19000, 3000, 5000, 2000, 3000, totalSales > 0 ? totalSales / 10 : 15000],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const expenseChartData = {
    labels: ['Procurement', 'Tax (Estimated)', 'Operating'],
    datasets: [{
      data: [totalPurchases, totalSales * 0.18, 5000],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6']
    }]
  };

  const reorderList = dbData.products.filter(p => p.stock <= 5);

  // Global search filtered lists — powered by Topbar search bar
  const q = (globalSearch || '').toLowerCase().trim();
  const filteredProducts = q
    ? dbData.products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.hsnSac || '').toLowerCase().includes(q)
      )
    : dbData.products;
  const filteredParties = q
    ? dbData.parties.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q) ||
        (p.type || '').toLowerCase().includes(q)
      )
    : dbData.parties;
  const filteredSales = q
    ? dbData.sales.filter(s =>
        (s.customer || '').toLowerCase().includes(q) ||
        (s.invoiceNo || '').toLowerCase().includes(q) ||
        (s.payMode || '').toLowerCase().includes(q)
      )
    : dbData.sales;
  const filteredPurchases = q
    ? dbData.purchases.filter(p =>
        (p.supplier || '').toLowerCase().includes(q) ||
        (p.invoiceNo || '').toLowerCase().includes(q) ||
        (p.payMode || '').toLowerCase().includes(q)
      )
    : dbData.purchases;

  return (
    <>
      {/* ==================== MODULE 1: DASHBOARD ==================== */}
      {currentView === 'dashboard' && (
        <section className="view active" id="view-dashboard">
          <div className="sec-header">
            <h2>Business Overview</h2>
            <p>Welcome back! Here's what's happening with your store today.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={() => { setCurrentView('sales'); setShowSalesForm(true); }}><i className="fas fa-plus"></i> New Sale</button>
            <button className="btn" onClick={() => { setCurrentView('purchase'); setShowPurchaseForm(true); }}><i className="fas fa-cart-shopping"></i> New Purchase</button>
            <button className="btn" onClick={() => setShowProductModal(true)}><i className="fas fa-box"></i> Add Product</button>
            <button className="btn" onClick={() => setShowPartyModal(true)}><i className="fas fa-user-plus"></i> Add Party</button>
          </div>

          <div className="stats-grid">
            <div className="card card--lift">
              <div className="stat__top">
                <div className="stat__icon stat__icon--g"><i className="fas fa-wallet"></i></div>
                <span className="stat__trend up"><i className="fas fa-arrow-up"></i> 12.5%</span>
              </div>
              <div className="stat__val">{fmt(totalSales)}</div>
              <div className="stat__lbl">Total Sales</div>
            </div>
            <div className="card card--lift">
              <div className="stat__top">
                <div className="stat__icon stat__icon--r"><i className="fas fa-cart-shopping"></i></div>
                <span className="stat__trend down"><i className="fas fa-arrow-down"></i> 4.2%</span>
              </div>
              <div className="stat__val">{fmt(totalPurchases)}</div>
              <div className="stat__lbl">Total Purchases</div>
            </div>
            <div className="card card--lift">
              <div className="stat__top">
                <div className="stat__icon stat__icon--y"><i className="fas fa-chart-line"></i></div>
                <span className="stat__trend up"><i className="fas fa-arrow-up"></i> 8.2%</span>
              </div>
              <div className="stat__val" style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(profit)}</div>
              <div className="stat__lbl">Profit & Loss</div>
            </div>
            <div className="card card--lift">
              <div className="stat__top">
                <div className="stat__icon stat__icon--b"><i className="fas fa-hand-holding-dollar"></i></div>
              </div>
              <div className="stat__val">{fmt(cashInHand)}</div>
              <div className="stat__lbl">Cash in Hand</div>
            </div>
          </div>

          <div className="two-col">
            <div className="card chart-area">
              <div className="card__head">
                <span>Sales Performance</span>
              </div>
              <div style={{ height: '240px' }}><Line data={salesChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
            </div>
            <div className="card">
              <div className="card__head"><span>Low Stock Alerts</span></div>
              <div id="dash-alerts">
                {reorderList.length ? (
                  reorderList.map((p, idx) => (
                    <div className="alert-row" key={idx}>
                      <div className="alert-row__img" style={{ display: 'grid', placeItems: 'center', fontSize: '16px', color: 'var(--text-3)' }}><i className="fas fa-box"></i></div>
                      <div style={{ flex: 1 }}><div className="alert-row__name">{p.name}</div><div className="alert-row__meta">SKU: {p.sku}</div></div>
                      <span className="badge badge--red">{p.stock} left</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-3)', padding: '16px 0' }}>All products are well-stocked ✓</p>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card__head">
              <span>Recent Transactions</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dbData.transactions.slice(0, 5).map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                    <td><span className={`badge ${t.type === 'Sale' ? 'badge--green' : 'badge--blue'}`}>{t.type}</span></td>
                    <td>{t.party}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(t.credit || t.debit)}</td>
                    <td><span className={`badge ${t.credit ? 'badge--green' : 'badge--red'}`}>{t.credit ? 'Credit' : 'Debit'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== MODULE 2: SALES ==================== */}
      {currentView === 'sales' && (
        <section className="view active" id="view-sales">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Sales & Billing <span className="ai-badge">AI Ready</span></h2>
              <p>Create invoices, track sales, and manage billing.</p>
            </div>
            <button className="btn btn--primary" onClick={() => setShowSalesForm(true)}><i className="fas fa-plus"></i> New Invoice</button>
          </div>

          {showSalesForm && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="modal__top">
                <h3>Create Invoice</h3>
                <button className="btn--icon" onClick={() => setShowSalesForm(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
              </div>
              <form onSubmit={handleSalesSubmit}>
                <div className="form-row form-row-3">
                  <div className="fg"><label>Customer Name</label>
                    <input className="fi" placeholder="Customer name" value={saleCust} onChange={(e) => setSaleCust(e.target.value)} required />
                  </div>
                  <div className="fg"><label>Invoice Date</label>
                    <input type="date" className="fi" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
                  </div>
                  <div className="fg"><label>Payment Mode</label>
                    <select className="fi" value={saleMode} onChange={(e) => setSaleMode(e.target.value)}>
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                      <option>Credit (Due)</option>
                    </select>
                  </div>
                </div>

                <table className="tbl" style={{ marginBottom: '12px' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th style={{ width: '90px' }}>HSN/SAC</th>
                      <th style={{ width: '70px' }}>Qty</th>
                      <th style={{ width: '100px' }}>Rate ({getCurrencySymbol()})</th>
                      <th style={{ width: '100px' }}>Tax Slab</th>
                      <th style={{ width: '100px' }}>Pricing</th>
                      <th style={{ width: '90px' }}>Tax ({getCurrencySymbol()})</th>
                      <th style={{ width: '100px' }}>Line Total</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.map((item, idx) => {
                      const lineMath = calculateLineItem(item);
                      return (
                        <tr key={idx}>
                          <td>
                            <input
                              list="products-datalist"
                              className="fi"
                              placeholder="Product name"
                              value={item.name}
                              onChange={(e) => handleSaleProductNameChange(idx, e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              className="fi"
                              placeholder="HSN"
                              value={item.hsnSac || ''}
                              onChange={(e) => {
                                const copy = [...saleItems];
                                copy[idx].hsnSac = e.target.value;
                                setSaleItems(copy);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="fi"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const copy = [...saleItems];
                                copy[idx].qty = parseInt(e.target.value) || 1;
                                setSaleItems(copy);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="fi"
                              placeholder="0"
                              value={item.rate}
                              onChange={(e) => {
                                const copy = [...saleItems];
                                copy[idx].rate = parseFloat(e.target.value) || 0;
                                setSaleItems(copy);
                              }}
                              required
                            />
                          </td>
                          <td>
                            <select
                              className="fi"
                              value={item.taxSlab || '18%'}
                              onChange={(e) => {
                                const copy = [...saleItems];
                                copy[idx].taxSlab = e.target.value;
                                setSaleItems(copy);
                              }}
                            >
                              <option value="Exempt">Exempt</option>
                              <option value="0%">0%</option>
                              <option value="5%">5%</option>
                              <option value="12%">12%</option>
                              <option value="18%">18%</option>
                              <option value="28%">28%</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="fi"
                              value={item.isTaxInclusive ? 'inclusive' : 'exclusive'}
                              onChange={(e) => {
                                const copy = [...saleItems];
                                copy[idx].isTaxInclusive = e.target.value === 'inclusive';
                                setSaleItems(copy);
                              }}
                            >
                              <option value="exclusive">Exclusive</option>
                              <option value="inclusive">Inclusive</option>
                            </select>
                          </td>
                          <td style={{ fontWeight: 500 }}>{fmt(lineMath.taxAmount)}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(lineMath.total)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn--icon"
                              onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                            >
                              <i className="fas fa-trash" style={{ color: 'var(--red)' }}></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button type="button" className="btn btn--sm" onClick={() => setSaleItems([...saleItems, { name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }])}><i className="fas fa-plus"></i> Add Item</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="fg"><label>Notes / Remarks</label>
                      <textarea className="fi" placeholder="Invoice notes..." value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ width: '320px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {(() => {
                      const t = getSaleFormTotals();
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span>Subtotal:</span>
                            <span style={{ fontWeight: 600 }}>{fmt(t.subtotal)}</span>
                          </div>
                          {t.isLocal ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>CGST:</span>
                                <span style={{ fontWeight: 600 }}>{fmt(t.cgst)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>SGST:</span>
                                <span style={{ fontWeight: 600 }}>{fmt(t.sgst)}</span>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                              <span>IGST:</span>
                              <span style={{ fontWeight: 600 }}>{fmt(t.igst)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '6px' }}>
                            <span>Total Tax:</span>
                            <span style={{ fontWeight: 600 }}>{fmt(t.taxAmount)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>
                            <span>Grand Total:</span>
                            <span>{fmt(t.total)}</span>
                          </div>
                        </>
                      );
                    })()}
                    <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}><i className="fas fa-check"></i> Save Invoice</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbData.sales.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--blue)', cursor: 'pointer' }} onClick={() => setActiveInvoice(s)}>{s.id}</td>
                    <td>{s.customer}</td>
                    <td style={{ color: 'var(--text-3)' }}>{s.date}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(s.amount)}</td>
                    <td><span className={`badge ${s.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{s.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn--icon" onClick={() => deleteSale(s.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== MODULE 3: PURCHASE ==================== */}
      {currentView === 'purchase' && (
        <section className="view active" id="view-purchase">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Purchase Management</h2>
              <p>Record purchases, track supplier orders, and manage procurement.</p>
            </div>
            <button className="btn btn--primary" onClick={() => setShowPurchaseForm(true)}><i className="fas fa-plus"></i> New Purchase</button>
          </div>

          {showPurchaseForm && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="modal__top">
                <h3>New Purchase Entry</h3>
                <button className="btn--icon" onClick={() => setShowPurchaseForm(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
              </div>
              <form onSubmit={handlePurchaseSubmit}>
                <div className="form-row form-row-3">
                  <div className="fg"><label>Supplier Name</label>
                    <input className="fi" placeholder="Supplier name" value={purSupp} onChange={(e) => setPurSupp(e.target.value)} required />
                  </div>
                  <div className="fg"><label>Date</label>
                    <input type="date" className="fi" value={purDate} onChange={(e) => setPurDate(e.target.value)} required />
                  </div>
                  <div className="fg"><label>Payment Mode</label>
                    <select className="fi" value={purMode} onChange={(e) => setPurMode(e.target.value)}>
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                      <option>Credit (Due)</option>
                    </select>
                  </div>
                </div>

                <table className="tbl" style={{ marginBottom: '12px' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th style={{ width: '90px' }}>HSN/SAC</th>
                      <th style={{ width: '70px' }}>Qty</th>
                      <th style={{ width: '100px' }}>Rate ({getCurrencySymbol()})</th>
                      <th style={{ width: '100px' }}>Tax Slab</th>
                      <th style={{ width: '100px' }}>Pricing</th>
                      <th style={{ width: '90px' }}>Tax ({getCurrencySymbol()})</th>
                      <th style={{ width: '100px' }}>Line Total</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purItems.map((item, idx) => {
                      const lineMath = calculateLineItem(item);
                      return (
                        <tr key={idx}>
                          <td>
                            <input
                              list="products-datalist"
                              className="fi"
                              placeholder="Product name"
                              value={item.name}
                              onChange={(e) => handlePurProductNameChange(idx, e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              className="fi"
                              placeholder="HSN"
                              value={item.hsnSac || ''}
                              onChange={(e) => {
                                const copy = [...purItems];
                                copy[idx].hsnSac = e.target.value;
                                setPurItems(copy);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="fi"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const copy = [...purItems];
                                copy[idx].qty = parseInt(e.target.value) || 1;
                                setPurItems(copy);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="fi"
                              placeholder="0"
                              value={item.rate}
                              onChange={(e) => {
                                const copy = [...purItems];
                                copy[idx].rate = parseFloat(e.target.value) || 0;
                                setPurItems(copy);
                              }}
                              required
                            />
                          </td>
                          <td>
                            <select
                              className="fi"
                              value={item.taxSlab || '18%'}
                              onChange={(e) => {
                                const copy = [...purItems];
                                copy[idx].taxSlab = e.target.value;
                                setPurItems(copy);
                              }}
                            >
                              <option value="Exempt">Exempt</option>
                              <option value="0%">0%</option>
                              <option value="5%">5%</option>
                              <option value="12%">12%</option>
                              <option value="18%">18%</option>
                              <option value="28%">28%</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="fi"
                              value={item.isTaxInclusive ? 'inclusive' : 'exclusive'}
                              onChange={(e) => {
                                const copy = [...purItems];
                                copy[idx].isTaxInclusive = e.target.value === 'inclusive';
                                setPurItems(copy);
                              }}
                            >
                              <option value="exclusive">Exclusive</option>
                              <option value="inclusive">Inclusive</option>
                            </select>
                          </td>
                          <td style={{ fontWeight: 500 }}>{fmt(lineMath.taxAmount)}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(lineMath.total)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn--icon"
                              onClick={() => setPurItems(purItems.filter((_, i) => i !== idx))}
                            >
                              <i className="fas fa-trash" style={{ color: 'var(--red)' }}></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button type="button" className="btn btn--sm" onClick={() => setPurItems([...purItems, { name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }])}><i className="fas fa-plus"></i> Add Item</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="fg"><label>Notes / Remarks</label>
                      <textarea className="fi" placeholder="Purchase notes..." value={purNotes} onChange={(e) => setPurNotes(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ width: '320px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {(() => {
                      const t = getPurFormTotals();
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span>Subtotal:</span>
                            <span style={{ fontWeight: 600 }}>{fmt(t.subtotal)}</span>
                          </div>
                          {t.isLocal ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>CGST:</span>
                                <span style={{ fontWeight: 600 }}>{fmt(t.cgst)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>SGST:</span>
                                <span style={{ fontWeight: 600 }}>{fmt(t.sgst)}</span>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                              <span>IGST:</span>
                              <span style={{ fontWeight: 600 }}>{fmt(t.igst)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '6px' }}>
                            <span>Total Tax:</span>
                            <span style={{ fontWeight: 600 }}>{fmt(t.taxAmount)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>
                            <span>Grand Total:</span>
                            <span>{fmt(t.total)}</span>
                          </div>
                        </>
                      );
                    })()}
                    <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}><i className="fas fa-check"></i> Save Purchase</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbData.purchases.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{p.id}</td>
                    <td>{p.supplier}</td>
                    <td style={{ color: 'var(--text-3)' }}>{p.date}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                    <td><span className={`badge ${p.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{p.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn--icon" onClick={() => deletePurchase(p.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== MODULE 4: INVENTORY ==================== */}
      {currentView === 'inventory' && (
        <section className="view active" id="view-inventory">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Inventory Catalog</h2>
              <p>Total Stock Value: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt(dbData.products.reduce((acc, p) => acc + (p.stock * p.price), 0))}</span></p>
            </div>
            <button className="btn btn--primary" onClick={() => setShowProductModal(true)}><i className="fas fa-plus"></i> Add Product</button>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / HSN</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Tax Slab</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbData.products.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-3)' }}>{p.sku} {p.hsnSac ? `(HSN: ${p.hsnSac})` : ''}</td>
                    <td><span className="badge badge--blue">{p.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.stock}</td>
                    <td>{fmt(p.price)}</td>
                    <td><span className="badge badge--purple">{p.taxSlab || '18%'} {p.isTaxInclusive ? '(Inc)' : '(Exc)'}</span></td>
                    <td><span className={`badge ${p.stock <= 5 ? 'badge--red' : 'badge--green'}`}>{p.stock <= 5 ? 'Low Stock' : 'In Stock'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn--icon" onClick={() => deleteProduct(p.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== MODULE 5: PARTIES ==================== */}
      {currentView === 'parties' && (
        <section className="view active" id="view-parties">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Party & Contacts Ledger</h2>
              <p>Manage customer billing limits, supplier balances, and active payment scores.</p>
            </div>
            <button className="btn btn--primary" onClick={() => setShowPartyModal(true)}><i className="fas fa-plus"></i> Add Party</button>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone & State</th>
                  <th>Balance</th>
                  <th>Last Transaction</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbData.parties.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className={`badge ${p.type === 'Customer' ? 'badge--green' : 'badge--blue'}`}>{p.type}</span></td>
                    <td style={{ color: 'var(--text-3)' }}>{p.phone} ({p.state || 'Karnataka'})</td>
                    <td style={{ fontWeight: 600, color: p.balance < 0 ? 'var(--red)' : p.balance > 0 ? 'var(--yellow)' : 'inherit' }}>{fmt(Math.abs(p.balance))} {p.balance < 0 ? '(Due)' : p.balance > 0 ? '(Payable)' : ''}</td>
                    <td style={{ color: 'var(--text-3)' }}>{p.lastTxn}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${p.balance < -50000 ? 'badge--red' : 'badge--green'}`} style={{ marginRight: '8px' }}>Score: {p.balance < -50000 ? 'Poor' : 'Excellent'}</span>
                      <button className="btn--icon" onClick={() => deleteParty(p.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== MODULE 6: FINANCIAL ==================== */}
      {currentView === 'financial' && (
        <section className="view active" id="view-financial">
          <div className="sec-header">
            <h2>Financial Management</h2>
            <p>Track operating stats, tax estimations, and balance assets.</p>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card card--lift">
              <div className="stat__icon stat__icon--g" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-trend-up"></i></div>
              <div className="stat__val">{fmt(profit)}</div>
              <div className="stat__lbl">Net Profit (This Month)</div>
            </div>
            <div className="card card--lift">
              <div className="stat__icon stat__icon--r" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-trend-down"></i></div>
              <div className="stat__val">{fmt(totalPurchases)}</div>
              <div className="stat__lbl">Total Expenses</div>
            </div>
            <div className="card card--lift">
              <div className="stat__icon stat__icon--y" style={{ marginBottom: '14px' }}><i className="fas fa-hand-holding-dollar"></i></div>
              <div className="stat__val">{fmt(cashInHand)}</div>
              <div className="stat__lbl">Cash in Hand</div>
            </div>
          </div>

          <div className="two-col">
            <div className="card chart-area">
              <div className="card__head"><span>Operating Expenses</span></div>
              <div style={{ height: '240px' }}><Doughnut data={expenseChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
            <div className="card">
              <div className="card__head"><span>Pending Receivables / Dues</span></div>
              <div id="fin-dues">
                {dbData.sales.filter(s => s.status === 'Pending').map((s, idx) => (
                  <div className="alert-row" key={idx}>
                    <div style={{ flex: 1 }}><div className="alert-row__name">{s.customer}</div><div className="alert-row__meta">Sale Due ({s.date})</div></div>
                    <span className="badge badge--red">{fmt(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== MODULE 7: TRANSACTIONS ==================== */}
      {currentView === 'transactions' && (
        <section className="view active" id="view-transactions">
          <div className="sec-header">
            <h2>System Ledger Journal</h2>
            <p>Complete double-entry accounting ledger of all purchases and sales.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button className={`btn btn--sm ${txnSubTab === 'flat' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('flat')}>
              <i className="fas fa-list"></i> General Journal
            </button>
            <button className={`btn btn--sm ${txnSubTab === 'tchart' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('tchart')}>
              <i className="fas fa-columns"></i> Double-Entry T-Charts
            </button>
          </div>

          {txnSubTab === 'flat' ? (
            <div className="card">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Txn ID</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th>Debit Account</th>
                    <th>Credit Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                      <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{t.id}</td>
                      <td><span className={`badge ${t.type === 'Sale' ? 'badge--green' : 'badge--blue'}`}>{t.type}</span></td>
                      <td>{t.party}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{t.debitAccount || 'Accounts Receivable (Asset)'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{t.creditAccount || 'Sales Revenue (Income)'}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 600 }}>{t.debit ? fmt(t.debit) : '-'}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{t.credit ? fmt(t.credit) : '-'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(t.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Cash in Hand (Asset)', type: 'Asset' },
                { name: 'Bank Account (Asset)', type: 'Asset' },
                { name: 'Accounts Receivable (Asset)', type: 'Asset' },
                { name: 'Accounts Payable (Liability)', type: 'Liability' },
                { name: 'Sales Revenue (Income)', type: 'Income' },
                { name: 'Cost of Goods Sold (Expense)', type: 'Expense' }
              ].map((acc, aIdx) => {
                const { debits, credits, totalDebit, totalCredit } = (() => {
                  const debits = [];
                  const credits = [];
                  dbData.transactions.forEach(t => {
                    const amount = parseFloat(t.credit || t.debit || 0);
                    if (t.debitAccount === acc.name) {
                      debits.push({ id: t.id, date: t.date, party: t.party, amount });
                    }
                    if (t.creditAccount === acc.name) {
                      credits.push({ id: t.id, date: t.date, party: t.party, amount });
                    }
                  });
                  return {
                    debits,
                    credits,
                    totalDebit: debits.reduce((sum, item) => sum + item.amount, 0),
                    totalCredit: credits.reduce((sum, item) => sum + item.amount, 0)
                  };
                })();
                const balance = acc.type === 'Asset' || acc.type === 'Expense' 
                  ? totalDebit - totalCredit 
                  : totalCredit - totalDebit;
                
                return (
                  <div className="card" key={aIdx} style={{ display: 'flex', flexDirection: 'column', height: '360px', padding: '16px' }}>
                    <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</span>
                      <span className={`badge ${
                        acc.type === 'Asset' ? 'badge--green' :
                        acc.type === 'Liability' ? 'badge--red' :
                        acc.type === 'Income' ? 'badge--blue' : 'badge--yellow'
                      }`}>{acc.type}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
                      {/* Debit side (Left) */}
                      <div style={{ flex: 1, borderRight: '1px solid var(--border)', paddingRight: '8px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--text-3)', borderBottom: '1px dashed var(--border)', paddingBottom: '4px' }}>DEBIT (Dr)</div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                          {debits.map((d, dIdx) => (
                            <div key={dIdx} style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <span style={{ color: 'var(--text-3)' }}>{d.date} | {d.party}</span>
                              <span style={{ fontWeight: 600, color: 'var(--red)', alignSelf: 'flex-end' }}>{fmt(d.amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '4px', textAlign: 'right' }}>
                          Total: {fmt(totalDebit)}
                        </div>
                      </div>
                      
                      {/* Credit side (Right) */}
                      <div style={{ flex: 1, paddingLeft: '8px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--text-3)', borderBottom: '1px dashed var(--border)', paddingBottom: '4px' }}>CREDIT (Cr)</div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                          {credits.map((c, cIdx) => (
                            <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <span style={{ color: 'var(--text-3)' }}>{c.date} | {c.party}</span>
                              <span style={{ fontWeight: 600, color: 'var(--accent)', alignSelf: 'flex-end' }}>{fmt(c.amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '4px', textAlign: 'right' }}>
                          Total: {fmt(totalCredit)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 700 }}>Net Balance:</span>
                      <span style={{ fontWeight: 700, color: balance >= 0 ? 'var(--accent)' : 'var(--red)' }}>{fmt(balance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== MODULE 8: REPORTS ==================== */}
      {currentView === 'reports' && (
        <section className="view active" id="view-reports">
          <div className="sec-header">
            <h2>Reports & AI Advisory</h2>
            <p>System reports and real-time AI strategic suggestions.</p>
          </div>

          <div className="two-col">
            <div className="card chart-area">
              <div className="card__head"><span>Monthly Flow Strategy</span></div>
              <div style={{ height: '240px' }}><Bar data={{
                labels: ['Sales', 'Procurements', 'P&L Margins'],
                datasets: [{
                  label: 'Value',
                  data: [totalSales, totalPurchases, profit],
                  backgroundColor: ['#10b981', '#ef4444', '#6366f1']
                }]
              }} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
            <div className="card">
              <div className="card__head"><span>🤖 AI Advisor Recommendation</span></div>
              <div id="ai-insights">
                <div className="alert-row">
                  <div style={{ flex: 1 }}>
                    <div className="alert-row__name">📈 Sales Velocity Analysis</div>
                    <div className="alert-row__meta">You completed <b>{dbData.sales.length} transactions</b>. Momentum is positive. AI recommends offering bundle values on low velocity accessories.</div>
                  </div>
                </div>
                <div className="alert-row">
                  <div style={{ flex: 1 }}>
                    <div className="alert-row__name">🛡️ Smart Re-ordering</div>
                    <div className="alert-row__meta">{reorderList.length > 0 ? `Stock levels are low for ${reorderList.length} SKUs. Re-order 15 units immediately.` : 'All product catalog levels are optimal. Zero stockout threats.'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== MODULE 9: BUSINESS PROFILE ==================== */}
      {currentView === 'business' && (
        <section className="view active" id="view-business">
          <div className="sec-header">
            <h2>Business Profile & SaaS</h2>
            <p>Update company parameters and manage active plan licensing.</p>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card__head"><span>Corporate parameters</span></div>
              <form onSubmit={handleProfileSave}>
                <div className="fg"><label>Business Name</label>
                  <input className="fi" value={profileForm.bizName} onChange={(e) => setProfileForm({ ...profileForm, bizName: e.target.value })} required />
                </div>
                <div className="form-row">
                  {/* ─── EMAIL ─── */}
                  <div className="fg">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Email Address
                      {isEmailVerified === 1
                        ? <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '1px 8px' }}>✔ Verified</span>
                        : <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '999px', padding: '1px 8px' }}>✗ Unverified</span>
                      }
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="fi" type="email" value={profileForm.email} onChange={(e) => { setProfileForm({ ...profileForm, email: e.target.value }); setEmailOtpMsg(''); setShowEmailOtp(false); }} />
                      <button type="button" className="btn btn--sm" disabled={emailOtpSending || emailOtpCountdown > 0} onClick={() => handleSendOTP('email')} style={{ minWidth: '64px', whiteSpace: 'nowrap' }}>
                        {emailOtpSending ? '…' : emailOtpCountdown > 0 ? `${emailOtpCountdown}s` : isEmailVerified === 1 ? 'Re-verify' : 'Send OTP'}
                      </button>
                    </div>
                    {emailOtpMsg && <p style={{ fontSize: '11.5px', marginTop: '5px', color: emailOtpMsg.startsWith('✅') ? '#10b981' : emailOtpMsg.startsWith('ℹ️') ? '#60a5fa' : '#f87171' }}>{emailOtpMsg}</p>}
                    {showEmailOtp && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                        <input className="fi" placeholder="6-digit OTP" maxLength={6} style={{ width: '130px', letterSpacing: '3px', fontWeight: 600 }} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))} />
                        <button type="button" className="btn btn--sm btn--primary" onClick={() => handleVerifyOTP('email')}>Verify</button>
                        <button type="button" className="btn btn--sm" style={{ opacity: 0.6 }} onClick={() => { setShowEmailOtp(false); setEmailOtpMsg(''); }}>✕</button>
                      </div>
                    )}
                  </div>

                  {/* ─── PHONE ─── */}
                  <div className="fg">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Phone Number
                      {isPhoneVerified === 1
                        ? <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '1px 8px' }}>✔ Verified</span>
                        : <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '999px', padding: '1px 8px' }}>✗ Unverified</span>
                      }
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="fi" type="tel" value={profileForm.phone} onChange={(e) => { setProfileForm({ ...profileForm, phone: e.target.value }); setPhoneOtpMsg(''); setShowPhoneOtp(false); }} placeholder="+91 9876543210" />
                      <button type="button" className="btn btn--sm" disabled={phoneOtpSending || phoneOtpCountdown > 0} onClick={() => handleSendOTP('phone')} style={{ minWidth: '72px', whiteSpace: 'nowrap' }}>
                        {phoneOtpSending ? '…' : phoneOtpCountdown > 0 ? `${phoneOtpCountdown}s` : isPhoneVerified === 1 ? 'Re-verify' : 'Send OTP'}
                      </button>
                    </div>
                    {phoneOtpMsg && <p style={{ fontSize: '11.5px', marginTop: '5px', color: phoneOtpMsg.startsWith('✅') ? '#10b981' : phoneOtpMsg.startsWith('ℹ️') ? '#60a5fa' : '#f87171' }}>{phoneOtpMsg}</p>}
                    {showPhoneOtp && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                        <input className="fi" placeholder="6-digit OTP" maxLength={6} style={{ width: '130px', letterSpacing: '3px', fontWeight: 600 }} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP('phone')} />
                        <button type="button" className="btn btn--sm btn--primary" onClick={() => handleVerifyOTP('phone')}>Verify</button>
                        <button type="button" className="btn btn--sm" style={{ opacity: 0.6 }} onClick={() => { setShowPhoneOtp(false); setPhoneOtpMsg(''); }}>✕</button>
                      </div>
                    )}
                    <p style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: '4px' }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
                      Enter number with +91 prefix. OTP sent via SMS.
                    </p>
                  </div>
                </div>

                <div className="form-row form-row-3">
                  <div className="fg"><label>State</label>
                    <select className="fi" value={profileForm.state || ''} onChange={(e) => handleStateChange(e.target.value)}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>City</label>
                    <select className="fi" value={profileForm.city || ''} onChange={(e) => handleCityChange(e.target.value)}>
                      <option value="">Select City</option>
                      {(STATE_CITY_PINCODES[profileForm.state] || [{ city: `${profileForm.state} Capital`, pincode: "100001" }]).map(c => (
                        <option key={c.city} value={c.city}>{c.city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fg"><label>Pincode</label>
                    <input className="fi" placeholder="Pincode" value={profileForm.pincode || ''} onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="fg">
                    <label>GSTIN Validation</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="fi" placeholder="e.g. 29AABCU9603R1ZM" value={profileForm.gstin} onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })} />
                      <button type="button" className="btn btn--sm" onClick={handleGSTVerify}>Verify</button>
                    </div>
                    {gstStatusMsg && <p style={{ fontSize: '11px', color: isGstVerified === 1 ? '#10b981' : '#ef4444', marginTop: '4px' }}>{gstStatusMsg}</p>}
                  </div>
                  <div className="fg">
                    <label>Base Currency</label>
                    <select className="fi" value={profileForm.currency || 'INR (₹)'} onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}>
                      <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                    </select>
                  </div>
                </div>

                <div className="fg"><label>Office Address</label>
                  <textarea className="fi" rows="2" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>Update Profile</button>
              </form>
            </div>

            <div className="card">
              <div className="card__head"><span>Licensing Details</span></div>
              <div className="sub-card">
                <div className="sub-icon"><i className="fas fa-crown"></i></div>
                <div>
                  <div className="sub-name">{dbData.settings.planName || 'Bronze'} Plan</div>
                  <div className="sub-meta">Renewal: {dbData.settings.subscriptionExpiry || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== MODALS ==================== */}
      {showProductModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000 }}>
          <div className="modal__top">
            <h3>Add New Product</h3>
            <button className="btn--icon" onClick={() => setShowProductModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleProductSubmit}>
            <div className="fg"><label>Product Name</label>
              <input className="fi" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="fg"><label>SKU</label>
                <input className="fi" value={prodForm.sku} onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })} required />
              </div>
              <div className="fg"><label>Category</label>
                <input className="fi" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Stock</label>
                <input type="number" className="fi" value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} required />
              </div>
              <div className="fg"><label>Price ({getCurrencySymbol()})</label>
                <input type="number" className="fi" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} required />
              </div>
            </div>
            <div className="form-row form-row-3">
              <div className="fg"><label>Tax Slab</label>
                <select className="fi" value={prodForm.taxSlab || '18%'} onChange={(e) => setProdForm({ ...prodForm, taxSlab: e.target.value })}>
                  <option value="Exempt">Exempt</option>
                  <option value="0%">0%</option>
                  <option value="5%">5%</option>
                  <option value="12%">12%</option>
                  <option value="18%">18%</option>
                  <option value="28%">28%</option>
                </select>
              </div>
              <div className="fg" style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                  <input type="checkbox" checked={prodForm.isTaxInclusive === true || prodForm.isTaxInclusive === 'true'} onChange={(e) => setProdForm({ ...prodForm, isTaxInclusive: e.target.checked })} />
                  <span>Tax Inclusive</span>
                </label>
              </div>
              <div className="fg"><label>HSN / SAC Code</label>
                <input className="fi" placeholder="e.g. 8471" value={prodForm.hsnSac || ''} onChange={(e) => setProdForm({ ...prodForm, hsnSac: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button type="button" className="btn" onClick={() => setShowProductModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary">Save Product</button>
            </div>
          </form>
        </div>
      )}

      {showPartyModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000 }}>
          <div className="modal__top">
            <h3>Add New Party</h3>
            <button className="btn--icon" onClick={() => setShowPartyModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handlePartySubmit}>
            <div className="fg"><label>Party Name</label>
              <input className="fi" value={partyForm.name} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="fg"><label>Type</label>
                <select className="fi" value={partyForm.type} onChange={(e) => setPartyForm({ ...partyForm, type: e.target.value })}>
                  <option>Customer</option>
                  <option>Supplier</option>
                </select>
              </div>
              <div className="fg"><label>Phone</label>
                <input type="tel" className="fi" value={partyForm.phone} onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Opening Balance ({getCurrencySymbol()})</label>
                <input type="number" className="fi" value={partyForm.balance} onChange={(e) => setPartyForm({ ...partyForm, balance: e.target.value })} />
              </div>
              <div className="fg"><label>State</label>
                <select className="fi" value={partyForm.state || 'Karnataka'} onChange={(e) => setPartyForm({ ...partyForm, state: e.target.value })}>
                  {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button type="button" className="btn" onClick={() => setShowPartyModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary">Save Party</button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Details view modal */}
      {activeInvoice && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '640px' }}>
          <div className="modal__top">
            <h3>Invoice Details</h3>
            <button className="btn--icon" onClick={() => setActiveInvoice(null)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div className="invoice-simple print-area" style={{ background: '#fff', padding: '16px', color: '#1e293b', borderRadius: '8px' }}>
            <div className="inv-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div className="brand" style={{ fontWeight: 800, color: 'var(--blue)' }}><i className="fas fa-cube"></i> Vyapar</div>
              <div className="inv-title" style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>Sales Invoice</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{activeInvoice.id} | {activeInvoice.date}</div>
              </div>
            </div>
            <div className="inv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div><strong>Billed To:</strong><br />{activeInvoice.customer}</div>
              <div><strong>Payment Details:</strong><br />Mode: {activeInvoice.mode}<br />Status: {activeInvoice.status}</div>
            </div>
            <table className="inv-items" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Item Details</th>
                  <th style={{ textAlign: 'left', padding: '8px', width: '80px' }}>HSN/SAC</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '50px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '90px' }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '70px' }}>Tax Slab</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '80px' }}>Tax Amt</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '100px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {activeInvoice.items ? (
                  activeInvoice.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '8px', color: '#64748b' }}>{item.hsnSac || '-'}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{fmt(item.rate)}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{item.taxSlab || '18%'}</td>
                      <td style={{ textAlign: 'right', padding: '8px', color: '#64748b' }}>{fmt(item.taxAmount || 0)}</td>
                      <td style={{ textAlign: 'right', padding: '8px', fontWeight: 600 }}>{fmt(item.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>Sales Item — {activeInvoice.id}</td>
                    <td style={{ padding: '8px' }}>-</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>1</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{fmt(activeInvoice.amount)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>18%</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{fmt(activeInvoice.amount * 0.18 / 1.18)}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: 600 }}>{fmt(activeInvoice.amount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderTop: '2px solid #cbd5e1', paddingTop: '12px' }}>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>Subtotal:</span>
                <span>{fmt(activeInvoice.subtotal || activeInvoice.amount / 1.18)}</span>
              </div>
              {activeInvoice.cgst !== undefined && activeInvoice.cgst > 0 ? (
                <>
                  <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span>CGST:</span>
                    <span>{fmt(activeInvoice.cgst)}</span>
                  </div>
                  <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span>SGST:</span>
                    <span>{fmt(activeInvoice.sgst)}</span>
                  </div>
                </>
              ) : activeInvoice.igst !== undefined && activeInvoice.igst > 0 ? (
                <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                  <span>IGST:</span>
                  <span>{fmt(activeInvoice.igst)}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                  <span>GST (18%):</span>
                  <span>{fmt(activeInvoice.amount * 0.18 / 1.18)}</span>
                </div>
              )}
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '6px', fontSize: '16px', fontWeight: 700 }}>
                <span>Grand Total:</span>
                <span>{fmt(activeInvoice.amount)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button className="btn" onClick={() => setActiveInvoice(null)}>Close</button>
            <button className="btn btn--primary" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
          </div>
        </div>
      )}

      <datalist id="products-datalist">
        {dbData.products.map(p => (
          <option key={p.id} value={p.name}>{p.name} (Stock: {p.stock} | Price: {fmt(p.price)})</option>
        ))}
      </datalist>

      {(showProductModal || showPartyModal || activeInvoice) && <div className="overlay" style={{ display: 'block', zIndex: 999 }}></div>}
    </>
  );
}
