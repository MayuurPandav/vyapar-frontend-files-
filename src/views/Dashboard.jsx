import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import PaginatedList from '../components/PaginatedList';
import * as XLSX from 'xlsx';
import AnimatedNumber from '../components/AnimatedNumber';
import Staff from './Staff';
import Subscription from './Subscription';
import Invoices from './Invoices';
import Settings from './Settings';
import QRCode from 'qrcode.react';
import BarcodeScannerCamera from './staff/components/BarcodeScannerCamera';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
  ArcElement
);
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

const INDIAN_STATES = Object.keys(STATE_CITY_PINCODES);

export default function Dashboard({ globalSearch = '' }) {
  const [tsPeriod, setTsPeriod] = useState('monthly');
  const [useServerPaginationSales, setUseServerPaginationSales] = useState(false);
  const [useServerPaginationPurchases, setUseServerPaginationPurchases] = useState(false);
  const [useServerPaginationInventory, setUseServerPaginationInventory] = useState(false);
  const [useServerPaginationParties, setUseServerPaginationParties] = useState(false);
  const { currentView, setCurrentView, dbData, setDbData, saveDB, viewOnly, user } = useApp();
  const { loadDB } = useApp();
  
  const getPurchaseAmount = (p) => {
    const type = p.purchaseType || 'Purchase Invoice';
    if (type === 'Purchase Order') return 0;
    if (type === 'Purchase Return' || type === 'Debit Note') return -(parseFloat(p.amount) || 0);
    return parseFloat(p.amount) || 0;
  };

  // Dashboard Metrics
  const totalSales = dbData.sales.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalPurchases = dbData.purchases.filter(p => p.active !== false).reduce((sum, item) => sum + getPurchaseAmount(item), 0);
  const profit = totalSales - totalPurchases;

  // Expense Reports calculations
  const totalExpenses = (dbData.expenses || [])
    .filter(exp => !exp.isRecurringTemplate)
    .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  const expenseByCategory = (dbData.expenses || [])
    .filter(exp => !exp.isRecurringTemplate)
    .reduce((acc, exp) => {
      const cat = exp.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (parseFloat(exp.amount) || 0);
      return acc;
    }, {});

  const expenseByMonth = (dbData.expenses || [])
    .filter(exp => !exp.isRecurringTemplate)
    .reduce((acc, exp) => {
      const month = exp.date ? exp.date.substring(0, 7) : 'Unknown';
      acc[month] = (acc[month] || 0) + (parseFloat(exp.amount) || 0);
      return acc;
    }, {});

  const salesByMonth = dbData.sales.reduce((acc, s) => {
    const month = s.date ? s.date.substring(0, 7) : 'Unknown';
    acc[month] = (acc[month] || 0) + (parseFloat(s.amount) || 0);
    return acc;
  }, {});

  const allMonthsSet = new Set([
    ...Object.keys(expenseByMonth),
    ...Object.keys(salesByMonth)
  ]);
  const sortedMonths = Array.from(allMonthsSet).sort().filter(m => m !== 'Unknown');
  
  const getCashInHand = () => {
    return dbData.transactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0) - (parseFloat(t.debit) || 0), 0);
  };
  const cashInHand = getCashInHand();

  // Additional Admin Metrics
  const totalPendingReceivables = dbData.sales
    .filter(s => (s.status || '').toLowerCase() === 'pending')
    .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  const purchasesPendingSum = dbData.purchases
    .filter(p => p.active !== false && (p.status || '').toLowerCase() === 'pending')
    .reduce((sum, p) => sum + getPurchaseAmount(p), 0);

  const suppliersOutstanding = dbData.parties
    .filter(p => (p.type || '').toLowerCase() === 'supplier')
    .reduce((sum, p) => sum + (parseFloat(p.balance) > 0 ? parseFloat(p.balance) : 0), 0);

  const totalOutstandingPayables = purchasesPendingSum + suppliersOutstanding;

  // Calculate effective stock by checking active PO quantities
  const activePOsForMetrics = (dbData.purchases || []).filter(p => p.active !== false && p.purchaseType === 'Purchase Order');
  const orderedQtyMapForMetrics = {};
  activePOsForMetrics.forEach(po => {
    if (Array.isArray(po.items)) {
      po.items.forEach(item => {
        if (item.name) {
          const key = item.name.trim().toLowerCase();
          orderedQtyMapForMetrics[key] = (orderedQtyMapForMetrics[key] || 0) + (Number(item.qty) || 0);
        }
        if (item.sku) {
          const key = item.sku.trim().toLowerCase();
          orderedQtyMapForMetrics[key] = (orderedQtyMapForMetrics[key] || 0) + (Number(item.qty) || 0);
        }
      });
    }
  });

  const getEffectiveStockForMetrics = (p) => {
    const pName = (p.name || '').trim().toLowerCase();
    const pSku = (p.sku || '').trim().toLowerCase();
    const orderedQty = (orderedQtyMapForMetrics[pName] || 0) || (pSku ? (orderedQtyMapForMetrics[pSku] || 0) : 0);
    return (Number(p.stock) || 0) + orderedQty;
  };

  const outOfStockCount = dbData.products.filter(p => p.active !== false && getEffectiveStockForMetrics(p) <= 0).length;
  const lowStockAlertsCount = dbData.products.filter(p => p.active !== false && getEffectiveStockForMetrics(p) <= (parseInt(p.lowStockLevel) || 5)).length;

  const deliveryStatusSummary = dbData.sales.reduce((acc, s) => {
    const status = (s.deliveryStatus || s.status || 'unknown').toLowerCase();
    if (status.includes('cancel')) acc.cancelled += 1;
    else if (status.includes('pending')) acc.pending += 1;
    else acc.completed += 1;
    return acc;
  }, { pending: 0, completed: 0, cancelled: 0 });

  // Top customers by sales value
  const topCustomers = Object.entries(dbData.sales.reduce((map, s) => {
    const name = s.customer || 'Unknown';
    map[name] = (map[name] || 0) + (parseFloat(s.amount) || 0);
    return map;
  }, {})).map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  // Period based metrics (today / week / month)
  const parseDate = (d) => {
    if (!d) return new Date(0);
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return new Date(d + 'T00:00:00');
    return dt;
  };
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - 6);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const salesToday = dbData.sales.filter(s => parseDate(s.date) >= startOfDay).reduce((a,b)=>a + (parseFloat(b.amount)||0), 0);
  const salesWeek = dbData.sales.filter(s => parseDate(s.date) >= startOfWeek).reduce((a,b)=>a + (parseFloat(b.amount)||0), 0);
  const salesMonth = dbData.sales.filter(s => parseDate(s.date) >= startOfMonth).reduce((a,b)=>a + (parseFloat(b.amount)||0), 0);

  const expensesToday = dbData.purchases.filter(p => p.active !== false && parseDate(p.date) >= startOfDay).reduce((a,b)=>a + getPurchaseAmount(b), 0);
  const expensesMonth = dbData.purchases.filter(p => p.active !== false && parseDate(p.date) >= startOfMonth).reduce((a,b)=>a + getPurchaseAmount(b), 0);

  const recentInvoicesList = dbData.sales
    .slice()
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, 5);

  const cashIn = dbData.transactions.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);
  const cashOut = dbData.transactions.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0);

  const totalCustomers = dbData.parties.filter(p => (p.type || '').toLowerCase() === 'customer').length;
  const totalSuppliers = dbData.parties.filter(p => (p.type || '').toLowerCase() === 'supplier').length;

  // Top selling products (from sales items)
  const productSalesMap = {};
  dbData.sales.forEach(s => {
    (s.items || []).forEach(it => {
      const name = it.name || it.item || 'Unknown';
      const qty = parseFloat(it.qty) || 0;
      const amt = parseFloat(it.total) || parseFloat(it.amount) || 0;
      if (!productSalesMap[name]) productSalesMap[name] = { qty: 0, revenue: 0 };
      productSalesMap[name].qty += qty;
      productSalesMap[name].revenue += amt;
    });
  });
  const topSelling = Object.entries(productSalesMap).map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue })).sort((a,b)=>b.revenue-a.revenue).slice(0,10);

  const topSellingChartData = {
    labels: topSelling.map(t => t.name),
    datasets: [{ label: 'Revenue', data: topSelling.map(t => Math.round(t.revenue)), backgroundColor: '#4f46e5' }]
  };

  // 1. Daily Revenue Chart Data (Last 7 days)
  const getDailyRevenueData = () => {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const salesForDay = dbData.sales.filter(s => {
        if (!s.date) return false;
        try {
          const sDate = parseDate(s.date);
          return sDate.getFullYear() === d.getFullYear() &&
                 sDate.getMonth() === d.getMonth() &&
                 sDate.getDate() === d.getDate();
        } catch {
          return false;
        }
      });
      const totalForDay = salesForDay.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      labels.push(label);
      data.push(Math.round(totalForDay));
    }
    return { labels, data };
  };

  // 2. Weekly Revenue Chart Data (Last 4 weeks)
  const getWeeklyRevenueData = () => {
    const labels = [];
    const data = [];
    for (let i = 3; i >= 0; i--) {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() - (i * 7));
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(endOfWeek.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setHours(23, 59, 59, 999);
      const salesForWeek = dbData.sales.filter(s => {
        if (!s.date) return false;
        try {
          const sDate = parseDate(s.date);
          return sDate >= startOfWeek && sDate <= endOfWeek;
        } catch {
          return false;
        }
      });
      const totalForWeek = salesForWeek.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      const label = `${startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
      labels.push(label);
      data.push(Math.round(totalForWeek));
    }
    return { labels, data };
  };

  // 3. Monthly Revenue Chart Data (Last 6 months)
  const getMonthlyRevenueData = () => {
    const labels = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const salesForMonth = dbData.sales.filter(s => {
        if (!s.date) return false;
        try {
          const sDate = parseDate(s.date);
          return sDate.getFullYear() === d.getFullYear() && sDate.getMonth() === d.getMonth();
        } catch {
          return false;
        }
      });
      const totalForMonth = salesForMonth.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      labels.push(label);
      data.push(Math.round(totalForMonth));
    }
    return { labels, data };
  };

  const [revenueChartPeriod, setRevenueChartPeriod] = useState('daily');

  const revenueChartData = useMemo(() => {
    let result = { labels: [], data: [] };
    if (revenueChartPeriod === 'daily') {
      result = getDailyRevenueData();
    } else if (revenueChartPeriod === 'weekly') {
      result = getWeeklyRevenueData();
    } else {
      result = getMonthlyRevenueData();
    }
    return {
      labels: result.labels,
      datasets: [
        {
          label: 'Revenue',
          data: result.data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [dbData.sales, revenueChartPeriod]);

  // Modals / Form toggles
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [dashboardDetailType, setDashboardDetailType] = useState(null); // 'profit', 'receivables', 'payables', 'expensesToday', 'expensesMonth', 'customers', 'suppliers', 'lowStock', 'outOfStock', 'salesToday', 'salesWeek', 'salesMonth'
  const [detailModalTab, setDetailModalTab] = useState('sales'); // for modal tab switching (e.g. sales/purchases, invoices/suppliers)
  const [partyModalTab, setPartyModalTab] = useState('basic');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [txnSubTab, setTxnSubTab] = useState('flat'); // 'flat' or 'tchart'

  // Advanced inventory states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('audit'); // 'audit', 'damaged', 'returned', 'theft', 'other'

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProduct, setTransferProduct] = useState(null);
  const [transferQty, setTransferQty] = useState(1);
  const [transferTargetBranch, setTransferTargetBranch] = useState('');
  const [selectedTransferSerials, setSelectedTransferSerials] = useState([]);
  const [showMultiLocationModal, setShowMultiLocationModal] = useState(false);
  const [serialSelectRowIdx, setSerialSelectRowIdx] = useState(null);
  const [serialSelectTempList, setSerialSelectTempList] = useState([]);
  const [selectedAdjustSerials, setSelectedAdjustSerials] = useState([]);
  const [adjustSerialsText, setAdjustSerialsText] = useState('');
  const [physicalSerials, setPhysicalSerials] = useState({});

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [showSalesCamera, setShowSalesCamera] = useState(false);
  const [showPurchaseCamera, setShowPurchaseCamera] = useState(false);
  const [showInventoryCamera, setShowInventoryCamera] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState({}); // mapping product.sku -> count

  const [txFilter, setTxFilter] = useState('');

  const [showCatBrandModal, setShowCatBrandModal] = useState(false);
  const [customCats, setCustomCats] = useState(['Electronics', 'Clothing', 'Grocery', 'Services', 'Hardware', 'Other']);
  const [customBrands, setCustomBrands] = useState(['Samsung', 'Nike', 'Apple', 'Generic']);
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Form states
  const [prodForm, setProdForm] = useState({
    name: '', sku: '', category: 'Electronics', stock: 0, price: 0, notes: '', image: '', taxSlab: '18%', isTaxInclusive: false, hsnSac: '',
    barcode: '', subCategory: '', brand: '', unit: 'pcs', purchasePrice: 0, wholesalePrice: 0,
    lowStockLevel: 5, expiryDate: '', description: '', rackLocation: '', godownName: '', serialNumber: '', batchNumber: '',
    isBatchTracked: false, batches: []
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingParty, setEditingParty] = useState(null);
  const [partyForm, setPartyForm] = useState({ 
    name: '', type: 'Customer', phone: '+91 ', balance: 0, notes: '', state: 'Karnataka',
    email: '', whatsappNumber: '', billingAddress: '', shippingAddress: '', gstin: '', pan: '', 
    customerGroup: 'Retail', creditLimit: 0, paymentTerms: 'Net 30', openingBalance: 0, bankDetails: ''
  });
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedStatementParty, setSelectedStatementParty] = useState(null);
  const [statementTab, setStatementTab] = useState('overview');
  const [reminderMessage, setReminderMessage] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('All');
  const [dayBookDate, setDayBookDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [bookSearch, setBookSearch] = useState('');
  const [bookStartDate, setBookStartDate] = useState('');
  const [bookEndDate, setBookEndDate] = useState('');

  // Custom Accounting & Journal States
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({ date: new Date().toISOString().substring(0, 10), description: '', debitAccount: '', creditAccount: '', amount: '' });
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: '', type: 'Expense', description: '', openingBalance: 0 });
  const [editingAccount, setEditingAccount] = useState(null);

  // Bank Account Management States
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ accountName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', openingBalance: 0 });
  const [editingBank, setEditingBank] = useState(null);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferForm, setBankTransferForm] = useState({ date: new Date().toISOString().substring(0, 10), fromAccount: '', toAccount: '', amount: '', referenceNo: '', description: '' });
  const [reconBankId, setReconBankId] = useState('');
  const [reconStatementBalance, setReconStatementBalance] = useState('');
  const [reconStatementDate, setReconStatementDate] = useState(new Date().toISOString().substring(0, 10));
  const [showReconView, setShowReconView] = useState(false);

  // Cheque Management & Petty Cash States
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [chequeForm, setChequeForm] = useState({ chequeNumber: '', bankName: '', issueDate: new Date().toISOString().substring(0, 10), dueDate: new Date().toISOString().substring(0, 10), partyName: '', amount: '', type: 'Received', bankAccountId: '', notes: '' });
  const [editingCheque, setEditingCheque] = useState(null);
  const [showBounceModal, setShowBounceModal] = useState(false);
  const [bounceForm, setBounceForm] = useState({ chequeId: '', bounceCharge: 0, date: new Date().toISOString().substring(0, 10) });
  const [chequeFilterStatus, setChequeFilterStatus] = useState('All');
  const [bankSubTab, setBankSubTab] = useState('accounts'); // 'accounts', 'cheques'
  const [showPettyTopupModal, setShowPettyTopupModal] = useState(false);
  const [pettyTopupForm, setPettyTopupForm] = useState({ date: new Date().toISOString().substring(0, 10), sourceAccount: '', amount: '', notes: '' });
  const [showPettyExpenseModal, setShowPettyExpenseModal] = useState(false);
  const [pettyExpenseForm, setPettyExpenseForm] = useState({ date: new Date().toISOString().substring(0, 10), category: '', amount: '', notes: '' });

  // Sales Form items builder
  const [saleItems, setSaleItems] = useState([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '' }]);
  const [saleCust, setSaleCust] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [saleMode, setSaleMode] = useState('Cash');
  const [saleNotes, setSaleNotes] = useState('');
  const [saleDiscountCode, setSaleDiscountCode] = useState('');
  const [salePaidAmount, setSalePaidAmount] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);

  const calculateOfferDiscount = (offer, items, total, customerName) => {
    if (!offer) return 0;
    if (total < (offer.minBillAmount || 0)) return 0;
    const today = new Date().toISOString().substring(0, 10);
    if (offer.startDate && today < offer.startDate) return 0;
    if (offer.endDate && today > offer.endDate) return 0;
    if (offer.usageLimit > 0 && (offer.usedCount || 0) >= offer.usageLimit) return 0;

    // Specific Customer validation
    if (offer.applicableCustomer && offer.applicableCustomer.trim()) {
      if (!customerName || customerName.trim().toLowerCase() !== offer.applicableCustomer.trim().toLowerCase()) {
        return 0;
      }
    }

    // Specific Customer Group validation
    if (offer.applicableCustomerGroup && offer.applicableCustomerGroup.trim()) {
      const party = dbData.parties.find(p => p.name.trim().toLowerCase() === (customerName || '').trim().toLowerCase());
      const customerGroup = party?.customerGroup || 'Retail';
      if (customerGroup.trim().toLowerCase() !== offer.applicableCustomerGroup.trim().toLowerCase()) {
        return 0;
      }
    }

    // Specific Products and Categories filtering
    let applicableItems = items;
    let applicableTotal = total;
    const targetProduct = (offer.applicableProduct || '').trim().toLowerCase();
    const targetCategory = (offer.applicableCategory || '').trim().toLowerCase();

    if (targetProduct || targetCategory) {
      applicableItems = items.filter(item => {
        const prodMatch = !targetProduct || (item.name && item.name.trim().toLowerCase() === targetProduct);
        let catMatch = true;
        if (targetCategory) {
          const productInfo = dbData.products.find(p => p.name.trim().toLowerCase() === (item.name || '').trim().toLowerCase());
          const itemCategory = productInfo?.category || '';
          catMatch = itemCategory.trim().toLowerCase() === targetCategory;
        }
        return prodMatch && catMatch;
      });

      applicableTotal = applicableItems.reduce((acc, item) => {
        const qty = parseInt(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        const lineTotal = item.total !== undefined ? item.total : (qty * rate);
        return acc + lineTotal;
      }, 0);

      if (applicableItems.length === 0) return 0;
    }

    if (offer.type === 'Percentage') {
      return (applicableTotal * (offer.value || 0)) / 100;
    } else if (offer.type === 'Flat Discount') {
      return Math.min(offer.value || 0, applicableTotal);
    } else if (offer.type === 'BOGO') {
      const targetName = (offer.applicableProduct || '').trim().toLowerCase();
      if (!targetName) return 0;
      const matchedItem = items.find(item => item.name && item.name.trim().toLowerCase() === targetName);
      if (!matchedItem) return 0;
      const qty = parseInt(matchedItem.qty) || 0;
      const rate = parseFloat(matchedItem.rate) || 0;
      const buyQty = parseInt(offer.buyQty) || 0;
      const getQty = parseInt(offer.getQty) || 0;
      if (qty >= buyQty && buyQty > 0 && getQty > 0) {
        const discount = Math.floor(qty / buyQty) * getQty * rate;
        return Math.min(discount, qty * rate);
      }
      return 0;
    } else if (offer.type === 'Bundle') {
      const bundleProds = offer.bundleProducts || [];
      if (bundleProds.length === 0) return 0;
      const allPresent = bundleProds.every(bpName => {
        const cleanedBpName = bpName.trim().toLowerCase();
        return items.some(item => 
          item.name && 
          item.name.trim().toLowerCase() === cleanedBpName && 
          (parseInt(item.qty) || 0) >= 1
        );
      });
      if (allPresent) {
        return (applicableTotal * (offer.value || 0)) / 100;
      }
      return 0;
    } else if (offer.type === 'Seasonal') {
      return (applicableTotal * (offer.value || 0)) / 100;
    }
    return 0;
  };

  const calculateOfferPerformance = () => {
    const offers = dbData.offers || [];
    const sales = dbData.sales || [];
    let totalDiscountGiven = 0;
    let totalRevenueWithOffers = 0;
    let totalOfferUsage = 0;

    const offerStats = offers.map(o => {
      const matchingSales = sales.filter(s => s.discountCode && s.discountCode.toUpperCase() === o.code.toUpperCase());
      const revenue = matchingSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      const discount = matchingSales.reduce((sum, s) => sum + (Number(s.discountAmount) || 0), 0);
      totalDiscountGiven += discount;
      totalRevenueWithOffers += revenue;
      totalOfferUsage += matchingSales.length;
      return {
        ...o,
        usageCount: matchingSales.length,
        revenueGenerated: revenue,
        discountGiven: discount
      };
    });

    return {
      stats: offerStats,
      totalDiscountGiven,
      totalRevenueWithOffers,
      totalOfferUsage
    };
  };

  // Purchase Form items builder
  const [purItems, setPurItems] = useState([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '', discount: 0, unit: 'pcs' }]);
  const [purSupp, setPurSupp] = useState('');
  const [purDate, setPurDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [purMode, setPurMode] = useState('Cash');
  const [purNotes, setPurNotes] = useState('');
  const [purType, setPurType] = useState('Purchase Invoice');
  const [purAdditionalCharges, setPurAdditionalCharges] = useState(0);
  const [purDueDate, setPurDueDate] = useState('');
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('All');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('All');
  const [purchaseActiveFilter, setPurchaseActiveFilter] = useState('Active');
  const [inventorySearch, setInventorySearch] = useState('');
  const [productActiveFilter, setProductActiveFilter] = useState('Active');
  const [purchaseReportData, setPurchaseReportData] = useState(null);
  const [productAlerts, setProductAlerts] = useState({ outOfStock: [], lowStock: [], expired: [], expiringSoon: [] });

  // Verification & Profile forms
  const [settingsTab, setSettingsTab] = useState('general');
  const [finTab, setFinTab] = useState('overview');
  const [gstTab, setGstTab] = useState('gstr1');
  const [gstMonth, setGstMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [isManualTaxSplit, setIsManualTaxSplit] = useState(false);
  const [manualTaxType, setManualTaxType] = useState('Local');
  const [isManualPurTaxSplit, setIsManualPurTaxSplit] = useState(false);
  const [manualPurTaxType, setManualPurTaxType] = useState('Local');
  const [editingHsnProductId, setEditingHsnProductId] = useState(null);
  const [editingHsnVal, setEditingHsnVal] = useState('');
  const [editingHsnTaxSlab, setEditingHsnTaxSlab] = useState('18%');
  const [hsnSearch, setHsnSearch] = useState('');
  const [ewayForm, setEwayForm] = useState({ invoiceId: '', transporterId: '', vehicleNo: '', distance: '', hsnCode: '' });
  const [generatedEway, setGeneratedEway] = useState(null);
  const [tdsForm, setTdsForm] = useState({ partyName: '', section: '194C', amount: '', narration: '' });
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ 
    date: new Date().toISOString().substring(0, 10), 
    category: 'Rent', 
    amount: 0, 
    paymentMode: 'Cash', 
    description: '',
    receipt: '',
    isRecurringTemplate: false,
    frequency: 'Monthly',
    nextOccurrenceDate: '',
    isActive: true
  });
  const [expenseTab, setExpenseTab] = useState('all');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [reportsTab, setReportsTab] = useState('general');
  const [staffList, setStaffList] = useState([]);
  const [salesReportPeriod, setSalesReportPeriod] = useState('monthly'); // daily | weekly | monthly | yearly
  const [salesReportStart, setSalesReportStart] = useState('');
  const [salesReportEnd, setSalesReportEnd] = useState('');
  const [purchaseReportStart, setPurchaseReportStart] = useState('');
  const [purchaseReportEnd, setPurchaseReportEnd] = useState('');
  const [innerInventoryTab, setInnerInventoryTab] = useState('summary');

  useEffect(() => {
    loadDB();
  }, []);

  useEffect(() => {
    if (currentView === 'reports' && user) {
      fetch(`/api/staff?username=${encodeURIComponent(user.username)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setStaffList(data);
        })
        .catch(err => console.error('Error fetching staff list for reports:', err));
    }
  }, [currentView, user]);

  const salesReportData = useMemo(() => {
    if (!dbData.sales) {
      return {
        filteredSales: [],
        summary: { totalRevenue: 0, invoiceCount: 0, avgInvoiceValue: 0, grossProfit: 0 },
        timeData: { labels: [], values: [] },
        productData: [],
        categoryData: [],
        customerData: [],
        staffData: [],
        modeData: []
      };
    }

    // 1. Filter by date range
    const filteredSales = dbData.sales.filter(sale => {
      if (!sale.date) return false;
      const sDate = sale.date.substring(0, 10);
      if (salesReportStart && sDate < salesReportStart) return false;
      if (salesReportEnd && sDate > salesReportEnd) return false;
      return true;
    });

    // 2. Summary stats
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const invoiceCount = filteredSales.length;
    const avgInvoiceValue = invoiceCount > 0 ? (totalRevenue / invoiceCount) : 0;
    
    // Profit margin calculation:
    // Look up purchasePrice in dbData.products. Fallback to 70% of rate.
    const productPriceMap = {};
    if (dbData.products) {
      dbData.products.forEach(p => {
        productPriceMap[p.name.toLowerCase()] = Number(p.purchasePrice || p.price * 0.7 || 0);
      });
    }

    let totalCostOfGoods = 0;
    filteredSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const costRate = productPriceMap[item.name.toLowerCase()] || (Number(item.rate) * 0.7);
          totalCostOfGoods += costRate * (Number(item.qty) || 0);
        });
      } else {
        totalCostOfGoods += (Number(sale.amount) * 0.7);
      }
    });
    const grossProfit = totalRevenue - totalCostOfGoods;

    // 3. Chronological grouping by period (salesReportPeriod)
    const timeGroups = {};
    filteredSales.forEach(sale => {
      const dateVal = new Date(sale.date);
      let key = '';
      if (salesReportPeriod === 'daily') {
        key = sale.date.substring(0, 10); // YYYY-MM-DD
      } else if (salesReportPeriod === 'weekly') {
        const dayOfWeek = dateVal.getDay();
        const startOfWeek = new Date(dateVal);
        startOfWeek.setDate(dateVal.getDate() - dayOfWeek);
        key = `W/C ${startOfWeek.toISOString().substring(0, 10)}`;
      } else if (salesReportPeriod === 'yearly') {
        key = String(dateVal.getFullYear());
      } else {
        key = sale.date.substring(0, 7); // YYYY-MM
      }
      timeGroups[key] = (timeGroups[key] || 0) + (Number(sale.amount) || 0);
    });

    const sortedTimeLabels = Object.keys(timeGroups).sort();
    const sortedTimeValues = sortedTimeLabels.map(lbl => timeGroups[lbl]);

    // 4. Product-wise sales
    const productMap = {};
    filteredSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const name = item.name || 'Unknown Product';
          const qty = Number(item.qty) || 0;
          const rev = Number(item.total || (item.qty * item.rate) || 0);
          if (!productMap[name]) {
            productMap[name] = { product: name, qty: 0, revenue: 0 };
          }
          productMap[name].qty += qty;
          productMap[name].revenue += rev;
        });
      }
    });
    const productData = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    // 5. Category-wise sales
    const categoryMap = {};
    const productCatMap = {};
    if (dbData.products) {
      dbData.products.forEach(p => {
        productCatMap[p.name.toLowerCase()] = p.category || 'General';
      });
    }
    filteredSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const cat = productCatMap[item.name.toLowerCase()] || 'General';
          const rev = Number(item.total || (item.qty * item.rate) || 0);
          const qty = Number(item.qty) || 0;
          if (!categoryMap[cat]) {
            categoryMap[cat] = { category: cat, qty: 0, revenue: 0 };
          }
          categoryMap[cat].qty += qty;
          categoryMap[cat].revenue += rev;
        });
      }
    });
    const categoryData = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    // 6. Customer-wise sales
    const customerMap = {};
    filteredSales.forEach(sale => {
      const custName = sale.customer || 'Walk-in Customer';
      const amt = Number(sale.amount) || 0;
      if (!customerMap[custName]) {
        customerMap[custName] = { customer: custName, invoiceCount: 0, revenue: 0 };
      }
      customerMap[custName].invoiceCount += 1;
      customerMap[custName].revenue += amt;
    });
    const customerData = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue);

    // 7. Staff-wise sales
    const staffMap = {};
    const staffIdNameMap = {};
    if (staffList) {
      staffList.forEach(s => {
        staffIdNameMap[s._id] = s.name;
        staffIdNameMap[s.username] = s.name;
      });
    }
    filteredSales.forEach(sale => {
      const creatorKey = typeof sale.createdBy === 'object' ? sale.createdBy?._id : (sale.createdBy || sale.username || 'Admin');
      const staffName = sale.createdBy?.name || staffIdNameMap[creatorKey] || (creatorKey === user?.username || creatorKey === 'Admin' ? 'Self (Admin)' : creatorKey);
      const amt = Number(sale.amount) || 0;
      if (!staffMap[staffName]) {
        staffMap[staffName] = { staff: staffName, invoiceCount: 0, revenue: 0 };
      }
      staffMap[staffName].invoiceCount += 1;
      staffMap[staffName].revenue += amt;
    });
    const staffData = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue);

    // 8. Payment mode-wise sales
    const modeMap = {};
    filteredSales.forEach(sale => {
      const mode = sale.mode || 'Cash';
      const amt = Number(sale.amount) || 0;
      if (!modeMap[mode]) {
        modeMap[mode] = { mode, transactions: 0, revenue: 0 };
      }
      modeMap[mode].transactions += 1;
      modeMap[mode].revenue += amt;
    });
    const modeData = Object.values(modeMap).sort((a, b) => b.revenue - a.revenue);

    return {
      filteredSales,
      summary: { totalRevenue, invoiceCount, avgInvoiceValue, grossProfit },
      timeData: { labels: sortedTimeLabels, values: sortedTimeValues },
      productData,
      categoryData,
      customerData,
      staffData,
      modeData
    };
  }, [dbData.sales, dbData.products, staffList, salesReportPeriod, salesReportStart, salesReportEnd, user]);

  const purchaseReportsAggData = useMemo(() => {
    if (!dbData.purchases) {
      return {
        filteredPurchases: [],
        summary: { totalProcurement: 0, orderCount: 0, avgPurchaseValue: 0, activeSuppliers: 0 },
        timeData: { labels: [], values: [] },
        supplierData: [],
        productData: []
      };
    }

    // 1. Filter by date range
    const filteredPurchases = dbData.purchases.filter(p => {
      if (!p.date) return false;
      const pDate = p.date.substring(0, 10);
      if (purchaseReportStart && pDate < purchaseReportStart) return false;
      if (purchaseReportEnd && pDate > purchaseReportEnd) return false;
      return true;
    });

    // 2. Summary stats
    const totalProcurement = filteredPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const orderCount = filteredPurchases.length;
    const avgPurchaseValue = orderCount > 0 ? (totalProcurement / orderCount) : 0;

    // 3. Supplier-wise aggregation
    const supplierMap = {};
    filteredPurchases.forEach(p => {
      const sup = p.supplier || 'Generic Supplier';
      const amt = Number(p.amount) || 0;
      if (!supplierMap[sup]) {
        supplierMap[sup] = { supplier: sup, invoiceCount: 0, totalAmount: 0 };
      }
      supplierMap[sup].invoiceCount += 1;
      supplierMap[sup].totalAmount += amt;
    });
    const supplierData = Object.values(supplierMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const activeSuppliers = supplierData.length;

    // 4. Product-wise aggregation
    const productMap = {};
    filteredPurchases.forEach(p => {
      if (p.items && Array.isArray(p.items)) {
        p.items.forEach(item => {
          const name = item.name || 'Unknown Product';
          const qty = Number(item.qty) || 0;
          const totalCost = Number(item.total || (item.qty * item.rate) || 0);
          if (!productMap[name]) {
            productMap[name] = { product: name, qty: 0, totalCost: 0 };
          }
          productMap[name].qty += qty;
          productMap[name].totalCost += totalCost;
        });
      }
    });
    const productData = Object.values(productMap).sort((a, b) => b.totalCost - a.totalCost);

    // 5. Monthly chronological summary
    const monthlyGroups = {};
    filteredPurchases.forEach(p => {
      const key = p.date.substring(0, 7); // YYYY-MM
      monthlyGroups[key] = (monthlyGroups[key] || 0) + (Number(p.amount) || 0);
    });
    const sortedLabels = Object.keys(monthlyGroups).sort();
    const sortedValues = sortedLabels.map(lbl => monthlyGroups[lbl]);

    return {
      filteredPurchases,
      summary: { totalProcurement, orderCount, avgPurchaseValue, activeSuppliers },
      timeData: { labels: sortedLabels, values: sortedValues },
      supplierData,
      productData
    };
  }, [dbData.purchases, purchaseReportStart, purchaseReportEnd]);

  const inventoryReportData = useMemo(() => {
    const productsList = dbData.products || [];
    const salesList = dbData.sales || [];
    const purchasesList = dbData.purchases || [];

    // 1. KPI Stats indicators
    const totalSKUs = productsList.length;
    let totalInventoryValue = 0;
    
    // Valuation mapping
    const summaryList = productsList.map(p => {
      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchasePrice || p.price * 0.7 || 0);
      const retail = Number(p.price) || 0;
      const assetVal = stock * cost;
      totalInventoryValue += assetVal;
      return {
        name: p.name,
        sku: p.sku || 'N/A',
        stock,
        purchasePrice: cost,
        price: retail,
        valuation: assetVal
      };
    });

    // Get active purchase orders and accumulate quantities
    const activePOs = purchasesList.filter(p => p.active !== false && p.purchaseType === 'Purchase Order');
    const orderedQtyMap = {};
    activePOs.forEach(po => {
      if (Array.isArray(po.items)) {
        po.items.forEach(item => {
          if (item.name) {
            const key = item.name.trim().toLowerCase();
            orderedQtyMap[key] = (orderedQtyMap[key] || 0) + (Number(item.qty) || 0);
          }
          if (item.sku) {
            const key = item.sku.trim().toLowerCase();
            orderedQtyMap[key] = (orderedQtyMap[key] || 0) + (Number(item.qty) || 0);
          }
        });
      }
    });

    const getEffectiveStock = (p) => {
      const pName = (p.name || '').trim().toLowerCase();
      const pSku = (p.sku || '').trim().toLowerCase();
      const orderedQty = (orderedQtyMap[pName] || 0) || (pSku ? (orderedQtyMap[pSku] || 0) : 0);
      return (Number(p.stock) || 0) + orderedQty;
    };

    // 2. Stock Alerts filters
    const lowStockList = productsList.filter(p => {
      const effStock = getEffectiveStock(p);
      const minLevel = Number(p.lowStockLevel) || 5;
      return effStock > 0 && effStock <= minLevel;
    });

    const outOfStockList = productsList.filter(p => getEffectiveStock(p) <= 0);

    // 3. Dead Stock filter: find products that have zero sales recorded in salesList
    const activeSoldProducts = new Set();
    salesList.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          if (item.name) activeSoldProducts.add(item.name.toLowerCase());
        });
      }
    });
    const deadStockList = productsList.filter(p => !activeSoldProducts.has(p.name.toLowerCase()));

    // 4. Stock Movement Log (chronological log of inward vs outward stock adjustments)
    const movementLog = [];
    
    // Process Sales (outward)
    salesList.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          movementLog.push({
            date: s.date || '',
            product: item.name || 'Unknown Product',
            type: 'Outward (Sale)',
            qty: -(Number(item.qty) || 0),
            refId: s.id || 'N/A',
            party: s.customer || 'Walk-in'
          });
        });
      }
    });

    // Process Purchases (inward)
    purchasesList.forEach(p => {
      if (p.items && Array.isArray(p.items)) {
        p.items.forEach(item => {
          const multiplier = (p.purchaseType === 'Purchase Return' || p.purchaseType === 'Debit Note') ? -1 : 1;
          movementLog.push({
            date: p.date || '',
            product: item.name || 'Unknown Product',
            type: (p.purchaseType === 'Purchase Return' || p.purchaseType === 'Debit Note') ? 'Outward (Return)' : 'Inward (Purchase)',
            qty: (Number(item.qty) || 0) * multiplier,
            refId: p.id || 'N/A',
            party: p.supplier || 'N/A'
          });
        });
      }
    });

    // Sort chronologically in descending order
    movementLog.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 5. Expiry Resolution (root + batch level expiries)
    const expiredList = [];
    const expiringSoonList = [];
    const todayStr = new Date().toISOString().substring(0, 10);
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysStr = thirtyDaysLater.toISOString().substring(0, 10);

    productsList.forEach(p => {
      if (p.expiryDate) {
        if (p.expiryDate <= todayStr) {
          expiredList.push({ name: p.name, sku: p.sku, type: 'Product Profile', expiryDate: p.expiryDate });
        } else if (p.expiryDate > todayStr && p.expiryDate <= thirtyDaysStr) {
          expiringSoonList.push({ name: p.name, sku: p.sku, type: 'Product Profile', expiryDate: p.expiryDate });
        }
      }

      if (p.batches && Array.isArray(p.batches)) {
        p.batches.forEach(b => {
          if (b.expiryDate) {
            const desc = `Batch: ${b.batchNumber}`;
            if (b.expiryDate <= todayStr) {
              expiredList.push({ name: `${p.name} (${desc})`, sku: p.sku, type: 'Batch', expiryDate: b.expiryDate });
            } else if (b.expiryDate > todayStr && b.expiryDate <= thirtyDaysStr) {
              expiringSoonList.push({ name: `${p.name} (${desc})`, sku: p.sku, type: 'Batch', expiryDate: b.expiryDate });
            }
          }
        });
      }
    });

    return {
      totalSKUs,
      totalInventoryValue,
      summaryList,
      lowStockList,
      outOfStockList,
      deadStockList,
      movementLog,
      expiredList,
      expiringSoonList
    };
  }, [dbData.products, dbData.sales, dbData.purchases]);

  const [paymentsTab, setPaymentsTab] = useState('all');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [simulatedCheckoutState, setSimulatedCheckoutState] = useState('idle');
  const [gatewayConfig, setGatewayConfig] = useState({
    razorpayKey: 'rzp_test_9831',
    stripePublishable: 'pk_test_7721',
    payuMerchantId: 'payu_merchant_8892',
    enabledGateways: { stripe: true, razorpay: true, payu: false }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ partyId: '', partyName: '', type: 'Receive', amount: 0, mode: 'Cash', referenceNo: '', date: new Date().toISOString().substring(0, 10) });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({ code: '', type: 'Percentage', value: 0, startDate: '', endDate: '', minBillAmount: 0, applicableCategory: '', applicableProduct: '', usageLimit: 0, isActive: true });
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  const addBranch = () => {
    if (!newBranchName.trim() || !newBranchAddress.trim()) return alert('Please enter both Branch Name and Address.');
    const updatedBranches = [...(profileForm.branches || []), { name: newBranchName, address: newBranchAddress }];
    setProfileForm(prev => ({ ...prev, branches: updatedBranches }));
    setNewBranchName('');
    setNewBranchAddress('');
  };

  const removeBranch = (idx) => {
    const updatedBranches = (profileForm.branches || []).filter((_, i) => i !== idx);
    setProfileForm(prev => ({ ...prev, branches: updatedBranches }));
  };

  // Export products CSV
  const exportProducts = async () => {
    if (!user) return alert('Login required');
    try {
      const res = await fetch(`/api/products/export?username=${encodeURIComponent(user.username)}`);
      if (!res.ok) return alert('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${user.username}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  // Import Excel / CSV
  const handleImportFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        if (!data || data.length === 0) {
          return alert('The sheet appears empty');
        }
        
        const products = data.map(row => {
          const getVal = (possibleKeys) => {
            const foundKey = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()));
            return foundKey ? String(row[foundKey]).trim() : '';
          };
          
          return {
            name: getVal(['name', 'product name', 'product', 'item']),
            sku: getVal(['sku', 'product code', 'code', 'item code', 'barcode']),
            hsnSac: getVal(['hsnsac', 'hsn code', 'hsn', 'sac']),
            category: getVal(['category', 'product category']) || 'Electronics',
            brand: getVal(['brand']) || 'Generic',
            unit: getVal(['unit', 'uom']) || 'pcs',
            price: parseFloat(getVal(['price', 'selling price', 'mrp'])) || 0,
            purchasePrice: parseFloat(getVal(['purchaseprice', 'cost price', 'purchase rate', 'cost'])) || 0,
            wholesalePrice: parseFloat(getVal(['wholesaleprice', 'wholesale rate', 'wholesale'])) || 0,
            taxSlab: getVal(['taxslab', 'gst', 'gst rate', 'tax slab']) || '18%',
            stock: parseInt(getVal(['stock', 'quantity', 'qty', 'opening stock'])) || 0,
            lowStockLevel: parseInt(getVal(['lowstocklevel', 'low stock level', 'reorder level'])) || 5,
            expiryDate: getVal(['expirydate', 'expiry', 'expiry date']) || null,
            notes: getVal(['notes', 'description', 'remarks'])
          };
        });
        
        const res = await fetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, products })
        });
        
        if (res.ok) {
          const resJson = await res.json();
          alert(`Import successful: ${resJson.inserted || products.length} products loaded.`);
          loadDB();
        } else {
          alert('Import failed');
        }
      } catch (err) {
        console.error(err);
        alert('Error parsing file: ' + err.message);
      }
    };
    reader.readAsBinaryString(f);
  };

  const exportParties = () => {
    if (!dbData.parties || dbData.parties.length === 0) {
      return alert('No parties data to export.');
    }
    const ws = XLSX.utils.json_to_sheet(dbData.parties.map(p => ({
      Name: p.name,
      Type: p.type,
      Phone: p.phone,
      Email: p.email,
      WhatsAppNumber: p.whatsappNumber,
      BillingAddress: p.billingAddress,
      ShippingAddress: p.shippingAddress,
      State: p.state,
      GSTIN: p.gstin,
      PAN: p.pan,
      CustomerGroup: p.customerGroup,
      CreditLimit: p.creditLimit,
      PaymentTerms: p.paymentTerms,
      OpeningBalance: p.openingBalance,
      Balance: p.balance,
      BankDetails: p.bankDetails,
      Notes: p.notes,
      LastTransaction: p.lastTxn
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parties');
    XLSX.writeFile(wb, `parties-${dbData.settings?.username || 'export'}.xlsx`);
  };

  const handleImportPartiesFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        if (!data || data.length === 0) {
          return alert('The sheet appears empty');
        }
        
        const parties = data.map(row => {
          const getVal = (possibleKeys) => {
            const foundKey = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()));
            return foundKey ? String(row[foundKey]).trim() : '';
          };
          
          return {
            name: getVal(['name', 'party name', 'customer name', 'supplier name', 'customer', 'supplier', 'party']),
            type: getVal(['type', 'party type', 'partytype']) || 'Customer',
            phone: getVal(['phone', 'phone number', 'contact', 'mobile']),
            email: getVal(['email', 'email address']),
            whatsappNumber: getVal(['whatsapp', 'whatsapp number', 'whatsappno']),
            billingAddress: getVal(['billingaddress', 'billing address', 'address']),
            shippingAddress: getVal(['shippingaddress', 'shipping address']),
            state: getVal(['state']) || 'Karnataka',
            gstin: getVal(['gstin', 'gst', 'gst number']),
            pan: getVal(['pan', 'pan number', 'pan card']),
            customerGroup: getVal(['customergroup', 'customer group', 'group']) || 'Retail',
            creditLimit: parseFloat(getVal(['creditlimit', 'credit limit'])) || 0,
            paymentTerms: getVal(['paymentterms', 'payment terms', 'terms']) || 'Net 30',
            openingBalance: parseFloat(getVal(['openingbalance', 'opening balance', 'balance'])) || 0,
            bankDetails: getVal(['bankdetails', 'bank details', 'bank']),
            notes: getVal(['notes', 'description', 'remarks'])
          };
        });
        
        const res = await fetch('/api/parties/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: dbData.settings.username, parties })
        });
        
        if (res.ok) {
          const resJson = await res.json();
          alert(`Import successful: ${resJson.inserted || parties.length} parties loaded.`);
          loadDB();
        } else {
          alert('Import failed');
        }
      } catch (err) {
        console.error(err);
        alert('Error parsing file: ' + err.message);
      }
    };
    reader.readAsBinaryString(f);
  };

  // Fetch product alerts
  const loadProductAlerts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/products/alerts?username=${encodeURIComponent(user.username)}`);
      if (res.ok) {
        const j = await res.json();
        setProductAlerts({
          outOfStock: j.outOfStock || [],
          lowStock: j.lowStock || [],
          expired: j.expired || [],
          expiringSoon: j.expiringSoon || []
        });
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadProductAlerts(); }, [user, dbData.products.length]);

  useEffect(() => {
    if (!user) return;
    const socket = io();
    socket.on('low_stock_alert', (data) => {
      if (data.username === user.username) {
        toast.error(`⚠️ Low Stock Alert: Product "${data.name}" (${data.sku || 'N/A'}) has dropped to ${data.stock} units! (Threshold: ${data.lowStockLevel})`, {
          duration: 6000,
          position: 'top-right',
          style: {
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            border: '1px solid #ef4444',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 99999
          }
        });
        loadProductAlerts();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Sync custom categories & brands from server settings
  useEffect(() => {
    if (dbData.settings?.customCats && Array.isArray(dbData.settings.customCats)) {
      setCustomCats(dbData.settings.customCats);
    }
  }, [dbData.settings?.customCats]);

  useEffect(() => {
    if (dbData.settings?.customBrands && Array.isArray(dbData.settings.customBrands)) {
      setCustomBrands(dbData.settings.customBrands);
    }
  }, [dbData.settings?.customBrands]);

  useEffect(() => {
    if (currentView === 'purchase') {
      const prefillStr = localStorage.getItem('prefill_purchase');
      if (prefillStr) {
        try {
          const prefill = JSON.parse(prefillStr);
          setEditingPurchase(null);
          setPurSupp(prefill.supplier || '');
          setPurDate(new Date().toISOString().substring(0, 10));
          setPurMode('Credit (Due)');
          setPurNotes('Auto-generated reorder for out-of-stock / low-stock alert.');
          setPurType(prefill.purchaseType || 'Purchase Order');
          setPurAdditionalCharges(0);
          setPurDueDate('');
          setPurItems(prefill.items || []);
          setShowPurchaseForm(true);
        } catch (e) {
          console.error(e);
        } finally {
          localStorage.removeItem('prefill_purchase');
        }
      }
    }
  }, [currentView]);

  const saveCategoriesAndBrands = (newCats, newBrands) => {
    const updated = {
      ...dbData,
      settings: {
        ...dbData.settings,
        customCats: newCats,
        customBrands: newBrands
      }
    };
    saveDB(updated);
  };

  // --- Barcode Scanner Global Listener ---
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout;

    const handleKeyDown = (e) => {
      if (!e || !e.key) return;
      // We rely on the 50ms timeout to distinguish humans from scanners.
      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        const code = barcodeBuffer;
        barcodeBuffer = '';
        clearTimeout(barcodeTimeout);
        
        const prod = dbData.products.find(p => p.active !== false && (p.barcode === code || String(p.sku) === code));
        if (prod) {
          if (showSalesForm) {
            // Add to sale cart
            setSaleItems(prev => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && !last.name.trim()) {
                 copy.pop(); // remove empty row
              }
              // check if already in cart, then increment qty
              const existingIdx = copy.findIndex(item => item.name === prod.name);
              if (existingIdx >= 0) {
                 copy[existingIdx].qty = Number(copy[existingIdx].qty) + 1;
              } else {
                 copy.push({ name: prod.name, qty: 1, rate: prod.price || 0, taxSlab: prod.taxSlab || '18%', isTaxInclusive: prod.isTaxInclusive || false, hsnSac: prod.hsnSac || '' });
              }
              return copy;
            });
          } else if (showPurchaseForm) {
            // Add to purchase cart
            setPurItems(prev => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && !last.name.trim()) {
                 copy.pop(); // remove empty row
              }
              const existingIdx = copy.findIndex(item => item.name === prod.name);
              if (existingIdx >= 0) {
                 copy[existingIdx].qty = Number(copy[existingIdx].qty) + 1;
              } else {
                 copy.push({ name: prod.name, qty: 1, rate: prod.purchasePrice || prod.price || 0, taxSlab: prod.taxSlab || '18%', isTaxInclusive: prod.isTaxInclusive || false, hsnSac: prod.hsnSac || '', discount: 0, unit: prod.unit || 'pcs' });
              }
              return copy;
            });
          } else {
            // Maybe search it in inventory
            if (currentView !== 'inventory') {
              setCurrentView('inventory');
            }
          }
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(barcodeTimeout);
        barcodeTimeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dbData.products, showSalesForm, showPurchaseForm, currentView]);

  const [profileForm, setProfileForm] = useState({
    bizName: '',
    email: '',
    phone: '+91 ',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    currency: 'INR (₹)',
    logo: '',
    shopType: 'General',
    ownerName: '',
    pan: '',
    fssai: '',
    regNumber: '',
    addressLine1: '',
    addressLine2: '',
    branches: [],
    financialYear: 'Apr-Mar',
    workingHours: '09:00 - 21:00',
    timezone: 'UTC+05:30',
    dateFormat: 'DD-MM-YYYY',
    language: 'English',
    invoicePrefix: 'INV',
    invoiceStartNumber: '1',
    digitalSignature: '',
    shopStamp: '',
    termsAndConditions: 'Thank you for your business!',
    bankDetails: { accountName: '', accountNumber: '', bankName: '', ifscCode: '' },
    upiId: '',
    socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '' },
    gstScheme: 'Regular',
    compositionRate: '1%'
  });

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(prev => ({
        ...prev,
        [field]: reader.result
      }));
    };
    reader.readAsDataURL(file);
   };

  const handleBankDetailsChange = (key, val) => {
    setProfileForm(prev => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || { accountName: '', accountNumber: '', bankName: '', ifscCode: '' }),
        [key]: val
      }
    }));
  };

  const handleSocialLinksChange = (key, val) => {
    setProfileForm(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || { facebook: '', instagram: '', twitter: '', linkedin: '' }),
        [key]: val
      }
    }));
  };

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
        currency: s.currency || 'INR (₹)',
        logo: s.logo || '',
        shopType: s.shopType || 'General',
        ownerName: s.ownerName || '',
        pan: s.pan || '',
        fssai: s.fssai || '',
        regNumber: s.regNumber || '',
        addressLine1: s.addressLine1 || '',
        addressLine2: s.addressLine2 || '',
        branches: s.branches || [],
        financialYear: s.financialYear || 'Apr-Mar',
        workingHours: s.workingHours || '09:00 - 21:00',
        timezone: s.timezone || 'UTC+05:30',
        dateFormat: s.dateFormat || 'DD-MM-YYYY',
        language: s.language || 'English',
        invoicePrefix: s.invoicePrefix || 'INV',
        invoiceStartNumber: s.invoiceStartNumber || '1',
        digitalSignature: s.digitalSignature || '',
        shopStamp: s.shopStamp || '',
        termsAndConditions: s.termsAndConditions || 'Thank you for your business!',
        bankDetails: s.bankDetails || { accountName: '', accountNumber: '', bankName: '', ifscCode: '' },
        upiId: s.upiId || '',
        socialLinks: s.socialLinks || { facebook: '', instagram: '', twitter: '', linkedin: '' },
        gstScheme: s.gstScheme || 'Regular',
        compositionRate: s.compositionRate || '1%'
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
    const discount = parseFloat(item.discount) || 0;
    const rate = Math.max(0, (parseFloat(item.rate) || 0) - discount);
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
    const match = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === value.toLowerCase());
    if (match) {
      copy[idx].rate = match.price;
      copy[idx].taxSlab = match.taxSlab || '18%';
      copy[idx].isTaxInclusive = match.isTaxInclusive === true || match.isTaxInclusive === 'true';
      copy[idx].hsnSac = match.hsnSac || '';
      copy[idx].unit = match.unit || 'pcs';
      copy[idx].hasSerialTracking = match.hasSerialTracking || false;
      copy[idx].serialNumbers = [];
    }
    setSaleItems(copy);
  };

  const handlePurProductNameChange = (idx, value) => {
    const copy = [...purItems];
    copy[idx].name = value;
    const match = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === value.toLowerCase());
    if (match) {
      copy[idx].rate = match.price;
      copy[idx].taxSlab = match.taxSlab || '18%';
      copy[idx].isTaxInclusive = match.isTaxInclusive === true || match.isTaxInclusive === 'true';
      copy[idx].hsnSac = match.hsnSac || '';
      copy[idx].unit = match.unit || 'pcs';
      copy[idx].hasSerialTracking = match.hasSerialTracking || false;
      copy[idx].serialNumbers = [];
    }
    setPurItems(copy);
  };

  const getSaleFormTotals = () => {
    const isComposition = dbData.settings?.gstScheme === 'Composition';
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    saleItems.forEach(item => {
      if (item.name.trim()) {
        const m = calculateLineItem(item);
        if (isComposition) {
          const qty = parseFloat(item.qty) || 0;
          const discount = parseFloat(item.discount) || 0;
          const rate = Math.max(0, (parseFloat(item.rate) || 0) - discount);
          const lineVal = qty * rate;
          subtotal += lineVal;
          total += lineVal;
        } else {
          subtotal += m.subtotal;
          taxAmount += m.taxAmount;
          total += m.total;
        }
      }
    });
    const customerParty = dbData.parties.find(p => p.name === saleCust);
    const isLocal = isManualTaxSplit
      ? (manualTaxType === 'Local')
      : (customerParty?.state || 'Karnataka').toLowerCase() === (dbData.settings?.state || 'Karnataka').toLowerCase();
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: isComposition ? 0 : Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      isLocal,
      cgst: isComposition ? 0 : (isLocal ? Math.round((taxAmount / 2) * 100) / 100 : 0),
      sgst: isComposition ? 0 : (isLocal ? Math.round((taxAmount / 2) * 100) / 100 : 0),
      igst: isComposition ? 0 : (!isLocal ? Math.round(taxAmount * 100) / 100 : 0)
    };
  };

  const getPurFormTotals = () => {
    const isComposition = dbData.settings?.gstScheme === 'Composition';
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    purItems.forEach(item => {
      if (item.name.trim()) {
        const m = calculateLineItem(item);
        subtotal += m.subtotal;
        taxAmount += m.taxAmount;
        total += m.total;
      }
    });
    const supplierParty = dbData.parties.find(p => p.name === purSupp);
    const isLocal = isManualPurTaxSplit
      ? (manualPurTaxType === 'Local')
      : (supplierParty?.state || 'Karnataka').toLowerCase() === (dbData.settings?.state || 'Karnataka').toLowerCase();
    const finalTotal = total + (parseFloat(purAdditionalCharges) || 0);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: isComposition ? 0 : Math.round(taxAmount * 100) / 100,
      total: Math.round(finalTotal * 100) / 100,
      isLocal,
      cgst: isComposition ? 0 : (isLocal ? Math.round((taxAmount / 2) * 100) / 100 : 0),
      sgst: isComposition ? 0 : (isLocal ? Math.round((taxAmount / 2) * 100) / 100 : 0),
      igst: isComposition ? 0 : (!isLocal ? Math.round(taxAmount * 100) / 100 : 0)
    };
  };

  // CRUD Mutations
  const resetProdForm = () => {
    setProdForm({
      name: '', sku: '', category: 'Electronics', stock: 0, price: 0, notes: '', image: '', taxSlab: '18%', isTaxInclusive: false, hsnSac: '',
      barcode: '', subCategory: '', brand: '', unit: 'pcs', purchasePrice: 0, wholesalePrice: 0,
      lowStockLevel: 5, expiryDate: '', description: '', rackLocation: '', godownName: '', serialNumber: '', batchNumber: '',
      isBatchTracked: false, batches: [],
      hasSerialTracking: false, serialNumbers: []
    });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');

    const payload = {
      ...prodForm,
      stock: prodForm.hasSerialTracking ? (Array.isArray(prodForm.serialNumbers) ? prodForm.serialNumbers.length : 0) : (parseInt(prodForm.stock) || 0),
      price: parseFloat(prodForm.price) || 0,
      purchasePrice: parseFloat(prodForm.purchasePrice) || 0,
      wholesalePrice: parseFloat(prodForm.wholesalePrice) || 0,
      lowStockLevel: parseInt(prodForm.lowStockLevel) || 5,
      taxSlab: prodForm.taxSlab || '18%',
      isTaxInclusive: prodForm.isTaxInclusive === true || prodForm.isTaxInclusive === 'true',
      hsnSac: prodForm.hsnSac || '',
      batches: prodForm.isBatchTracked ? (prodForm.batches || []) : [],
      serialNumbers: prodForm.hasSerialTracking ? (prodForm.serialNumbers || []) : [],
      username: dbData.settings.username
    };

    if (editingProduct) {
      const pid = editingProduct.id || editingProduct._id;
      fetch(`/api/products/${encodeURIComponent(pid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success') {
            loadDB();
            setShowProductModal(false);
            setEditingProduct(null);
            resetProdForm();
          } else alert('Failed to update product');
        })
        .catch(() => alert('Network error'));
    } else {
      const newId = Math.max(0, ...dbData.products.map(p => p.id)) + 1;
      const finalPayload = { ...payload, id: newId };
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      })
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success') {
            loadDB();
            setShowProductModal(false);
            resetProdForm();
          } else alert('Failed to add product');
        })
        .catch(() => alert('Network error'));
    }
  };

  const handlePartySubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const todayStr = new Date().toISOString().substring(0, 10);
    const balanceNum = parseFloat(partyForm.openingBalance) || 0;

    if (editingParty) {
      const pid = editingParty.id || editingParty._id;
      const payload = { 
        ...partyForm, 
        username: dbData.settings.username 
      };
      fetch(`/api/parties/${encodeURIComponent(pid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success') {
            loadDB();
            setShowPartyModal(false);
            setEditingParty(null);
            setPartyForm({ 
              name: '', type: 'Customer', phone: '+91 ', balance: 0, notes: '', state: 'Karnataka',
              email: '', whatsappNumber: '', billingAddress: '', shippingAddress: '', gstin: '', pan: '', 
              customerGroup: 'Retail', creditLimit: 0, paymentTerms: 'Net 30', openingBalance: 0, bankDetails: ''
            });
          } else alert('Failed to update party');
        })
        .catch(() => alert('Network error'));
    } else {
      const newId = Math.max(0, ...dbData.parties.map(p => p.id)) + 1;
      const payload = { 
        ...partyForm, 
        id: newId, 
        balance: balanceNum, 
        openingBalance: balanceNum,
        lastTxn: todayStr, 
        state: partyForm.state || 'Karnataka', 
        username: dbData.settings.username 
      };
      fetch('/api/parties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json())
        .then(d => { 
          if (d.status === 'success') { 
            loadDB(); 
            setShowPartyModal(false); 
            setPartyForm({ 
              name: '', type: 'Customer', phone: '+91 ', balance: 0, notes: '', state: 'Karnataka',
              email: '', whatsappNumber: '', billingAddress: '', shippingAddress: '', gstin: '', pan: '', 
              customerGroup: 'Retail', creditLimit: 0, paymentTerms: 'Net 30', openingBalance: 0, bankDetails: ''
            }); 
          } else alert('Failed to add party'); 
        })
        .catch(() => alert('Network error'));
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    
    let updatedExpenses = [];
    if (editingExpenseId !== null) {
      updatedExpenses = (dbData.expenses || []).map(exp => 
        exp.id === editingExpenseId ? { ...exp, ...expenseForm, amount: parseFloat(expenseForm.amount) || 0 } : exp
      );
    } else {
      const newId = Math.max(0, ...(dbData.expenses || []).map(exp => exp.id)) + 1;
      const payload = { ...expenseForm, id: newId, amount: parseFloat(expenseForm.amount) || 0 };
      updatedExpenses = [...(dbData.expenses || []), payload];
    }
    
    const updated = { 
      ...dbData, 
      expenses: updatedExpenses 
    };
    saveDB(updated);
    setShowExpenseModal(false);
    setEditingExpenseId(null);
    setExpenseForm({ 
      date: new Date().toISOString().substring(0, 10), 
      category: 'Rent', 
      amount: 0, 
      paymentMode: 'Cash', 
      description: '', 
      receipt: '', 
      isRecurringTemplate: false, 
      frequency: 'Monthly', 
      nextOccurrenceDate: '', 
      isActive: true 
    });
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds the 2MB limit. Please upload a smaller receipt.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setExpenseForm(prev => ({ ...prev, receipt: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const getNextOccurrenceDate = (currentDateStr, frequency) => {
    const date = new Date(currentDateStr);
    if (frequency === 'Daily') {
      date.setDate(date.getDate() + 1);
    } else if (frequency === 'Weekly') {
      date.setDate(date.getDate() + 7);
    } else if (frequency === 'Monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (frequency === 'Yearly') {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString().substring(0, 10);
  };

  // Auto-generate recurring expenses when next occurrence date is reached
  useEffect(() => {
    if (viewOnly || !dbData || !dbData.expenses || dbData.expenses.length === 0) return;

    const today = new Date().toISOString().substring(0, 10);
    let updatedExpenses = [...dbData.expenses];
    let hasChanges = false;

    updatedExpenses.forEach((exp, idx) => {
      if (exp.isRecurringTemplate && exp.isActive && exp.nextOccurrenceDate && exp.nextOccurrenceDate <= today) {
        // Generate standard expense instance
        const newInstanceId = Math.max(0, ...updatedExpenses.map(ex => ex.id)) + 1;
        const newInstance = {
          id: newInstanceId,
          date: exp.nextOccurrenceDate,
          category: exp.category,
          amount: parseFloat(exp.amount) || 0,
          paymentMode: exp.paymentMode || 'Cash',
          description: `Auto-generated recurrence: ${exp.description || ''}`,
          receipt: exp.receipt || '',
          isRecurringInstance: true,
          templateId: exp.id
        };

        updatedExpenses.push(newInstance);

        // Advance nextOccurrenceDate
        let nextDate = getNextOccurrenceDate(exp.nextOccurrenceDate, exp.frequency);
        while (nextDate <= today) {
          nextDate = getNextOccurrenceDate(nextDate, exp.frequency);
        }

        updatedExpenses[idx] = {
          ...exp,
          nextOccurrenceDate: nextDate,
          lastGeneratedDate: exp.nextOccurrenceDate
        };

        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveDB({ ...dbData, expenses: updatedExpenses });
    }
  }, [dbData.expenses, viewOnly]);

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const pAmt = parseFloat(paymentForm.amount) || 0;
    if (pAmt <= 0) return alert('Amount must be greater than zero.');
    
    // Update Party Balance
    const pIdx = dbData.parties.findIndex(p => p.id === paymentForm.partyId);
    if (pIdx === -1) return alert('Party not found');
    
    let updatedParties = [...dbData.parties];
    let newBalance = parseFloat(updatedParties[pIdx].balance) || 0;
    
    // Balance convention: Negative = Due (Customer owes us), Positive = Payable (We owe supplier).
    if (paymentForm.type === 'Receive') {
      newBalance += pAmt;
    } else {
      newBalance -= pAmt;
    }
    updatedParties[pIdx] = { ...updatedParties[pIdx], balance: newBalance, lastTxn: paymentForm.date };
    
    // Create Transaction Entry
    const newTxnId = 'TXN-' + Date.now();
    const isReceive = paymentForm.type === 'Receive';
    const txn = {
      id: newTxnId,
      date: paymentForm.date,
      type: 'Payment ' + paymentForm.type,
      party: paymentForm.partyName,
      partyId: paymentForm.partyId,
      debitAccount: isReceive 
        ? ((paymentForm.mode || '').toLowerCase() === 'cash' ? 'Cash Account' : 'Bank/UPI Account') 
        : 'Accounts Payable (Liability)',
      creditAccount: isReceive 
        ? 'Accounts Receivable (Asset)' 
        : ((paymentForm.mode || '').toLowerCase() === 'cash' ? 'Cash Account' : 'Bank/UPI Account'),
      debit: isReceive ? pAmt : 0,
      credit: isReceive ? 0 : pAmt,
      mode: paymentForm.mode || 'Cash',
      referenceNo: paymentForm.referenceNo || '',
      balance: newBalance
    };
    
    const updated = {
      ...dbData,
      parties: updatedParties,
      transactions: [...dbData.transactions, txn]
    };
    saveDB(updated);
    setShowPaymentModal(false);
  };

  const handleDeletePayment = async (txn) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!await window.confirm('Are you sure you want to delete this payment record? This will adjust the party balance accordingly.')) return;
    
    const pIdx = dbData.parties.findIndex(p => p.id === txn.partyId || p.name === txn.party);
    let updatedParties = [...dbData.parties];
    
    if (pIdx !== -1) {
      const amount = parseFloat(txn.debit || txn.credit || txn.amount || 0);
      let newBalance = parseFloat(updatedParties[pIdx].balance) || 0;
      
      if (txn.type === 'Payment Receive') {
        newBalance -= amount;
      } else if (txn.type === 'Payment Pay') {
        newBalance += amount;
      }
      
      updatedParties[pIdx] = { 
        ...updatedParties[pIdx], 
        balance: newBalance 
      };
    }
    
    const updatedTxns = dbData.transactions.filter(t => t.id !== txn.id);
    
    saveDB({
      ...dbData,
      parties: updatedParties,
      transactions: updatedTxns
    });
  };

  const printPaymentVoucher = (txn) => {
    const printWindow = window.open('', '_blank');
    const isReceive = txn.type === 'Payment Receive';
    const amount = txn.debit > 0 ? txn.debit : txn.credit;
    const html = `
      <html>
        <head>
          <title>Payment Voucher - ${txn.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .voucher { border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: ${isReceive ? '#10b981' : '#ef4444'}; text-transform: uppercase; }
            .meta { text-align: right; font-size: 14px; color: #64748b; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
            .label { font-weight: 600; color: #475569; }
            .value { color: #0f172a; }
            .amount-box { margin-top: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
            .amount-val { font-size: 28px; font-weight: 800; color: #1e293b; margin-top: 5px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; }
            .sig { border-top: 1px solid #cbd5e1; width: 150px; text-align: center; padding-top: 5px; margin-top: 40px; }
            @media print {
              body { padding: 0; }
              .voucher { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <div>
                <div class="title">${isReceive ? 'Payment Receipt' : 'Payment Voucher'}</div>
                <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Vyapar Billing System</div>
              </div>
              <div class="meta">
                <div><b>Voucher No:</b> ${txn.id}</div>
                <div><b>Date:</b> ${txn.date}</div>
              </div>
            </div>
            <div class="row">
              <span class="label">Party Name:</span>
              <span class="value" style="font-weight: bold;">${txn.party}</span>
            </div>
            <div class="row">
              <span class="label">Payment Type:</span>
              <span class="value">${isReceive ? 'Received (Inward)' : 'Paid (Outward)'}</span>
            </div>
            <div class="row">
              <span class="label">Payment Mode:</span>
              <span class="value">${txn.mode || 'Cash'}</span>
            </div>
            <div class="row">
              <span class="label">Reference No / Notes:</span>
              <span class="value">${txn.referenceNo || 'N/A'}</span>
            </div>
            
            <div class="amount-box">
              <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Transaction Amount</div>
              <div class="amount-val">₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
              <div class="sig">Receiver Signature</div>
              <div class="sig">Authorized Signatory</div>
            </div>
            
            <div class="footer" style="text-align: center; display: block; margin-top: 50px;">
              Thank you for doing business with us!
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const openCentralPaymentModal = (type) => {
    setPaymentForm({
      partyId: '',
      partyName: '',
      type: type,
      amount: 0,
      mode: 'Cash',
      referenceNo: '',
      date: new Date().toISOString().substring(0, 10)
    });
    setShowPaymentModal(true);
  };

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const amount = parseFloat(journalForm.amount) || 0;
    if (amount <= 0) return alert('Amount must be greater than zero.');
    if (!journalForm.debitAccount || !journalForm.creditAccount) return alert('Please select both Debit and Credit accounts.');
    if (journalForm.debitAccount === journalForm.creditAccount) return alert('Debit and Credit accounts must be different.');

    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '')) || 0)) + 1;
    const newTxn = {
      id: `JV-${nextTxnId}`,
      date: journalForm.date,
      type: 'Journal Entry',
      party: journalForm.description || 'Manual Journal Entry',
      debit: amount,
      credit: amount,
      balance: (dbData.transactions[dbData.transactions.length - 1]?.balance || 0),
      debitAccount: journalForm.debitAccount,
      creditAccount: journalForm.creditAccount
    };

    const updated = {
      ...dbData,
      transactions: [...dbData.transactions, newTxn]
    };
    saveDB(updated);
    setShowJournalModal(false);
    setJournalForm({ date: new Date().toISOString().substring(0, 10), description: '', debitAccount: '', creditAccount: '', amount: '' });
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!accountForm.name.trim()) return alert('Account name is required.');

    let updatedAccounts = [...(dbData.accounts || [])];
    
    if (editingAccount) {
      const idx = updatedAccounts.findIndex(a => a.id === editingAccount.id);
      if (idx > -1) {
        updatedAccounts[idx] = { 
          ...updatedAccounts[idx], 
          name: accountForm.name.trim(), 
          type: accountForm.type, 
          description: accountForm.description,
          openingBalance: parseFloat(accountForm.openingBalance) || 0
        };
      }
    } else {
      const newId = `acc-${Date.now()}`;
      const newAcc = {
        id: newId,
        name: accountForm.name.trim(),
        type: accountForm.type,
        description: accountForm.description,
        openingBalance: parseFloat(accountForm.openingBalance) || 0,
        isSystem: false
      };
      if (updatedAccounts.some(a => a.name.toLowerCase() === newAcc.name.toLowerCase())) {
        return alert('An account with this name already exists.');
      }
      updatedAccounts.push(newAcc);
    }

    const updated = {
      ...dbData,
      accounts: updatedAccounts
    };
    saveDB(updated);
    setShowAccountModal(false);
    setAccountForm({ name: '', type: 'Expense', description: '', openingBalance: 0 });
    setEditingAccount(null);
  };

  const handleDeleteAccount = async (account) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (account.isSystem) return alert('Cannot delete system accounts.');

    const isReferenced = dbData.transactions.some(t => 
      t.debitAccount === account.name || t.creditAccount === account.name
    );
    if (isReferenced) {
      return alert('Cannot delete this account because it has active transaction records.');
    }

    if (!await window.confirm(`Are you sure you want to delete account "${account.name}"?`)) return;

    const updatedAccounts = (dbData.accounts || []).filter(a => a.id !== account.id);
    const updated = {
      ...dbData,
      accounts: updatedAccounts
    };
    saveDB(updated);
  };

  // ===== Bank Account Management Handlers =====
  const handleBankSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!bankForm.accountName.trim()) return alert('Account name is required.');
    if (!bankForm.bankName.trim()) return alert('Bank name is required.');

    let updatedBanks = [...(dbData.bankAccounts || [])];
    let updatedAccounts = [...(dbData.accounts || [])];

    if (editingBank) {
      const idx = updatedBanks.findIndex(b => b.id === editingBank.id);
      if (idx > -1) {
        // Update matching Chart of Accounts entry if name changed
        const oldName = updatedBanks[idx].accountName;
        updatedBanks[idx] = { ...updatedBanks[idx], ...bankForm };
        if (oldName !== bankForm.accountName.trim()) {
          const accIdx = updatedAccounts.findIndex(a => a.name === oldName);
          if (accIdx > -1) {
            updatedAccounts[accIdx] = { ...updatedAccounts[accIdx], name: bankForm.accountName.trim() };
          }
        }
      }
    } else {
      const newId = `bank-${Date.now()}`;
      const newBank = { id: newId, ...bankForm, accountName: bankForm.accountName.trim(), openingBalance: parseFloat(bankForm.openingBalance) || 0 };
      if (updatedBanks.some(b => b.accountName.toLowerCase() === newBank.accountName.toLowerCase())) {
        return alert('A bank account with this name already exists.');
      }
      updatedBanks.push(newBank);

      // Also add to Chart of Accounts as an Asset type
      if (!updatedAccounts.some(a => a.name.toLowerCase() === newBank.accountName.toLowerCase())) {
        updatedAccounts.push({
          id: `acc-bank-${Date.now()}`,
          name: newBank.accountName,
          type: 'Asset',
          description: `Bank: ${newBank.bankName} | A/C: ${newBank.accountNumber || 'N/A'}`,
          isSystem: false
        });
      }
    }

    const updated = { ...dbData, bankAccounts: updatedBanks, accounts: updatedAccounts };
    saveDB(updated);
    setShowBankModal(false);
    setBankForm({ accountName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', openingBalance: 0 });
    setEditingBank(null);
  };

  const handleBankTransferSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const amount = parseFloat(bankTransferForm.amount) || 0;
    if (amount <= 0) return alert('Transfer amount must be greater than zero.');
    if (!bankTransferForm.fromAccount || !bankTransferForm.toAccount) return alert('Please select both source and destination accounts.');
    if (bankTransferForm.fromAccount === bankTransferForm.toAccount) return alert('Source and destination must be different.');

    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '').replace('BT-', '')) || 0)) + 1;
    const newTxn = {
      id: `BT-${nextTxnId}`,
      date: bankTransferForm.date,
      type: 'Bank Transfer',
      party: bankTransferForm.description || `Transfer: ${bankTransferForm.fromAccount} → ${bankTransferForm.toAccount}`,
      debit: amount,
      credit: amount,
      balance: (dbData.transactions[dbData.transactions.length - 1]?.balance || 0),
      debitAccount: bankTransferForm.toAccount,
      creditAccount: bankTransferForm.fromAccount,
      isReconciled: false
    };

    const updated = { ...dbData, transactions: [...dbData.transactions, newTxn] };
    saveDB(updated);
    setShowBankTransferModal(false);
    setBankTransferForm({ date: new Date().toISOString().substring(0, 10), fromAccount: '', toAccount: '', amount: '', referenceNo: '', description: '' });
  };

  const handleDeleteBank = async (bank) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    const isReferenced = dbData.transactions.some(t =>
      t.debitAccount === bank.accountName || t.creditAccount === bank.accountName
    );
    if (isReferenced) return alert('Cannot delete this bank account because it has active transaction records. Clear transactions first.');
    if (!await window.confirm(`Delete bank account "${bank.accountName}" (${bank.bankName})?`)) return;

    const updatedBanks = (dbData.bankAccounts || []).filter(b => b.id !== bank.id);
    const updatedAccounts = (dbData.accounts || []).filter(a => a.name !== bank.accountName);
    saveDB({ ...dbData, bankAccounts: updatedBanks, accounts: updatedAccounts });
  };

  const handleToggleReconciled = (txnId) => {
    if (viewOnly) return;
    const updatedTxns = dbData.transactions.map(t =>
      t.id === txnId ? { ...t, isReconciled: !t.isReconciled } : t
    );
    saveDB({ ...dbData, transactions: updatedTxns });
  };

  // ===== Cheque Management Handlers =====
  const handleChequeSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const amount = parseFloat(chequeForm.amount) || 0;
    if (amount <= 0) return alert('Cheque amount must be greater than zero.');
    if (!chequeForm.chequeNumber.trim()) return alert('Cheque number is required.');
    if (!chequeForm.bankName.trim()) return alert('Bank name is required.');
    if (!chequeForm.partyName) return alert('Please select a customer/supplier.');
    if (!chequeForm.bankAccountId) return alert('Please select a bank account.');

    let updatedCheques = [...(dbData.cheques || [])];

    if (editingCheque) {
      const idx = updatedCheques.findIndex(c => c.id === editingCheque.id);
      if (idx > -1) {
        updatedCheques[idx] = { ...updatedCheques[idx], ...chequeForm, amount };
      }
    } else {
      const newCheque = {
        id: `chq-${Date.now()}`,
        ...chequeForm,
        amount,
        status: 'Pending',
        bounceCharge: 0
      };
      updatedCheques.push(newCheque);
    }

    saveDB({ ...dbData, cheques: updatedCheques });
    setShowChequeModal(false);
    setChequeForm({ chequeNumber: '', bankName: '', issueDate: new Date().toISOString().substring(0, 10), dueDate: new Date().toISOString().substring(0, 10), partyName: '', amount: '', type: 'Received', bankAccountId: '', notes: '' });
    setEditingCheque(null);
  };

  const handleClearCheque = (chequeId, clearDate) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    let updatedCheques = (dbData.cheques || []).map(c => {
      if (c.id === chequeId) {
        return { ...c, status: 'Cleared' };
      }
      return c;
    });

    const chq = (dbData.cheques || []).find(c => c.id === chequeId);
    if (!chq) return;

    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '').replace('BT-', '').replace('CHQ-', '')) || 0)) + 1;
    const isReceived = chq.type === 'Received';
    const newTxn = {
      id: `CHQ-CLR-${nextTxnId}`,
      date: clearDate || new Date().toISOString().substring(0, 10),
      type: 'Cheque Cleared',
      party: chq.partyName,
      debit: chq.amount,
      credit: chq.amount,
      balance: (dbData.transactions[dbData.transactions.length - 1]?.balance || 0),
      debitAccount: isReceived ? chq.bankAccountId : 'Accounts Payable (Liability)',
      creditAccount: isReceived ? 'Accounts Receivable (Asset)' : chq.bankAccountId,
      isReconciled: false,
      chequeId: chq.id
    };

    saveDB({
      ...dbData,
      cheques: updatedCheques,
      transactions: [...dbData.transactions, newTxn]
    });
  };

  const handleBounceCheque = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const chequeId = bounceForm.chequeId;
    const charge = parseFloat(bounceForm.bounceCharge) || 0;
    
    const chq = (dbData.cheques || []).find(c => c.id === chequeId);
    if (!chq) return;

    let updatedCheques = (dbData.cheques || []).map(c => {
      if (c.id === chequeId) {
        return { ...c, status: 'Bounced', bounceCharge: charge };
      }
      return c;
    });

    const hasClearingTxn = dbData.transactions.some(t => t.chequeId === chequeId && t.type === 'Cheque Cleared');
    let newTxns = [...dbData.transactions];

    if (hasClearingTxn) {
      const nextTxnId = Math.max(0, newTxns.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '').replace('BT-', '').replace('CHQ-', '')) || 0)) + 1;
      const isReceived = chq.type === 'Received';
      
      const reverseTxn = {
        id: `CHQ-REV-${nextTxnId}`,
        date: bounceForm.date,
        type: 'Cheque Bounced',
        party: chq.partyName,
        debit: chq.amount,
        credit: chq.amount,
        balance: (newTxns[newTxns.length - 1]?.balance || 0),
        debitAccount: isReceived ? 'Accounts Receivable (Asset)' : chq.bankAccountId,
        creditAccount: isReceived ? chq.bankAccountId : 'Accounts Payable (Liability)',
        isReconciled: false,
        chequeId: chq.id
      };
      newTxns.push(reverseTxn);
    }

    if (charge > 0) {
      const nextTxnId = Math.max(0, newTxns.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '').replace('BT-', '').replace('CHQ-', '')) || 0)) + 1;
      const isReceived = chq.type === 'Received';
      
      const chargeTxn = {
        id: `CHQ-CHG-${nextTxnId}`,
        date: bounceForm.date,
        type: 'Cheque Bounce Charge',
        party: chq.partyName,
        debit: charge,
        credit: charge,
        balance: (newTxns[newTxns.length - 1]?.balance || 0),
        debitAccount: isReceived ? 'Accounts Receivable (Asset)' : 'Cost of Goods Sold (Expense)',
        creditAccount: chq.bankAccountId,
        isReconciled: false,
        chequeId: chq.id
      };
      newTxns.push(chargeTxn);
    }

    saveDB({
      ...dbData,
      cheques: updatedCheques,
      transactions: newTxns
    });

    setShowBounceModal(false);
    setBounceForm({ chequeId: '', bounceCharge: 0, date: new Date().toISOString().substring(0, 10) });
  };

  const handleDeleteCheque = async (chequeId) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    const chq = (dbData.cheques || []).find(c => c.id === chequeId);
    if (!chq) return;

    if (chq.status === 'Cleared') return alert('Cannot delete a cleared cheque. Bounce or adjust the transaction instead.');
    if (!await window.confirm('Are you sure you want to delete this cheque record?')) return;

    const updatedCheques = (dbData.cheques || []).filter(c => c.id !== chequeId);
    saveDB({ ...dbData, cheques: updatedCheques });
  };

  // ===== Petty Cash Handlers =====
  const handlePettyTopupSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const amount = parseFloat(pettyTopupForm.amount) || 0;
    if (amount <= 0) return alert('Top-up amount must be greater than zero.');
    if (!pettyTopupForm.sourceAccount) return alert('Please select a source account.');

    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '').replace('BT-', '').replace('PT-', '')) || 0)) + 1;
    const newTxn = {
      id: `PT-IN-${nextTxnId}`,
      date: pettyTopupForm.date,
      type: 'Petty Cash Topup',
      party: pettyTopupForm.notes || `Topup from ${pettyTopupForm.sourceAccount}`,
      debit: amount,
      credit: amount,
      balance: (dbData.transactions[dbData.transactions.length - 1]?.balance || 0),
      debitAccount: 'Petty Cash (Asset)',
      creditAccount: pettyTopupForm.sourceAccount
    };

    saveDB({ ...dbData, transactions: [...dbData.transactions, newTxn] });
    setShowPettyTopupModal(false);
    setPettyTopupForm({ date: new Date().toISOString().substring(0, 10), sourceAccount: '', amount: '', notes: '' });
  };

  const handlePettyExpenseSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    const amount = parseFloat(pettyExpenseForm.amount) || 0;
    if (amount <= 0) return alert('Expense amount must be greater than zero.');
    if (!pettyExpenseForm.category) return alert('Please select or enter a category.');

    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '').replace('JV-', '').replace('BT-', '').replace('PT-', '')) || 0)) + 1;
    const newTxn = {
      id: `PT-OUT-${nextTxnId}`,
      date: pettyExpenseForm.date,
      type: 'Petty Cash Expense',
      party: pettyExpenseForm.category,
      debit: amount,
      credit: amount,
      balance: (dbData.transactions[dbData.transactions.length - 1]?.balance || 0),
      debitAccount: 'Cost of Goods Sold (Expense)',
      creditAccount: 'Petty Cash (Asset)',
      description: pettyExpenseForm.notes
    };

    const nextExpId = Math.max(0, ...(dbData.expenses || []).map(ex => parseInt(ex.id) || 0)) + 1;
    const newExpense = {
      id: nextExpId,
      date: pettyExpenseForm.date,
      category: pettyExpenseForm.category,
      amount,
      paymentMode: 'Petty Cash',
      description: pettyExpenseForm.notes || 'Petty Cash Disbursement'
    };

    saveDB({
      ...dbData,
      transactions: [...dbData.transactions, newTxn],
      expenses: [...(dbData.expenses || []), newExpense]
    });
    setShowPettyExpenseModal(false);
    setPettyExpenseForm({ date: new Date().toISOString().substring(0, 10), category: '', amount: '', notes: '' });
  };

  // ===== Trial Balance Handlers & Report Generator =====
  const getTrialBalanceAccounts = () => {
    const list = [];
    (dbData.accounts || []).forEach(a => {
      list.push({
        id: a.id,
        name: a.name,
        type: a.type,
        openingBalance: parseFloat(a.openingBalance) || 0
      });
    });

    (dbData.bankAccounts || []).forEach(b => {
      const exists = list.some(a => a.name.toLowerCase() === b.accountName.toLowerCase());
      if (!exists) {
        list.push({
          id: b.id,
          name: b.accountName,
          type: 'Asset',
          openingBalance: parseFloat(b.openingBalance) || 0
        });
      }
    });

    return list;
  };

  const getTrialBalanceReport = () => {
    const accounts = getTrialBalanceAccounts();
    let totalDebitsSum = 0;
    let totalCreditsSum = 0;

    const rows = accounts.map(a => {
      let totalDebit = 0;
      let totalCredit = 0;

      // 1. Process explicit transactions
      (dbData.transactions || []).forEach(t => {
        const amount = parseFloat(t.credit || t.debit || t.amount || 0);
        let dr = t.debitAccount;
        let cr = t.creditAccount;

        if (!dr || !cr) {
          if (t.type === 'Sale') {
            dr = dr || 'Accounts Receivable (Asset)';
            cr = cr || 'Sales Revenue (Income)';
          } else if (t.type === 'Purchase') {
            dr = dr || 'Cost of Goods Sold (Expense)';
            cr = cr || 'Cash in Hand (Asset)';
          }
        }

        const isTarget = (name) => {
          if (!name) return false;
          const n = name.toLowerCase();
          const target = a.name.toLowerCase();
          if (n === target) return true;
          if (target === 'cash in hand (asset)' || target === 'cash account') {
            if (n === 'cash in hand (asset)' || n === 'cash account' || n === 'cash') return true;
          }
          if (target === 'bank account (asset)' || target === 'bank/upi account') {
            if (n === 'bank account (asset)' || n === 'bank/upi account' || n === 'bank/upi account (asset)') return true;
          }
          return false;
        };

        if (isTarget(dr)) totalDebit += amount;
        if (isTarget(cr)) totalCredit += amount;
      });

      // 2. Process expenses
      (dbData.expenses || []).forEach(e => {
        const amount = parseFloat(e.amount) || 0;
        const paymentMode = (e.paymentMode || '').toLowerCase();
        
        const isCOGS = a.name.toLowerCase() === 'cost of goods sold (expense)' || a.name.toLowerCase() === 'expense account';
        if (isCOGS) {
          totalDebit += amount;
        }

        if (paymentMode === 'cash') {
          if (a.name.toLowerCase() === 'cash in hand (asset)' || a.name.toLowerCase() === 'cash account') {
            totalCredit += amount;
          }
        } else if (paymentMode === 'petty cash') {
          if (a.name.toLowerCase() === 'petty cash (asset)') {
            totalCredit += amount;
          }
        } else {
          if (a.name.toLowerCase() === 'bank account (asset)' || a.name.toLowerCase() === 'bank/upi account') {
            totalCredit += amount;
          }
        }
      });

      const opBal = parseFloat(a.openingBalance) || 0;
      let drCol = 0;
      let crCol = 0;

      if (a.type === 'Asset' || a.type === 'Expense') {
        const net = opBal + totalDebit - totalCredit;
        if (net >= 0) {
          drCol = net;
        } else {
          crCol = Math.abs(net);
        }
      } else {
        const net = opBal + totalCredit - totalDebit;
        if (net >= 0) {
          crCol = net;
        } else {
          drCol = Math.abs(net);
        }
      }

      totalDebitsSum += drCol;
      totalCreditsSum += crCol;

      return {
        name: a.name,
        type: a.type,
        openingBalance: opBal,
        debits: drCol,
        credits: crCol
      };
    });

    return {
      rows,
      totalDebits: totalDebitsSum,
      totalCredits: totalCreditsSum,
      isBalanced: Math.abs(totalDebitsSum - totalCreditsSum) < 0.01
    };
  };

  const handlePrintTrialBalance = () => {
    const printWindow = window.open('', '_blank');
    const report = getTrialBalanceReport();
    
    const rowsHtml = report.rows.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${r.type}</td>
        <td class="num">${r.debits > 0 ? fmt(r.debits) : '-'}</td>
        <td class="num">${r.credits > 0 ? fmt(r.credits) : '-'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Trial Balance - Vypar 2.0</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            h1 { margin-bottom: 5px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .num { text-align: right; }
            .total-row { font-weight: bold; background-color: #fafafa; }
            .status { font-weight: 600; padding: 8px 12px; display: inline-block; border-radius: 4px; margin-bottom: 20px; }
            .status-balanced { background-color: #e6f4ea; color: #137333; }
            .status-unbalanced { background-color: #fce8e6; color: #c5221f; }
          </style>
        </head>
        <body>
          <h1>Trial Balance Sheet</h1>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          
          <div class="status ${report.isBalanced ? 'status-balanced' : 'status-unbalanced'}">
            Status: ${report.isBalanced ? '✓ Balanced' : '⚠️ Unbalanced (Difference: ' + fmt(Math.abs(report.totalDebits - report.totalCredits)) + ')'}
          </div>

          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Account Type</th>
                <th class="num">Debit (Dr)</th>
                <th class="num">Credit (Cr)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="2">Grand Total</td>
                <td class="num">${fmt(report.totalDebits)}</td>
                <td class="num">${fmt(report.totalCredits)}</td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    let updatedOffers = [...(dbData.offers || [])];
    
    if (editingOffer) {
      const idx = updatedOffers.findIndex(o => o.id === editingOffer.id);
      if (idx !== -1) updatedOffers[idx] = { ...editingOffer, ...offerForm };
    } else {
      const newId = Math.max(0, ...updatedOffers.map(o => o.id)) + 1;
      updatedOffers.push({ ...offerForm, id: newId, usedCount: 0 });
    }
    
    saveDB({ ...dbData, offers: updatedOffers });
    setShowOfferModal(false);
    setEditingOffer(null);
    setOfferForm({ code: '', type: 'Percentage', value: 0, startDate: '', endDate: '', minBillAmount: 0, applicableCategory: '', applicableProduct: '', usageLimit: 0, isActive: true });
  };

  const handleOfferToggle = (id) => {
    if (viewOnly) return;
    let updatedOffers = (dbData.offers || []).map(o => o.id === id ? { ...o, isActive: !o.isActive } : o);
    saveDB({ ...dbData, offers: updatedOffers });
  };

  const deleteOffer = async (id) => {
    if (viewOnly || !await window.confirm('Delete this offer?')) return;
    let updatedOffers = (dbData.offers || []).filter(o => o.id !== id);
    saveDB({ ...dbData, offers: updatedOffers });
  };

  // Delete Handlers
  const deleteParty = async (id) => {
    if (viewOnly || !await window.confirm('Delete this party?')) return;
    try {
      const res = await fetch(`/api/parties/${encodeURIComponent(id)}?username=${encodeURIComponent(user.username)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Party deleted successfully');
        loadDB();
      } else {
        alert('Failed to delete party');
      }
    } catch {
      alert('Network error');
    }
  };

  const sendReminder = async (type, party, customMessage) => {
    try {
      const pid = party.id || party._id;
      const res = await fetch(`/api/parties/${encodeURIComponent(pid)}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: dbData.settings.username,
          type,
          message: customMessage
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(`Reminder sent via ${type.toUpperCase()} successfully!`);
      } else {
        alert(data.message || `Failed to send reminder via ${type.toUpperCase()}`);
      }
    } catch {
      alert('Network error sending reminder');
    }
  };

  const deleteSale = async (id) => {
    if (viewOnly || !await window.confirm('Delete this invoice?')) return;
    const updated = { ...dbData, sales: dbData.sales.filter(s => s.id !== id) };
    saveDB(updated);
  };

  // Sales Submit Handler
  const handleApplyOffer = () => {
    if (!saleDiscountCode.trim()) { setAppliedOffer(null); return; }
    const offer = (dbData.offers || []).find(o => o.code === saleDiscountCode.toUpperCase() && o.isActive);
    if (!offer) return alert('Invalid or inactive coupon code.');
    
    const today = new Date().toISOString().substring(0, 10);
    if (offer.startDate && today < offer.startDate) return alert('Offer not valid yet.');
    if (offer.endDate && today > offer.endDate) return alert('Offer has expired.');
    if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) return alert('Offer usage limit reached.');
    
    // Validate customer eligibility
    if (offer.applicableCustomer && offer.applicableCustomer.trim()) {
      if (saleCust.trim().toLowerCase() !== offer.applicableCustomer.trim().toLowerCase()) {
        return alert(`This offer is restricted to customer "${offer.applicableCustomer}".`);
      }
    }
    if (offer.applicableCustomerGroup && offer.applicableCustomerGroup.trim()) {
      const party = dbData.parties.find(p => p.name.toLowerCase() === saleCust.toLowerCase());
      const custGroup = party?.customerGroup || 'Retail';
      if (custGroup.toLowerCase() !== offer.applicableCustomerGroup.toLowerCase()) {
        return alert(`This offer is restricted to the "${offer.applicableCustomerGroup}" customer group.`);
      }
    }

    setAppliedOffer(offer);
    alert(`Offer ${offer.code} applied successfully!`);
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');

    const formTotals = getSaleFormTotals();
    const isComposition = dbData.settings?.gstScheme === 'Composition';

    const items = saleItems.filter(item => item.name.trim()).map(item => {
      const lineMath = calculateLineItem(item);
      return {
        ...item,
        qty: parseInt(item.qty) || 1,
        rate: parseFloat(item.rate) || 0,
        taxSlab: item.taxSlab || '18%',
        isTaxInclusive: item.isTaxInclusive === true || item.isTaxInclusive === 'true',
        hsnSac: item.hsnSac || '',
        subtotal: isComposition ? (parseInt(item.qty) || 1) * (parseFloat(item.rate) || 0) : lineMath.subtotal,
        taxAmount: isComposition ? 0 : lineMath.taxAmount,
        total: isComposition ? (parseInt(item.qty) || 1) * (parseFloat(item.rate) || 0) : lineMath.total
      };
    });

    if (items.length === 0) return alert('Please add at least one valid product.');

    const discountAmount = calculateOfferDiscount(appliedOffer, items, formTotals.total, saleCust);

    const grandTotal = Math.round(formTotals.total - discountAmount);
    const paidAmt = saleMode === 'Credit (Due)' 
      ? 0 
      : (salePaidAmount === '' ? grandTotal : (parseFloat(salePaidAmount) || 0));
    const dueAmt = grandTotal - paidAmt;

    // AI Limit warning simulation
    if (dueAmt > 0) {
      const party = dbData.parties.find(p => p.name.toLowerCase() === saleCust.toLowerCase());
      if (party && party.balance < -50000) {
        if (!await window.confirm(`⚠️ AI Warning: ${saleCust} already has outstanding dues (${fmt(Math.abs(party.balance))}). Proceed anyway?`)) return;
      }
    }

    const nextSaleId = Math.max(0, ...dbData.sales.map(s => parseInt(s.id.replace('INV-', '')) || 0)) + 1;
    const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '')) || 0)) + 1;

    const newSale = {
      id: `INV-${nextSaleId}`,
      customer: saleCust,
      date: saleDate,
      amount: grandTotal,
      mode: saleMode,
      status: paidAmt >= grandTotal ? 'Paid' : (paidAmt > 0 ? 'Partial' : 'Pending'),
      paymentReceived: paidAmt,
      balanceDue: dueAmt,
      notes: saleNotes,
      items: items,
      subtotal: formTotals.subtotal,
      taxAmount: formTotals.taxAmount,
      cgst: formTotals.cgst,
      sgst: formTotals.sgst,
      igst: formTotals.igst,
      discountCode: appliedOffer ? appliedOffer.code : '',
      discountAmount: discountAmount
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
      if (matched) {
        let newStock = Math.max(0, p.stock - matched.qty);
        let newBatches = p.batches || [];
        if (matched.batchNumber) {
          newBatches = (p.batches || []).map(b => {
            if (b.batchNumber === matched.batchNumber) {
              return { ...b, stock: Math.max(0, (Number(b.stock) || 0) - matched.qty) };
            }
            return b;
          });
        }
        let newSerialNumbers = p.serialNumbers || [];
        if (p.hasSerialTracking && matched.serialNumbers) {
          newSerialNumbers = (p.serialNumbers || []).filter(sn => !matched.serialNumbers.includes(sn));
          newStock = newSerialNumbers.length;
        }
        return { ...p, stock: newStock, batches: newBatches, serialNumbers: newSerialNumbers };
      }
      return p;
    });

    // Update customer balance based on due amount (handles credit advances as well as outstanding receivables)
    const updatedParties = dbData.parties.map(p => {
      if (p.name.toLowerCase() === saleCust.toLowerCase()) {
        return {
          ...p,
          balance: p.balance - dueAmt,
          lastTxn: saleDate
        };
      }
      return p;
    });

    const payload = { ...newSale, username: dbData.settings.username };
    fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          const updated = {
            ...dbData,
            products: updatedProducts,
            parties: updatedParties,
            sales: [...dbData.sales, payload],
            transactions: [...dbData.transactions, newTxn]
          };
          
          // Increment offer usage count if one was applied
          if (appliedOffer) {
            updated.offers = (dbData.offers || []).map(o => o.id === appliedOffer.id ? { ...o, usedCount: o.usedCount + 1 } : o);
          }
          saveDB(updated);

          loadDB();
          setShowSalesForm(false);
          setSaleItems([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '', batchNumber: '' }]);
          setSaleCust('');
          setSaleDate(() => new Date().toISOString().substring(0, 10));
          setSaleMode('Cash');
          setSaleNotes('');
          setSalePaidAmount('');
          setAppliedOffer(null);
          setSaleDiscountCode('');
        } else alert('Failed to create sale');
      })
      .catch(() => alert('Network error'));
  };

  // Purchase Submit Handler
  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');

    const formTotals = getPurFormTotals();
    const isComposition = dbData.settings?.gstScheme === 'Composition';

    const items = purItems.filter(item => item.name.trim()).map(item => {
      const lineMath = calculateLineItem(item);
      return {
        ...item,
        qty: parseInt(item.qty) || 1,
        rate: parseFloat(item.rate) || 0,
        discount: parseFloat(item.discount) || 0,
        taxSlab: item.taxSlab || '18%',
        isTaxInclusive: item.isTaxInclusive === true || item.isTaxInclusive === 'true',
        hsnSac: item.hsnSac || '',
        subtotal: lineMath.subtotal,
        taxAmount: isComposition ? 0 : lineMath.taxAmount,
        total: lineMath.total
      };
    });

    if (items.length === 0) return alert('Please add at least one valid product.');

    const grandTotal = Math.round(formTotals.total);

    const finalPur = {
      supplier: purSupp,
      date: purDate,
      amount: grandTotal,
      mode: purMode,
      status: purMode === 'Credit (Due)' ? 'Pending' : 'Paid',
      notes: purNotes,
      items: items,
      purchaseType: purType,
      additionalCharges: parseFloat(purAdditionalCharges) || 0,
      dueDate: purDueDate || '',
      subtotal: formTotals.subtotal,
      taxAmount: formTotals.taxAmount,
      cgst: formTotals.cgst,
      sgst: formTotals.sgst,
      igst: formTotals.igst,
      username: dbData.settings.username
    };

    if (editingPurchase) {
      const pid = editingPurchase.id || editingPurchase._id;
      fetch(`/api/purchases/${encodeURIComponent(pid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPur)
      })
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success') {
            loadDB();
            setShowPurchaseForm(false);
            setEditingPurchase(null);
            setPurItems([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '', discount: 0, unit: 'pcs' }]);
            setPurSupp('');
            setPurNotes('');
            setPurType('Purchase Invoice');
            setPurAdditionalCharges(0);
            setPurDueDate('');
          } else alert('Failed to update purchase');
        })
        .catch(() => alert('Network error'));
    } else {
      const nextPurId = Math.max(0, ...dbData.purchases.map(p => parseInt((p.id || '').replace('PO-', '')) || 0)) + 1;
      const newPur = {
        ...finalPur,
        id: `PO-${nextPurId}`
      };
      fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPur)
      })
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success') {
            loadDB();
            setShowPurchaseForm(false);
            setPurItems([{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '', discount: 0, unit: 'pcs', batchNumber: '', expiryDate: '' }]);
            setPurSupp('');
            setPurNotes('');
            setPurType('Purchase Invoice');
            setPurAdditionalCharges(0);
            setPurDueDate('');
          } else alert('Failed to create purchase');
        })
    }
  };

  // Delete purchase (soft) via API
  const deletePurchase = async (purchaseId) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!await window.confirm('Delete this purchase? This will mark it inactive.')) return;
    try {
      const res = await fetch(`/api/purchases/${encodeURIComponent(purchaseId)}`, { method: 'DELETE', headers: { 'Content-Type':'application/json' } });
      if (res.ok) { alert('Deleted'); loadDB(); } else alert('Failed to delete');
    } catch (err) { console.error(err); alert('Network error'); }
  };

  // Restore purchase via API
  const restorePurchase = async (purchase) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!await window.confirm('Restore this purchase?')) return;
    try {
      const pid = purchase.id || purchase._id;
      const payload = { ...purchase, active: true, username: dbData.settings?.username };
      delete payload._id;
      const res = await fetch(`/api/purchases/${encodeURIComponent(pid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Purchase restored successfully.');
        loadDB();
      } else {
        alert('Failed to restore purchase.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  // Delete product (soft)
  const deleteProduct = async (productId) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!await window.confirm('Delete this product? This will mark it inactive.')) return;
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
      if (res.ok) { alert('Deleted'); loadDB(); } else alert('Failed to delete');
    } catch (err) { console.error(err); alert('Network error'); }
  };

  // Restore product via API
  const restoreProduct = async (product) => {
    if (viewOnly) return alert('⛔ View-Only Mode');
    if (!await window.confirm('Restore this product?')) return;
    try {
      const pid = product.id || product._id;
      const payload = { ...product, active: true, username: dbData.settings?.username };
      delete payload._id;
      const res = await fetch(`/api/products/${encodeURIComponent(pid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Product restored successfully.');
        loadDB();
      } else {
        alert('Failed to restore product.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
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
  const [salesChartData, setSalesChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const username = dbData.settings?.username;
    if (!username) return;
    // fetch timeseries based on selected period
    fetch(`/api/revenue-timeseries?username=${encodeURIComponent(username)}&period=${encodeURIComponent(tsPeriod)}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setSalesChartData({ labels: d.labels, datasets: [{ label: 'Sales Revenue', data: d.data, borderColor: '#3b82f6', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 }] });
        }
      }).catch(() => {});
  }, [dbData.settings, tsPeriod]);

  const expenseChartData = {
    labels: ['Procurement', 'Tax (Estimated)', 'Operating'],
    datasets: [{
      data: [totalPurchases, totalSales * 0.18, 5000],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6']
    }]
  };

  const exportToExcelGstr1 = (month, salesList) => {
    const b2bData = [];
    salesList.forEach(s => {
      const party = dbData.parties.find(p => p.name === s.customer) || {};
      if (party.gstin) {
        (s.items || []).forEach(it => {
          b2bData.push({
            "Receiver GSTIN": party.gstin,
            "Receiver Name": party.name,
            "Invoice Number": s.id,
            "Invoice Date": s.date,
            "Invoice Value": s.amount,
            "Place Of Supply": party.state || dbData.settings?.state || "Karnataka",
            "Reverse Charge": "N",
            "Rate": it.gstRate || 18,
            "Taxable Value": it.total || 0,
            "CGST": s.cgst || 0,
            "SGST": s.sgst || 0,
            "IGST": s.igst || 0
          });
        });
      }
    });

    const b2csData = [];
    salesList.forEach(s => {
      const party = dbData.parties.find(p => p.name === s.customer) || {};
      if (!party.gstin) {
        (s.items || []).forEach(it => {
          b2csData.push({
            "Place Of Supply": party.state || dbData.settings?.state || "Karnataka",
            "Rate": it.gstRate || 18,
            "Taxable Value": it.total || 0,
            "CGST": s.cgst || 0,
            "SGST": s.sgst || 0,
            "IGST": s.igst || 0
          });
        });
      }
    });

    const hsnSummaryData = [];
    const hsnSalesSummary = {};
    salesList.forEach(s => {
      const isInterstate = (parseFloat(s.igst) || 0) > 0;
      (s.items || []).forEach(it => {
        const code = (it.hsnSac || '').trim() || 'N/A';
        const name = it.name || 'Unknown';
        const qty = parseFloat(it.qty) || 0;
        const totalVal = parseFloat(it.total) || 0;
        const gstRate = parseFloat(it.gstRate) || 18;
        const cgst = isInterstate ? 0 : totalVal * (gstRate / 200);
        const sgst = isInterstate ? 0 : totalVal * (gstRate / 200);
        const igst = isInterstate ? totalVal * (gstRate / 100) : 0;
        
        if (!hsnSalesSummary[code]) {
          hsnSalesSummary[code] = { code, description: name, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        }
        hsnSalesSummary[code].qty += qty;
        hsnSalesSummary[code].taxable += totalVal;
        hsnSalesSummary[code].cgst += cgst;
        hsnSalesSummary[code].sgst += sgst;
        hsnSalesSummary[code].igst += igst;
        hsnSalesSummary[code].total += (totalVal + cgst + sgst + igst);
      });
    });
    Object.values(hsnSalesSummary).forEach(h => {
      hsnSummaryData.push({
        "HSN": h.code,
        "Description": h.description,
        "UQC": "NOS",
        "Total Quantity": h.qty,
        "Total Value": h.total,
        "Taxable Value": h.taxable,
        "Integrated Tax Amount": h.igst,
        "Central Tax Amount": h.cgst,
        "State/UT Tax Amount": h.sgst
      });
    });

    const wb = XLSX.utils.book_new();
    const wsB2B = XLSX.utils.json_to_sheet(b2bData.length ? b2bData : [{"Status": "No B2B Invoices"}]);
    const wsB2CS = XLSX.utils.json_to_sheet(b2csData.length ? b2csData : [{"Status": "No B2CS Invoices"}]);
    const wsHSN = XLSX.utils.json_to_sheet(hsnSummaryData.length ? hsnSummaryData : [{"Status": "No HSN Data"}]);

    XLSX.utils.book_append_sheet(wb, wsB2B, "b2b");
    XLSX.utils.book_append_sheet(wb, wsB2CS, "b2cs");
    XLSX.utils.book_append_sheet(wb, wsHSN, "hsn");

    XLSX.writeFile(wb, `gstr1_portal_${month}.xlsx`);
  };

  const exportGstr1Json = (month, salesList) => {
    const b2bArray = [];
    const buyerInvoices = {};
    salesList.forEach(s => {
      const party = dbData.parties.find(p => p.name === s.customer) || {};
      if (party.gstin) {
        if (!buyerInvoices[party.gstin]) {
          buyerInvoices[party.gstin] = [];
        }
        buyerInvoices[party.gstin].push(s);
      }
    });

    Object.entries(buyerInvoices).forEach(([ctin, invoices]) => {
      const invs = invoices.map(s => {
        const party = dbData.parties.find(p => p.name === s.customer) || {};
        const itms = (s.items || []).map((it, i) => ({
          num: i + 1,
          itm_det: {
            ty: "G",
            hsn_sc: it.hsnSac || "8471",
            txval: Math.round(it.subtotal * 100) / 100,
            rt: parseFloat(it.gstRate) || 18,
            iamt: Math.round((s.igst > 0 ? it.taxAmount : 0) * 100) / 100,
            camt: Math.round((s.cgst > 0 ? it.taxAmount / 2 : 0) * 100) / 100,
            samt: Math.round((s.sgst > 0 ? it.taxAmount / 2 : 0) * 100) / 100,
            csamt: 0
          }
        }));
        return {
          inum: s.id,
          idt: s.date,
          val: s.amount,
          pos: party.state ? "29" : "29",
          rchrg: "N",
          inv_typ: "R",
          itms
        };
      });
      b2bArray.push({ ctin, invs });
    });

    const payload = {
      gstin: dbData.settings?.gstin || "27AAPCS1234M1Z2",
      fp: month.replace('-', ''),
      b2b: b2bArray
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gstr1_${month}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToExcelGstr2 = (month, purchaseList) => {
    const b2bData = [];
    purchaseList.forEach(p => {
      const party = dbData.parties.find(pt => pt.name === p.supplier) || {};
      (p.items || []).forEach(it => {
        b2bData.push({
          "Supplier GSTIN": party.gstin || "UNREGISTERED",
          "Supplier Name": p.supplier,
          "Bill Number": p.id,
          "Bill Date": p.date,
          "Invoice Value": p.amount,
          "Reverse Charge": "N",
          "Rate": it.gstRate || 18,
          "Taxable Value": it.total || 0,
          "CGST Credit": p.cgst || 0,
          "SGST Credit": p.sgst || 0,
          "IGST Credit": p.igst || 0
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const wsB2B = XLSX.utils.json_to_sheet(b2bData.length ? b2bData : [{"Status": "No Inward Supplies"}]);
    XLSX.utils.book_append_sheet(wb, wsB2B, "inward_b2b");
    XLSX.writeFile(wb, `gstr2_portal_${month}.xlsx`);
  };

  const exportToExcelGstr3B = (month, summary) => {
    const data = [
      { "Table Details": "Table 3.1: Outward taxable supplies (other than zero rated)", "Taxable Value": summary.salesTaxable, "IGST": summary.salesIgst, "CGST": summary.salesCgst, "SGST": summary.salesSgst },
      { "Table Details": "Table 4: Eligible Input Tax Credit (ITC) - All other ITC", "Taxable Value": summary.purTaxable, "IGST": summary.purIgst, "CGST": summary.purCgst, "SGST": summary.purSgst },
      { "Table Details": "Table 5: Net GST Payable (Offset)", "Taxable Value": "-", "IGST": summary.salesIgst - summary.purIgst, "CGST": summary.salesCgst - summary.purCgst, "SGST": summary.salesSgst - summary.purSgst }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "gstr3b_consolidated");
    XLSX.writeFile(wb, `gstr3b_portal_${month}.xlsx`);
  };

  const exportToExcelCMP08 = (quarter, summary) => {
    const data = [
      { "Details": "1. Outward Supplies (Turnover including non-GST & exempt)", "Value (Rs.)": summary.turnover },
      { "Details": "2. Flat Tax Rate Applicable", "Value (Rs.)": summary.rateText },
      { "Details": "3. Integrated Tax (IGST) Payable", "Value (Rs.)": summary.igst },
      { "Details": "4. Central Tax (CGST) Payable", "Value (Rs.)": summary.cgst },
      { "Details": "5. State/UT Tax (SGST) Payable", "Value (Rs.)": summary.sgst },
      { "Details": "Total Composition Tax Payable", "Value (Rs.)": summary.totalTax }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "cmp08_composition");
    XLSX.writeFile(wb, `cmp08_portal_${quarter.replace(/\s+/g, '_')}.xlsx`);
  };

  const getCalendarDeadlines = () => {
    const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
    const calendarDeadlines = [];
    months.forEach((m) => {
      const year = m.split('-')[0];
      const monthIdx = parseInt(m.split('-')[1]);
      
      let nextMonth = monthIdx + 1;
      let nextYear = parseInt(year);
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      const g1Due = `${nextYear}-${String(nextMonth).padStart(2, '0')}-11`;
      calendarDeadlines.push({
        id: `GSTR1-${m}`,
        type: 'GSTR-1 (Outward Sales)',
        period: m,
        dueDate: g1Due,
        frequency: 'Monthly'
      });

      const g3Due = `${nextYear}-${String(nextMonth).padStart(2, '0')}-20`;
      calendarDeadlines.push({
        id: `GSTR3B-${m}`,
        type: 'GSTR-3B (Consolidated Return)',
        period: m,
        dueDate: g3Due,
        frequency: 'Monthly'
      });

      if (monthIdx === 3 || monthIdx === 6 || monthIdx === 9 || monthIdx === 12) {
        let qName = '';
        let cmpDue = '';
        if (monthIdx === 3) {
          qName = `${year} Q4 (Jan-Mar)`;
          cmpDue = `${year}-04-18`;
        } else if (monthIdx === 6) {
          qName = `${year} Q1 (Apr-Jun)`;
          cmpDue = `${year}-07-18`;
        } else if (monthIdx === 9) {
          qName = `${year} Q2 (Jul-Sep)`;
          cmpDue = `${year}-10-18`;
        } else if (monthIdx === 12) {
          qName = `${year} Q3 (Oct-Dec)`;
          cmpDue = `${parseInt(year) + 1}-01-18`;
        }
        calendarDeadlines.push({
          id: `CMP08-${m}`,
          type: 'Form CMP-08 (Composition Statement)',
          period: qName,
          dueDate: cmpDue,
          frequency: 'Quarterly'
        });
      }
    });
    return calendarDeadlines.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  };

  const reorderList = dbData.products.filter(p => p.active !== false && p.stock <= 5);

  // Global search filtered lists — powered by Topbar search bar
  const q = (globalSearch || '').toLowerCase().trim();
  const filteredProducts = q
    ? dbData.products.filter(p =>
        p.active !== false && (
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.hsnSac || '').toLowerCase().includes(q)
        )
      )
    : dbData.products.filter(p => p.active !== false);
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
      <Toaster position="top-right" />
      {['staff','subscription','invoices','settings'].includes(currentView) ? (
        currentView === 'staff' ? <Staff /> : currentView === 'subscription' ? <Subscription /> : currentView === 'invoices' ? <Invoices /> : <Settings />
      ) : null}
      {/* ==================== MODULE 1: DASHBOARD ==================== */}
      {currentView === 'dashboard' && (
        <section className="view active" id="view-dashboard">
          <div className="sec-header">
            <h2>Business Overview</h2>
            <p>Welcome back! Here's what's happening with your store today.</p>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>Quick Action Buttons:</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn--primary" onClick={() => { setCurrentView('sales'); setShowSalesForm(true); }}>➕ New Sale Bill</button>
              <button className="btn" onClick={() => { setCurrentView('purchase'); setShowPurchaseForm(true); }}>➕ New Purchase</button>
              <button className="btn" onClick={() => setShowProductModal(true)}>➕ Add Product</button>
              <button className="btn" onClick={() => setShowPartyModal(true)}>➕ Add Party</button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('salesToday')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--g"><i className="fas fa-coins"></i></div>
              </div>
              <div className="stat__val" style={{ color: '#10b981' }}><AnimatedNumber value={salesToday} duration={900} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Sales Today</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('salesWeek')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--g"><i className="fas fa-calendar-week"></i></div>
              </div>
              <div className="stat__val" style={{ color: '#10b981' }}><AnimatedNumber value={salesWeek} duration={900} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Sales This Week</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('salesMonth')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--g"><i className="fas fa-calendar-days"></i></div>
              </div>
              <div className="stat__val" style={{ color: '#10b981' }}><AnimatedNumber value={salesMonth} duration={900} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Sales This Month</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => { setDashboardDetailType('profit'); setDetailModalTab('sales'); }}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--y"><i className="fas fa-chart-line"></i></div>
              </div>
              <div className="stat__val" style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}><AnimatedNumber value={profit} duration={1200} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Profit (Revenue - Expenses)</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('receivables')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--o"><i className="fas fa-file-invoice"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={totalPendingReceivables} duration={1200} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Pending Payments (Receivables)</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => { setDashboardDetailType('payables'); setDetailModalTab('purchases'); }}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--p"><i className="fas fa-hand-paper"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={totalOutstandingPayables} duration={1200} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Outstanding Dues (Payables)</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('expensesToday')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--r"><i className="fas fa-arrow-trend-down"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={expensesToday} duration={900} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Expenses Today</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('expensesMonth')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--r"><i className="fas fa-calendar-day"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={expensesMonth} duration={900} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Expenses This Month</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('customers')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--b"><i className="fas fa-users"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={totalCustomers} duration={800} formatter={v => Math.round(v)} /></div>
              <div className="stat__lbl">Total Customers Count</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('suppliers')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--g"><i className="fas fa-truck-field"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={totalSuppliers} duration={800} formatter={v => Math.round(v)} /></div>
              <div className="stat__lbl">Total Suppliers Count</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('lowStock')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--y"><i className="fas fa-triangle-exclamation"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={lowStockAlertsCount} duration={800} formatter={v => Math.round(v)} /></div>
              <div className="stat__lbl">Low Stock Alerts Count</div>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setDashboardDetailType('outOfStock')}>
              <div className="stat__top">
                <div className="stat__icon stat__icon--r"><i className="fas fa-circle-xmark"></i></div>
              </div>
              <div className="stat__val"><AnimatedNumber value={outOfStockCount} duration={800} formatter={v => Math.round(v)} /></div>
              <div className="stat__lbl">Out of Stock Items Count</div>
            </div>
          </div>

          {/* ==================== TOTAL REVENUE LINE CHART ==================== */}
          <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
            <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: 'none' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-1)' }}>Total Revenue Chart (daily / weekly / monthly)</span>
              <div className="tab-heads" style={{ display: 'flex', gap: '6px' }}>
                <button className={`btn btn--sm ${revenueChartPeriod === 'daily' ? 'btn--primary' : ''}`} onClick={() => setRevenueChartPeriod('daily')}>Daily</button>
                <button className={`btn btn--sm ${revenueChartPeriod === 'weekly' ? 'btn--primary' : ''}`} onClick={() => setRevenueChartPeriod('weekly')}>Weekly</button>
                <button className={`btn btn--sm ${revenueChartPeriod === 'monthly' ? 'btn--primary' : ''}`} onClick={() => setRevenueChartPeriod('monthly')}>Monthly</button>
              </div>
            </div>
            <div style={{ height: '280px' }}>
              <Line 
                data={revenueChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `Revenue: ${fmt(context.parsed.y)}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      grid: { color: 'var(--border)' },
                      ticks: {
                        color: 'var(--text-3)',
                        callback: (value) => fmt(value)
                      }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: 'var(--text-3)' }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="two-col" style={{ marginTop: '18px' }}>
            <div className="card chart-area card--lift" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('reports')}>
              <div className="card__head">
                <span>Top Selling Products (Chart)</span>
                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}></i>
              </div>
              <div style={{ height: '240px' }}><Bar data={topSellingChartData} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutCubic' }, plugins: { legend: { display: false } } }} /></div>
            </div>
            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('sales')}>
              <div className="card__head">
                <span>Total Orders & Delivery Status</span>
                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}></i>
              </div>
              <div style={{ padding: '12px', display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', color: 'var(--text-2)' }}>Total Orders (Pending / Completed / Cancelled)</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    <li style={{ padding: '6px 0' }}>Pending: <strong><AnimatedNumber value={Number(deliveryStatusSummary.pending)||0} duration={600} formatter={v=>Math.round(v)} /></strong></li>
                    <li style={{ padding: '6px 0' }}>Completed: <strong><AnimatedNumber value={Number(deliveryStatusSummary.completed)||0} duration={600} formatter={v=>Math.round(v)} /></strong></li>
                    <li style={{ padding: '6px 0' }}>Cancelled: <strong><AnimatedNumber value={Number(deliveryStatusSummary.cancelled)||0} duration={600} formatter={v=>Math.round(v)} /></strong></li>
                  </ul>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--border)' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', color: 'var(--text-2)' }}>Total Delivery Status Summary</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    <li style={{ padding: '6px 0' }}>Pending: <strong><AnimatedNumber value={Number(deliveryStatusSummary.pending)||0} duration={600} formatter={v=>Math.round(v)} /></strong></li>
                    <li style={{ padding: '6px 0' }}>Completed: <strong><AnimatedNumber value={Number(deliveryStatusSummary.completed)||0} duration={600} formatter={v=>Math.round(v)} /></strong></li>
                    <li style={{ padding: '6px 0' }}>Cancelled: <strong><AnimatedNumber value={Number(deliveryStatusSummary.cancelled)||0} duration={600} formatter={v=>Math.round(v)} /></strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="two-col" style={{ marginTop: '20px' }}>
            <div className="card">
              <div className="card__head" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('transactions')}>
                <span>Recent Transactions Feed</span>
                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}></i>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px' }}>
                <input className="fi" placeholder="Filter transactions..." value={txFilter} onChange={e=>setTxFilter(e.target.value)} style={{ width: 240 }} />
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
                  {dbData.transactions.filter(tt => !txFilter.trim() || JSON.stringify(tt).toLowerCase().includes(txFilter.toLowerCase())).slice(0, 5).map((t, idx) => (
                    <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setCurrentView('transactions')}>
                      <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                      <td><span className={`badge ${t.type === 'Sale' ? 'badge--green' : 'badge--blue'}`}>{t.type}</span></td>
                      <td>{t.party}</td>
                      <td style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.credit || t.debit) || 0} duration={700} formatter={v => fmt(Math.round(v))} /></td>
                      <td><span className={`badge ${t.credit ? 'badge--green' : 'badge--red'}`}>{t.credit ? 'Credit' : 'Debit'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('transactions')}>
              <div className="card__head">
                <span>Cash Flow Summary (In / Out)</span>
                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}></i>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500 }}>Total Cash In (Inflow)</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    <AnimatedNumber value={cashIn} duration={800} formatter={v => fmt(Math.round(v))} />
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500 }}>Total Cash Out (Outflow)</span>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    <AnimatedNumber value={cashOut} duration={800} formatter={v => fmt(Math.round(v))} />
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Net Cash Flow</span>
                  <span style={{ color: (cashIn - cashOut) >= 0 ? '#10b981' : '#ef4444' }}>
                    <AnimatedNumber value={cashIn - cashOut} duration={800} formatter={v => fmt(Math.round(v))} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="two-col" style={{ marginTop: '20px' }}>
            <div className="card">
              <div className="card__head" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('invoices')}>
                <span>Recent Invoices List</span>
                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}></i>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoicesList.length ? (
                    recentInvoicesList.map((inv, idx) => (
                      <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setCurrentView('invoices')}>
                        <td style={{ fontWeight: 600, color: 'var(--blue)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveInvoice(inv); }}>{inv.id || inv.invoiceNumber}</td>
                        <td>{inv.customer}</td>
                        <td style={{ color: 'var(--text-3)' }}>{inv.date}</td>
                        <td style={{ fontWeight: 600 }}><AnimatedNumber value={Number(inv.amount) || 0} duration={700} formatter={v => fmt(Math.round(v))} /></td>
                        <td><span className={`badge ${inv.status === 'Paid' || inv.status === 'Completed' ? 'badge--green' : 'badge--yellow'}`}>{inv.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '16px' }}>No invoices created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card card--lift" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('parties')}>
              <div className="card__head">
                <span>Top Customers (by Purchase Value)</span>
                <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}></i>
              </div>
              <div style={{ padding: '12px' }}>
                {topCustomers.length ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {topCustomers.slice(0, 5).map((c, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--muted)' }}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ color: 'var(--text-2)' }}><AnimatedNumber value={Number(c.total) || 0} duration={700} formatter={v => fmt(Math.round(v))} /></div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-3)', padding: '8px 0' }}>No customer purchases yet.</p>
                )}
              </div>
            </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowSalesCamera(!showSalesCamera)}>
                    <i className="fas fa-camera"></i> Scan Item
                  </button>
                  <button className="btn--icon" onClick={() => { setShowSalesForm(false); setShowSalesCamera(false); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
                </div>
              </div>
              {showSalesCamera && (
                <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                  <BarcodeScannerCamera
                    onScan={(code) => {
                      const prod = dbData.products.find(p => p.active !== false && (p.barcode === code || String(p.sku) === code));
                      if (prod) {
                        setSaleItems(prev => {
                          const copy = [...prev];
                          const last = copy[copy.length - 1];
                          if (last && !last.name.trim()) {
                            copy.pop(); // remove empty row
                          }
                          const existingIdx = copy.findIndex(item => item.name === prod.name);
                          if (existingIdx >= 0) {
                            copy[existingIdx].qty = Number(copy[existingIdx].qty) + 1;
                          } else {
                            copy.push({ name: prod.name, qty: 1, rate: prod.price || 0, taxSlab: prod.taxSlab || '18%', isTaxInclusive: prod.isTaxInclusive || false, hsnSac: prod.hsnSac || '' });
                          }
                          return copy;
                        });
                      } else {
                        alert(`Product with barcode ${code} not found!`);
                      }
                      setShowSalesCamera(false);
                    }}
                    onError={(err) => alert('Camera error: ' + (err?.message || 'Access denied'))}
                    onClose={() => setShowSalesCamera(false)}
                  />
                </div>
              )}
              <form onSubmit={handleSalesSubmit}>
                <div className="form-row form-row-3">
                  <div className="fg"><label>Customer Name</label>
                    <input className="fi" placeholder="Customer name" value={saleCust} onChange={(e) => setSaleCust(e.target.value)} required list="customers-datalist" />
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
                      <th>Product</th>
                      <th style={{ width: '120px' }}>Batch / Lot</th>
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
                            {(() => {
                              const prodMatch = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === item.name.toLowerCase());
                              if (prodMatch && prodMatch.hasSerialTracking) {
                                return (
                                  <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    style={{ width: '100%', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                                    onClick={() => {
                                      setSerialSelectRowIdx(idx);
                                      setSerialSelectTempList(item.serialNumbers || []);
                                    }}
                                  >
                                    {(item.serialNumbers || []).length > 0 ? `${(item.serialNumbers || []).length} Serials` : 'Select Serials'}
                                  </button>
                                );
                              }
                              const hasBatches = prodMatch && Array.isArray(prodMatch.batches) && prodMatch.batches.length > 0;
                              if (hasBatches) {
                                return (
                                  <select
                                    className="fi"
                                    value={item.batchNumber || ''}
                                    onChange={(e) => {
                                      const bNum = e.target.value;
                                      const copy = [...saleItems];
                                      copy[idx].batchNumber = bNum;
                                      const bMatch = prodMatch.batches.find(b => b.batchNumber === bNum);
                                      if (bMatch) {
                                        copy[idx].rate = bMatch.sellingPrice || prodMatch.price || 0;
                                        copy[idx].expiryDate = bMatch.expiryDate || '';
                                      }
                                      setSaleItems(copy);
                                    }}
                                    required
                                  >
                                    <option value="">-- Batch --</option>
                                    {prodMatch.batches.map(b => (
                                      <option key={b.batchNumber} value={b.batchNumber} disabled={b.stock <= 0}>
                                        {b.batchNumber} (Qty: {b.stock})
                                      </option>
                                    ))}
                                  </select>
                                );
                              }
                              return (
                                <input
                                  className="fi"
                                  placeholder="N/A"
                                  value={item.batchNumber || ''}
                                  onChange={(e) => {
                                    const copy = [...saleItems];
                                    copy[idx].batchNumber = e.target.value;
                                    setSaleItems(copy);
                                  }}
                                />
                              );
                            })()}
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
                            {(() => {
                              const prodMatch = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === item.name.toLowerCase());
                              if (prodMatch && prodMatch.hasSerialTracking) {
                                return (
                                  <input
                                    type="number"
                                    className="fi"
                                    value={item.qty}
                                    disabled
                                    style={{ background: 'var(--border)' }}
                                  />
                                );
                              }
                              return (
                                <input
                                  type="number"
                                  className="fi"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const prodMatch = dbData.products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                                    let val = parseInt(e.target.value) || 1;
                                    if (prodMatch && item.batchNumber) {
                                      const bMatch = (prodMatch.batches || []).find(b => b.batchNumber === item.batchNumber);
                                      if (bMatch && val > bMatch.stock) {
                                        alert(`Only ${bMatch.stock} units available in Batch ${item.batchNumber}`);
                                        val = bMatch.stock;
                                      }
                                    }
                                    const copy = [...saleItems];
                                    copy[idx].qty = val;
                                    setSaleItems(copy);
                                  }}
                                />
                              );
                            })()}
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
                          <td style={{ fontWeight: 500 }}><AnimatedNumber value={Number(lineMath.taxAmount) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></td>
                          <td style={{ fontWeight: 600 }}><AnimatedNumber value={Number(lineMath.total) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></td>
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
                    
                    <div className="fg" style={{ marginTop: '16px' }}><label>Apply Offer Code</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="fi" placeholder="Enter code" value={saleDiscountCode} onChange={(e) => setSaleDiscountCode(e.target.value)} style={{ maxWidth: '200px' }} />
                        <button type="button" className="btn" onClick={handleApplyOffer}>Apply</button>
                        {appliedOffer && (
                          <button type="button" className="btn" style={{ color: 'var(--red)' }} onClick={() => { setAppliedOffer(null); setSaleDiscountCode(''); }}>Remove</button>
                        )}
                      </div>
                      {appliedOffer && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px' }}><i className="fas fa-check-circle"></i> Offer {appliedOffer.code} applied!</div>}
                    </div>

                    <div className="fg" style={{ marginTop: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isManualTaxSplit}
                          onChange={(e) => setIsManualTaxSplit(e.target.checked)}
                        />
                        Manual Tax Split Override
                      </label>
                      {isManualTaxSplit && (
                        <select
                          className="fi"
                          value={manualTaxType}
                          onChange={(e) => setManualTaxType(e.target.value)}
                          style={{ marginTop: '6px', maxWidth: '200px', padding: '4px 8px' }}
                        >
                          <option value="Local">Local (CGST + SGST)</option>
                          <option value="Interstate">Interstate (IGST)</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div style={{ width: '320px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {(() => {
                      const t = getSaleFormTotals();
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span>Subtotal:</span>
                            <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.subtotal) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                          </div>
                          {t.isLocal ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>CGST:</span>
                                <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.cgst) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>SGST:</span>
                                <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.sgst) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                              <span>IGST:</span>
                              <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.igst) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '6px' }}>
                            <span>Total Tax:</span>
                            <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.taxAmount) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                          </div>
                          
                          {appliedOffer && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--primary)', marginBottom: '6px' }}>
                              <span>Discount applied ({appliedOffer.code}):</span>
                              <span style={{ fontWeight: 600 }}>- {fmt(calculateOfferDiscount(appliedOffer, saleItems, t.total, saleCust))}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>
                            <span>Grand Total:</span>
                            <span>
                              {(() => {
                                const discount = calculateOfferDiscount(appliedOffer, saleItems, t.total, saleCust);
                                const dt = Math.max(0, Math.round(t.total - discount));
                                return fmt(dt);
                              })()}
                            </span>
                          </div>

                          {/* Partial payment and UPI QR code at billing */}
                          {saleMode !== 'Credit (Due)' && (
                            <div className="fg" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-3)' }}>Amount Paid</label>
                              <input 
                                type="number" 
                                className="fi" 
                                value={salePaidAmount} 
                                onChange={(e) => setSalePaidAmount(e.target.value)} 
                                placeholder="Leave empty for full payment" 
                                style={{ marginTop: '4px', fontSize: '12px', padding: '6px' }}
                              />
                            </div>
                          )}

                          {saleMode === 'UPI' && (
                            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Scan to Pay via UPI</span>
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(`upi://pay?pa=${dbData.settings?.upiId || 'merchant@upi'}&pn=${encodeURIComponent(dbData.settings?.businessName || 'Merchant')}&am=${(() => {
                                  const discount = calculateOfferDiscount(appliedOffer, saleItems, t.total, saleCust);
                                  const grandTotal = Math.max(0, Math.round(t.total - discount));
                                  return salePaidAmount !== '' ? (parseFloat(salePaidAmount) || grandTotal) : grandTotal;
                                })()}&cu=INR`)}`}
                                alt="UPI QR Code" 
                                style={{ width: '110px', height: '110px', borderRadius: '4px', border: '4px solid #fff' }}
                              />
                              <span style={{ fontSize: '10px', color: 'var(--text-2)', display: 'block', marginTop: '4px' }}>UPI ID: {dbData.settings?.upiId || 'merchant@upi'}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}><i className="fas fa-check"></i> Save Invoice</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div />
            <div>
              <button className={`btn btn--sm ${useServerPaginationSales ? 'btn--primary' : ''}`} onClick={() => setUseServerPaginationSales(s => !s)}>{useServerPaginationSales ? 'Use Local Data' : 'Use Server Pagination'}</button>
            </div>
          </div>
          {useServerPaginationSales ? (
            <div style={{ marginTop: '8px' }}>
              <PaginatedList type="sales" />
            </div>
          ) : (
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
                      <td style={{ fontWeight: 600 }}><AnimatedNumber value={Number(s.amount) || 0} duration={700} formatter={v => fmt(Math.round(v))} /></td>
                      <td><span className={`badge ${s.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{s.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn--icon" onClick={() => deleteSale(s.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => { fetch(`/api/purchase-report?username=${user.username}`).then(r=>r.json()).then(d=>setPurchaseReportData(d)).catch(()=>{}); }}><i className="fas fa-chart-pie"></i> Report</button>
              <button className="btn btn--primary" onClick={() => { setEditingPurchase(null); setShowPurchaseForm(true); }}><i className="fas fa-plus"></i> New Purchase</button>
            </div>
          </div>

          {/* Purchase Report Cards */}
          {purchaseReportData && (
            <div style={{ marginBottom: 16 }}>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 12 }}>
                <div className="card card--lift" style={{ padding: 16 }}><div className="stat__val"><AnimatedNumber value={Number(purchaseReportData.totalPurchases||0)} duration={900} formatter={v => fmt(Math.round(v))} /></div><div className="stat__lbl">Total Purchases</div></div>
                <div className="card card--lift" style={{ padding: 16 }}><div className="stat__val"><AnimatedNumber value={Number(purchaseReportData.monthPurchases||0)} duration={900} formatter={v => fmt(Math.round(v))} /></div><div className="stat__lbl">This Month</div></div>
                <div className="card card--lift" style={{ padding: 16 }}><div className="stat__val"><AnimatedNumber value={Number(purchaseReportData.weekPurchases||0)} duration={900} formatter={v => fmt(Math.round(v))} /></div><div className="stat__lbl">This Week</div></div>
                <div className="card card--lift" style={{ padding: 16 }}><div className="stat__val" style={{ color: 'var(--red)' }}><AnimatedNumber value={Number(purchaseReportData.pendingDues||0)} duration={900} formatter={v => fmt(Math.round(v))} /></div><div className="stat__lbl">Pending Dues</div></div>
              </div>
              {purchaseReportData.supplierDues && purchaseReportData.supplierDues.length > 0 && (
                <div className="card" style={{ marginBottom: 12, padding: 16 }}>
                  <div className="card__head"><span>Supplier Payment Dues</span></div>
                  <table className="tbl"><thead><tr><th>Supplier</th><th>Outstanding</th><th>Phone</th></tr></thead><tbody>
                    {purchaseReportData.supplierDues.map((s, i) => (
                      <tr 
                        key={i} 
                        style={{ cursor: 'pointer' }} 
                        className="tr-hoverable"
                        onClick={() => setPurchaseSearch(s.name)}
                        title={`Click to filter purchases by ${s.name}`}
                      >
                        <td style={{ fontWeight: 600, color: 'var(--blue)' }}><i className="fas fa-search" style={{ fontSize: 11, marginRight: 6 }}></i> {s.name}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 600 }}><AnimatedNumber value={Number(s.balance)||0} duration={700} formatter={v => fmt(Math.round(v))} /></td>
                        <td style={{ color: 'var(--text-3)' }}>{s.phone}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
              <button className="btn btn--sm" onClick={() => setPurchaseReportData(null)} style={{ marginBottom: 8 }}><i className="fas fa-xmark"></i> Close Report</button>
            </div>
          )}

          {showPurchaseForm && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="modal__top">
                <h3>{editingPurchase ? 'Edit Purchase' : 'New Purchase Entry'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowPurchaseCamera(!showPurchaseCamera)}>
                    <i className="fas fa-camera"></i> Scan Item
                  </button>
                  <button className="btn--icon" onClick={() => { setShowPurchaseForm(false); setEditingPurchase(null); setShowPurchaseCamera(false); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
                </div>
              </div>
              {showPurchaseCamera && (
                <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                  <BarcodeScannerCamera
                    onScan={(code) => {
                      const prod = dbData.products.find(p => p.active !== false && (p.barcode === code || String(p.sku) === code));
                      if (prod) {
                        setPurItems(prev => {
                          const copy = [...prev];
                          const last = copy[copy.length - 1];
                          if (last && !last.name.trim()) {
                            copy.pop(); // remove empty row
                          }
                          const existingIdx = copy.findIndex(item => item.name === prod.name);
                          if (existingIdx >= 0) {
                            copy[existingIdx].qty = Number(copy[existingIdx].qty) + 1;
                          } else {
                            copy.push({ name: prod.name, qty: 1, rate: prod.purchasePrice || prod.price || 0, taxSlab: prod.taxSlab || '18%', isTaxInclusive: prod.isTaxInclusive || false, hsnSac: prod.hsnSac || '', discount: 0, unit: prod.unit || 'pcs' });
                          }
                          return copy;
                        });
                      } else {
                        alert(`Product with barcode ${code} not found!`);
                      }
                      setShowPurchaseCamera(false);
                    }}
                    onError={(err) => alert('Camera error: ' + (err?.message || 'Access denied'))}
                    onClose={() => setShowPurchaseCamera(false)}
                  />
                </div>
              )}
              <form onSubmit={handlePurchaseSubmit}>
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <div className="fg"><label>Purchase Type</label>
                    <select className="fi" value={purType} onChange={(e) => setPurType(e.target.value)}>
                      <option>Purchase Invoice</option>
                      <option>Purchase Return</option>
                      <option>Purchase Order</option>
                      <option>Debit Note</option>
                    </select>
                  </div>
                  <div className="fg"><label>Due Date</label>
                    <input type="date" className="fi" value={purDueDate} onChange={(e) => setPurDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="fg"><label>Supplier Name</label>
                    <input className="fi" placeholder="Supplier name" value={purSupp} onChange={(e) => setPurSupp(e.target.value)} required list="suppliers-datalist" />
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
                      <th style={{ width: '90px' }}>Batch</th>
                      <th style={{ width: '100px' }}>Expiry</th>
                      <th style={{ width: '90px' }}>HSN/SAC</th>
                      <th style={{ width: '70px' }}>Qty</th>
                      <th style={{ width: '100px' }}>Rate ({getCurrencySymbol()})</th>
                      <th style={{ width: '80px' }}>Discount</th>
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
                            {(() => {
                              const prodMatch = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === item.name.toLowerCase());
                              if (prodMatch && prodMatch.hasSerialTracking) {
                                return (
                                  <textarea
                                    className="fi"
                                    rows={2}
                                    style={{ fontSize: 11, padding: '4px 6px', minWidth: 120 }}
                                    placeholder="Serials (comma or line separated)"
                                    value={(item.serialNumbers || []).join(', ')}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      const serials = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                                      const copy = [...purItems];
                                      copy[idx].serialNumbers = serials;
                                      copy[idx].qty = serials.length;
                                      setPurItems(copy);
                                    }}
                                    required
                                  />
                                );
                              }
                              return (
                                <input
                                  className="fi"
                                  placeholder="Batch"
                                  value={item.batchNumber || ''}
                                  onChange={(e) => {
                                    const copy = [...purItems];
                                    copy[idx].batchNumber = e.target.value;
                                    setPurItems(copy);
                                  }}
                                />
                              );
                            })()}
                          </td>
                          <td>
                            {(() => {
                              const prodMatch = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === item.name.toLowerCase());
                              if (prodMatch && prodMatch.hasSerialTracking) {
                                return <span style={{ fontSize: 11, color: 'var(--text-3)' }}>N/A (Serial)</span>;
                              }
                              return (
                                <input
                                  type="date"
                                  className="fi"
                                  value={item.expiryDate || ''}
                                  onChange={(e) => {
                                    const copy = [...purItems];
                                    copy[idx].expiryDate = e.target.value;
                                    setPurItems(copy);
                                  }}
                                />
                              );
                            })()}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {(() => {
                                const prodMatch = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === item.name.toLowerCase());
                                if (prodMatch && prodMatch.hasSerialTracking) {
                                  return (
                                    <input
                                      type="number"
                                      className="fi"
                                      value={item.qty}
                                      disabled
                                      style={{ minWidth: 60, background: 'var(--border)' }}
                                    />
                                  );
                                }
                                return (
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
                                    style={{ minWidth: 60 }}
                                  />
                                );
                              })()}
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.unit || 'pcs'}</span>
                            </div>
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
                            <input
                              type="number"
                              className="fi"
                              placeholder="0"
                              value={item.discount || 0}
                              onChange={(e) => {
                                const copy = [...purItems];
                                copy[idx].discount = parseFloat(e.target.value) || 0;
                                setPurItems(copy);
                              }}
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
                          <td style={{ fontWeight: 500 }}><AnimatedNumber value={Number(lineMath.taxAmount) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></td>
                          <td style={{ fontWeight: 600 }}><AnimatedNumber value={Number(lineMath.total) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></td>
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
                <button type="button" className="btn btn--sm" onClick={() => setPurItems([...purItems, { name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '', discount: 0 }])}><i className="fas fa-plus"></i> Add Item</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="fg"><label>Notes / Remarks</label>
                      <textarea className="fi" placeholder="Purchase notes..." value={purNotes} onChange={(e) => setPurNotes(e.target.value)} />
                    </div>
                    <div className="fg"><label>Additional Charges ({getCurrencySymbol()})</label>
                      <input type="number" className="fi" placeholder="0" value={purAdditionalCharges} onChange={(e) => setPurAdditionalCharges(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="fg" style={{ marginTop: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isManualPurTaxSplit}
                          onChange={(e) => setIsManualPurTaxSplit(e.target.checked)}
                        />
                        Manual Tax Split Override
                      </label>
                      {isManualPurTaxSplit && (
                        <select
                          className="fi"
                          value={manualPurTaxType}
                          onChange={(e) => setManualPurTaxType(e.target.value)}
                          style={{ marginTop: '6px', maxWidth: '200px', padding: '4px 8px' }}
                        >
                          <option value="Local">Local (CGST + SGST)</option>
                          <option value="Interstate">Interstate (IGST)</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div style={{ width: '320px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {(() => {
                      const t = getPurFormTotals();
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span>Subtotal:</span>
                            <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.subtotal) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                          </div>
                          {t.isLocal ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>CGST:</span>
                                <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.cgst) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span>SGST:</span>
                                <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.sgst) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                              <span>IGST:</span>
                              <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.igst) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '6px' }}>
                            <span>Total Tax:</span>
                            <span style={{ fontWeight: 600 }}><AnimatedNumber value={Number(t.taxAmount) || 0} duration={600} formatter={v => fmt(Math.round(v))} /></span>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div />
            <div>
              <button className={`btn btn--sm ${useServerPaginationPurchases ? 'btn--primary' : ''}`} onClick={() => setUseServerPaginationPurchases(s => !s)}>{useServerPaginationPurchases ? 'Use Local Data' : 'Use Server Pagination'}</button>
            </div>
          </div>
          {/* Search / Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="fi" placeholder="Search by PO#, supplier..." value={purchaseSearch} onChange={(e) => setPurchaseSearch(e.target.value)} style={{ maxWidth: 280 }} />
            
            <select className="fi" value={purchaseTypeFilter} onChange={(e) => setPurchaseTypeFilter(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="All">All Types</option>
              <option value="Purchase Invoice">Purchase Invoice</option>
              <option value="Purchase Return">Purchase Return</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Debit Note">Debit Note</option>
            </select>

            <select className="fi" value={purchaseStatusFilter} onChange={(e) => setPurchaseStatusFilter(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <select className="fi" value={purchaseActiveFilter} onChange={(e) => setPurchaseActiveFilter(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="Active">Active Bills</option>
              <option value="Deleted">Deleted / Trash</option>
              <option value="All">All Entries</option>
            </select>
          </div>

          {useServerPaginationPurchases ? (
            <PaginatedList type="purchases" />
          ) : (
            <div className="card">
              <table className="tbl">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Type</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbData.purchases.filter(p => {
                  // 1. Search Filter
                  if (purchaseSearch) {
                    const q = purchaseSearch.toLowerCase();
                    const matchSearch = (p.id || '').toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q) || (p.purchaseType || '').toLowerCase().includes(q);
                    if (!matchSearch) return false;
                  }
                  // 2. Type Filter
                  if (purchaseTypeFilter !== 'All') {
                    const type = p.purchaseType || 'Purchase Invoice';
                    if (type !== purchaseTypeFilter) return false;
                  }
                  // 3. Status Filter
                  if (purchaseStatusFilter !== 'All') {
                    if (p.status !== purchaseStatusFilter) return false;
                  }
                  // 4. Active Status Filter
                  if (purchaseActiveFilter === 'Active' && p.active === false) return false;
                  if (purchaseActiveFilter === 'Deleted' && p.active !== false) return false;
                  
                  return true;
                }).map((p, idx) => (
                  <tr key={idx} style={p.active === false ? { opacity: 0.6, fontStyle: 'italic' } : {}}>
                    <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{p.id}</td>
                    <td><span className="badge badge--purple">{p.purchaseType || 'Invoice'}</span></td>
                    <td>{p.supplier}</td>
                    <td style={{ color: 'var(--text-3)' }}>{p.date}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                    <td><span className={`badge ${p.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{p.status}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {p.active === false ? (
                        <button className="btn--icon" title="Restore" onClick={() => restorePurchase(p)}><i className="fas fa-undo" style={{ color: 'var(--green)' }}></i></button>
                      ) : (
                        <>
                          <button className="btn--icon" title="Edit" onClick={() => {
                            setEditingPurchase(p);
                            setPurSupp(p.supplier || '');
                            setPurDate(p.date || new Date().toISOString().substring(0,10));
                            setPurMode(p.mode || 'Cash');
                            setPurNotes(p.notes || '');
                            setPurType(p.purchaseType || 'Purchase Invoice');
                            setPurAdditionalCharges(p.additionalCharges || 0);
                            setPurDueDate(p.dueDate || '');
                            setPurItems(p.items && p.items.length ? p.items.map(it => ({ name: it.name || '', qty: it.qty || 1, rate: it.rate || 0, taxSlab: it.taxSlab || '18%', isTaxInclusive: it.isTaxInclusive || false, hsnSac: it.hsnSac || '', discount: it.discount || 0, unit: it.unit || 'pcs', batchNumber: it.batchNumber || '', expiryDate: it.expiryDate || '', hasSerialTracking: it.hasSerialTracking || false, serialNumbers: it.serialNumbers || [] })) : [{ name: '', qty: 1, rate: 0, taxSlab: '18%', isTaxInclusive: false, hsnSac: '', discount: 0, unit: 'pcs', serialNumbers: [] }]);
                            setShowPurchaseForm(true);
                          }}><i className="fas fa-pen" style={{ color: 'var(--blue)' }}></i></button>
                          <button className="btn--icon" title="Delete" onClick={() => deletePurchase(p.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      )}

      {/* ==================== MODULE 4: INVENTORY ==================== */}
      {currentView === 'inventory' && (
        <section className="view active" id="view-inventory">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Inventory Catalog</h2>
              <p>Total Stock Value: <span style={{ color: 'var(--accent)', fontWeight: 700 }}><AnimatedNumber value={Number(dbData.products.filter(p => p.active !== false).reduce((acc, p) => acc + (p.stock * p.price), 0))||0} duration={1000} formatter={v => fmt(Math.round(v))} /></span></p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn--primary" onClick={() => { setEditingProduct(null); resetProdForm(); setShowProductModal(true); }}><i className="fas fa-plus"></i> Add Product</button>
              <button className="btn" onClick={() => setShowCatBrandModal(true)}><i className="fas fa-tags"></i> Categories & Brands</button>
              <button className="btn" onClick={() => { setPhysicalCounts({}); setPhysicalSerials({}); setShowAuditModal(true); }}><i className="fas fa-clipboard-check"></i> Stock Audit</button>
              <button className="btn" onClick={() => setShowMultiLocationModal(true)}><i className="fas fa-cubes"></i> Multi-Location Matrix</button>
              <button className="btn" onClick={() => exportProducts()}><i className="fas fa-file-csv"></i> Export CSV</button>
              <label className="btn btn--sm" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <i className="fas fa-file-import"></i> Import (Excel/CSV)
                <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleImportFile(e)} />
              </label>
            </div>
          </div>

          {/* Multi-Location Stock Summary Panel */}
          {(() => {
            const godownTotals = {};
            dbData.products.filter(p => p.active !== false).forEach(p => {
              const gName = p.godownName || 'Main Warehouse';
              godownTotals[gName] = (godownTotals[gName] || 0) + (p.stock || 0);
            });
            return (
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, overflowX: 'auto', paddingBottom: 6 }}>
                {Object.entries(godownTotals).map(([name, qty]) => (
                  <div key={name} className="card" style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', minWidth: 160, background: 'rgba(255,255,255,0.02)', marginBottom: 0 }}>
                    <div style={{ background: 'rgba(79,70,229,0.1)', padding: 6, borderRadius: 6, color: '#6366f1', display: 'flex', alignItems: 'center' }}><i className="fas fa-warehouse"></i></div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{name}</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{qty} items</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Search / Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 360, alignItems: 'center' }}>
                <input className="fi" placeholder="Search by name, SKU, category..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} style={{ flex: 1 }} />
                <button type="button" className="btn btn--outline" onClick={() => setShowInventoryCamera(!showInventoryCamera)} style={{ padding: '0 12px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Scan Barcode using Camera">
                  <i className="fas fa-camera"></i>
                </button>
              </div>
              
              <select className="fi" value={productActiveFilter} onChange={(e) => setProductActiveFilter(e.target.value)} style={{ maxWidth: 180 }}>
                <option value="Active">Active Products</option>
                <option value="Deleted">Deleted / Trash</option>
                <option value="All">All Products</option>
              </select>
            </div>
            
            {showInventoryCamera && (
              <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'center' }}>
                <BarcodeScannerCamera
                  onScan={(code) => {
                    setInventorySearch(code);
                    setShowInventoryCamera(false);
                  }}
                  onError={(err) => alert('Camera error: ' + (err?.message || 'Access denied'))}
                  onClose={() => setShowInventoryCamera(false)}
                />
              </div>
            )}
          </div>

          {(productAlerts.outOfStock.length > 0 || productAlerts.lowStock.length > 0 || productAlerts.expired.length > 0 || productAlerts.expiringSoon.length > 0) ? (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productAlerts.outOfStock.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#ef4444' }}><i className="fas fa-circle-xmark"></i> Out of Stock: </strong>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{productAlerts.outOfStock.length} items are completely out of stock. Reorder immediately!</span>
                  </div>
                  <button className="btn btn--sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none' }} onClick={() => { setInventorySearch('stock:0'); }}>View</button>
                </div>
              )}
              {productAlerts.lowStock.length > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#f59e0b' }}><i className="fas fa-triangle-exclamation"></i> Low Stock Warning: </strong>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{productAlerts.lowStock.length} items are below their alert levels.</span>
                  </div>
                  <button className="btn btn--sm" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'none' }} onClick={() => { setInventorySearch('status:low'); }}>View</button>
                </div>
              )}
              {(productAlerts.expired.length > 0 || productAlerts.expiringSoon.length > 0) && (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#6366f1' }}><i className="fas fa-clock"></i> Expiry Warnings: </strong>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {productAlerts.expired.length > 0 && `${productAlerts.expired.length} items have expired. `}
                      {productAlerts.expiringSoon.length > 0 && `${productAlerts.expiringSoon.length} items are expiring within 30 days.`}
                    </span>
                  </div>
                  <button className="btn btn--sm" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: 'none' }} onClick={() => { setInventorySearch('status:expiring'); }}>View</button>
                </div>
              )}
            </div>
          ) : null}

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / HSN</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Cost / Sale Price</th>
                  <th>Tax Slab</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {useServerPaginationInventory ? (
                  <tr><td colSpan={8} style={{ padding: '8px' }}><PaginatedList type="products" /></td></tr>
                ) : (
                  <>
                    {dbData.products.filter(p => {
                      // 1. Search Filter
                      if (inventorySearch) {
                        const q = inventorySearch.toLowerCase().trim();
                        if (q === 'stock:0') {
                          if ((parseInt(p.stock) || 0) > 0) return false;
                        } else if (q === 'status:low') {
                          if ((parseInt(p.stock) || 0) <= 0 || (parseInt(p.stock) || 0) > (parseInt(p.lowStockLevel) || 5)) return false;
                        } else if (q === 'status:expiring') {
                          const today = new Date().toISOString().substring(0,10);
                          const thirtyDaysLater = new Date();
                          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
                          const thirtyDaysStr = thirtyDaysLater.toISOString().substring(0,10);
                          if (!p.expiryDate || p.expiryDate > thirtyDaysStr) return false;
                        } else {
                          const matchSearch = (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
                          if (!matchSearch) return false;
                        }
                      }
                      
                      // 2. Active status filter
                      if (productActiveFilter === 'Active' && p.active === false) return false;
                      if (productActiveFilter === 'Deleted' && p.active !== false) return false;
                      
                      return true;
                    }).map((p, idx) => (
                      <tr key={idx} style={p.active === false ? { opacity: 0.6, fontStyle: 'italic' } : {}}>
                        <td style={{ fontWeight: 500 }}>
                          {p.name}
                          {p.brand ? <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block' }}>{p.brand}</span> : null}
                        </td>
                        <td style={{ color: 'var(--text-3)' }}>{p.sku + (p.hsnSac ? ' (HSN: ' + p.hsnSac + ')' : '')}</td>
                        <td><span className="badge badge--blue">{p.category}{p.subCategory ? ' / ' + p.subCategory : ''}</span></td>
                        <td style={{ fontWeight: 600 }}>
                          <AnimatedNumber value={Number(p.stock)||0} duration={700} formatter={v => Math.round(v)} /> <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.unit || 'pcs'}</span>
                          {Array.isArray(p.batches) && p.batches.length > 0 && (
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--accent)', fontWeight: 500 }}>Batches: {p.batches.length}</span>
                          )}
                        </td>
                        <td>{fmt(p.purchasePrice || 0)} / {fmt(p.price)}</td>
                        <td><span className="badge badge--purple">{(p.taxSlab || '18%') + ' ' + (p.isTaxInclusive ? '(Inc)' : '(Exc)')}</span></td>
                        <td><span className={`badge ${(p.stock || 0) <= (p.lowStockLevel || 5) ? 'badge--red' : 'badge--green'}`}>{(p.stock || 0) <= 0 ? 'Out of Stock' : (p.stock || 0) <= (p.lowStockLevel || 5) ? 'Low Stock' : 'In Stock'}</span></td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {p.active === false ? (
                            <button className="btn--icon" title="Restore Product" onClick={() => restoreProduct(p)}><i className="fas fa-undo" style={{ color: 'var(--green)' }}></i></button>
                          ) : (
                            <>
                              <button className="btn--icon" title="Edit Product" onClick={() => {
                                setProdForm({ 
                                  ...p, 
                                  purchasePrice: p.purchasePrice || 0, 
                                  wholesalePrice: p.wholesalePrice || 0, 
                                  lowStockLevel: p.lowStockLevel || 5, 
                                  barcode: p.barcode || '', 
                                  subCategory: p.subCategory || '', 
                                  brand: p.brand || '', 
                                  unit: p.unit || 'pcs', 
                                  expiryDate: p.expiryDate || '', 
                                  description: p.description || '', 
                                  rackLocation: p.rackLocation || '', 
                                  godownName: p.godownName || '', 
                                  serialNumber: p.serialNumber || '', 
                                  batchNumber: p.batchNumber || '',
                                  isBatchTracked: Array.isArray(p.batches) && p.batches.length > 0,
                                  batches: p.batches || [],
                                  hasSerialTracking: p.hasSerialTracking || false,
                                  serialNumbers: p.serialNumbers || []
                                });
                                setEditingProduct(p);
                                setShowProductModal(true);
                              }}><i className="fas fa-pen" style={{ color: 'var(--blue)' }}></i></button>
                              <button className="btn--icon" title="Adjust Stock" style={{ marginLeft: 4 }} onClick={() => { setAdjustmentProduct(p); setAdjustQty(0); setAdjustReason('audit'); setShowAdjustmentModal(true); }}><i className="fas fa-sliders" style={{ color: 'var(--yellow)' }}></i></button>
                              <button className="btn--icon" title="Transfer Stock" style={{ marginLeft: 4 }} onClick={() => { setTransferProduct(p); setTransferQty(1); setTransferTargetBranch(''); setShowTransferModal(true); }}><i className="fas fa-truck" style={{ color: 'var(--accent)' }}></i></button>
                              <button className="btn--icon" title="View Barcode / QR" style={{ marginLeft: 4 }} onClick={() => { setBarcodeProduct(p); setShowBarcodeModal(true); }}><i className="fas fa-barcode" style={{ color: 'var(--text-2)' }}></i></button>
                              <button className="btn--icon" title="Delete Product" style={{ marginLeft: 4 }} onClick={() => deleteProduct(p.id || p._id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--secondary" onClick={exportParties} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-file-export"></i> Export Excel
              </button>
              <label className="btn btn--secondary" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-file-import"></i> Import Excel
                <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImportPartiesFile} />
              </label>
              <button className="btn btn--primary" onClick={() => setShowPartyModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-plus"></i> Add Party
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
              <input 
                type="text" 
                className="fi" 
                placeholder="Search by name, phone..." 
                value={partySearch} 
                onChange={(e) => setPartySearch(e.target.value)} 
                style={{ maxWidth: '300px', margin: 0 }}
              />
              <select 
                className="fi" 
                value={partyTypeFilter} 
                onChange={(e) => setPartyTypeFilter(e.target.value)}
                style={{ maxWidth: '150px', margin: 0 }}
              >
                <option value="All">All Parties</option>
                <option value="Customer">Customers</option>
                <option value="Supplier">Suppliers</option>
              </select>
            </div>
            <div>
              <button className={`btn btn--sm ${useServerPaginationParties ? 'btn--primary' : ''}`} onClick={() => setUseServerPaginationParties(s => !s)}>{useServerPaginationParties ? 'Use Local Data' : 'Use Server Pagination'}</button>
            </div>
          </div>
          {useServerPaginationParties ? (
            <PaginatedList type="parties" />
          ) : (
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
                {dbData.parties.filter(p => {
                  if (partySearch) {
                    const q = partySearch.toLowerCase().trim();
                    const match = (p.name || '').toLowerCase().includes(q) || (p.phone || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
                    if (!match) return false;
                  }
                  if (partyTypeFilter !== 'All' && p.type !== partyTypeFilter) {
                    return false;
                  }
                  return true;
                }).map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className={`badge ${p.type === 'Customer' ? 'badge--green' : 'badge--blue'}`}>{p.type}</span></td>
                    <td style={{ color: 'var(--text-3)' }}>{p.phone} ({p.state || 'Karnataka'})</td>
                    <td style={{ fontWeight: 600, color: p.balance < 0 ? 'var(--red)' : p.balance > 0 ? 'var(--yellow)' : 'inherit' }}>{fmt(Math.abs(p.balance)) + ' ' + (p.balance < 0 ? '(Due)' : p.balance > 0 ? '(Payable)' : '')}</td>
                    <td style={{ color: 'var(--text-3)' }}>{p.lastTxn}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${p.balance < -50000 ? 'badge--red' : 'badge--green'}`} style={{ marginRight: '8px' }}>Score: {p.balance < -50000 ? 'Poor' : 'Excellent'}</span>
                      <button className="btn--icon" title="Record Payment" style={{ marginRight: '4px' }} onClick={() => {
                        setPaymentForm({
                          partyId: p.id,
                          partyName: p.name,
                          type: p.balance > 0 ? 'Pay' : 'Receive',
                          amount: Math.abs(p.balance) || 0,
                          mode: 'Cash',
                          referenceNo: '',
                          date: new Date().toISOString().substring(0, 10)
                        });
                        setShowPaymentModal(true);
                      }}><i className="fas fa-money-bill-wave" style={{ color: 'var(--green)' }}></i></button>
                      <button className="btn--icon" title="View Profile & Statement" style={{ marginRight: '4px' }} onClick={() => {
                        setSelectedStatementParty(p);
                        setStatementTab('overview');
                        setReminderMessage(`Dear ${p.name},\nThis is a friendly reminder that your outstanding balance of Rs. ${Math.abs(p.balance).toFixed(2)} is due. Please settle this at your earliest convenience.\nRegards,\n${dbData.settings?.businessName || 'Management'}`);
                        setShowStatementModal(true);
                      }}><i className="fas fa-file-invoice" style={{ color: 'var(--primary)' }}></i></button>
                      <button className="btn--icon" title="Edit Party" style={{ marginRight: '4px' }} onClick={() => {
                        setEditingParty(p);
                        setPartyForm({
                          name: p.name || '',
                          type: p.type || 'Customer',
                          phone: p.phone || '+91 ',
                          balance: p.balance || 0,
                          notes: p.notes || '',
                          state: p.state || 'Karnataka',
                          email: p.email || '',
                          whatsappNumber: p.whatsappNumber || '',
                          billingAddress: p.billingAddress || '',
                          shippingAddress: p.shippingAddress || '',
                          gstin: p.gstin || '',
                          pan: p.pan || '',
                          customerGroup: p.customerGroup || 'Retail',
                          creditLimit: p.creditLimit || 0,
                          openingBalance: p.openingBalance || 0,
                          paymentTerms: p.paymentTerms || 'Net 30',
                          bankDetails: p.bankDetails || ''
                        });
                        setShowPartyModal(true);
                      }}><i className="fas fa-pen" style={{ color: 'var(--blue)' }}></i></button>
                      <button className="btn--icon" title="Delete Party" onClick={() => deleteParty(p.id || p._id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      )}

      {/* ==================== MODULE 6: FINANCIAL ==================== */}
      {currentView === 'financial' && (
        <section className="view active" id="view-financial">
          <div className="sec-header">
            <h2>Accounting & Financial Management</h2>
            <p>Comprehensive accounting modules including Trial Balance, P&L, and Balance Sheet.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button className={`btn btn--sm ${finTab === 'overview' ? 'btn--primary' : ''}`} onClick={() => setFinTab('overview')}>Overview</button>
            <button className={`btn btn--sm ${finTab === 'trial' ? 'btn--primary' : ''}`} onClick={() => setFinTab('trial')}>Trial Balance</button>
            <button className={`btn btn--sm ${finTab === 'pnl' ? 'btn--primary' : ''}`} onClick={() => setFinTab('pnl')}>Profit & Loss</button>
            <button className={`btn btn--sm ${finTab === 'balance' ? 'btn--primary' : ''}`} onClick={() => setFinTab('balance')}>Balance Sheet</button>
          </div>

          {finTab === 'overview' && (
            <>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card card--lift">
              <div className="stat__icon stat__icon--g" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-trend-up"></i></div>
              <div className="stat__val"><AnimatedNumber value={profit} duration={1000} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Net Profit (This Month)</div>
            </div>
            <div className="card card--lift">
              <div className="stat__icon stat__icon--r" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-trend-down"></i></div>
              <div className="stat__val"><AnimatedNumber value={totalPurchases} duration={1000} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Total Expenses</div>
            </div>
            <div className="card card--lift">
              <div className="stat__icon stat__icon--y" style={{ marginBottom: '14px' }}><i className="fas fa-hand-holding-dollar"></i></div>
              <div className="stat__val"><AnimatedNumber value={cashInHand} duration={1000} formatter={v => fmt(Math.round(v))} /></div>
              <div className="stat__lbl">Cash in Hand</div>
            </div>
          </div>

          <div className="two-col">
            <div className="card chart-area">
              <div className="card__head"><span>Operating Expenses</span></div>
              <div style={{ height: '240px' }}><Doughnut data={expenseChartData} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: 1000, easing: 'easeOutCubic' } }} /></div>
            </div>
            <div className="card">
              <div className="card__head"><span>Pending Receivables / Dues</span></div>
              <div id="fin-dues">
                {dbData.sales.filter(s => s.status === 'Pending').map((s, idx) => (
                  <div className="alert-row" key={idx}>
                    <div style={{ flex: 1 }}><div className="alert-row__name">{s.customer}</div><div className="alert-row__meta">Sale Due ({s.date})</div></div>
                    <span className="badge badge--red"><AnimatedNumber value={Number(s.amount)||0} duration={700} formatter={v => fmt(Math.round(v))} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
          )}

          {finTab === 'trial' && (
            <div className="card">
              <h3>Trial Balance (As of Today)</h3>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th style={{ textAlign: 'right' }}>Debit Balance</th>
                    <th style={{ textAlign: 'right' }}>Credit Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Cash Account</td><td style={{ textAlign: 'right' }}>{fmt(cashInHand > 0 ? cashInHand : 0)}</td><td style={{ textAlign: 'right' }}>{fmt(cashInHand < 0 ? Math.abs(cashInHand) : 0)}</td></tr>
                  <tr><td>Accounts Receivable</td><td style={{ textAlign: 'right' }}>{fmt(totalPendingReceivables)}</td><td style={{ textAlign: 'right' }}>-</td></tr>
                  <tr><td>Accounts Payable</td><td style={{ textAlign: 'right' }}>-</td><td style={{ textAlign: 'right' }}>{fmt(totalOutstandingPayables)}</td></tr>
                  <tr><td>Sales Revenue</td><td style={{ textAlign: 'right' }}>-</td><td style={{ textAlign: 'right' }}>{fmt(totalSales)}</td></tr>
                  <tr><td>Purchase Expenses</td><td style={{ textAlign: 'right' }}>{fmt(totalPurchases)}</td><td style={{ textAlign: 'right' }}>-</td></tr>
                  <tr style={{ fontWeight: 'bold', background: 'var(--bg)' }}>
                    <td>Total</td>
                    <td style={{ textAlign: 'right' }}>{fmt(Math.max(0, cashInHand) + totalPendingReceivables + totalPurchases)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(Math.max(0, -cashInHand) + totalOutstandingPayables + totalSales)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {finTab === 'pnl' && (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Profit & Loss Statement</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Sales Revenue</span><span>{fmt(totalSales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Cost of Goods Sold (Purchases)</span><span>- {fmt(totalPurchases)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                <span>Gross Profit</span><span>{fmt(totalSales - totalPurchases)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Operating Expenses</span><span>- {fmt(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontWeight: 'bold', fontSize: '1.1rem', color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                <span>Net Profit</span><span>{fmt(profit)}</span>
              </div>
            </div>
          )}

          {finTab === 'balance' && (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Balance Sheet</h3>
              
              <h4 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Assets</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Cash & Equivalents</span><span>{fmt(Math.max(0, cashInHand))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Accounts Receivable</span><span>{fmt(totalPendingReceivables)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold', marginBottom: '20px' }}>
                <span>Total Assets</span><span>{fmt(Math.max(0, cashInHand) + totalPendingReceivables)}</span>
              </div>

              <h4 style={{ color: 'var(--red)', marginBottom: '10px' }}>Liabilities & Equity</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Accounts Payable</span><span>{fmt(totalOutstandingPayables)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Overdrawn Cash (Liability)</span><span>{fmt(Math.max(0, -cashInHand))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Retained Earnings (Net Profit)</span><span>{fmt(profit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold' }}>
                <span>Total Liabilities & Equity</span><span>{fmt(totalOutstandingPayables + Math.max(0, -cashInHand) + profit)}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ==================== MODULE 7: TRANSACTIONS ==================== */}
      {currentView === 'transactions' && (
        <section className="view active" id="view-transactions">
          <div className="sec-header">
            <h2>System Ledger Journal</h2>
            <p>Complete double-entry accounting ledger of all purchases and sales.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className={`btn btn--sm ${txnSubTab === 'flat' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('flat')}>
                <i className="fas fa-list"></i> General Journal
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'tchart' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('tchart')}>
                <i className="fas fa-columns"></i> Double-Entry T-Charts
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'cashbook' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('cashbook')}>
                <i className="fas fa-wallet"></i> Cash Book
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'petty-cash' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('petty-cash')}>
                <i className="fas fa-coins"></i> Petty Cash
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'bankbook' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('bankbook')}>
                <i className="fas fa-university"></i> Bank Book
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'daybook' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('daybook')}>
                <i className="fas fa-calendar-day"></i> Day Book
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'accounts' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('accounts')}>
                <i className="fas fa-folder-open"></i> Chart of Accounts
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'trial-balance' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('trial-balance')}>
                <i className="fas fa-scale-balanced"></i> Trial Balance
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'receivables' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('receivables')}>
                <i className="fas fa-hand-holding-dollar"></i> Receivables
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'payables' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('payables')}>
                <i className="fas fa-file-invoice-dollar"></i> Payables
              </button>
              <button className={`btn btn--sm ${txnSubTab === 'bank-accounts' ? 'btn--primary' : ''}`} onClick={() => setTxnSubTab('bank-accounts')}>
                <i className="fas fa-building-columns"></i> Bank Accounts
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--primary btn--sm" onClick={() => {
                setJournalForm({ date: new Date().toISOString().substring(0, 10), description: '', debitAccount: '', creditAccount: '', amount: '' });
                setShowJournalModal(true);
              }}>
                <i className="fas fa-plus"></i> New Journal Entry
              </button>
              <button className="btn btn--sm" style={{ background: 'linear-gradient(135deg, hsl(210,80%,50%), hsl(230,70%,55%))', color: '#fff', border: 'none' }} onClick={() => {
                setBankTransferForm({ date: new Date().toISOString().substring(0, 10), fromAccount: '', toAccount: '', amount: '', referenceNo: '', description: '' });
                setShowBankTransferModal(true);
              }}>
                <i className="fas fa-right-left"></i> Bank Transfer
              </button>
            </div>
          </div>

          {txnSubTab === 'flat' && (() => {
            const filteredTxns = dbData.transactions.filter(t => {
              if (!ledgerAccountFilter) return true;
              const resolvedDebit = t.debitAccount || (t.type === 'Sale' ? 'Accounts Receivable (Asset)' : 'Cost of Goods Sold (Expense)');
              const resolvedCredit = t.creditAccount || (t.type === 'Sale' ? 'Sales Revenue (Income)' : 'Cash in Hand (Asset)');
              return resolvedDebit === ledgerAccountFilter || resolvedCredit === ledgerAccountFilter;
            });

            const filterAccount = (dbData.accounts || []).find(a => a.name === ledgerAccountFilter);
            const filterType = filterAccount ? filterAccount.type : 'Asset';
            let currentRunningBal = 0;

            return (
              <div className="card">
                {ledgerAccountFilter && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card-hover)', padding: '12px 16px', borderRadius: '6px', marginBottom: '15px', borderLeft: '4px solid var(--accent)' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      <i className="fas fa-filter" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                      Filtering Ledger: <strong style={{ color: 'var(--text-1)' }}>{ledgerAccountFilter}</strong> ({filterType})
                    </span>
                    <button className="btn btn--sm" onClick={() => setLedgerAccountFilter('')}>
                      <i className="fas fa-times"></i> Clear Filter
                    </button>
                  </div>
                )}
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
                    {filteredTxns.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>
                          No transaction records found for this account.
                        </td>
                      </tr>
                    ) : (
                      filteredTxns.map((t, idx) => {
                        const amount = parseFloat(t.credit || t.debit || 0);
                        const resolvedDebit = t.debitAccount || (t.type === 'Sale' ? 'Accounts Receivable (Asset)' : 'Cost of Goods Sold (Expense)');
                        const resolvedCredit = t.creditAccount || (t.type === 'Sale' ? 'Sales Revenue (Income)' : 'Cash in Hand (Asset)');
                        
                        if (ledgerAccountFilter) {
                          let drChange = 0;
                          let crChange = 0;
                          if (resolvedDebit === ledgerAccountFilter) drChange = amount;
                          if (resolvedCredit === ledgerAccountFilter) crChange = amount;
                          const netChange = (filterType === 'Asset' || filterType === 'Expense')
                            ? (drChange - crChange)
                            : (crChange - drChange);
                          currentRunningBal += netChange;
                        } else {
                          currentRunningBal = t.balance;
                        }

                        return (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{t.id}</td>
                            <td>
                              <span className={`badge ${
                                t.type === 'Sale' ? 'badge--green' : 
                                t.type === 'Purchase' ? 'badge--blue' :
                                t.type === 'Bank Transfer' ? 'badge--blue' :
                                t.type === 'Journal Entry' ? 'badge--yellow' :
                                (t.type || '').startsWith('Payment') ? 'badge--orange' : 'badge--grey'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td>{t.party}</td>
                            <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{resolvedDebit}</td>
                            <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{resolvedCredit}</td>
                            <td style={{ color: 'var(--red)', fontWeight: 600 }}>{t.debit ? fmt(t.debit) : '-'}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{t.credit ? fmt(t.credit) : '-'}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(currentRunningBal)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {txnSubTab === 'tchart' && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {(dbData.accounts || []).map((acc, aIdx) => {
                const { debits, credits, totalDebit, totalCredit } = (() => {
                  const debits = [];
                  const credits = [];
                  dbData.transactions.forEach(t => {
                    const amount = parseFloat(t.credit || t.debit || 0);
                    const resolvedDebit = t.debitAccount || (t.type === 'Sale' ? 'Accounts Receivable (Asset)' : 'Cost of Goods Sold (Expense)');
                    const resolvedCredit = t.creditAccount || (t.type === 'Sale' ? 'Sales Revenue (Income)' : 'Cash in Hand (Asset)');
                    if (resolvedDebit === acc.name) {
                      debits.push({ id: t.id, date: t.date, party: t.party, amount });
                    }
                    if (resolvedCredit === acc.name) {
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
                      <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={acc.name}>{acc.name}</span>
                      <span className={`badge ${
                        acc.type === 'Asset' ? 'badge--green' :
                        acc.type === 'Liability' ? 'badge--red' :
                        acc.type === 'Equity' ? 'badge--blue' :
                        acc.type === 'Income' ? 'badge--yellow' : 'badge--orange'
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

          {txnSubTab === 'accounts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Chart of Accounts</h3>
                <button className="btn btn--primary btn--sm" onClick={() => {
                  setAccountForm({ name: '', type: 'Expense', description: '', openingBalance: 0 });
                  setEditingAccount(null);
                  setShowAccountModal(true);
                }}>
                  <i className="fas fa-plus"></i> Add Ledger Account
                </button>
              </div>

              <div className="card">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Account Name</th>
                      <th>Account Type</th>
                      <th>Description</th>
                      <th>System Status</th>
                      <th style={{ textAlign: 'right' }}>Opening Bal.</th>
                      <th style={{ textAlign: 'right' }}>Net Balance</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dbData.accounts || []).map((account, idx) => {
                      const balance = (() => {
                        let totalDebit = 0;
                        let totalCredit = 0;
                        dbData.transactions.forEach(t => {
                          const amount = parseFloat(t.credit || t.debit || t.amount || 0);
                          const resolvedDebit = t.debitAccount || (t.type === 'Sale' ? 'Accounts Receivable (Asset)' : 'Cost of Goods Sold (Expense)');
                          const resolvedCredit = t.creditAccount || (t.type === 'Sale' ? 'Sales Revenue (Income)' : 'Cash in Hand (Asset)');
                          
                          if (resolvedDebit === account.name) totalDebit += amount;
                          if (resolvedCredit === account.name) totalCredit += amount;
                        });
                        const opBal = parseFloat(account.openingBalance) || 0;
                        if (account.type === 'Asset' || account.type === 'Expense') {
                          return opBal + totalDebit - totalCredit;
                        } else {
                          return opBal + totalCredit - totalDebit;
                        }
                      })();

                      return (
                        <tr key={idx} style={{ transition: 'all 0.2s ease' }}>
                          <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{account.name}</td>
                          <td>
                            <span className={`badge ${
                              account.type === 'Asset' ? 'badge--green' :
                              account.type === 'Liability' ? 'badge--red' :
                              account.type === 'Equity' ? 'badge--blue' :
                              account.type === 'Income' ? 'badge--yellow' : 'badge--orange'
                            }`}>
                              {account.type}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-3)', fontSize: '13px' }}>{account.description || '-'}</td>
                          <td>
                            {account.isSystem ? (
                              <span className="badge badge--green" style={{ opacity: 0.8 }}>System Default</span>
                            ) : (
                              <span className="badge badge--grey">Custom</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {fmt(account.openingBalance || 0)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: balance >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                            {fmt(balance)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn--sm" title="View Ledger Journal" onClick={() => {
                                setLedgerAccountFilter(account.name);
                                setTxnSubTab('flat');
                              }}>
                                <i className="fas fa-book-open"></i> Ledger
                              </button>
                              {!account.isSystem && (
                                <>
                                  <button className="btn btn--sm" title="Edit Account" onClick={() => {
                                    setEditingAccount(account);
                                    setAccountForm({ name: account.name, type: account.type, description: account.description || '', openingBalance: account.openingBalance || 0 });
                                    setShowAccountModal(true);
                                  }}>
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button className="btn btn--sm" style={{ color: 'var(--red)' }} title="Delete Account" onClick={() => handleDeleteAccount(account)}>
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {txnSubTab === 'receivables' && (() => {
            const customersWithDues = dbData.parties.filter(
              p => (p.type || '').toLowerCase() === 'customer' && parseFloat(p.balance) < 0
            );
            const totalReceivables = customersWithDues.reduce((sum, p) => sum + Math.abs(parseFloat(p.balance) || 0), 0);
            
            const pendingSales = dbData.sales.filter(
              s => (s.status || '').toLowerCase() === 'pending'
            );
            const totalPendingSalesAmount = pendingSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

            return (
              <div>
                {/* Summary Cards */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>Total Accounts Receivable</span>
                      <i className="fas fa-hand-holding-dollar" style={{ color: 'var(--red)', fontSize: '18px' }}></i>
                    </div>
                    <h2 style={{ margin: '8px 0 0 0', color: 'var(--red)', fontSize: '24px', fontWeight: 800 }}>{fmt(totalReceivables)}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>From {customersWithDues.length} active customer accounts</p>
                  </div>
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>Pending Sales Invoices</span>
                      <i className="fas fa-file-invoice" style={{ color: 'var(--yellow)', fontSize: '18px' }}></i>
                    </div>
                    <h2 style={{ margin: '8px 0 0 0', color: 'var(--yellow)', fontSize: '24px', fontWeight: 800 }}>{fmt(totalPendingSalesAmount)}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Across {pendingSales.length} unpaid orders</p>
                  </div>
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>Total Customer Dues</span>
                      <i className="fas fa-scale-unbalanced" style={{ color: 'var(--accent)', fontSize: '18px' }}></i>
                    </div>
                    <h2 style={{ margin: '8px 0 0 0', color: 'var(--accent)', fontSize: '24px', fontWeight: 800 }}>{fmt(totalReceivables + totalPendingSalesAmount)}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Combined credit and invoice receivables</p>
                  </div>
                </div>

                {/* Customer Ledger Dues Table */}
                <div className="card" style={{ marginBottom: '25px' }}>
                  <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Customer Dues (Credit Ledger)</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Customers with outstanding negative ledger balances</p>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Phone / Email</th>
                        <th>Last Activity</th>
                        <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersWithDues.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No customer ledger dues found. All accounts settled.</td>
                        </tr>
                      ) : (
                        customersWithDues.map((p, idx) => {
                          const outstandingAmt = Math.abs(parseFloat(p.balance) || 0);
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</td>
                              <td style={{ fontSize: '13px' }}>
                                <div style={{ color: 'var(--text-2)' }}>{p.phone}</div>
                                <div style={{ color: 'var(--text-3)', fontSize: '11px' }}>{p.email}</div>
                              </td>
                              <td style={{ color: 'var(--text-3)', fontSize: '13px' }}>{p.lastTxn || '-'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>{fmt(outstandingAmt)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button className="btn btn--sm" title="Record Payment Received" onClick={() => {
                                    setPaymentForm({
                                      partyId: p.id,
                                      partyName: p.name,
                                      type: 'Receive',
                                      amount: outstandingAmt,
                                      mode: 'Cash',
                                      referenceNo: '',
                                      date: new Date().toISOString().substring(0, 10)
                                    });
                                    setShowPaymentModal(true);
                                  }}>
                                    <i className="fas fa-money-bill-wave"></i> Receive
                                  </button>
                                  <button className="btn btn--sm" title="Send Reminder" onClick={() => {
                                    setSelectedStatementParty(p);
                                    setStatementTab('overview');
                                    setReminderMessage(`Dear ${p.name},\nThis is a friendly reminder that your outstanding balance of Rs. ${outstandingAmt.toFixed(2)} is due. Please settle this at your earliest convenience.\nRegards,\n${dbData.settings?.businessName || 'Management'}`);
                                    setShowStatementModal(true);
                                  }}>
                                    <i className="fas fa-bell"></i> Remind
                                  </button>
                                  <button className="btn btn--sm" title="View Statement" onClick={() => {
                                    setSelectedStatementParty(p);
                                    setStatementTab('ledger');
                                    setShowStatementModal(true);
                                  }}>
                                    <i className="fas fa-file-invoice"></i> Statement
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pending Invoices Table */}
                <div className="card">
                  <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Pending Invoices List</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Unpaid sales bills awaiting payment confirmation</p>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Payment Mode</th>
                        <th style={{ textAlign: 'right' }}>Invoice Amount</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSales.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No pending customer invoices. All invoices cleared.</td>
                        </tr>
                      ) : (
                        pendingSales.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{s.id}</td>
                            <td style={{ color: 'var(--text-3)', fontSize: '13px' }}>{s.date}</td>
                            <td style={{ fontWeight: 600 }}>{s.customer}</td>
                            <td style={{ fontSize: '13px' }}><span className="badge badge--grey">{s.mode}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--yellow)' }}>{fmt(parseFloat(s.amount) || 0)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button className="btn btn--sm" onClick={() => {
                                const matchedParty = dbData.parties.find(p => p.name === s.customer && (p.type || '').toLowerCase() === 'customer');
                                setPaymentForm({
                                  partyId: matchedParty ? matchedParty.id : null,
                                  partyName: s.customer,
                                  type: 'Receive',
                                  amount: parseFloat(s.amount) || 0,
                                  mode: (s.mode || 'Cash').includes('Credit') ? 'Cash' : s.mode,
                                  referenceNo: `INV-SETTLE-${s.id}`,
                                  date: new Date().toISOString().substring(0, 10)
                                });
                                setShowPaymentModal(true);
                              }}>
                                <i className="fas fa-check"></i> Settle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'payables' && (() => {
            const suppliersWithDues = dbData.parties.filter(
              p => (p.type || '').toLowerCase() === 'supplier' && parseFloat(p.balance) > 0
            );
            const totalPayables = suppliersWithDues.reduce((sum, p) => sum + (parseFloat(p.balance) || 0), 0);
            
            const pendingPurchases = dbData.purchases.filter(
              p => p.active !== false && (p.status || '').toLowerCase() === 'pending'
            );
            const totalPendingPurchasesAmount = pendingPurchases.reduce((sum, p) => sum + getPurchaseAmount(p), 0);

            return (
              <div>
                {/* Summary Cards */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>Total Accounts Payable</span>
                      <i className="fas fa-file-invoice-dollar" style={{ color: 'var(--yellow)', fontSize: '18px' }}></i>
                    </div>
                    <h2 style={{ margin: '8px 0 0 0', color: 'var(--yellow)', fontSize: '24px', fontWeight: 800 }}>{fmt(totalPayables)}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>To {suppliersWithDues.length} active supplier accounts</p>
                  </div>
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>Pending Purchase Invoices</span>
                      <i className="fas fa-cart-flatbed" style={{ color: 'var(--red)', fontSize: '18px' }}></i>
                    </div>
                    <h2 style={{ margin: '8px 0 0 0', color: 'var(--red)', fontSize: '24px', fontWeight: 800 }}>{fmt(totalPendingPurchasesAmount)}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Across {pendingPurchases.length} unpaid purchases</p>
                  </div>
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600 }}>Total Supplier Dues</span>
                      <i className="fas fa-scale-unbalanced" style={{ color: 'var(--accent)', fontSize: '18px' }}></i>
                    </div>
                    <h2 style={{ margin: '8px 0 0 0', color: 'var(--accent)', fontSize: '24px', fontWeight: 800 }}>{fmt(totalPayables + totalPendingPurchasesAmount)}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Combined credit and purchase payables</p>
                  </div>
                </div>

                {/* Supplier Ledger Dues Table */}
                <div className="card" style={{ marginBottom: '25px' }}>
                  <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Supplier Dues (Credit Ledger)</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Suppliers with outstanding positive ledger balances</p>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Phone / Email</th>
                        <th>Last Activity</th>
                        <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliersWithDues.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No supplier ledger dues found. All accounts settled.</td>
                        </tr>
                      ) : (
                        suppliersWithDues.map((p, idx) => {
                          const outstandingAmt = parseFloat(p.balance) || 0;
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</td>
                              <td style={{ fontSize: '13px' }}>
                                <div style={{ color: 'var(--text-2)' }}>{p.phone}</div>
                                <div style={{ color: 'var(--text-3)', fontSize: '11px' }}>{p.email}</div>
                              </td>
                              <td style={{ color: 'var(--text-3)', fontSize: '13px' }}>{p.lastTxn || '-'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--yellow)' }}>{fmt(outstandingAmt)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button className="btn btn--sm" title="Record Payment Sent" onClick={() => {
                                    setPaymentForm({
                                      partyId: p.id,
                                      partyName: p.name,
                                      type: 'Pay',
                                      amount: outstandingAmt,
                                      mode: 'Cash',
                                      referenceNo: '',
                                      date: new Date().toISOString().substring(0, 10)
                                    });
                                    setShowPaymentModal(true);
                                  }}>
                                    <i className="fas fa-money-bill-wave"></i> Pay
                                  </button>
                                  <button className="btn btn--sm" title="View Statement" onClick={() => {
                                    setSelectedStatementParty(p);
                                    setStatementTab('ledger');
                                    setShowStatementModal(true);
                                  }}>
                                    <i className="fas fa-file-invoice"></i> Statement
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pending Purchases Table */}
                <div className="card">
                  <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Pending Purchases List</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Unpaid purchases awaiting payment settlements</p>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Purchase ID</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Purchase Amount</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPurchases.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No pending supplier purchases. All cleared.</td>
                        </tr>
                      ) : (
                        pendingPurchases.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{s.id}</td>
                            <td style={{ color: 'var(--text-3)', fontSize: '13px' }}>{s.date}</td>
                            <td style={{ fontWeight: 600 }}>{s.supplier}</td>
                            <td style={{ fontSize: '13px' }}><span className="badge badge--grey">{s.purchaseType || 'Purchase Invoice'}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>{fmt(parseFloat(s.amount) || 0)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button className="btn btn--sm" onClick={() => {
                                const matchedParty = dbData.parties.find(p => p.name === s.supplier && (p.type || '').toLowerCase() === 'supplier');
                                setPaymentForm({
                                  partyId: matchedParty ? matchedParty.id : null,
                                  partyName: s.supplier,
                                  type: 'Pay',
                                  amount: parseFloat(s.amount) || 0,
                                  mode: (s.mode || 'Cash').includes('Credit') ? 'Cash' : s.mode,
                                  referenceNo: `PUR-SETTLE-${s.id}`,
                                  date: new Date().toISOString().substring(0, 10)
                                });
                                setShowPaymentModal(true);
                              }}>
                                <i className="fas fa-check"></i> Settle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'cashbook' && (() => {
            let bal = 0;
            const isCashAccount = (acc) => (acc || '').toLowerCase().includes('cash');
            const allCashTxns = [
              ...dbData.transactions.map(t => ({ ...t, isExpense: false })),
              ...(dbData.expenses || []).map(e => ({
                id: `EXP-${e.id}`,
                date: e.date,
                type: 'Expense',
                party: e.category,
                debit: 0,
                credit: e.amount,
                debitAccount: 'Expense Account',
                creditAccount: (e.paymentMode || '').toLowerCase() === 'cash' ? 'Cash Account' : 'Bank/UPI Account',
                isExpense: true,
                description: e.description
              }))
            ]
            .filter(t => isCashAccount(t.debitAccount) || isCashAccount(t.creditAccount))
            .sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.id.localeCompare(b.id);
            })
            .map(t => {
              const isDr = isCashAccount(t.debitAccount);
              const amount = parseFloat(t.debit || t.credit || 0);
              if (isDr) {
                bal += amount;
              } else {
                bal -= amount;
              }
              return {
                ...t,
                cashIn: isDr ? amount : 0,
                cashOut: !isDr ? amount : 0,
                runningBalance: bal
              };
            });

            let displayCashTxns = allCashTxns;
            if (bookStartDate) displayCashTxns = displayCashTxns.filter(t => t.date >= bookStartDate);
            if (bookEndDate) displayCashTxns = displayCashTxns.filter(t => t.date <= bookEndDate);
            if (bookSearch) {
              const qs = bookSearch.toLowerCase().trim();
              displayCashTxns = displayCashTxns.filter(t => 
                (t.id || '').toLowerCase().includes(qs) || 
                (t.type || '').toLowerCase().includes(qs) || 
                (t.party || '').toLowerCase().includes(qs) ||
                (t.description || '').toLowerCase().includes(qs)
              );
            }

            const tableTxns = [...displayCashTxns].reverse();
            const totalIn = displayCashTxns.reduce((sum, t) => sum + t.cashIn, 0);
            const totalOut = displayCashTxns.reduce((sum, t) => sum + t.cashOut, 0);
            const netBalance = totalIn - totalOut;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div className="card card--lift">
                    <div className="stat__icon stat__icon--g" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-down-long"></i></div>
                    <div className="stat__val">{fmt(totalIn)}</div>
                    <div className="stat__lbl">Total Cash In (Inflow)</div>
                  </div>
                  <div className="card card--lift">
                    <div className="stat__icon stat__icon--r" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-up-long"></i></div>
                    <div className="stat__val">{fmt(totalOut)}</div>
                    <div className="stat__lbl">Total Cash Out (Outflow)</div>
                  </div>
                  <div className="card card--lift">
                    <div className={`stat__icon ${netBalance >= 0 ? 'stat__icon--g' : 'stat__icon--r'}`} style={{ marginBottom: '14px' }}><i className="fas fa-wallet"></i></div>
                    <div className="stat__val" style={{ color: netBalance >= 0 ? 'var(--accent)' : 'var(--red)' }}>{fmt(netBalance)}</div>
                    <div className="stat__lbl">Net Period Cash Change</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '5px' }}>Search Cash Transactions</label>
                      <input 
                        type="text" 
                        className="fi" 
                        placeholder="Search ID, type, party..." 
                        value={bookSearch} 
                        onChange={(e) => setBookSearch(e.target.value)} 
                        style={{ margin: 0, width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '5px' }}>Start Date</label>
                      <input 
                        type="date" 
                        className="fi" 
                        value={bookStartDate} 
                        onChange={(e) => setBookStartDate(e.target.value)} 
                        style={{ margin: 0, height: '38px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '5px' }}>End Date</label>
                      <input 
                        type="date" 
                        className="fi" 
                        value={bookEndDate} 
                        onChange={(e) => setBookEndDate(e.target.value)} 
                        style={{ margin: 0, height: '38px' }}
                      />
                    </div>
                    {(bookSearch || bookStartDate || bookEndDate) && (
                      <div style={{ alignSelf: 'flex-end' }}>
                        <button className="btn btn--secondary" onClick={() => { setBookSearch(''); setBookStartDate(''); setBookEndDate(''); }} style={{ height: '38px' }}>
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card__head">
                    <span>Cash Book Ledger</span>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Txn ID</th>
                        <th>Type</th>
                        <th>Party / Details</th>
                        <th style={{ textAlign: 'right' }}>Cash In (Dr)</th>
                        <th style={{ textAlign: 'right' }}>Cash Out (Cr)</th>
                        <th style={{ textAlign: 'right' }}>Running Cash Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableTxns.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '20px' }}>No cash transactions found for the selected filters.</td>
                        </tr>
                      ) : (
                        tableTxns.map((t, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{t.id}</td>
                            <td>
                              <span className={`badge ${
                                t.type === 'Sale' ? 'badge--green' :
                                t.type === 'Purchase' ? 'badge--blue' :
                                t.type === 'Bank Transfer' ? 'badge--blue' :
                                t.type === 'Expense' ? 'badge--red' : 'badge--yellow'
                              }`}>{t.type}</span>
                            </td>
                            <td>
                              <div>{t.party}</div>
                              {t.description && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.description}</div>}
                            </td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600, textAlign: 'right' }}>{t.cashIn ? fmt(t.cashIn) : '-'}</td>
                            <td style={{ color: 'var(--red)', fontWeight: 600, textAlign: 'right' }}>{t.cashOut ? fmt(t.cashOut) : '-'}</td>
                            <td style={{ fontWeight: 600, textAlign: 'right', color: t.runningBalance >= 0 ? 'var(--text-1)' : 'var(--red)' }}>{fmt(t.runningBalance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'bankbook' && (() => {
            let bal = 0;
            const isBankAccount = (acc) => {
              const lower = (acc || '').toLowerCase();
              return lower.includes('bank') || lower.includes('upi') || lower.includes('card');
            };
            const allBankTxns = [
              ...dbData.transactions.map(t => ({ ...t, isExpense: false })),
              ...(dbData.expenses || []).map(e => ({
                id: `EXP-${e.id}`,
                date: e.date,
                type: 'Expense',
                party: e.category,
                debit: 0,
                credit: e.amount,
                debitAccount: 'Expense Account',
                creditAccount: (e.paymentMode || '').toLowerCase() === 'cash' ? 'Cash Account' : 'Bank/UPI Account',
                isExpense: true,
                description: e.description
              }))
            ]
            .filter(t => isBankAccount(t.debitAccount) || isBankAccount(t.creditAccount))
            .sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.id.localeCompare(b.id);
            })
            .map(t => {
              const isDr = isBankAccount(t.debitAccount);
              const amount = parseFloat(t.debit || t.credit || 0);
              if (isDr) {
                bal += amount;
              } else {
                bal -= amount;
              }
              return {
                ...t,
                bankIn: isDr ? amount : 0,
                bankOut: !isDr ? amount : 0,
                runningBalance: bal
              };
            });

            let displayBankTxns = allBankTxns;
            if (bookStartDate) displayBankTxns = displayBankTxns.filter(t => t.date >= bookStartDate);
            if (bookEndDate) displayBankTxns = displayBankTxns.filter(t => t.date <= bookEndDate);
            if (bookSearch) {
              const qs = bookSearch.toLowerCase().trim();
              displayBankTxns = displayBankTxns.filter(t => 
                (t.id || '').toLowerCase().includes(qs) || 
                (t.type || '').toLowerCase().includes(qs) || 
                (t.party || '').toLowerCase().includes(qs) ||
                (t.description || '').toLowerCase().includes(qs)
              );
            }

            const tableTxns = [...displayBankTxns].reverse();
            const totalIn = displayBankTxns.reduce((sum, t) => sum + t.bankIn, 0);
            const totalOut = displayBankTxns.reduce((sum, t) => sum + t.bankOut, 0);
            const netBalance = totalIn - totalOut;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div className="card card--lift">
                    <div className="stat__icon stat__icon--g" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-down-long"></i></div>
                    <div className="stat__val">{fmt(totalIn)}</div>
                    <div className="stat__lbl">Total Bank In (Inflow)</div>
                  </div>
                  <div className="card card--lift">
                    <div className="stat__icon stat__icon--r" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-up-long"></i></div>
                    <div className="stat__val">{fmt(totalOut)}</div>
                    <div className="stat__lbl">Total Bank Out (Outflow)</div>
                  </div>
                  <div className="card card--lift">
                    <div className={`stat__icon ${netBalance >= 0 ? 'stat__icon--g' : 'stat__icon--r'}`} style={{ marginBottom: '14px' }}><i className="fas fa-university"></i></div>
                    <div className="stat__val" style={{ color: netBalance >= 0 ? 'var(--accent)' : 'var(--red)' }}>{fmt(netBalance)}</div>
                    <div className="stat__lbl">Net Period Bank Change</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '5px' }}>Search Bank Transactions</label>
                      <input 
                        type="text" 
                        className="fi" 
                        placeholder="Search ID, type, party..." 
                        value={bookSearch} 
                        onChange={(e) => setBookSearch(e.target.value)} 
                        style={{ margin: 0, width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '5px' }}>Start Date</label>
                      <input 
                        type="date" 
                        className="fi" 
                        value={bookStartDate} 
                        onChange={(e) => setBookStartDate(e.target.value)} 
                        style={{ margin: 0, height: '38px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '5px' }}>End Date</label>
                      <input 
                        type="date" 
                        className="fi" 
                        value={bookEndDate} 
                        onChange={(e) => setBookEndDate(e.target.value)} 
                        style={{ margin: 0, height: '38px' }}
                      />
                    </div>
                    {(bookSearch || bookStartDate || bookEndDate) && (
                      <div style={{ alignSelf: 'flex-end' }}>
                        <button className="btn btn--secondary" onClick={() => { setBookSearch(''); setBookStartDate(''); setBookEndDate(''); }} style={{ height: '38px' }}>
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card__head">
                    <span>Bank Book Ledger</span>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Txn ID</th>
                        <th>Type</th>
                        <th>Party / Details</th>
                        <th style={{ textAlign: 'right' }}>Bank In (Dr)</th>
                        <th style={{ textAlign: 'right' }}>Bank Out (Cr)</th>
                        <th style={{ textAlign: 'right' }}>Running Bank Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableTxns.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '20px' }}>No bank transactions found for the selected filters.</td>
                        </tr>
                      ) : (
                        tableTxns.map((t, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{t.id}</td>
                            <td>
                              <span className={`badge ${
                                t.type === 'Sale' ? 'badge--green' :
                                t.type === 'Purchase' ? 'badge--blue' :
                                t.type === 'Bank Transfer' ? 'badge--blue' :
                                t.type === 'Expense' ? 'badge--red' : 'badge--yellow'
                              }`}>{t.type}</span>
                            </td>
                            <td>
                              <div>{t.party}</div>
                              {t.description && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.description}</div>}
                            </td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600, textAlign: 'right' }}>{t.bankIn ? fmt(t.bankIn) : '-'}</td>
                            <td style={{ color: 'var(--red)', fontWeight: 600, textAlign: 'right' }}>{t.bankOut ? fmt(t.bankOut) : '-'}</td>
                            <td style={{ fontWeight: 600, textAlign: 'right', color: t.runningBalance >= 0 ? 'var(--text-1)' : 'var(--red)' }}>{fmt(t.runningBalance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'daybook' && (() => {
            const isCashAccount = (acc) => (acc || '').toLowerCase().includes('cash');
            const isBankAccount = (acc) => {
              const lower = (acc || '').toLowerCase();
              return lower.includes('bank') || lower.includes('upi') || lower.includes('card');
            };

            const allDayEntries = [
              ...dbData.transactions.map(t => {
                const amount = parseFloat(t.debit || t.credit || 0);
                const isSale = t.type === 'Sale';
                const isPurchase = t.type === 'Purchase';
                const isReceive = t.type.includes('Receive') || isSale;
                const isPay = t.type.includes('Pay') || isPurchase;

                const inflow = isReceive ? amount : 0;
                const outflow = isPay ? amount : 0;

                const isCashIn = isReceive && isCashAccount(t.debitAccount);
                const isCashOut = isPay && isCashAccount(t.creditAccount);
                const isBankIn = isReceive && isBankAccount(t.debitAccount);
                const isBankOut = isPay && isBankAccount(t.creditAccount);

                return {
                  id: t.id,
                  date: t.date,
                  type: t.type,
                  party: t.party,
                  inflow,
                  outflow,
                  cashInAmt: isCashIn ? amount : 0,
                  cashOutAmt: isCashOut ? amount : 0,
                  bankInAmt: isBankIn ? amount : 0,
                  bankOutAmt: isBankOut ? amount : 0,
                  isSale,
                  isPurchase,
                  saleAmt: isSale ? amount : 0,
                  purchaseAmt: isPurchase ? amount : 0,
                  description: ''
                };
              }),
              ...(dbData.expenses || []).map(e => {
                const amount = parseFloat(e.amount || 0);
                const isCash = (e.paymentMode || '').toLowerCase() === 'cash';
                
                return {
                  id: `EXP-${e.id}`,
                  date: e.date,
                  type: 'Expense',
                  party: e.category,
                  inflow: 0,
                  outflow: amount,
                  cashInAmt: 0,
                  cashOutAmt: isCash ? amount : 0,
                  bankInAmt: 0,
                  bankOutAmt: !isCash ? amount : 0,
                  isSale: false,
                  isPurchase: false,
                  saleAmt: 0,
                  purchaseAmt: 0,
                  description: e.description
                };
              })
            ];

            const dayEntries = allDayEntries.filter(e => e.date === dayBookDate);

            const dayCashIn = dayEntries.reduce((sum, e) => sum + e.cashInAmt, 0);
            const dayCashOut = dayEntries.reduce((sum, e) => sum + e.cashOutAmt, 0);
            const dayBankIn = dayEntries.reduce((sum, e) => sum + e.bankInAmt, 0);
            const dayBankOut = dayEntries.reduce((sum, e) => sum + e.bankOutAmt, 0);
            
            const totalDaySales = dayEntries.reduce((sum, e) => sum + e.saleAmt, 0);
            const totalDayPurchases = dayEntries.reduce((sum, e) => sum + e.purchaseAmt, 0);

            const totalInflow = dayEntries.reduce((sum, e) => sum + e.inflow, 0);
            const totalOutflow = dayEntries.reduce((sum, e) => sum + e.outflow, 0);
            const netDayBalance = totalInflow - totalOutflow;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>Daily Day Book</h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Summary of all activities for a specific business date.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>Select Date:</span>
                      <input 
                        type="date" 
                        className="fi" 
                        value={dayBookDate} 
                        onChange={(e) => setDayBookDate(e.target.value)} 
                        style={{ margin: 0, height: '38px', width: '160px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>COMMERCIALS</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span>Sales:</span>
                      <strong style={{ color: 'var(--accent)' }}>{fmt(totalDaySales)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span>Purchases:</span>
                      <strong style={{ color: 'var(--blue)' }}>{fmt(totalDayPurchases)}</strong>
                    </div>
                  </div>

                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--yellow)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>CASH FLOW</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span>Cash In:</span>
                      <strong style={{ color: 'var(--accent)' }}>{fmt(dayCashIn)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span>Cash Out:</span>
                      <strong style={{ color: 'var(--red)' }}>{fmt(dayCashOut)}</strong>
                    </div>
                  </div>

                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--blue)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>BANK FLOW</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span>Bank In:</span>
                      <strong style={{ color: 'var(--accent)' }}>{fmt(dayBankIn)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span>Bank Out:</span>
                      <strong style={{ color: 'var(--red)' }}>{fmt(dayBankOut)}</strong>
                    </div>
                  </div>

                  <div className="card card--lift" style={{ borderLeft: `4px solid ${netDayBalance >= 0 ? 'var(--accent)' : 'var(--red)'}` }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>DAILY NET BALANCE</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '10px', color: netDayBalance >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                      {fmt(netDayBalance)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '5px' }}>
                      {fmt(totalInflow)} Inflow vs {fmt(totalOutflow)} Outflow
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card__head">
                    <span>Transactions list for {dayBookDate}</span>
                    <span className="badge badge--blue" style={{ marginLeft: 'auto' }}>{dayEntries.length} Items</span>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Txn ID</th>
                        <th>Type</th>
                        <th>Party / Details</th>
                        <th style={{ textAlign: 'right' }}>Inflow (Sales/Receipts)</th>
                        <th style={{ textAlign: 'right' }}>Outflow (Purchases/Expenses)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayEntries.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '20px' }}>No transactions recorded on this date.</td>
                        </tr>
                      ) : (
                        dayEntries.map((e, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{e.id}</td>
                            <td>
                              <span className={`badge ${
                                e.type === 'Sale' ? 'badge--green' :
                                e.type === 'Purchase' ? 'badge--blue' :
                                e.type === 'Bank Transfer' ? 'badge--blue' :
                                e.type === 'Expense' ? 'badge--red' : 'badge--yellow'
                              }`}>{e.type}</span>
                            </td>
                            <td>
                              <div>{e.party}</div>
                              {e.description && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{e.description}</div>}
                            </td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600, textAlign: 'right' }}>{e.inflow ? fmt(e.inflow) : '-'}</td>
                            <td style={{ color: 'var(--red)', fontWeight: 600, textAlign: 'right' }}>{e.outflow ? fmt(e.outflow) : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'petty-cash' && (() => {
            const pettyTxns = (dbData.transactions || []).filter(t => 
              t.debitAccount === 'Petty Cash (Asset)' || t.creditAccount === 'Petty Cash (Asset)'
            );

            const pettyExpenses = (dbData.expenses || [])
              .filter(e => (e.paymentMode || '').toLowerCase() === 'petty cash')
              .map(e => ({
                id: `EXP-${e.id}`,
                date: e.date,
                type: 'Petty Cash Expense',
                party: e.category,
                debit: 0,
                credit: parseFloat(e.amount) || 0,
                debitAccount: 'Cost of Goods Sold (Expense)',
                creditAccount: 'Petty Cash (Asset)',
                description: e.description
              }));

            const allPettyTxns = [
              ...pettyTxns.map(t => ({
                id: t.id,
                date: t.date,
                type: t.type,
                party: t.party,
                debit: t.debitAccount === 'Petty Cash (Asset)' ? parseFloat(t.debit || t.amount || 0) : 0,
                credit: t.creditAccount === 'Petty Cash (Asset)' ? parseFloat(t.credit || t.amount || 0) : 0,
                description: t.description
              })),
              ...pettyExpenses.map(e => ({
                id: e.id,
                date: e.date,
                type: e.type,
                party: e.party,
                debit: 0,
                credit: e.credit,
                description: e.description
              }))
            ].sort((a, b) => b.date.localeCompare(a.date));

            const pettyOpening = (dbData.accounts || []).find(a => a.name === 'Petty Cash (Asset)')?.openingBalance || 0;
            const pettyInflowTotal = allPettyTxns.reduce((sum, t) => sum + t.debit, 0);
            const pettyOutflowTotal = allPettyTxns.reduce((sum, t) => sum + t.credit, 0);
            const currentPettyBalance = pettyOpening + pettyInflowTotal - pettyOutflowTotal;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--accent)', background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.05) 0%, rgba(var(--accent-rgb), 0.01) 100%)' }}>
                    <div className="stat__icon stat__icon--g" style={{ marginBottom: '14px' }}><i className="fas fa-coins"></i></div>
                    <div className="stat__val" style={{ color: 'var(--accent)' }}>{fmt(currentPettyBalance)}</div>
                    <div className="stat__lbl">Petty Cash Balance</div>
                  </div>
                  
                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--blue)' }}>
                    <div className="stat__icon stat__icon--b" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-down-long"></i></div>
                    <div className="stat__val">{fmt(pettyInflowTotal)}</div>
                    <div className="stat__lbl">Total Topups</div>
                  </div>

                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--red)' }}>
                    <div className="stat__icon stat__icon--r" style={{ marginBottom: '14px' }}><i className="fas fa-arrow-up-long"></i></div>
                    <div className="stat__val">{fmt(pettyOutflowTotal)}</div>
                    <div className="stat__lbl">Total Disbursements</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span>Petty Cash Book Ledger (Opening: {fmt(pettyOpening)})</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn--sm btn--primary" onClick={() => {
                        setPettyTopupForm({ date: new Date().toISOString().substring(0, 10), sourceAccount: '', amount: '', notes: '' });
                        setShowPettyTopupModal(true);
                      }}>
                        <i className="fas fa-plus"></i> Topup Petty Cash
                      </button>
                      <button className="btn btn--sm btn--primary" style={{ background: 'var(--orange)' }} onClick={() => {
                        setPettyExpenseForm({ date: new Date().toISOString().substring(0, 10), category: '', amount: '', notes: '' });
                        setShowPettyExpenseModal(true);
                      }}>
                        <i className="fas fa-receipt"></i> Log Expense
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Txn ID</th>
                          <th>Type</th>
                          <th>Category / Description</th>
                          <th style={{ textAlign: 'right' }}>Cash In (Topup)</th>
                          <th style={{ textAlign: 'right' }}>Cash Out (Expense)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPettyTxns.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                              No petty cash transactions recorded.
                            </td>
                          </tr>
                        ) : (
                          allPettyTxns.map((t, idx) => (
                            <tr key={idx}>
                              <td>{t.date}</td>
                              <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{t.id}</td>
                              <td>
                                <span className={`badge ${
                                  t.type === 'Petty Cash Topup' ? 'badge--green' : 'badge--red'
                                }`}>{t.type}</span>
                              </td>
                              <td>
                                <div>{t.party}</div>
                                {t.description && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.description}</div>}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                                {t.debit > 0 ? fmt(t.debit) : '-'}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>
                                {t.credit > 0 ? fmt(t.credit) : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'trial-balance' && (() => {
            const report = getTrialBalanceReport();

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--blue)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>TOTAL DEBITS (DR)</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '10px', color: 'var(--blue)' }}>
                      {fmt(report.totalDebits)}
                    </div>
                  </div>

                  <div className="card card--lift" style={{ borderLeft: '4px solid var(--yellow)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>TOTAL CREDITS (CR)</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '10px', color: 'var(--yellow)' }}>
                      {fmt(report.totalCredits)}
                    </div>
                  </div>

                  <div className="card card--lift" style={{ borderLeft: `4px solid ${report.isBalanced ? 'var(--accent)' : 'var(--red)'}` }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>TRIAL BALANCE STATUS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '10px', color: report.isBalanced ? 'var(--accent)' : 'var(--red)' }}>
                      {report.isBalanced ? '✓ Balanced' : '⚠️ Unbalanced'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '5px' }}>
                      {report.isBalanced ? 'Debits equal Credits.' : `Difference: ${fmt(Math.abs(report.totalDebits - report.totalCredits))}`}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Trial Balance Sheet</span>
                    <button className="btn btn--sm" style={{ background: 'var(--accent)', color: '#fff' }} onClick={handlePrintTrialBalance}>
                      <i className="fas fa-print"></i> Print Trial Balance
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Account Name</th>
                          <th>Account Type</th>
                          <th style={{ textAlign: 'right' }}>Debit (Dr)</th>
                          <th style={{ textAlign: 'right' }}>Credit (Cr)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.rows.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                              No accounts loaded.
                            </td>
                          </tr>
                        ) : (
                          report.rows.map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{row.name}</td>
                              <td>
                                <span className={`badge ${
                                  row.type === 'Asset' ? 'badge--green' :
                                  row.type === 'Liability' ? 'badge--red' :
                                  row.type === 'Equity' ? 'badge--blue' :
                                  row.type === 'Income' ? 'badge--yellow' : 'badge--orange'
                                }`}>{row.type}</span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: row.debits > 0 ? 600 : 400, color: row.debits > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                                {row.debits > 0 ? fmt(row.debits) : '-'}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: row.credits > 0 ? 600 : 400, color: row.credits > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                                {row.credits > 0 ? fmt(row.credits) : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr style={{ borderTop: '2px double var(--border)', fontWeight: 800, backgroundColor: 'var(--bg-card-hover)' }}>
                          <td colSpan="2">Grand Total</td>
                          <td style={{ textAlign: 'right', color: 'var(--blue)' }}>{fmt(report.totalDebits)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--yellow)' }}>{fmt(report.totalCredits)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {txnSubTab === 'bank-accounts' && (() => {
            const banks = dbData.bankAccounts || [];
            
            const getBankTransactions = (bank) => {
              const isDefaultBank = bank.id === 'bank-1' || bank.accountName === 'Bank Account (Asset)';
              
              return [
                ...dbData.transactions.map(t => ({ ...t, isExpense: false })),
                ...(dbData.expenses || []).map(e => {
                  const isCash = (e.paymentMode || '').toLowerCase() === 'cash';
                  return {
                    id: `EXP-${e.id}`,
                    date: e.date,
                    type: 'Expense',
                    party: e.category,
                    debit: 0,
                    credit: parseFloat(e.amount) || 0,
                    debitAccount: 'Expense Account',
                    creditAccount: isCash ? 'Cash Account' : 'Bank Account (Asset)',
                    isExpense: true,
                    description: e.description
                  };
                })
              ].filter(t => {
                const dr = (t.debitAccount || '').toLowerCase();
                const cr = (t.creditAccount || '').toLowerCase();
                const targetName = bank.accountName.toLowerCase();
                
                if (dr === targetName || cr === targetName) return true;
                
                if (isDefaultBank) {
                  const isGenericBank = (name) => {
                    const n = (name || '').toLowerCase();
                    return n === 'bank/upi account' || n === 'bank/upi account (asset)' || n === 'bank account (asset)';
                  };
                  if (isGenericBank(dr) || isGenericBank(cr)) return true;
                }
                
                return false;
              });
            };

            const getBankBalance = (bank) => {
              const txns = getBankTransactions(bank);
              const targetName = bank.accountName.toLowerCase();
              const isDefaultBank = bank.id === 'bank-1' || bank.accountName === 'Bank Account (Asset)';
              
              const isTargetAccount = (acc) => {
                if (!acc) return false;
                const lower = acc.toLowerCase();
                if (lower === targetName) return true;
                if (isDefaultBank) {
                  return lower === 'bank/upi account' || lower === 'bank/upi account (asset)' || lower === 'bank account (asset)';
                }
                return false;
              };

              const opBal = parseFloat(bank.openingBalance) || 0;
              
              const netDrCr = txns.reduce((sum, t) => {
                const amount = parseFloat(t.debit || t.credit || t.amount || 0);
                const isDr = isTargetAccount(t.debitAccount);
                return sum + (isDr ? amount : -amount);
              }, 0);

              return opBal + netDrCr;
            };

            const totalBalance = banks.reduce((sum, b) => sum + getBankBalance(b), 0);
            const totalAccounts = banks.length;
            
            const transfers = dbData.transactions.filter(t => t.type === 'Bank Transfer');
            const lastTransfer = transfers.length > 0 ? transfers[transfers.length - 1] : null;

            if (showReconView && reconBankId) {
              const bank = banks.find(b => b.id === reconBankId);
              if (!bank) return <p style={{ color: 'var(--red)' }}>Error: Bank account not found.</p>;
              
              const targetName = bank.accountName.toLowerCase();
              const isDefaultBank = bank.id === 'bank-1' || bank.accountName === 'Bank Account (Asset)';
              const isTargetAccount = (acc) => {
                if (!acc) return false;
                const lower = acc.toLowerCase();
                if (lower === targetName) return true;
                if (isDefaultBank) {
                  return lower === 'bank/upi account' || lower === 'bank/upi account (asset)' || lower === 'bank account (asset)';
                }
                return false;
              };

              const bankTxns = getBankTransactions(bank).sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.id.localeCompare(b.id);
              });

              const opBal = parseFloat(bank.openingBalance) || 0;
              
              const reconciledInflows = bankTxns
                .filter(t => t.isReconciled && isTargetAccount(t.debitAccount))
                .reduce((sum, t) => sum + parseFloat(t.debit || t.credit || t.amount || 0), 0);

              const reconciledOutflows = bankTxns
                .filter(t => t.isReconciled && isTargetAccount(t.creditAccount))
                .reduce((sum, t) => sum + parseFloat(t.debit || t.credit || t.amount || 0), 0);

              const clearedBalance = opBal + reconciledInflows - reconciledOutflows;
              const stmtBal = parseFloat(reconStatementBalance) || 0;
              const difference = stmtBal - clearedBalance;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-arrows-spin" style={{ color: 'var(--accent)' }}></i> Bank Reconciliation: {bank.accountName}
                      </h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>
                        Match your system transactions with bank statements. Check items that appear on your statement.
                      </p>
                    </div>
                    <button className="btn btn--sm btn--primary" onClick={() => setShowReconView(false)}>
                      <i className="fas fa-arrow-left"></i> Back to Accounts
                    </button>
                  </div>

                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--blue)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>STATEMENT BALANCE</div>
                      <input
                        type="number"
                        className="fi"
                        placeholder="Enter Statement Balance"
                        value={reconStatementBalance}
                        onChange={(e) => setReconStatementBalance(e.target.value)}
                        style={{ marginTop: '10px', width: '100%', fontSize: '18px', fontWeight: 'bold' }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '5px' }}>
                        As of statement date: 
                        <input
                          type="date"
                          className="fi"
                          value={reconStatementDate}
                          onChange={(e) => setReconStatementDate(e.target.value)}
                          style={{ display: 'inline-block', width: '130px', padding: '2px 5px', fontSize: '11px', marginLeft: '5px', height: 'auto' }}
                        />
                      </div>
                    </div>

                    <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>CLEARED BALANCE</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '10px', color: 'var(--accent)' }}>
                        {fmt(clearedBalance)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '5px' }}>
                        Opening {fmt(opBal)} + Rec. Inflows {fmt(reconciledInflows)} - Rec. Outflows {fmt(reconciledOutflows)}
                      </div>
                    </div>

                    <div className="card" style={{ padding: '16px', borderLeft: `4px solid ${difference === 0 ? 'var(--accent)' : 'var(--red)'}` }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>DIFFERENCE</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '10px', color: difference === 0 ? 'var(--accent)' : 'var(--red)' }}>
                        {fmt(difference)}
                      </div>
                      <div style={{ fontSize: '11px', color: difference === 0 ? 'var(--accent)' : 'var(--red)', marginTop: '5px', fontWeight: 500 }}>
                        {difference === 0 ? '✓ Balanced' : 'Unreconciled Difference'}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Reconciliation Worksheet</span>
                      <span className="badge badge--blue">{bankTxns.length} Transactions</span>
                    </div>
                    <div className="table-responsive">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th style={{ width: '50px', textAlign: 'center' }}>Reconciled</th>
                            <th>Date</th>
                            <th>Txn ID</th>
                            <th>Type</th>
                            <th>Party / Description</th>
                            <th style={{ textAlign: 'right' }}>Deposit (Inflow)</th>
                            <th style={{ textAlign: 'right' }}>Withdrawal (Outflow)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankTxns.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                                No transactions found for this bank account.
                              </td>
                            </tr>
                          ) : (
                            bankTxns.map((t, idx) => {
                              const isDr = isTargetAccount(t.debitAccount);
                              const amount = parseFloat(t.debit || t.credit || t.amount || 0);
                              return (
                                <tr key={idx} style={{ background: t.isReconciled ? 'rgba(var(--accent-rgb), 0.05)' : 'none' }}>
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!t.isReconciled}
                                      onChange={() => handleToggleReconciled(t.id)}
                                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                    />
                                  </td>
                                  <td>{t.date}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{t.id}</td>
                                  <td>
                                    <span className={`badge ${
                                      t.type === 'Sale' ? 'badge--green' :
                                      t.type === 'Purchase' ? 'badge--blue' :
                                      t.type === 'Bank Transfer' ? 'badge--blue' :
                                      t.type === 'Expense' ? 'badge--red' : 'badge--yellow'
                                    }`}>{t.type}</span>
                                  </td>
                                  <td>
                                    <div>{t.party}</div>
                                    {t.description && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.description}</div>}
                                  </td>
                                  <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                                    {isDr ? fmt(amount) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>
                                    {!isDr ? fmt(amount) : '-'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }

            const allCheques = dbData.cheques || [];
            const receivedPending = allCheques.filter(c => c.type === 'Received' && c.status === 'Pending').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            const issuedPending = allCheques.filter(c => c.type === 'Issued' && c.status === 'Pending').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            const clearedTotal = allCheques.filter(c => c.status === 'Cleared').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            const bouncedTotal = allCheques.filter(c => c.status === 'Bounced').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

            const filteredCheques = allCheques.filter(c => {
              if (chequeFilterStatus === 'All') return true;
              return c.status === chequeFilterStatus;
            }).sort((a, b) => b.dueDate.localeCompare(a.dueDate));

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
                  <button 
                    className={`btn btn--sm ${bankSubTab === 'accounts' ? 'btn--primary' : ''}`}
                    onClick={() => setBankSubTab('accounts')}
                    style={{ borderRadius: '20px', padding: '6px 16px' }}
                  >
                    <i className="fas fa-university"></i> Bank Accounts
                  </button>
                  <button 
                    className={`btn btn--sm ${bankSubTab === 'cheques' ? 'btn--primary' : ''}`}
                    onClick={() => setBankSubTab('cheques')}
                    style={{ borderRadius: '20px', padding: '6px 16px' }}
                  >
                    <i className="fas fa-money-check-dollar"></i> Cheque Book
                  </button>
                </div>

                {bankSubTab === 'accounts' ? (
                  <>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--accent)', background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.05) 0%, rgba(var(--accent-rgb), 0.01) 100%)' }}>
                        <div className="stat__icon stat__icon--g" style={{ marginBottom: '14px' }}><i className="fas fa-university"></i></div>
                        <div className="stat__val" style={{ color: 'var(--accent)' }}>{fmt(totalBalance)}</div>
                        <div className="stat__lbl">Total Bank Balance</div>
                      </div>
                      
                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--blue)' }}>
                        <div className="stat__icon stat__icon--b" style={{ marginBottom: '14px' }}><i className="fas fa-building-columns"></i></div>
                        <div className="stat__val">{totalAccounts}</div>
                        <div className="stat__lbl">Active Bank Accounts</div>
                      </div>

                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--yellow)' }}>
                        <div className="stat__icon stat__icon--y" style={{ marginBottom: '14px' }}><i className="fas fa-right-left"></i></div>
                        <div className="stat__val" style={{ fontSize: '15px', lineHeight: '28px', fontWeight: 700 }}>
                          {lastTransfer ? `${fmt(lastTransfer.debit)} on ${lastTransfer.date}` : 'No Transfers Yet'}
                        </div>
                        <div className="stat__lbl">Last Bank Transfer</div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <span>Registered Bank Accounts</span>
                        <button className="btn btn--primary btn--sm" onClick={() => {
                          setBankForm({ accountName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', openingBalance: 0 });
                          setEditingBank(null);
                          setShowBankModal(true);
                        }}>
                          <i className="fas fa-plus"></i> Add Bank Account
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>Account / Ledger Name</th>
                              <th>Bank & Branch</th>
                              <th>Account Details</th>
                              <th style={{ textAlign: 'right' }}>Opening Bal.</th>
                              <th style={{ textAlign: 'right' }}>Current Bal.</th>
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {banks.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                                  No bank accounts registered. Click Add Bank Account to start.
                                </td>
                              </tr>
                            ) : (
                              banks.map((b, idx) => {
                                const currentBal = getBankBalance(b);
                                return (
                                  <tr key={idx}>
                                    <td>
                                      <div style={{ fontWeight: 600, color: 'var(--blue)' }}>{b.accountName}</div>
                                    </td>
                                    <td>
                                      <div>{b.bankName}</div>
                                      {b.branchName && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{b.branchName}</div>}
                                    </td>
                                    <td>
                                      <div>A/C: {b.accountNumber || 'N/A'}</div>
                                      {b.ifscCode && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>IFSC: {b.ifscCode}</div>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{fmt(b.openingBalance)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: currentBal >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                                      {fmt(currentBal)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                                        <button className="btn btn--sm btn--primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => {
                                          setReconBankId(b.id);
                                          setReconStatementBalance(currentBal.toFixed(2));
                                          setReconStatementDate(new Date().toISOString().substring(0, 10));
                                          setShowReconView(true);
                                        }}>
                                          <i className="fas fa-arrows-spin"></i> Reconcile
                                        </button>
                                        
                                        <button className="btn btn--sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => {
                                          setLedgerAccountFilter(b.accountName);
                                          setTxnSubTab('flat');
                                        }}>
                                          <i className="fas fa-list"></i> Ledger
                                        </button>
                                        
                                        <button className="btn btn--sm btn--icon" title="Edit Account" onClick={() => {
                                          setEditingBank(b);
                                          setBankForm({ ...b });
                                          setShowBankModal(true);
                                        }}>
                                          <i className="fas fa-pencil"></i>
                                        </button>

                                        <button className="btn btn--sm btn--icon" title="Delete Account" style={{ color: 'var(--red)' }} onClick={() => handleDeleteBank(b)}>
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--accent)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>RECEIVED PENDING</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: 'var(--accent)' }}>{fmt(receivedPending)}</div>
                      </div>
                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--blue)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>ISSUED PENDING</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: 'var(--blue)' }}>{fmt(issuedPending)}</div>
                      </div>
                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--green)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>TOTAL CLEARED</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: 'var(--green)' }}>{fmt(clearedTotal)}</div>
                      </div>
                      <div className="card card--lift" style={{ borderLeft: '4px solid var(--red)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>TOTAL BOUNCED</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: 'var(--red)' }}>{fmt(bouncedTotal)}</div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {['All', 'Pending', 'Cleared', 'Bounced'].map(status => (
                            <button 
                              key={status}
                              className={`btn btn--sm ${chequeFilterStatus === status ? 'btn--primary' : ''}`}
                              onClick={() => setChequeFilterStatus(status)}
                              style={{ borderRadius: '4px', padding: '4px 12px' }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        <button className="btn btn--primary btn--sm" onClick={() => {
                          setChequeForm({ chequeNumber: '', bankName: '', issueDate: new Date().toISOString().substring(0, 10), dueDate: new Date().toISOString().substring(0, 10), partyName: '', amount: '', type: 'Received', bankAccountId: '', notes: '' });
                          setEditingCheque(null);
                          setShowChequeModal(true);
                        }}>
                          <i className="fas fa-plus"></i> Record Cheque
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>Cheque No.</th>
                              <th>Type</th>
                              <th>Party / Client</th>
                              <th>Bank & Account</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                              <th>Dates</th>
                              <th>Status</th>
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCheques.length === 0 ? (
                              <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                                  No cheques found for the selected status.
                                </td>
                              </tr>
                            ) : (
                              filteredCheques.map((c, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{c.chequeNumber}</td>
                                  <td>
                                    <span className={`badge ${c.type === 'Received' ? 'badge--green' : 'badge--blue'}`}>
                                      {c.type}
                                    </span>
                                  </td>
                                  <td>{c.partyName}</td>
                                  <td>
                                    <div>{c.bankName}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>A/C: {c.bankAccountId}</div>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(c.amount)}</td>
                                  <td>
                                    <div style={{ fontSize: '12px' }}>Issue: {c.issueDate}</div>
                                    <div style={{ fontSize: '12px', fontWeight: 500 }}>Due: {c.dueDate}</div>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      c.status === 'Pending' ? 'badge--yellow' :
                                      c.status === 'Cleared' ? 'badge--green' :
                                      c.status === 'Bounced' ? 'badge--red' : 'badge--red'
                                    }`}>
                                      {c.status}
                                    </span>
                                    {c.status === 'Bounced' && c.bounceCharge > 0 && (
                                      <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '2px' }}>
                                        Penalty: {fmt(c.bounceCharge)}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                                      {c.status === 'Pending' && (
                                        <>
                                          <button className="btn btn--sm btn--primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => {
                                            const dt = window.prompt("Enter Clearance Date (YYYY-MM-DD):", new Date().toISOString().substring(0, 10));
                                            if (dt !== null) handleClearCheque(c.id, dt);
                                          }}>
                                            Clear
                                          </button>
                                          <button className="btn btn--sm btn--red" style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--red)' }} onClick={() => {
                                            setBounceForm({ chequeId: c.id, bounceCharge: 0, date: new Date().toISOString().substring(0, 10) });
                                            setShowBounceModal(true);
                                          }}>
                                            Bounce
                                          </button>
                                        </>
                                      )}
                                      
                                      <button className="btn btn--sm btn--icon" title="Delete Cheque Record" style={{ color: 'var(--red)' }} onClick={() => handleDeleteCheque(c.id)}>
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </section>
      )}
      {/* ==================== MODULE 8: GST & TAXES ==================== */}
      {currentView === 'gst' && (
        <section className="view active" id="view-gst">
          <div className="sec-header">
            <h2>GST & Tax Management</h2>
            <p>Generate, review, and export GSTR reports for tax filing, manage product HSN/SAC codes, generate E-Way Bills, and log TDS transactions.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className={`btn btn--sm ${gstTab === 'gstr1' ? 'btn--primary' : ''}`} onClick={() => setGstTab('gstr1')}>GSTR-1 (Sales)</button>
              <button className={`btn btn--sm ${gstTab === 'gstr2' ? 'btn--primary' : ''}`} onClick={() => setGstTab('gstr2')}>GSTR-2 (Purchases)</button>
              <button className={`btn btn--sm ${gstTab === 'gstr3b' ? 'btn--primary' : ''}`} onClick={() => setGstTab('gstr3b')}>GSTR-3B (Summary)</button>
              <button className={`btn btn--sm ${gstTab === 'hsn' ? 'btn--primary' : ''}`} onClick={() => setGstTab('hsn')}>HSN/SAC Codes</button>
              <button className={`btn btn--sm ${gstTab === 'eway' ? 'btn--primary' : ''}`} onClick={() => setGstTab('eway')}>E-Way Bills</button>
              <button className={`btn btn--sm ${gstTab === 'tds' ? 'btn--primary' : ''}`} onClick={() => setGstTab('tds')}>TDS Tracker</button>
              <button className={`btn btn--sm ${gstTab === 'summary' ? 'btn--primary' : ''}`} onClick={() => setGstTab('summary')}>Tax Summary</button>
              <button className={`btn btn--sm ${gstTab === 'calendar' ? 'btn--primary' : ''}`} onClick={() => setGstTab('calendar')}>📅 Filing Calendar</button>
            </div>
            {gstTab !== 'hsn' && gstTab !== 'eway' && gstTab !== 'tds' && gstTab !== 'summary' && gstTab !== 'calendar' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-2)' }}>Filing Period:</span>
                <input
                  type="month"
                  className="fi"
                  style={{ width: '160px', padding: '4px 8px' }}
                  value={gstMonth}
                  onChange={(e) => setGstMonth(e.target.value)}
                />
              </div>
            )}
          </div>

          {gstTab === 'hsn' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>HSN / SAC Code Directory</h3>
                <input
                  type="text"
                  className="fi"
                  placeholder="Search products..."
                  value={hsnSearch}
                  onChange={(e) => setHsnSearch(e.target.value)}
                  style={{ maxWidth: '300px', padding: '4px 8px' }}
                />
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>HSN/SAC Code</th>
                    <th style={{ width: '180px' }}>GST Rate / Tax Slab</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.products
                    .filter(p => p.active !== false && (
                      (p.name || '').toLowerCase().includes(hsnSearch.toLowerCase()) ||
                      (p.sku || '').toLowerCase().includes(hsnSearch.toLowerCase()) ||
                      (p.hsnSac || '').toLowerCase().includes(hsnSearch.toLowerCase())
                    ))
                    .map((p, idx) => {
                      const isEditing = editingHsnProductId === (p.id || p._id);
                      return (
                        <tr key={p.id || p._id || idx}>
                          <td><strong>{p.name}</strong></td>
                          <td><code>{p.sku || 'N/A'}</code></td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="fi"
                                value={editingHsnVal}
                                onChange={(e) => setEditingHsnVal(e.target.value)}
                                style={{ width: '100%', padding: '4px 8px', fontFamily: 'monospace' }}
                              />
                            ) : (
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.hsnSac || '-'}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select
                                className="fi"
                                value={editingHsnTaxSlab}
                                onChange={(e) => setEditingHsnTaxSlab(e.target.value)}
                                style={{ width: '100%', padding: '4px 8px' }}
                              >
                                <option value="Exempt">Exempt</option>
                                <option value="0%">0%</option>
                                <option value="5%">5%</option>
                                <option value="12%">12%</option>
                                <option value="18%">18%</option>
                                <option value="28%">28%</option>
                              </select>
                            ) : (
                              <span>{p.taxSlab || '18%'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  className="btn btn--sm btn--primary"
                                  style={{ padding: '2px 8px' }}
                                  onClick={async () => {
                                    const pId = p.id || p._id;
                                    const updatedProducts = dbData.products.map(prod => {
                                      if ((prod.id || prod._id) === pId) {
                                        return { ...prod, hsnSac: editingHsnVal.trim(), taxSlab: editingHsnTaxSlab };
                                      }
                                      return prod;
                                    });
                                    await saveDB({ ...dbData, products: updatedProducts });
                                    setEditingHsnProductId(null);
                                  }}
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="btn btn--sm btn--secondary"
                                  style={{ padding: '2px 8px' }}
                                  onClick={() => setEditingHsnProductId(null)}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn btn--sm"
                                onClick={() => {
                                  setEditingHsnProductId(p.id || p._id);
                                  setEditingHsnVal(p.hsnSac || '');
                                  setEditingHsnTaxSlab(p.taxSlab || '18%');
                                }}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {gstTab === 'eway' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              <form
                className="card"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const { invoiceId, transporterId, vehicleNo, distance, hsnCode } = ewayForm;
                  if (!invoiceId || !transporterId || !vehicleNo || !distance) {
                    alert('Please fill in all E-Way Bill fields.');
                    return;
                  }
                  const sale = dbData.sales.find(s => s.id === invoiceId);
                  if (!sale) return;

                  const ewayBillNo = "3810" + Math.floor(10000000 + Math.random() * 90000000);
                  const days = Math.max(1, Math.ceil(parseFloat(distance) / 200));
                  const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

                  const newEway = {
                    ewayBillNo,
                    invoiceNo: sale.id,
                    customer: sale.customer,
                    amount: sale.amount,
                    transporterId,
                    vehicleNo,
                    distance,
                    hsnCode: hsnCode || '8471',
                    validUntil,
                    qrcodeValue: `EWAY-${ewayBillNo}-${vehicleNo}-${sale.amount}`
                  };

                  const updatedSales = dbData.sales.map(s => {
                    if (s.id === invoiceId) {
                      return {
                        ...s,
                        ewayBillNo,
                        transporterId,
                        vehicleNo,
                        distance,
                        ewayValidUntil: validUntil
                      };
                    }
                    return s;
                  });

                  await saveDB({ ...dbData, sales: updatedSales });
                  setGeneratedEway(newEway);
                  setEwayForm({ invoiceId: '', transporterId: '', vehicleNo: '', distance: '', hsnCode: '' });
                  alert('E-Way Bill generated and linked to sales invoice successfully.');
                }}
              >
                <h3 style={{ marginBottom: '16px' }}>E-Way Bill Compliance Management</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Select Active Invoice</label>
                    <select
                      className="fi"
                      required
                      value={ewayForm.invoiceId}
                      onChange={e => {
                        const sId = e.target.value;
                        const matchedSale = dbData.sales.find(s => s.id === sId);
                        let matchedHsn = '8471';
                        if (matchedSale && matchedSale.items && matchedSale.items.length) {
                          matchedHsn = matchedSale.items[0].hsnSac || '8471';
                        }
                        setEwayForm({ ...ewayForm, invoiceId: sId, hsnCode: matchedHsn });
                      }}
                    >
                      <option value="">-- Select Receivable Sale --</option>
                      {dbData.sales.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.id} - {s.customer} ({fmt(s.amount)}) {s.amount >= 50000 ? '✓ Audit Compliant' : '⚠ Below Limit'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Transporter ID</label>
                      <input
                        type="text"
                        className="fi"
                        required
                        placeholder="e.g. TRANS-8812"
                        value={ewayForm.transporterId}
                        onChange={e => setEwayForm({ ...ewayForm, transporterId: e.target.value.toUpperCase() })}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Vehicle Number</label>
                      <input
                        type="text"
                        className="fi"
                        required
                        placeholder="e.g. MH-12-PQ-9876"
                        value={ewayForm.vehicleNo}
                        onChange={e => setEwayForm({ ...ewayForm, vehicleNo: e.target.value.toUpperCase() })}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Distance (km)</label>
                      <input
                        type="number"
                        className="fi"
                        required
                        placeholder="e.g. 350"
                        value={ewayForm.distance}
                        onChange={e => setEwayForm({ ...ewayForm, distance: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>HSN/SAC Code</label>
                      <input
                        type="text"
                        className="fi"
                        required
                        placeholder="e.g. 8471"
                        value={ewayForm.hsnCode}
                        onChange={e => setEwayForm({ ...ewayForm, hsnCode: e.target.value })}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn--primary" style={{ marginTop: '8px' }}>
                    Generate Official E-Way Bill
                  </button>
                </div>
              </form>

              {generatedEway ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '16px' }}>Official E-Way Bill Certificate</h4>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>No: {generatedEway.ewayBillNo}</span>
                    </div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(generatedEway.qrcodeValue)}`}
                      alt="Verification QR"
                      style={{ border: '1px solid var(--border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--text-2)' }}>
                    <div>
                      <strong>Invoice Code:</strong> <span>{generatedEway.invoiceNo}</span>
                    </div>
                    <div>
                      <strong>Party Customer:</strong> <span>{generatedEway.customer}</span>
                    </div>
                    <div>
                      <strong>Consignment Value:</strong> <span>{fmt(generatedEway.amount)}</span>
                    </div>
                    <div>
                      <strong>Vehicle Transport:</strong> <span>{generatedEway.vehicleNo}</span>
                    </div>
                    <div>
                      <strong>Transporter ID:</strong> <span>{generatedEway.transporterId}</span>
                    </div>
                    <div>
                      <strong>Filing Validity:</strong> <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>Expires {generatedEway.validUntil}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="btn btn--sm btn--primary"
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        let html = `
                          <html>
                            <head>
                              <title>E-Way Bill: ${generatedEway.ewayBillNo}</title>
                              <style>
                                body { font-family: sans-serif; padding: 30px; }
                                .hdr { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; display:flex; justify-content:space-between; align-items:center; }
                                .lbl { color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
                                .val { font-weight: bold; font-size: 14px; }
                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                              </style>
                            </head>
                            <body>
                              <div class="hdr">
                                <div>
                                  <h2 style="margin:0;color:#1e3a8a;">GST E-WAY BILL</h2>
                                  <code style="font-size:14px;font-weight:bold;">No: ${generatedEway.ewayBillNo}</code>
                                </div>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generatedEway.qrcodeValue)}"/>
                              </div>
                              <div class="grid">
                                <div><div class="lbl">Invoice Number</div><div class="val">${generatedEway.invoiceNo}</div></div>
                                <div><div class="lbl">Customer Name</div><div class="val">${generatedEway.customer}</div></div>
                                <div><div class="lbl">Transporter ID</div><div class="val">${generatedEway.transporterId}</div></div>
                                <div><div class="lbl">Vehicle Number</div><div class="val">${generatedEway.vehicleNo}</div></div>
                                <div><div class="lbl">Distance</div><div class="val">${generatedEway.distance} km</div></div>
                                <div><div class="lbl">Valid Until</div><div class="val" style="color:red;">${generatedEway.validUntil}</div></div>
                              </div>
                              <script>window.onload=function(){window.print();window.close();};</script>
                            </body>
                          </html>
                        `;
                        printWindow.document.write(html);
                        printWindow.document.close();
                      }}
                    >
                      <i className="fas fa-print"></i> Print Slip
                    </button>
                    <button className="btn btn--sm btn--secondary" onClick={() => setGeneratedEway(null)}>Close preview</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-3)' }}>
                  <i className="fas fa-file-invoice" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                  <span>Fill form to generate or select active bills below.</span>
                </div>
              )}

              {/* History Table */}
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3 style={{ marginBottom: '16px' }}>Active E-Way Bills</h3>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>E-Way Bill No</th>
                      <th>Customer Name</th>
                      <th>Vehicle Number</th>
                      <th>Transporter ID</th>
                      <th>Valid Until</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.sales.filter(s => s.ewayBillNo).length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No generated E-Way bills recorded.</td>
                      </tr>
                    ) : (
                      dbData.sales.filter(s => s.ewayBillNo).map((s, idx) => (
                        <tr key={idx}>
                          <td>{s.id}</td>
                          <td><code>{s.ewayBillNo}</code></td>
                          <td>{s.customer}</td>
                          <td><code>{s.vehicleNo}</code></td>
                          <td><code>{s.transporterId}</code></td>
                          <td style={{ color: 'var(--red)', fontWeight: 'bold' }}>{s.ewayValidUntil}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                className="btn btn--sm"
                                onClick={() => {
                                  setGeneratedEway({
                                    ewayBillNo: s.ewayBillNo,
                                    invoiceNo: s.id,
                                    customer: s.customer,
                                    amount: s.amount,
                                    transporterId: s.transporterId,
                                    vehicleNo: s.vehicleNo,
                                    distance: s.distance,
                                    validUntil: s.ewayValidUntil,
                                    qrcodeValue: `EWAY-${s.ewayBillNo}-${s.vehicleNo}-${s.amount}`
                                  });
                                }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn--sm btn--secondary"
                                onClick={async () => {
                                  if (!await window.confirm('Are you sure you want to cancel this E-Way bill link?')) return;
                                  const updatedSales = dbData.sales.map(item => {
                                    if (item.id === s.id) {
                                      const { ewayBillNo, transporterId, vehicleNo, distance, ewayValidUntil, ...rest } = item;
                                      return rest;
                                    }
                                    return item;
                                  });
                                  await saveDB({ ...dbData, sales: updatedSales });
                                  setGeneratedEway(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {gstTab === 'tds' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              <form
                className="card"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const { partyName, section, amount, narration, type } = tdsForm;
                  if (!partyName || !amount) {
                    alert('Please enter party name and amount.');
                    return;
                  }

                  let rate = 0.02;
                  if (section === '194C-Ind') rate = 0.01;
                  else if (section === '194C-Corp') rate = 0.02;
                  else if (section === '194J') rate = 0.10;
                  else if (section === '194I') rate = 0.10;
                  else if (section === '194H') rate = 0.05;

                  const base = parseFloat(amount) || 0;
                  const withheld = base * rate;

                  const newTds = {
                    id: `TDS-${Date.now()}`,
                    date: new Date().toISOString().substring(0, 10),
                    partyName,
                    section: section.replace('-Ind', '').replace('-Corp', ''),
                    amount: base,
                    tdsRate: `${(rate * 100).toFixed(0)}%`,
                    tdsAmount: Math.round(withheld * 100) / 100,
                    type: type || 'Receivable',
                    narration: narration || `TDS withholding logged under Section ${section}`
                  };

                  const updatedSettings = {
                    ...dbData.settings,
                    tdsTransactions: [newTds, ...(dbData.settings?.tdsTransactions || [])]
                  };

                  await saveDB({ ...dbData, settings: updatedSettings });
                  setTdsForm({ partyName: '', section: '194C-Corp', amount: '', narration: '', type: 'Receivable' });
                  alert('TDS Withholding transaction logged successfully.');
                }}
              >
                <h3 style={{ marginBottom: '16px' }}>Log Tax Deducted at Source (TDS)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>TDS Type</label>
                    <div style={{ display: 'flex', gap: '16px', fontWeight: 'bold' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="tdsType"
                          checked={tdsForm.type !== 'Payable'}
                          onChange={() => setTdsForm({ ...tdsForm, type: 'Receivable' })}
                        />
                        Deducted by Customer (Receivable asset credit)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="radio"
                          name="tdsType"
                          checked={tdsForm.type === 'Payable'}
                          onChange={() => setTdsForm({ ...tdsForm, type: 'Payable' })}
                        />
                        Deducted for Supplier (Liability payable)
                      </label>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Select Party Name</label>
                    <select
                      className="fi"
                      required
                      value={tdsForm.partyName}
                      onChange={e => setTdsForm({ ...tdsForm, partyName: e.target.value })}
                    >
                      <option value="">-- Select Partner Party --</option>
                      {dbData.parties.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Base Bill Value (Rs)</label>
                      <input
                        type="number"
                        className="fi"
                        required
                        placeholder="e.g. 50000"
                        value={tdsForm.amount}
                        onChange={e => setTdsForm({ ...tdsForm, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>TDS Compliance Section</label>
                      <select
                        className="fi"
                        value={tdsForm.section}
                        onChange={e => setTdsForm({ ...tdsForm, section: e.target.value })}
                      >
                        <option value="194C-Ind">194C (Contractor: Individual - 1%)</option>
                        <option value="194C-Corp">194C (Contractor: Corporate - 2%)</option>
                        <option value="194J">194J (Professional Services - 10%)</option>
                        <option value="194I">194I (Rental Assets - 10%)</option>
                        <option value="194H">194H (Brokerage / Commission - 5%)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-3)' }}>Narration / Details</label>
                    <input
                      type="text"
                      className="fi"
                      placeholder="e.g. Professional Consultancy Fees"
                      value={tdsForm.narration || ''}
                      onChange={e => setTdsForm({ ...tdsForm, narration: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn--primary" style={{ marginTop: '8px' }}>
                    Log TDS Withholding Record
                  </button>
                </div>
              </form>

              {/* History Table */}
              <div className="card" style={{ minHeight: '340px' }}>
                <h3 style={{ marginBottom: '16px' }}>TDS Withholdings Ledger</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Partner Party</th>
                        <th>Type</th>
                        <th>Section</th>
                        <th style={{ textAlign: 'right' }}>Base Amount</th>
                        <th style={{ textAlign: 'center' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>TDS Withheld</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dbData.settings?.tdsTransactions || []).length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No TDS withholdings logged.</td>
                        </tr>
                      ) : (
                        (dbData.settings.tdsTransactions).map((t, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-3)' }}>{t.date}</td>
                            <td><strong>{t.partyName}</strong></td>
                            <td>
                              <span className={`badge ${t.type === 'Payable' ? 'badge--red' : 'badge--green'}`}>
                                {t.type === 'Payable' ? 'Liability' : 'Receivable'}
                              </span>
                            </td>
                            <td><code>{t.section}</code></td>
                            <td style={{ textAlign: 'right' }}>{fmt(t.amount)}</td>
                            <td style={{ textAlign: 'center' }}>{t.tdsRate}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: t.type === 'Payable' ? 'var(--red)' : 'var(--green)' }}>{fmt(t.tdsAmount)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn--icon"
                                onClick={async () => {
                                  if (!await window.confirm('Are you sure you want to delete this TDS record?')) return;
                                  const updatedTransactions = dbData.settings.tdsTransactions.filter(item => item.id !== t.id);
                                  const updatedSettings = {
                                    ...dbData.settings,
                                    tdsTransactions: updatedTransactions
                                  };
                                  await saveDB({ ...dbData, settings: updatedSettings });
                                }}
                              >
                                <i className="fas fa-trash" style={{ color: 'var(--red)' }}></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {gstTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Trend Visualizer Chart */}
              {(() => {
                const uniqueMonths = [...new Set([
                  ...dbData.sales.map(s => s.date?.substring(0, 7)),
                  ...dbData.purchases.map(p => p.date?.substring(0, 7))
                ])].filter(Boolean).sort().slice(-6);

                const salesGstData = uniqueMonths.map(m => dbData.sales.filter(s => s.date?.startsWith(m)).reduce((sum, s) => {
                  const cgst = parseFloat(s.cgst) || 0;
                  const sgst = parseFloat(s.sgst) || 0;
                  const igst = parseFloat(s.igst) || 0;
                  return sum + (parseFloat(s.taxAmount) || (cgst + sgst + igst));
                }, 0));

                const purGstData = uniqueMonths.map(m => dbData.purchases.filter(p => p.active !== false && p.date?.startsWith(m)).reduce((sum, p) => {
                  const cgst = parseFloat(p.cgst) || 0;
                  const sgst = parseFloat(p.sgst) || 0;
                  const igst = parseFloat(p.igst) || 0;
                  return sum + (parseFloat(p.taxAmount) || (cgst + sgst + igst));
                }, 0));

                const chartData = {
                  labels: uniqueMonths,
                  datasets: [
                    {
                      label: 'Outward GST Liability',
                      data: salesGstData,
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                      borderWidth: 1
                    },
                    {
                      label: 'Inward ITC credit',
                      data: purGstData,
                      backgroundColor: '#10b981',
                      borderColor: '#10b981',
                      borderWidth: 1
                    }
                  ]
                };

                const chartOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: {
                      grid: { display: false }
                    }
                  }
                };

                // TDS summary variables
                const tdsTransactions = dbData.settings?.tdsTransactions || [];
                const tdsAsset = tdsTransactions.filter(t => t.type !== 'Payable').reduce((sum, t) => sum + (t.tdsAmount || 0), 0);
                const tdsLiability = tdsTransactions.filter(t => t.type === 'Payable').reduce((sum, t) => sum + (t.tdsAmount || 0), 0);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                    <div className="card">
                      <h3 style={{ marginBottom: '16px' }}>6-Month GST Outward vs Inward Trend</h3>
                      <div style={{ height: '260px', position: 'relative' }}>
                        {uniqueMonths.length === 0 ? (
                          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--text-3)' }}>No historical data available.</div>
                        ) : (
                          <Bar data={chartData} options={chartOptions} />
                        )}
                      </div>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ marginBottom: '8px' }}>TDS Withholding Position</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                          <span style={{ color: 'var(--text-3)' }}>TDS Receivable (Credit Asset)</span>
                          <strong style={{ color: 'var(--green)' }}>{fmt(tdsAsset)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                          <span style={{ color: 'var(--text-3)' }}>TDS Payable (Liability Account)</span>
                          <strong style={{ color: 'var(--red)' }}>{fmt(tdsLiability)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '14px' }}>
                          <span>Net Credit Position</span>
                          <strong style={{ color: (tdsAsset - tdsLiability) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(tdsAsset - tdsLiability)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Filing grid */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                      <h3 style={{ marginBottom: '16px' }}>Filing Grid History</h3>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Filing Month</th>
                            <th style={{ textAlign: 'right' }}>Taxable Sales</th>
                            <th style={{ textAlign: 'right' }}>Outward GST Liability</th>
                            <th style={{ textAlign: 'right' }}>Taxable Purchases</th>
                            <th style={{ textAlign: 'right' }}>Eligible ITC</th>
                            <th style={{ textAlign: 'right' }}>Net GST Position</th>
                            <th style={{ textAlign: 'center' }}>Filing Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uniqueMonths.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No transactions logged.</td>
                            </tr>
                          ) : (
                            uniqueMonths.map((m, i) => {
                              const sTaxable = dbData.sales.filter(s => s.date?.startsWith(m)).reduce((sum, s) => {
                                const gross = parseFloat(s.amount) || 0;
                                const cgst = parseFloat(s.cgst) || 0;
                                const sgst = parseFloat(s.sgst) || 0;
                                const igst = parseFloat(s.igst) || 0;
                                const tax = parseFloat(s.taxAmount) || (cgst + sgst + igst);
                                return sum + (s.subtotal !== undefined ? parseFloat(s.subtotal) : (gross - tax));
                              }, 0);

                              const sTax = dbData.sales.filter(s => s.date?.startsWith(m)).reduce((sum, s) => {
                                const cgst = parseFloat(s.cgst) || 0;
                                const sgst = parseFloat(s.sgst) || 0;
                                const igst = parseFloat(s.igst) || 0;
                                return sum + (parseFloat(s.taxAmount) || (cgst + sgst + igst));
                              }, 0);

                              const pTaxable = dbData.purchases.filter(p => p.active !== false && p.date?.startsWith(m)).reduce((sum, p) => {
                                const gross = parseFloat(p.amount) || 0;
                                const cgst = parseFloat(p.cgst) || 0;
                                const sgst = parseFloat(p.sgst) || 0;
                                const igst = parseFloat(p.igst) || 0;
                                const tax = parseFloat(p.taxAmount) || (cgst + sgst + igst);
                                return sum + (p.subtotal !== undefined ? parseFloat(p.subtotal) : (gross - tax));
                              }, 0);

                              const pTax = dbData.purchases.filter(p => p.active !== false && p.date?.startsWith(m)).reduce((sum, p) => {
                                const cgst = parseFloat(p.cgst) || 0;
                                const sgst = parseFloat(p.sgst) || 0;
                                const igst = parseFloat(p.igst) || 0;
                                return sum + (parseFloat(p.taxAmount) || (cgst + sgst + igst));
                              }, 0);

                              const currentMonthStr = new Date().toISOString().substring(0, 7);
                              const isPastFiling = m < currentMonthStr;

                              return (
                                <tr key={i}>
                                  <td><strong>{m}</strong></td>
                                  <td style={{ textAlign: 'right' }}>{fmt(sTaxable)}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>{fmt(sTax)}</td>
                                  <td style={{ textAlign: 'right' }}>{fmt(pTaxable)}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 'bold' }}>{fmt(pTax)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: (sTax - pTax) >= 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(sTax - pTax)}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={`badge ${isPastFiling ? 'badge--green' : 'badge--yellow'}`}>
                                      {isPastFiling ? 'Ready for filing' : 'Active Period'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {gstTab !== 'hsn' && gstTab !== 'eway' && gstTab !== 'tds' && gstTab !== 'summary' && (
            <div>
              {(() => {
                const filteredSales = dbData.sales.filter(s => s.date && s.date.substring(0, 7) === gstMonth);
                const filteredPurchases = dbData.purchases.filter(p => p.active !== false && (p.purchaseType || 'Purchase Invoice') !== 'Purchase Order' && p.date && p.date.substring(0, 7) === gstMonth);

                let salesGross = 0;
                let salesTaxable = 0;
                let salesCgst = 0;
                let salesSgst = 0;
                let salesIgst = 0;
                let salesTotalTax = 0;

                filteredSales.forEach(s => {
                  const gross = parseFloat(s.amount) || 0;
                  const cgst = parseFloat(s.cgst) || 0;
                  const sgst = parseFloat(s.sgst) || 0;
                  const igst = parseFloat(s.igst) || 0;
                  const tax = parseFloat(s.taxAmount) || (cgst + sgst + igst);
                  const taxable = s.subtotal !== undefined ? parseFloat(s.subtotal) : (gross - tax);

                  salesGross += gross;
                  salesTaxable += taxable;
                  salesCgst += cgst;
                  salesSgst += sgst;
                  salesIgst += igst;
                  salesTotalTax += tax;
                });

                let purGross = 0;
                let purTaxable = 0;
                let purCgst = 0;
                let purSgst = 0;
                let purIgst = 0;
                let purTotalTax = 0;

                filteredPurchases.forEach(p => {
                  const gross = parseFloat(p.amount) || 0;
                  const cgst = parseFloat(p.cgst) || 0;
                  const sgst = parseFloat(p.sgst) || 0;
                  const igst = parseFloat(p.igst) || 0;
                  const tax = parseFloat(p.taxAmount) || (cgst + sgst + igst);
                  const taxable = p.subtotal !== undefined ? parseFloat(p.subtotal) : (gross - tax);

                  purGross += gross;
                  purTaxable += taxable;
                  purCgst += cgst;
                  purSgst += sgst;
                  purIgst += igst;
                  purTotalTax += tax;
                });

                // HSN sales summary calculations
                const hsnSalesSummary = {};
                filteredSales.forEach(s => {
                  const isInterstate = (parseFloat(s.igst) || 0) > 0 || (parseFloat(s.cgst) || 0) === 0 && (parseFloat(s.igst) || 0) > 0;
                  (s.items || []).forEach(it => {
                    const code = (it.hsnSac || it.hsn || '').trim() || 'N/A';
                    const name = it.name || 'Unknown Item';
                    const qty = parseFloat(it.qty || it.quantity) || 0;
                    const rate = parseFloat(it.rate || it.price) || 0;
                    const itemTotal = parseFloat(it.total || it.amount) || (qty * rate);
                    const gstRate = parseFloat(it.gstRate) || 18;

                    const taxableVal = itemTotal;
                    const taxVal = taxableVal * (gstRate / 100);
                    const cgst = isInterstate ? 0 : taxVal / 2;
                    const sgst = isInterstate ? 0 : taxVal / 2;
                    const igst = isInterstate ? taxVal : 0;

                    if (!hsnSalesSummary[code]) {
                      hsnSalesSummary[code] = { code, description: name, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
                    }
                    hsnSalesSummary[code].qty += qty;
                    hsnSalesSummary[code].taxable += taxableVal;
                    hsnSalesSummary[code].cgst += cgst;
                    hsnSalesSummary[code].sgst += sgst;
                    hsnSalesSummary[code].igst += igst;
                    hsnSalesSummary[code].total += (taxableVal + taxVal);
                  });
                });

                // HSN purchases summary calculations
                const hsnPurSummary = {};
                filteredPurchases.forEach(p => {
                  const isInterstate = (parseFloat(p.igst) || 0) > 0;
                  (p.items || []).forEach(it => {
                    const code = (it.hsnSac || it.hsn || '').trim() || 'N/A';
                    const name = it.name || 'Unknown Item';
                    const qty = parseFloat(it.qty || it.quantity) || 0;
                    const rate = parseFloat(it.rate || it.price) || 0;
                    const itemTotal = parseFloat(it.total || it.amount) || (qty * rate);
                    const gstRate = parseFloat(it.gstRate) || 18;

                    const taxableVal = itemTotal;
                    const taxVal = taxableVal * (gstRate / 100);
                    const cgst = isInterstate ? 0 : taxVal / 2;
                    const sgst = isInterstate ? 0 : taxVal / 2;
                    const igst = isInterstate ? taxVal : 0;

                    if (!hsnPurSummary[code]) {
                      hsnPurSummary[code] = { code, description: name, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
                    }
                    hsnPurSummary[code].qty += qty;
                    hsnPurSummary[code].taxable += taxableVal;
                    hsnPurSummary[code].cgst += cgst;
                    hsnPurSummary[code].sgst += sgst;
                    hsnPurSummary[code].igst += igst;
                    hsnPurSummary[code].total += (taxableVal + taxVal);
                  });
                });

                const exportGstr3BJson = () => {
                  const payload = {
                    gstin: settings.gstin || '27AAPCS1234M1Z2',
                    period: gstMonth,
                    filingType: 'GSTR-3B',
                    outwardSupplies: {
                      taxableSupplies: {
                        taxableValue: Math.round(salesTaxable * 100) / 100,
                        igst: Math.round(salesIgst * 100) / 100,
                        cgst: Math.round(salesCgst * 100) / 100,
                        sgst: Math.round(salesSgst * 100) / 100,
                        cess: 0
                      },
                      zeroRatedSupplies: { taxableValue: 0, igst: 0, cess: 0 },
                      exemptedSupplies: { taxableValue: 0 }
                    },
                    eligibleItc: {
                      allOtherItc: {
                        taxableValue: Math.round(purTaxable * 100) / 100,
                        igst: Math.round(purIgst * 100) / 100,
                        cgst: Math.round(purCgst * 100) / 100,
                        sgst: Math.round(purSgst * 100) / 100,
                        cess: 0
                      }
                    },
                    netPayable: {
                      igst: Math.round((salesIgst - purIgst) * 100) / 100,
                      cgst: Math.round((salesCgst - purCgst) * 100) / 100,
                      sgst: Math.round((salesSgst - purSgst) * 100) / 100
                    }
                  };

                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `gstr3b_${gstMonth}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                };

                return (
                  <div>
                    {gstTab === 'gstr1' && (
                      <div>
                        {/* GSTR-1 Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Taxable Outward Supplies</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(salesTaxable)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>CGST (Sales)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(salesCgst)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>SGST (Sales)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(salesSgst)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>IGST (Sales)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(salesIgst)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total GST Collected</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-primary)' }}>{fmt(salesTotalTax)}</div>
                          </div>
                        </div>

                        {/* Invoice Table */}
                        <div className="card" style={{ marginBottom: '24px' }}>
                          <h3 style={{ marginBottom: '16px' }}>Invoice-wise Outward Supplies</h3>
                          <table className="tbl">
                            <thead>
                              <tr>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Party Name</th>
                                <th>GSTIN</th>
                                <th style={{ textAlign: 'right' }}>Taxable Value</th>
                                <th style={{ textAlign: 'right' }}>CGST</th>
                                <th style={{ textAlign: 'right' }}>SGST</th>
                                <th style={{ textAlign: 'right' }}>IGST</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredSales.length === 0 ? (
                                <tr>
                                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No transactions found for this period.</td>
                                </tr>
                              ) : (
                                filteredSales.map((s, idx) => {
                                  const gross = parseFloat(s.amount) || 0;
                                  const cgst = parseFloat(s.cgst) || 0;
                                  const sgst = parseFloat(s.sgst) || 0;
                                  const igst = parseFloat(s.igst) || 0;
                                  const tax = parseFloat(s.taxAmount) || (cgst + sgst + igst);
                                  const taxable = s.subtotal !== undefined ? parseFloat(s.subtotal) : (gross - tax);
                                  const party = dbData.parties.find(p => p.name === s.customer) || {};
                                  return (
                                    <tr key={idx}>
                                      <td>{s.id}</td>
                                      <td>{s.date}</td>
                                      <td>{s.customer}</td>
                                      <td>{party.gstin || 'UNREGISTERED'}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(taxable)}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(cgst)}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(sgst)}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(igst)}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(gross)}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* GSTR-1 HSN Summary */}
                        <div className="card">
                          <h3 style={{ marginBottom: '16px' }}>HSN / SAC Summary of Outward Supplies</h3>
                          <table className="tbl">
                            <thead>
                              <tr>
                                <th>HSN/SAC Code</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Total Qty</th>
                                <th style={{ textAlign: 'right' }}>Taxable Value</th>
                                <th style={{ textAlign: 'right' }}>CGST</th>
                                <th style={{ textAlign: 'right' }}>SGST</th>
                                <th style={{ textAlign: 'right' }}>IGST</th>
                                <th style={{ textAlign: 'right' }}>Total Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(hsnSalesSummary).length === 0 ? (
                                <tr>
                                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No item details available.</td>
                                </tr>
                              ) : (
                                Object.values(hsnSalesSummary).map((h, i) => (
                                  <tr key={i}>
                                    <td><code>{h.code}</code></td>
                                    <td>{h.description}</td>
                                    <td style={{ textAlign: 'center' }}>{h.qty}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.taxable)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.cgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.sgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.igst)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(h.total)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {gstTab === 'gstr2' && (
                      <div>
                        {/* GSTR-2 Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Taxable Inward Supplies</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(purTaxable)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>CGST (ITC Input)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(purCgst)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>SGST (ITC Input)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(purSgst)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>IGST (ITC Input)</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(purIgst)}</div>
                          </div>
                          <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total ITC Available</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-primary)' }}>{fmt(purTotalTax)}</div>
                          </div>
                        </div>

                        {/* Purchases Invoices Table */}
                        <div className="card" style={{ marginBottom: '24px' }}>
                          <h3 style={{ marginBottom: '16px' }}>Inward Supplies Received</h3>
                          <table className="tbl">
                            <thead>
                              <tr>
                                <th>PO/Bill No</th>
                                <th>Date</th>
                                <th>Supplier Name</th>
                                <th>GSTIN</th>
                                <th style={{ textAlign: 'right' }}>Taxable Value</th>
                                <th style={{ textAlign: 'right' }}>CGST</th>
                                <th style={{ textAlign: 'right' }}>SGST</th>
                                <th style={{ textAlign: 'right' }}>IGST</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredPurchases.length === 0 ? (
                                <tr>
                                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No purchases found for this period.</td>
                                </tr>
                              ) : (
                                filteredPurchases.map((p, idx) => {
                                  const gross = parseFloat(p.amount) || 0;
                                  const cgst = parseFloat(p.cgst) || 0;
                                  const sgst = parseFloat(p.sgst) || 0;
                                  const igst = parseFloat(p.igst) || 0;
                                  const tax = parseFloat(p.taxAmount) || (cgst + sgst + igst);
                                  const taxable = p.subtotal !== undefined ? parseFloat(p.subtotal) : (gross - tax);
                                  const party = dbData.parties.find(pt => pt.name === p.supplier) || {};
                                  return (
                                    <tr key={idx}>
                                      <td>{p.id}</td>
                                      <td>{p.date}</td>
                                      <td>{p.supplier}</td>
                                      <td>{party.gstin || 'UNREGISTERED'}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(taxable)}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(cgst)}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(sgst)}</td>
                                      <td style={{ textAlign: 'right' }}>{fmt(igst)}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(gross)}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* GSTR-2 HSN Summary */}
                        <div className="card">
                          <h3 style={{ marginBottom: '16px' }}>HSN / SAC Summary of Inward Supplies</h3>
                          <table className="tbl">
                            <thead>
                              <tr>
                                <th>HSN/SAC Code</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Total Qty</th>
                                <th style={{ textAlign: 'right' }}>Taxable Value</th>
                                <th style={{ textAlign: 'right' }}>CGST</th>
                                <th style={{ textAlign: 'right' }}>SGST</th>
                                <th style={{ textAlign: 'right' }}>IGST</th>
                                <th style={{ textAlign: 'right' }}>Total Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(hsnPurSummary).length === 0 ? (
                                <tr>
                                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No item details available.</td>
                                </tr>
                              ) : (
                                Object.values(hsnPurSummary).map((h, i) => (
                                  <tr key={i}>
                                    <td><code>{h.code}</code></td>
                                    <td>{h.description}</td>
                                    <td style={{ textAlign: 'center' }}>{h.qty}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.taxable)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.cgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.sgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(h.igst)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(h.total)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {gstTab === 'gstr3b' && (
                      <div>
                        {dbData.settings?.gstScheme === 'Composition' ? (
                          <div>
                            {/* CMP-08 Composition Scheme View */}
                            <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
                              <h4 style={{ margin: 0, color: 'var(--primary)' }}><i className="fas fa-circle-info"></i> Composition Scheme Active</h4>
                              <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: '1.4' }}>
                                Under GST Composition Scheme, you pay tax at a flat rate on your turnover. You cannot collect GST from customers nor claim Input Tax Credit (ITC). CMP-08 returns are filed quarterly.
                              </p>
                            </div>

                            {/* CMP-08 Metrics */}
                            {(() => {
                              const turnover = salesTaxable;
                              const ratePercent = parseFloat(dbData.settings?.compositionRate || '1%') || 1;
                              const totalTax = turnover * (ratePercent / 100);
                              const cgst = totalTax / 2;
                              const sgst = totalTax / 2;
                              
                              const summary = {
                                turnover,
                                rateText: `${ratePercent}%`,
                                igst: 0,
                                cgst,
                                sgst,
                                totalTax
                              };

                              return (
                                <>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                    <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Quarterly Turnover</div>
                                      <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-1)' }}>{fmt(turnover)}</div>
                                    </div>
                                    <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Composition Rate</div>
                                      <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '4px', color: 'var(--primary)' }}>{ratePercent}%</div>
                                    </div>
                                    <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Composition Tax Payable</div>
                                      <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-danger)' }}>{fmt(totalTax)}</div>
                                    </div>
                                  </div>

                                  <div className="card" style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                      <h3>Form GST CMP-08 (Composition Return Statement)</h3>
                                      <button className="btn btn--sm btn--primary" onClick={() => exportToExcelCMP08(gstMonth, summary)}>
                                        <i className="fas fa-file-excel"></i> Export Excel
                                      </button>
                                    </div>

                                    <table className="tbl">
                                      <thead>
                                        <tr>
                                          <th>Details of Outward Supplies & Tax Payable</th>
                                          <th style={{ textAlign: 'right' }}>Taxable Value (Rs.)</th>
                                          <th style={{ textAlign: 'right' }}>Integrated Tax (Rs.)</th>
                                          <th style={{ textAlign: 'right' }}>Central Tax (Rs.)</th>
                                          <th style={{ textAlign: 'right' }}>State/UT Tax (Rs.)</th>
                                          <th style={{ textAlign: 'right' }}>Total Tax (Rs.)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td>1. Value of outward supplies (including exempt supplies)</td>
                                          <td style={{ textAlign: 'right' }}>{fmt(turnover)}</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                          <td style={{ textAlign: 'right' }}>{fmt(cgst)}</td>
                                          <td style={{ textAlign: 'right' }}>{fmt(sgst)}</td>
                                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(totalTax)}</td>
                                        </tr>
                                        <tr>
                                          <td>2. Inward supplies attracting reverse charge (including import of services)</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                        </tr>
                                        <tr style={{ fontWeight: 'bold', background: 'var(--bg-2)' }}>
                                          <td>Net Tax Payable (CMP-08 Offset)</td>
                                          <td style={{ textAlign: 'right' }}>{fmt(turnover)}</td>
                                          <td style={{ textAlign: 'right' }}>0.00</td>
                                          <td style={{ textAlign: 'right' }}>{fmt(cgst)}</td>
                                          <td style={{ textAlign: 'right' }}>{fmt(sgst)}</td>
                                          <td style={{ textAlign: 'right', color: 'var(--red)' }}>{fmt(totalTax)}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            {/* GSTR-3B Metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                              <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Outward Liability (Payable)</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-danger)' }}>{fmt(salesTotalTax)}</div>
                              </div>
                              <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Eligible ITC Input</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-success)' }}>{fmt(purTotalTax)}</div>
                              </div>
                              <div className="card-sub" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Net GST Liability (Net Cash)</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: (salesTotalTax - purTotalTax) >= 0 ? 'var(--text-danger)' : 'var(--text-success)' }}>
                                  {fmt(salesTotalTax - purTotalTax)}
                                </div>
                              </div>
                            </div>

                            {/* GSTR-3B Form tables */}
                            <div className="card" style={{ marginBottom: '24px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>GSTR-3B Consolidated Return</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button className="btn btn--sm btn--primary" onClick={() => exportToExcelGstr3B(gstMonth, { salesTaxable, salesIgst, salesCgst, salesSgst, purTaxable, purIgst, purCgst, purSgst, salesTotalTax, purTotalTax })}><i className="fas fa-file-excel"></i> Export Excel</button>
                                  <button className="btn btn--sm btn--primary" onClick={exportGstr3BJson}><i className="fas fa-download"></i> Export JSON</button>
                                </div>
                              </div>

                              <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Table 3.1: Outward Supplies & Inward Reverse Charge Liability</h4>
                              <table className="tbl" style={{ marginBottom: '24px' }}>
                                <thead>
                                  <tr>
                                    <th>Nature of Supplies</th>
                                    <th style={{ textAlign: 'right' }}>Total Taxable Value</th>
                                    <th style={{ textAlign: 'right' }}>Integrated Tax (IGST)</th>
                                    <th style={{ textAlign: 'right' }}>Central Tax (CGST)</th>
                                    <th style={{ textAlign: 'right' }}>State/UT Tax (SGST)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesTaxable)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesIgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesCgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesSgst)}</td>
                                  </tr>
                                  <tr>
                                    <td>(b) Outward taxable supplies (zero rated)</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                  </tr>
                                  <tr>
                                    <td>(c) Other outward supplies (Nil rated, exempted)</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                    <td style={{ textAlign: 'right' }}>0.00</td>
                                  </tr>
                                </tbody>
                              </table>

                              <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Table 4: Eligible Input Tax Credit (ITC)</h4>
                              <table className="tbl" style={{ marginBottom: '24px' }}>
                                <thead>
                                  <tr>
                                    <th>ITC Details</th>
                                    <th style={{ textAlign: 'right' }}>Total Taxable Value</th>
                                    <th style={{ textAlign: 'right' }}>Integrated Tax (IGST)</th>
                                    <th style={{ textAlign: 'right' }}>Central Tax (CGST)</th>
                                    <th style={{ textAlign: 'right' }}>State/UT Tax (SGST)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>(A)(5) All other ITC (from Inward Supplies)</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purTaxable)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purIgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purCgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purSgst)}</td>
                                  </tr>
                                </tbody>
                              </table>

                              <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Table 5: Net Payable / (Carry Forward Refund)</h4>
                              <table className="tbl">
                                <thead>
                                  <tr>
                                    <th>Tax Heads</th>
                                    <th style={{ textAlign: 'right' }}>Outward Liability</th>
                                    <th style={{ textAlign: 'right' }}>Input Tax Credit (ITC)</th>
                                    <th style={{ textAlign: 'right' }}>Net Payable Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>Integrated Tax (IGST)</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesIgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purIgst)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(salesIgst - purIgst)}</td>
                                  </tr>
                                  <tr>
                                    <td>Central Tax (CGST)</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesCgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purCgst)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(salesCgst - purCgst)}</td>
                                  </tr>
                                  <tr>
                                    <td>State/UT Tax (SGST)</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesSgst)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purSgst)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(salesSgst - purSgst)}</td>
                                  </tr>
                                  <tr style={{ fontWeight: 'bold', background: 'var(--bg-2)' }}>
                                    <td>Total Tax Summary</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(salesTotalTax)}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(purTotalTax)}</td>
                                    <td style={{ textAlign: 'right', color: (salesTotalTax - purTotalTax) >= 0 ? 'var(--text-danger)' : 'var(--text-success)' }}>
                                      {fmt(salesTotalTax - purTotalTax)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {gstTab === 'calendar' && (
                      <div>
                        {/* Calendar Metrics / Compliance Score */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '16px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>Filing Compliance Score</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: 'var(--primary)' }}>
                              {(() => {
                                const filings = dbData.settings?.gstFilingCalendar || [];
                                const deadlines = getCalendarDeadlines();
                                const total = deadlines.filter(d => d.dueDate < '2026-07-01').length;
                                const filedCount = filings.filter(f => f.status === 'Filed').length;
                                const pct = total > 0 ? Math.round((filedCount / total) * 100) : 100;
                                return `${pct}% (${filedCount}/${total} Timely)`;
                              })()}
                            </div>
                          </div>
                          <div className="card" style={{ borderLeft: '4px solid var(--yellow)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Filing Alert Reminders</div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', display: 'flex', gap: '15px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={dbData.settings?.gstEmailAlerts || false}
                                  onChange={(e) => {
                                    const updated = {
                                      ...dbData,
                                      settings: {
                                        ...dbData.settings,
                                        gstEmailAlerts: e.target.checked
                                      }
                                    };
                                    saveDB(updated);
                                  }}
                                />
                                Email Alerts
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={dbData.settings?.gstSmsAlerts || false}
                                  onChange={(e) => {
                                    const updated = {
                                      ...dbData,
                                      settings: {
                                        ...dbData.settings,
                                        gstSmsAlerts: e.target.checked
                                      }
                                    };
                                    saveDB(updated);
                                  }}
                                />
                                SMS Reminders
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Deadlines Table */}
                        <div className="card" style={{ padding: '20px' }}>
                          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-calendar-days" style={{ color: 'var(--primary)' }}></i> GST Return Deadlines Tracker (2026)
                          </h3>
                          <div style={{ overflowX: 'auto' }}>
                            <table className="tbl">
                              <thead>
                                <tr>
                                  <th>Form / Return Type</th>
                                  <th>Period</th>
                                  <th>Frequency</th>
                                  <th>Due Date</th>
                                  <th>Days Remaining</th>
                                  <th>Status</th>
                                  <th>Filing Record (ARN)</th>
                                  <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const deadlines = getCalendarDeadlines();
                                  const filings = dbData.settings?.gstFilingCalendar || [];
                                  const todayStr = '2026-06-07';
                                  const today = new Date(todayStr);

                                  return deadlines.map(d => {
                                    const record = filings.find(f => f.id === d.id);
                                    const isFiled = record?.status === 'Filed';
                                    
                                    const due = new Date(d.dueDate);
                                    const diffTime = due - today;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    let statusText = 'Pending';
                                    let statusClass = 'badge--yellow';
                                    if (isFiled) {
                                      statusText = 'Filed';
                                      statusClass = 'badge--green';
                                    } else if (diffDays < 0) {
                                      statusText = 'Overdue';
                                      statusClass = 'badge--red';
                                    }

                                    return (
                                      <tr key={d.id}>
                                        <td style={{ fontWeight: 600 }}>{d.type}</td>
                                        <td>{d.period}</td>
                                        <td><span className="badge">{d.frequency}</span></td>
                                        <td>{d.dueDate}</td>
                                        <td>
                                          {isFiled ? (
                                            <span style={{ color: 'var(--text-3)' }}>-</span>
                                          ) : diffDays < 0 ? (
                                            <span style={{ color: 'var(--red)', fontWeight: 600 }}>{Math.abs(diffDays)} days overdue</span>
                                          ) : (
                                            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{diffDays} days left</span>
                                          )}
                                        </td>
                                        <td><span className={`badge ${statusClass}`}>{statusText}</span></td>
                                        <td>
                                          {isFiled ? (
                                            <div>
                                              <div style={{ fontSize: '12.5px', fontWeight: 600 }}>ARN: {record.arn}</div>
                                              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Filed: {record.filedDate}</div>
                                            </div>
                                          ) : (
                                            <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Unfiled</span>
                                          )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          {isFiled ? (
                                            <button
                                              className="btn btn--sm btn--red"
                                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: 'none' }}
                                              onClick={() => {
                                                const updatedFilings = filings.filter(f => f.id !== d.id);
                                                const updated = {
                                                  ...dbData,
                                                  settings: {
                                                    ...dbData.settings,
                                                    gstFilingCalendar: updatedFilings
                                                  }
                                                };
                                                saveDB(updated);
                                              }}
                                            >
                                              Reset
                                            </button>
                                          ) : (
                                            <button
                                              className="btn btn--sm btn--primary"
                                              onClick={() => {
                                                const arn = window.prompt("Enter 15-digit Filing ARN:");
                                                if (!arn) return;
                                                if (arn.trim().length !== 15) return alert("Filing ARN must be exactly 15 digits.");
                                                const filedDate = window.prompt("Enter Filing Date (YYYY-MM-DD):", todayStr);
                                                if (!filedDate) return;

                                                const updatedFilings = [
                                                  ...filings.filter(f => f.id !== d.id),
                                                  { id: d.id, status: 'Filed', arn: arn.trim(), filedDate }
                                                ];

                                                const updated = {
                                                  ...dbData,
                                                  settings: {
                                                    ...dbData.settings,
                                                    gstFilingCalendar: updatedFilings
                                                  }
                                                };
                                                saveDB(updated);
                                                alert("Filing record saved successfully!");
                                              }}
                                            >
                                              Mark Filed
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      )}

      {/* ==================== MODULE 9: EXPENSES ==================== */}
      {currentView === 'expenses' && (
        <section className="view active" id="view-expenses">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Expense Management</h2>
              <p>Track business expenses, overheads, and operating costs.</p>
            </div>
            <button className="btn btn--primary" onClick={() => {
              setEditingExpenseId(null);
              setExpenseForm({ 
                date: new Date().toISOString().substring(0, 10), 
                category: 'Rent', 
                amount: 0, 
                paymentMode: 'Cash', 
                description: '', 
                receipt: '', 
                isRecurringTemplate: false, 
                frequency: 'Monthly', 
                nextOccurrenceDate: '', 
                isActive: true 
              });
              setShowExpenseModal(true);
            }}><i className="fas fa-plus"></i> Record Expense</button>
          </div>

          <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '5px' }}>
            <button 
              className={`btn ${expenseTab === 'all' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setExpenseTab('all')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              All Expenses
            </button>
            <button 
              className={`btn ${expenseTab === 'recurring' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setExpenseTab('recurring')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              Recurring Schedules
            </button>
          </div>

          <div className="card">
            {expenseTab === 'all' ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Receipt</th>
                    <th>Payment Mode</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(dbData.expenses || []).filter(exp => !exp.isRecurringTemplate).map((exp, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-3)' }}>{exp.date}</td>
                      <td><span className="badge badge--yellow">{exp.category}</span></td>
                      <td style={{ color: 'var(--text-2)' }}>
                        {exp.description || '-'}
                        {exp.isRecurringInstance && (
                          <span style={{ color: 'var(--blue)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                            <i className="fas fa-repeat"></i> Recurring Occurrence
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {exp.receipt ? (
                          <button className="btn btn--outline btn--sm" style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setActiveReceipt(exp.receipt)}>
                            <i className="fas fa-file-invoice"></i> View
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-3)' }}>-</span>
                        )}
                      </td>
                      <td>{exp.paymentMode}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(exp.amount)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn--icon" style={{ marginRight: '8px' }} onClick={() => {
                          setEditingExpenseId(exp.id);
                          setExpenseForm({
                            date: exp.date,
                            category: exp.category || 'Rent',
                            amount: exp.amount || 0,
                            paymentMode: exp.paymentMode || 'Cash',
                            description: exp.description || '',
                            receipt: exp.receipt || '',
                            isRecurringTemplate: exp.isRecurringTemplate || false,
                            frequency: exp.frequency || 'Monthly',
                            nextOccurrenceDate: exp.nextOccurrenceDate || '',
                            isActive: exp.isActive !== undefined ? exp.isActive : true
                          });
                          setShowExpenseModal(true);
                        }} title="Edit Expense"><i className="fas fa-edit" style={{ color: 'var(--text-3)' }}></i></button>
                        <button className="btn--icon" onClick={async () => {
                          if (viewOnly) return alert('⛔ View-Only Mode');
                          if (await window.confirm('Are you sure you want to delete this expense?')) {
                            const updatedExpenses = (dbData.expenses || []).filter(ex => ex.id !== exp.id);
                            saveDB({ ...dbData, expenses: updatedExpenses });
                          }
                        }} title="Delete Expense"><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                      </td>
                    </tr>
                  ))}
                  {!(dbData.expenses && dbData.expenses.filter(exp => !exp.isRecurringTemplate).length > 0) && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No expenses recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Frequency</th>
                    <th>Next Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(dbData.expenses || []).filter(exp => exp.isRecurringTemplate).map((exp, idx) => (
                    <tr key={idx}>
                      <td><span className="badge badge--yellow">{exp.category}</span></td>
                      <td style={{ color: 'var(--text-2)' }}>{exp.description || '-'}</td>
                      <td><span className="badge badge--blue">{exp.frequency}</span></td>
                      <td style={{ color: 'var(--text-3)' }}>{exp.nextOccurrenceDate}</td>
                      <td>
                        <span className={`badge ${exp.isActive ? 'badge--green' : 'badge--red'}`}>
                          {exp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(exp.amount)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn--icon" style={{ marginRight: '8px' }} onClick={() => {
                          if (viewOnly) return alert('⛔ View-Only Mode');
                          const updatedExpenses = dbData.expenses.map(ex => 
                            ex.id === exp.id ? { ...ex, isActive: !ex.isActive } : ex
                          );
                          saveDB({ ...dbData, expenses: updatedExpenses });
                        }} title={exp.isActive ? 'Deactivate Schedule' : 'Activate Schedule'}>
                          <i className={`fas ${exp.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} style={{ color: exp.isActive ? 'var(--green)' : 'var(--text-3)', fontSize: '18px' }}></i>
                        </button>
                        <button className="btn--icon" style={{ marginRight: '8px' }} onClick={() => {
                          setEditingExpenseId(exp.id);
                          setExpenseForm({
                            date: exp.date,
                            category: exp.category || 'Rent',
                            amount: exp.amount || 0,
                            paymentMode: exp.paymentMode || 'Cash',
                            description: exp.description || '',
                            receipt: exp.receipt || '',
                            isRecurringTemplate: exp.isRecurringTemplate || false,
                            frequency: exp.frequency || 'Monthly',
                            nextOccurrenceDate: exp.nextOccurrenceDate || '',
                            isActive: exp.isActive !== undefined ? exp.isActive : true
                          });
                          setShowExpenseModal(true);
                        }} title="Edit Schedule"><i className="fas fa-edit" style={{ color: 'var(--text-3)' }}></i></button>
                        <button className="btn--icon" onClick={async () => {
                          if (viewOnly) return alert('⛔ View-Only Mode');
                          if (await window.confirm('Are you sure you want to delete this recurring schedule?')) {
                            const updatedExpenses = (dbData.expenses || []).filter(ex => ex.id !== exp.id);
                            saveDB({ ...dbData, expenses: updatedExpenses });
                          }
                        }} title="Delete Schedule"><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                      </td>
                    </tr>
                  ))}
                  {!(dbData.expenses && dbData.expenses.filter(exp => exp.isRecurringTemplate).length > 0) && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No recurring schedules configured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* ==================== MODULE 12: PAYMENT MANAGEMENT ==================== */}
      {currentView === 'payments' && (() => {
        // Filter transactions to find only payment actions
        const payments = (dbData.transactions || []).filter(
          t => t.type === 'Payment Receive' || t.type === 'Payment Pay'
        );

        const totalReceived = payments
          .filter(t => t.type === 'Payment Receive')
          .reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0);

        const totalMade = payments
          .filter(t => t.type === 'Payment Pay')
          .reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0);

        const filteredPayments = payments.filter(p => {
          if (paymentsTab === 'received') return p.type === 'Payment Receive';
          if (paymentsTab === 'made') return p.type === 'Payment Pay';
          return true; // 'all'
        });

        // Gather Alerts
        const customerAlerts = dbData.parties.filter(
          p => (p.type || '').toLowerCase() === 'customer' && parseFloat(p.balance) < 0
        );

        const supplierAlerts = dbData.parties.filter(
          p => (p.type || '').toLowerCase() === 'supplier' && parseFloat(p.balance) > 0
        );

        const totalAlertsCount = customerAlerts.length + supplierAlerts.length;

        return (
          <section className="view active" id="view-payments">
            <div className="sec-header sec-header--row">
              <div>
                <h2>Payment Management</h2>
                <p>Record, manage, and verify inward customer receipts and outward supplier payments.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn--primary" onClick={() => openCentralPaymentModal('Receive')}>
                  <i className="fas fa-arrow-down-long"></i> Record Receipt (In)
                </button>
                <button className="btn btn--outline" onClick={() => openCentralPaymentModal('Pay')}>
                  <i className="fas fa-arrow-up-long"></i> Record Payment (Out)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div className="card card--lift" style={{ padding: '15px' }}>
                  <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Payments Received</div>
                  <div className="stat__val" style={{ color: 'var(--green)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{fmt(totalReceived)}</div>
                </div>
                <div className="card card--lift" style={{ padding: '15px' }}>
                  <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Payments Made</div>
                  <div className="stat__val" style={{ color: 'var(--red)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{fmt(totalMade)}</div>
                </div>
                <div className="card card--lift" style={{ padding: '15px' }}>
                  <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Net cash flow</div>
                  <div className="stat__val" style={{ color: totalReceived - totalMade >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>
                    {fmt(totalReceived - totalMade)}
                  </div>
                </div>
              </div>

              {/* Pending Payment Alerts (positioned directly below the stats boxes) */}
              <div className="card" style={{ borderLeft: totalAlertsCount > 0 ? '4px solid #f59e0b' : '4px solid #10b981', padding: '15px' }}>
                <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <i className={`fas ${totalAlertsCount > 0 ? 'fa-bell' : 'fa-circle-check'}`} style={{ color: totalAlertsCount > 0 ? '#f59e0b' : '#10b981' }}></i>
                    Pending Payment Alerts ({totalAlertsCount})
                  </span>
                </div>
                <div>
                  {totalAlertsCount === 0 ? (
                    <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-3)', fontSize: '12px' }}>
                      <i className="fas fa-circle-check" style={{ fontSize: '24px', color: 'var(--green)', marginBottom: '8px', display: 'block' }}></i>
                      All balances settled. No pending alerts!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                      {customerAlerts.map((c, idx) => (
                        <div key={`cust-alert-${idx}`} className="alert-row" style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-1)' }}>{c.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                                Cust. Due: <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{fmt(Math.abs(c.balance))}</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn--sm btn--primary" 
                              style={{ padding: '4px 8px', fontSize: '11px', height: 'fit-content' }}
                              onClick={() => {
                                setPaymentForm({
                                  partyId: c.id,
                                  partyName: c.name,
                                  type: 'Receive',
                                  amount: Math.abs(c.balance),
                                  mode: 'Cash',
                                  referenceNo: '',
                                  date: new Date().toISOString().substring(0, 10)
                                });
                                setShowPaymentModal(true);
                              }}
                            >
                              Settle
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '6px', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>Remind:</span>
                            <button 
                              className="btn btn--outline btn--sm" 
                              style={{ padding: '2px 5px', fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px', borderRadius: '4px', cursor: 'pointer' }}
                              title="Send WhatsApp Reminder"
                              onClick={() => {
                                const msg = `Dear ${c.name},\nThis is a friendly reminder that your outstanding balance of Rs. ${Math.abs(c.balance).toFixed(2)} is due. Please settle this soon.\nRegards,\n${dbData.settings?.businessName || 'Management'}`;
                                sendReminder('whatsapp', c, msg);
                              }}
                            >
                              <i className="fab fa-whatsapp" style={{ color: '#10b981' }}></i> WA
                            </button>
                            <button 
                              className="btn btn--outline btn--sm" 
                              style={{ padding: '2px 5px', fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px', borderRadius: '4px', cursor: 'pointer' }}
                              title="Send SMS Reminder"
                              onClick={() => {
                                const msg = `Dear ${c.name},\nThis is a friendly reminder that your outstanding balance of Rs. ${Math.abs(c.balance).toFixed(2)} is due. Please settle this soon.\nRegards,\n${dbData.settings?.businessName || 'Management'}`;
                                sendReminder('sms', c, msg);
                              }}
                            >
                              <i className="fas fa-comment-sms" style={{ color: '#3b82f6' }}></i> SMS
                            </button>
                            <button 
                              className="btn btn--outline btn--sm" 
                              style={{ padding: '2px 5px', fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px', borderRadius: '4px', cursor: 'pointer' }}
                              title="Send Email Reminder"
                              onClick={() => {
                                const msg = `Dear ${c.name},\nThis is a friendly reminder that your outstanding balance of Rs. ${Math.abs(c.balance).toFixed(2)} is due. Please settle this soon.\nRegards,\n${dbData.settings?.businessName || 'Management'}`;
                                sendReminder('email', c, msg);
                              }}
                            >
                              <i className="fas fa-envelope" style={{ color: '#f59e0b' }}></i> Email
                            </button>
                          </div>
                        </div>
                      ))}
                      {supplierAlerts.map((s, idx) => (
                        <div key={`supp-alert-${idx}`} className="alert-row" style={{ borderLeft: '3px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-1)' }}>{s.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                              Vendor Payable: <span style={{ color: 'var(--yellow)', fontWeight: 'bold' }}>{fmt(s.balance)}</span>
                            </div>
                          </div>
                          <button 
                            className="btn btn--sm btn--outline" 
                            style={{ padding: '4px 8px', fontSize: '11px', height: 'fit-content' }}
                            onClick={() => {
                              setPaymentForm({
                                partyId: s.id,
                                partyName: s.name,
                                type: 'Pay',
                                amount: s.balance,
                                mode: 'Cash',
                                referenceNo: '',
                                date: new Date().toISOString().substring(0, 10)
                              });
                              setShowPaymentModal(true);
                            }}
                          >
                            Settle
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>
                <button 
                  className={`btn btn--sm ${paymentsTab === 'all' ? 'btn--primary' : 'btn--outline'}`} 
                  onClick={() => setPaymentsTab('all')}
                  style={{ borderRadius: '20px' }}
                >
                  All Payments
                </button>
                <button 
                  className={`btn btn--sm ${paymentsTab === 'received' ? 'btn--primary' : 'btn--outline'}`} 
                  onClick={() => setPaymentsTab('received')}
                  style={{ borderRadius: '20px' }}
                >
                  Received (In)
                </button>
                <button 
                  className={`btn btn--sm ${paymentsTab === 'made' ? 'btn--primary' : 'btn--outline'}`} 
                  onClick={() => setPaymentsTab('made')}
                  style={{ borderRadius: '20px' }}
                >
                  Made (Out)
                </button>
                <button 
                  className={`btn btn--sm ${paymentsTab === 'gateways' ? 'btn--primary' : 'btn--outline'}`} 
                  onClick={() => setPaymentsTab('gateways')}
                  style={{ borderRadius: '20px' }}
                >
                  Online Gateways (Stripe/Razorpay)
                </button>
              </div>

              {paymentsTab === 'gateways' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Gateway Config Form */}
                  <div className="card" style={{ padding: '20px' }}>
                    <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                      <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <i className="fas fa-plug text--blue"></i>
                        Payment Gateway Configurations
                      </span>
                    </div>
                    <div className="form-row form-row-3" style={{ gap: '15px' }}>
                      <div className="fg" style={{ flex: 1 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={gatewayConfig.enabledGateways.stripe}
                            onChange={(e) => setGatewayConfig({
                              ...gatewayConfig,
                              enabledGateways: { ...gatewayConfig.enabledGateways, stripe: e.target.checked }
                            })}
                          />
                          <strong>Enable Stripe</strong>
                        </label>
                        <input 
                          className="fi" 
                          style={{ marginTop: '8px', fontSize: '12px', padding: '6px' }}
                          placeholder="Stripe Publishable Key"
                          value={gatewayConfig.stripePublishable}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, stripePublishable: e.target.value })}
                          disabled={!gatewayConfig.enabledGateways.stripe}
                        />
                      </div>
                      <div className="fg" style={{ flex: 1 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={gatewayConfig.enabledGateways.razorpay}
                            onChange={(e) => setGatewayConfig({
                              ...gatewayConfig,
                              enabledGateways: { ...gatewayConfig.enabledGateways, razorpay: e.target.checked }
                            })}
                          />
                          <strong>Enable Razorpay</strong>
                        </label>
                        <input 
                          className="fi" 
                          style={{ marginTop: '8px', fontSize: '12px', padding: '6px' }}
                          placeholder="Razorpay Key ID"
                          value={gatewayConfig.razorpayKey}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, razorpayKey: e.target.value })}
                          disabled={!gatewayConfig.enabledGateways.razorpay}
                        />
                      </div>
                      <div className="fg" style={{ flex: 1 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={gatewayConfig.enabledGateways.payu}
                            onChange={(e) => setGatewayConfig({
                              ...gatewayConfig,
                              enabledGateways: { ...gatewayConfig.enabledGateways, payu: e.target.checked }
                            })}
                          />
                          <strong>Enable PayU</strong>
                        </label>
                        <input 
                          className="fi" 
                          style={{ marginTop: '8px', fontSize: '12px', padding: '6px' }}
                          placeholder="PayU Merchant ID"
                          value={gatewayConfig.payuMerchantId}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, payuMerchantId: e.target.value })}
                          disabled={!gatewayConfig.enabledGateways.payu}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                      <button className="btn btn--primary btn--sm" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => alert('Gateway credentials saved successfully!')}>
                        <i className="fas fa-floppy-disk"></i> Save Configurations
                      </button>
                    </div>
                  </div>

                  {/* Mock Online Checkout Sandbox Terminal */}
                  <div className="card" style={{ padding: '20px' }}>
                    <div className="card__head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                      <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <i className="fas fa-laptop-code text--yellow"></i>
                        Mock Payment Link Sandbox Terminal
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Simulate customer-facing checkout gateways directly from here</p>
                    </div>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Balance Due</th>
                          <th style={{ textAlign: 'center' }}>Gateway Sandbox Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbData.sales.filter(s => s.status !== 'Paid' && s.active !== false).length > 0 ? (
                          dbData.sales.filter(s => s.status !== 'Paid' && s.active !== false).map((s, idx) => {
                            const remainingDue = (parseFloat(s.amount) || 0) - (parseFloat(s.paymentReceived) || 0);
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: 'var(--blue)', fontSize: '12px' }}>{s.id}</td>
                                <td style={{ fontWeight: 600, fontSize: '13px' }}>{s.customer}</td>
                                <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>{s.date}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '12px' }}>{fmt(parseFloat(s.amount) || 0)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--red)', fontSize: '13px' }}>
                                  {fmt(remainingDue)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    {gatewayConfig.enabledGateways.stripe && (
                                      <button 
                                        className="btn btn--sm btn--primary" 
                                        style={{ padding: '4px 8px', fontSize: '10px', background: '#635bff', borderColor: '#635bff' }}
                                        onClick={() => {
                                          setCheckoutInvoice(s);
                                          setSelectedGateway('stripe');
                                          setShowCheckoutModal(true);
                                        }}
                                      >
                                        <i className="fab fa-stripe-s"></i> Stripe
                                      </button>
                                    )}
                                    {gatewayConfig.enabledGateways.razorpay && (
                                      <button 
                                        className="btn btn--sm btn--primary" 
                                        style={{ padding: '4px 8px', fontSize: '10px', background: '#3397e2', borderColor: '#3397e2' }}
                                        onClick={() => {
                                          setCheckoutInvoice(s);
                                          setSelectedGateway('razorpay');
                                          setShowCheckoutModal(true);
                                        }}
                                      >
                                        <i className="fas fa-credit-card"></i> Razorpay
                                      </button>
                                    )}
                                    {!gatewayConfig.enabledGateways.stripe && !gatewayConfig.enabledGateways.razorpay && (
                                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Please enable Stripe/Razorpay above</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)', fontSize: '12px' }}>
                              No pending customer invoices found. All invoices settled!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Voucher No</th>
                        <th>Party Name</th>
                        <th>Type</th>
                        <th>Payment Mode</th>
                        <th>Reference / Notes</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length > 0 ? (
                        filteredPayments.slice().reverse().map((p, idx) => {
                          const isReceive = p.type === 'Payment Receive';
                          const amt = isReceive ? p.debit : p.credit;
                          return (
                            <tr key={idx}>
                              <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{p.date}</td>
                              <td style={{ fontWeight: 600, color: 'var(--blue)', fontSize: '12px' }}>{p.id}</td>
                              <td style={{ fontWeight: 600, fontSize: '13px' }}>{p.party}</td>
                              <td>
                                <span className={`badge ${isReceive ? 'badge--green' : 'badge--red'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>
                                  {isReceive ? 'Inward' : 'Outward'}
                                </span>
                              </td>
                              <td><span className="badge badge--grey" style={{ fontSize: '11px', padding: '2px 6px' }}>{p.mode || 'Cash'}</span></td>
                              <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>{p.referenceNo || '-'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: isReceive ? 'var(--green)' : 'var(--red)', fontSize: '13px' }}>
                                {fmt(parseFloat(amt) || 0)}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button className="btn--icon" style={{ marginRight: '6px' }} onClick={() => printPaymentVoucher(p)} title="Print Receipt">
                                  <i className="fas fa-print" style={{ color: 'var(--text-3)', fontSize: '12px' }}></i>
                                </button>
                                <button className="btn--icon" onClick={() => handleDeletePayment(p)} title="Delete Payment Record">
                                  <i className="fas fa-trash" style={{ color: 'var(--red)', fontSize: '12px' }}></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)', fontSize: '13px' }}>
                            No payments recorded matching current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ==================== MODULE 10: OFFERS & DISCOUNTS ==================== */}
      {currentView === 'offers' && (
        <section className="view active" id="view-offers">
          <div className="sec-header sec-header--row">
            <div>
              <h2>Offers & Discount Management</h2>
              <p>Create promotional offers, coupons, and discounts for billing.</p>
            </div>
            <button className="btn btn--primary" onClick={() => { setEditingOffer(null); setOfferForm({ code: '', type: 'Percentage', value: 0, startDate: '', endDate: '', minBillAmount: 0, applicableCategory: '', applicableProduct: '', usageLimit: 0, isActive: true }); setShowOfferModal(true); }}><i className="fas fa-tag"></i> Create Offer</button>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Validity</th>
                  <th>Min Bill</th>
                  <th>Usage Limit</th>
                  <th>Active</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dbData.offers || []).map((o, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{o.code}</td>
                    <td><span className="badge badge--blue">{o.type}</span></td>
                    <td style={{ fontWeight: 'bold' }}>{o.type === 'Percentage' ? `${o.value}%` : fmt(o.value)}</td>
                    <td style={{ color: 'var(--text-3)' }}>{o.startDate || '-'} to {o.endDate || '-'}</td>
                    <td>{o.minBillAmount > 0 ? fmt(o.minBillAmount) : 'None'}</td>
                    <td style={{ color: 'var(--text-3)' }}>{o.usedCount} / {o.usageLimit > 0 ? o.usageLimit : '∞'}</td>
                    <td>
                      <button className={`btn btn--sm ${o.isActive ? 'btn--primary' : ''}`} onClick={() => handleOfferToggle(o.id)}>
                        {o.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn--icon" onClick={() => { setEditingOffer(o); setOfferForm({ ...o }); setShowOfferModal(true); }}><i className="fas fa-pen"></i></button>
                      <button className="btn--icon" onClick={() => deleteOffer(o.id)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                    </td>
                  </tr>
                ))}
                {!(dbData.offers && dbData.offers.length > 0) && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No offers created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== MODULE 11: REPORTS ==================== */}
      {currentView === 'reports' && (
        <section className="view active" id="view-reports">
          <div className="sec-header">
            <h2>Reports & AI Advisory</h2>
            <p>System reports and real-time AI strategic suggestions.</p>
          </div>

          <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '5px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${reportsTab === 'general' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setReportsTab('general')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              General & AI Reports
            </button>
            <button 
              className={`btn ${reportsTab === 'sales' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setReportsTab('sales')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              Sales & Revenue Analytics
            </button>
            <button 
              className={`btn ${reportsTab === 'purchase' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setReportsTab('purchase')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              Purchase Analytics
            </button>
            <button 
              className={`btn ${reportsTab === 'expense' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setReportsTab('expense')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              Expense & Profit Analytics
            </button>
            <button 
              className={`btn ${reportsTab === 'inventory_rep' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setReportsTab('inventory_rep')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              Inventory & Stock Reports
            </button>
            <button 
              className={`btn ${reportsTab === 'offers' ? 'btn--primary' : 'btn--outline'}`} 
              onClick={() => setReportsTab('offers')}
              style={{ padding: '8px 16px', borderRadius: '20px' }}
            >
              Offer Performance Report
            </button>
          </div>

          {reportsTab === 'general' && (
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
          )}

          {reportsTab === 'sales' && (
            <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {/* Controls bar */}
              <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="fg" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Grouping Period</label>
                    <select className="fi" style={{ width: '130px', height: '36px', fontSize: '13px' }} value={salesReportPeriod} onChange={(e) => setSalesReportPeriod(e.target.value)}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div className="fg" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>From Date</label>
                    <input type="date" className="fi" style={{ width: '150px', height: '36px', fontSize: '13px' }} value={salesReportStart} onChange={(e) => setSalesReportStart(e.target.value)} />
                  </div>
                  
                  <div className="fg" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>To Date</label>
                    <input type="date" className="fi" style={{ width: '150px', height: '36px', fontSize: '13px' }} value={salesReportEnd} onChange={(e) => setSalesReportEnd(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn" type="button" onClick={() => { setSalesReportStart(''); setSalesReportEnd(''); setSalesReportPeriod('monthly'); }} style={{ fontSize: '13px', padding: '8px 14px' }}>
                    <i className="fas fa-undo"></i> Reset Filters
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales Revenue</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(salesReportData.summary.totalRevenue)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Invoices</span>
                  <h3 style={{ fontSize: '22px', color: '#3b82f6', margin: '5px 0 0 0', fontWeight: '800' }}>{salesReportData.summary.invoiceCount}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))', borderLeft: '4px solid #8b5cf6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Invoice Ticket</span>
                  <h3 style={{ fontSize: '22px', color: '#8b5cf6', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(salesReportData.summary.avgInvoiceValue)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(20, 184, 166, 0.02))', borderLeft: '4px solid #14b8a6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gross Profit Margin</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(salesReportData.summary.grossProfit)}</h3>
                </div>
              </div>

              {/* Visual Charts Grid */}
              <div className="two-col" style={{ gap: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Trend line chart */}
                <div className="card chart-area" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '10px' }}><span>Sales Chronological Trend</span></div>
                  <div style={{ height: '240px' }}>
                    {salesReportData.timeData.labels.length > 0 ? (
                      <Line
                        data={{
                          labels: salesReportData.timeData.labels,
                          datasets: [{
                            label: 'Sales Revenue',
                            data: salesReportData.timeData.values,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.3
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false }}
                      />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-3)' }}>No chronological data for range.</div>
                    )}
                  </div>
                </div>

                {/* Category Doughnut chart */}
                <div className="card" style={{ width: '300px', flexShrink: 0, padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '10px' }}><span>Category Sales</span></div>
                  <div style={{ height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {salesReportData.categoryData.length > 0 ? (
                      <Doughnut
                        data={{
                          labels: salesReportData.categoryData.map(c => c.category),
                          datasets: [{
                            data: salesReportData.categoryData.map(c => c.revenue),
                            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-3)' }}>No data available.</div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px', color: 'var(--text-3)' }}>Doughnut segments map revenue yield per category.</div>
                </div>

                {/* Payment Mode Doughnut chart */}
                <div className="card" style={{ width: '300px', flexShrink: 0, padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '10px' }}><span>Payment Modes</span></div>
                  <div style={{ height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {salesReportData.modeData.length > 0 ? (
                      <Doughnut
                        data={{
                          labels: salesReportData.modeData.map(m => m.mode),
                          datasets: [{
                            data: salesReportData.modeData.map(m => m.revenue),
                            backgroundColor: ['#8b5cf6', '#14b8a6', '#3b82f6', '#f59e0b', '#ef4444']
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-3)' }}>No data available.</div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px', color: 'var(--text-3)' }}>Breakdown of Cash, Bank, UPI and Credit payments.</div>
                </div>
              </div>

              {/* Detail Tables Grid */}
              <div className="two-col" style={{ gap: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: '20px' }}>
                {/* Product-wise Table */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '12px' }}><span>Product-wise Sales Performance</span></div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th style={{ textAlign: 'right' }}>Qty Sold</th>
                          <th style={{ textAlign: 'right' }}>Revenue Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReportData.productData.length > 0 ? (
                          salesReportData.productData.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.product}</td>
                              <td style={{ textAlign: 'right', fontWeight: '500' }}>{p.qty}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.revenue)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No items sold.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Category-wise Table */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '12px' }}><span>Category-wise Sales Breakdown</span></div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th style={{ textAlign: 'right' }}>Items Sold</th>
                          <th style={{ textAlign: 'right' }}>Revenue Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReportData.categoryData.length > 0 ? (
                          salesReportData.categoryData.map((c, idx) => (
                            <tr key={idx}>
                              <td>{c.category}</td>
                              <td style={{ textAlign: 'right', fontWeight: '500' }}>{c.qty}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(c.revenue)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No category data.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="two-col" style={{ gap: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Customer-wise Table */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '12px' }}><span>Customer-wise Sales Distribution</span></div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Customer Name</th>
                          <th style={{ textAlign: 'right' }}>Invoices</th>
                          <th style={{ textAlign: 'right' }}>Revenue Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReportData.customerData.length > 0 ? (
                          salesReportData.customerData.map((c, idx) => (
                            <tr key={idx}>
                              <td>{c.customer}</td>
                              <td style={{ textAlign: 'right', fontWeight: '500' }}>{c.invoiceCount}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(c.revenue)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No customer data.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Staff-wise Table */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '12px' }}><span>Staff-wise Sales Performance</span></div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th style={{ textAlign: 'right' }}>Invoices</th>
                          <th style={{ textAlign: 'right' }}>Revenue Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReportData.staffData.length > 0 ? (
                          salesReportData.staffData.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.staff}</td>
                              <td style={{ textAlign: 'right', fontWeight: '500' }}>{s.invoiceCount}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(s.revenue)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No staff data.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportsTab === 'purchase' && (
            <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {/* Controls bar */}
              <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="fg" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>From Date</label>
                    <input type="date" className="fi" style={{ width: '150px', height: '36px', fontSize: '13px' }} value={purchaseReportStart} onChange={(e) => setPurchaseReportStart(e.target.value)} />
                  </div>
                  
                  <div className="fg" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>To Date</label>
                    <input type="date" className="fi" style={{ width: '150px', height: '36px', fontSize: '13px' }} value={purchaseReportEnd} onChange={(e) => setPurchaseReportEnd(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn" type="button" onClick={() => { setPurchaseReportStart(''); setPurchaseReportEnd(''); }} style={{ fontSize: '13px', padding: '8px 14px' }}>
                    <i className="fas fa-undo"></i> Reset Filters
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))', borderLeft: '4px solid #ef4444' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Purchase Cost</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(purchaseReportsAggData.summary.totalProcurement)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Procurement Invoices</span>
                  <h3 style={{ fontSize: '22px', color: '#3b82f6', margin: '5px 0 0 0', fontWeight: '800' }}>{purchaseReportsAggData.summary.orderCount}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))', borderLeft: '4px solid #8b5cf6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Purchase Ticket</span>
                  <h3 style={{ fontSize: '22px', color: '#8b5cf6', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(purchaseReportsAggData.summary.avgPurchaseValue)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(20, 184, 166, 0.02))', borderLeft: '4px solid #14b8a6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Suppliers</span>
                  <h3 style={{ fontSize: '22px', color: '#14b8a6', margin: '5px 0 0 0', fontWeight: '800' }}>{purchaseReportsAggData.summary.activeSuppliers}</h3>
                </div>
              </div>

              {/* Visual Charts Grid */}
              <div className="two-col" style={{ gap: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Monthly Procurement Trend Bar Chart */}
                <div className="card chart-area" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '10px' }}><span>Monthly Purchase Summary</span></div>
                  <div style={{ height: '240px' }}>
                    {purchaseReportsAggData.timeData.labels.length > 0 ? (
                      <Bar
                        data={{
                          labels: purchaseReportsAggData.timeData.labels,
                          datasets: [{
                            label: 'Procurement Amount',
                            data: purchaseReportsAggData.timeData.values,
                            backgroundColor: 'rgba(239, 68, 68, 0.65)',
                            borderColor: '#ef4444',
                            borderWidth: 1
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false }}
                      />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-3)' }}>No procurement history available.</div>
                    )}
                  </div>
                </div>

                {/* Supplier share Doughnut */}
                <div className="card" style={{ width: '320px', flexShrink: 0, padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '10px' }}><span>Supplier Share Breakdown</span></div>
                  <div style={{ height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {purchaseReportsAggData.supplierData.length > 0 ? (
                      <Doughnut
                        data={{
                          labels: purchaseReportsAggData.supplierData.map(s => s.supplier),
                          datasets: [{
                            data: purchaseReportsAggData.supplierData.map(s => s.totalAmount),
                            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6']
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-3)' }}>No supplier data available.</div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px', color: 'var(--text-3)' }}>Breakdown of cost procurement share per vendor.</div>
                </div>
              </div>

              {/* Detail Tables Grid */}
              <div className="two-col" style={{ gap: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Supplier purchases table */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '12px' }}><span>Supplier-wise Procurement Summary</span></div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Supplier Name</th>
                          <th style={{ textAlign: 'right' }}>Invoices</th>
                          <th style={{ textAlign: 'right' }}>Total Procured</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseReportsAggData.supplierData.length > 0 ? (
                          purchaseReportsAggData.supplierData.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.supplier}</td>
                              <td style={{ textAlign: 'right', fontWeight: '500' }}>{s.invoiceCount}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(s.totalAmount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No suppliers registered.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Product-wise purchases table */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                  <div className="card__head" style={{ marginBottom: '12px' }}><span>Product-wise Procurement performance</span></div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th style={{ textAlign: 'right' }}>Qty Procured</th>
                          <th style={{ textAlign: 'right' }}>Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseReportsAggData.productData.length > 0 ? (
                          purchaseReportsAggData.productData.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.product}</td>
                              <td style={{ textAlign: 'right', fontWeight: '500' }}>{p.qty}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.totalCost)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No procurement details.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportsTab === 'inventory_rep' && (
            <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
              {/* KPI Cards Grid */}
              <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Unique SKUs</span>
                  <h3 style={{ fontSize: '22px', color: '#3b82f6', margin: '5px 0 0 0', fontWeight: '800' }}>{inventoryReportData.totalSKUs}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Inventory Asset Value</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(inventoryReportData.totalInventoryValue)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock SKU Alerts</span>
                  <h3 style={{ fontSize: '22px', color: '#f59e0b', margin: '5px 0 0 0', fontWeight: '800' }}>{inventoryReportData.lowStockList.length}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))', borderLeft: '4px solid #ef4444' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Out of Stock SKUs</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>{inventoryReportData.outOfStockList.length}</h3>
                </div>
              </div>

              {/* Inner Tab Buttons Navigation */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '5px', flexWrap: 'wrap' }}>
                <button className={`btn btn--sm ${innerInventoryTab === 'summary' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setInnerInventoryTab('summary')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                  Stock Summary
                </button>
                <button className={`btn btn--sm ${innerInventoryTab === 'low_stock' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setInnerInventoryTab('low_stock')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                  Low Stock ({inventoryReportData.lowStockList.length})
                </button>
                <button className={`btn btn--sm ${innerInventoryTab === 'out_of_stock' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setInnerInventoryTab('out_of_stock')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                  Out of Stock ({inventoryReportData.outOfStockList.length})
                </button>
                <button className={`btn btn--sm ${innerInventoryTab === 'dead_stock' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setInnerInventoryTab('dead_stock')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                  Dead Stock ({inventoryReportData.deadStockList.length})
                </button>
                <button className={`btn btn--sm ${innerInventoryTab === 'movement' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setInnerInventoryTab('movement')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                  Stock Movement Log
                </button>
                <button className={`btn btn--sm ${innerInventoryTab === 'expiry' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setInnerInventoryTab('expiry')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                  Expiry Tracker ({inventoryReportData.expiredList.length + inventoryReportData.expiringSoonList.length})
                </button>
              </div>

              {/* Inner Tab Contents */}
              <div className="card" style={{ padding: '16px' }}>
                {innerInventoryTab === 'summary' && (
                  <div>
                    <h4 style={{ marginBottom: '12px' }}>Inventory Valuation Ledger</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'right' }}>Current Stock</th>
                            <th style={{ textAlign: 'right' }}>Purchase Cost</th>
                            <th style={{ textAlign: 'right' }}>Retail Price</th>
                            <th style={{ textAlign: 'right' }}>Valuation (Cost)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.summaryList.length > 0 ? (
                            inventoryReportData.summaryList.map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.name}</td>
                                <td><code>{p.sku}</code></td>
                                <td style={{ textAlign: 'right', fontWeight: '500' }}>{p.stock}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(p.purchasePrice)}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(p.price)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.valuation)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No product records found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {innerInventoryTab === 'low_stock' && (
                  <div>
                    <h4 style={{ marginBottom: '12px', color: '#f59e0b' }}>Low Stock Alert Ledger</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'right' }}>Current Stock</th>
                            <th style={{ textAlign: 'right' }}>Min Threshold</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.lowStockList.length > 0 ? (
                            inventoryReportData.lowStockList.map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.name}</td>
                                <td><code>{p.sku || 'N/A'}</code></td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>{p.stock}</td>
                                <td style={{ textAlign: 'right' }}>{p.lowStockLevel || 5}</td>
                                <td><span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b' }}>Low Level</span></td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>Zero low-stock SKUs detected. All items optimal.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {innerInventoryTab === 'out_of_stock' && (
                  <div>
                    <h4 style={{ marginBottom: '12px', color: 'var(--red)' }}>Out of Stock Ledger</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'right' }}>Current Stock</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.outOfStockList.length > 0 ? (
                            inventoryReportData.outOfStockList.map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.name}</td>
                                <td><code>{p.sku || 'N/A'}</code></td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{p.stock}</td>
                                <td><span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid var(--red)' }}>Stockout</span></td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No stockout items detected.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {innerInventoryTab === 'dead_stock' && (
                  <div>
                    <h4 style={{ marginBottom: '4px' }}>Dead Stock Reports</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '15px' }}>The following catalog products have registered 0 sales transactions across invoice histories.</p>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'right' }}>Stock on Hand</th>
                            <th>Retail Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.deadStockList.length > 0 ? (
                            inventoryReportData.deadStockList.map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.name}</td>
                                <td><code>{p.sku || 'N/A'}</code></td>
                                <td style={{ textAlign: 'right', fontWeight: '500' }}>{p.stock || 0}</td>
                                <td>{fmt(p.price)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No dead stock detected. All items have registered sales activity.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {innerInventoryTab === 'movement' && (
                  <div>
                    <h4 style={{ marginBottom: '12px' }}>Chronological Stock Movement ledger</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Product Name</th>
                            <th>Direction/Type</th>
                            <th style={{ textAlign: 'right' }}>Qty Adjusted</th>
                            <th>Reference ID</th>
                            <th>Customer / Vendor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.movementLog.length > 0 ? (
                            inventoryReportData.movementLog.map((m, idx) => (
                              <tr key={idx}>
                                <td>{new Date(m.date).toLocaleString()}</td>
                                <td>{m.product}</td>
                                <td>
                                  <span className="badge" style={{ 
                                    backgroundColor: m.qty > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                    color: m.qty > 0 ? 'var(--green)' : 'var(--red)',
                                    border: `1px solid ${m.qty > 0 ? 'var(--green)' : 'var(--red)'}`
                                  }}>
                                    {m.type}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: m.qty > 0 ? 'var(--green)' : 'var(--red)' }}>
                                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                                </td>
                                <td><code>{m.refId}</code></td>
                                <td>{m.party}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No stock movement logs recorded.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {innerInventoryTab === 'expiry' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Expiry Ledger Tracker</h4>
                    
                    <div className="two-col" style={{ gap: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                      {/* Expired block */}
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <h5 style={{ color: 'var(--red)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--red)' }}></span>
                          Expired Items ({inventoryReportData.expiredList.length})
                        </h5>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>Product / Batch</th>
                                <th>SKU</th>
                                <th style={{ color: 'var(--red)' }}>Expiry Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryReportData.expiredList.length > 0 ? (
                                inventoryReportData.expiredList.map((e, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: '500' }}>{e.name}</td>
                                    <td><code>{e.sku || 'N/A'}</code></td>
                                    <td style={{ color: 'var(--red)', fontWeight: 'bold' }}>{e.expiryDate}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '10px', color: 'var(--text-3)' }}>No expired items.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Expiring soon block */}
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <h5 style={{ color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                          Expiring Soon (30 Days) ({inventoryReportData.expiringSoonList.length})
                        </h5>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="tbl tbl--simple" style={{ width: '100%', fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>Product / Batch</th>
                                <th>SKU</th>
                                <th style={{ color: '#f59e0b' }}>Expiry Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryReportData.expiringSoonList.length > 0 ? (
                                inventoryReportData.expiringSoonList.map((e, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: '500' }}>{e.name}</td>
                                    <td><code>{e.sku || 'N/A'}</code></td>
                                    <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{e.expiryDate}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '10px', color: 'var(--text-3)' }}>No items expiring soon.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {reportsTab === 'expense' && (
            <div>
              <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #10b98115, #10b98105)', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales (Revenue)</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(totalSales)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #ef444415, #ef444405)', borderLeft: '4px solid #ef4444' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(totalExpenses)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #6366f115, #6366f105)', borderLeft: '4px solid #6366f1' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Operating Balance</span>
                  <h3 style={{ fontSize: '22px', color: totalSales - totalExpenses >= 0 ? 'var(--green)' : 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(totalSales - totalExpenses)}</h3>
                </div>
                <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #f59e0b15, #f59e0b05)', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expense-To-Sales Ratio</span>
                  <h3 style={{ fontSize: '22px', color: 'var(--text-1)', margin: '5px 0 0 0', fontWeight: '800' }}>
                    {totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) + '%' : '0.0%'}
                  </h3>
                </div>
              </div>

              <div className="two-col" style={{ gap: '20px' }}>
                <div className="card" style={{ flex: 1 }}>
                  <div className="card__head"><span>Category-wise Breakdown</span></div>
                  {Object.keys(expenseByCategory).length > 0 ? (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', padding: '15px' }}>
                      <div style={{ width: '160px', height: '160px', position: 'relative' }}>
                        <Doughnut data={{
                          labels: Object.keys(expenseByCategory),
                          datasets: [{
                            data: Object.values(expenseByCategory),
                            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'].slice(0, Object.keys(expenseByCategory).length)
                          }]
                        }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                      </div>
                      <div style={{ flex: 1, maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="tbl tbl--simple" style={{ fontSize: '13px', width: '100%' }}>
                          <tbody>
                            {Object.keys(expenseByCategory).map((label, idx) => {
                              const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];
                              return (
                                <tr key={idx}>
                                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }}></span>
                                    {label}
                                  </td>
                                  <td style={{ fontWeight: 'bold', textAlign: 'right', padding: '4px 0' }}>{fmt(expenseByCategory[label])}</td>
                                  <td style={{ color: 'var(--text-3)', textAlign: 'right', padding: '4px 0' }}>{totalExpenses > 0 ? ((expenseByCategory[label] / totalExpenses) * 100).toFixed(0) + '%' : '0%'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No expenses recorded yet.</div>
                  )}
                </div>

                <div className="card" style={{ flex: 1 }}>
                  <div className="card__head"><span>Monthly Trend</span></div>
                  {Object.keys(expenseByMonth).length > 0 ? (
                    <div style={{ padding: '15px' }}>
                      <table className="tbl tbl--simple" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th style={{ textAlign: 'right' }}>Total Expenses</th>
                            <th style={{ textAlign: 'right' }}>Trend Shift</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(expenseByMonth).sort().reverse().map((month, idx, arr) => {
                            const amt = expenseByMonth[month];
                            const prevMonth = arr[idx + 1];
                            let pctChange = null;
                            if (prevMonth) {
                              const prevAmt = expenseByMonth[prevMonth];
                              if (prevAmt > 0) {
                                pctChange = ((amt - prevAmt) / prevAmt) * 100;
                              }
                            }
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: '500' }}>{month}</td>
                                <td style={{ fontWeight: 'bold', color: 'var(--red)', textAlign: 'right' }}>{fmt(amt)}</td>
                                <td style={{ textAlign: 'right' }}>
                                  {pctChange !== null ? (
                                    <span style={{ color: pctChange > 0 ? 'var(--red)' : 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <i className={`fas ${pctChange > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                                      {Math.abs(pctChange).toFixed(0)}%
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-3)' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No monthly trend data available.</div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginTop: '20px' }}>
                <div className="card__head"><span>Expense vs Revenue Monthly Comparison</span></div>
                {sortedMonths.length > 0 ? (
                  <div style={{ padding: '15px' }}>
                    <div style={{ height: '240px', marginBottom: '20px' }}>
                      <Bar data={{
                        labels: sortedMonths,
                        datasets: [
                          {
                            label: 'Revenue (Sales)',
                            data: sortedMonths.map(m => salesByMonth[m] || 0),
                            backgroundColor: '#10b981'
                          },
                          {
                            label: 'Expenses',
                            data: sortedMonths.map(m => expenseByMonth[m] || 0),
                            backgroundColor: '#ef4444'
                          }
                        ]
                      }} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                    <table className="tbl" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th style={{ textAlign: 'right' }}>Revenue (Sales)</th>
                          <th style={{ textAlign: 'right' }}>Expenses</th>
                          <th style={{ textAlign: 'right' }}>Net Margin</th>
                          <th style={{ textAlign: 'right' }}>Expense Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMonths.slice().reverse().map((month, idx) => {
                          const salesAmt = salesByMonth[month] || 0;
                          const expAmt = expenseByMonth[month] || 0;
                          const margin = salesAmt - expAmt;
                          const ratio = salesAmt > 0 ? ((expAmt / salesAmt) * 100).toFixed(0) + '%' : '100%+';
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 'bold' }}>{month}</td>
                              <td style={{ color: 'var(--green)', fontWeight: '500', textAlign: 'right' }}>{fmt(salesAmt)}</td>
                              <td style={{ color: 'var(--red)', fontWeight: '500', textAlign: 'right' }}>{fmt(expAmt)}</td>
                              <td style={{ color: margin >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold', textAlign: 'right' }}>{fmt(margin)}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{ratio}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No monthly sales or expense records found to compare.</div>
                )}
              </div>
            </div>
          )}

          {reportsTab === 'offers' && (() => {
            const perf = calculateOfferPerformance();
            const offerLabels = perf.stats.map(o => o.code);
            const revenueData = perf.stats.map(o => o.revenueGenerated);
            const discountData = perf.stats.map(o => o.discountGiven);

            return (
              <div>
                <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #3b82f615, #3b82f605)', borderLeft: '4px solid #3b82f6' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Coupon Redemptions</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--blue)', margin: '5px 0 0 0', fontWeight: '800' }}>{perf.totalOfferUsage}</h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #10b98115, #10b98105)', borderLeft: '4px solid #10b981' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue via Offers</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(perf.totalRevenueWithOffers)}</h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #ef444415, #ef444405)', borderLeft: '4px solid #ef4444' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Discounts Given</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(perf.totalDiscountGiven)}</h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #f59e0b15, #f59e0b05)', borderLeft: '4px solid #f59e0b' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Order Discount</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--text-1)', margin: '5px 0 0 0', fontWeight: '800' }}>
                      {perf.totalOfferUsage > 0 ? fmt(perf.totalDiscountGiven / perf.totalOfferUsage) : fmt(0)}
                    </h3>
                  </div>
                </div>

                <div className="two-col" style={{ gap: '20px' }}>
                  <div className="card" style={{ flex: 1 }}>
                    <div className="card__head"><span>Coupon Code Campaign Performance</span></div>
                    {perf.stats.length > 0 ? (
                      <div style={{ padding: '15px' }}>
                        <table className="tbl" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Type</th>
                              <th style={{ textAlign: 'right' }}>Uses</th>
                              <th style={{ textAlign: 'right' }}>Total Revenue (₹)</th>
                              <th style={{ textAlign: 'right' }}>Discounts Given (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perf.stats.map((o, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 'bold', color: 'var(--blue)' }}>{o.code}</td>
                                <td>{o.type}</td>
                                <td style={{ textAlign: 'right', fontWeight: '500' }}>{o.usageCount} / {o.usageLimit > 0 ? o.usageLimit : '∞'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: '600' }}>{fmt(o.revenueGenerated)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: '600' }}>{fmt(o.discountGiven)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No coupon usage statistics available.</div>
                    )}
                  </div>

                  <div className="card" style={{ width: '360px' }}>
                    <div className="card__head"><span>Revenue vs Discount Cost</span></div>
                    {perf.stats.length > 0 ? (
                      <div style={{ padding: '15px', height: '300px' }}>
                        <Bar data={{
                          labels: offerLabels,
                          datasets: [
                            {
                              label: 'Revenue',
                              data: revenueData,
                              backgroundColor: '#10b981'
                            },
                            {
                              label: 'Discount Cost',
                              data: discountData,
                              backgroundColor: '#ef4444'
                            }
                          ]
                        }} options={{ responsive: true, maintainAspectRatio: false }} />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No graphical comparison available.</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ==================== MODULE 9: BUSINESS PROFILE ==================== */}
      { currentView === 'business' && (
        <section className="view active" id="view-business">
          <div className="sec-header">
            <h2>Business Profile & SaaS</h2>
            <p>Update company parameters and manage active plan licensing.</p>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card__head" style={{ display: 'block', borderBottom: 'none', paddingBottom: 0 }}>
                <span style={{ display: 'block', marginBottom: '8px' }}>Corporate parameters</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'general' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('general')}>🏠 General</button>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'contact' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('contact')}>📞 Contact & Socials</button>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'address' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('address')}>📍 Address & Branches</button>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'reg' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('reg')}>🧾 Registrations</button>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'local' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('local')}>⚙️ Localization</button>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'billing' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('billing')}>✏️ Billing & Branding</button>
                  <button type="button" className={`btn btn--sm ${settingsTab === 'bank' ? 'btn--primary' : ''}`} onClick={() => setSettingsTab('bank')}>💳 Bank & UPI</button>
                </div>
              </div>
              <form onSubmit={handleProfileSave} style={{ marginTop: '16px' }}>
                {settingsTab === 'general' && (
                  <>
                    <div className="fg"><label>Shop Name</label>
                      <input className="fi" value={profileForm.bizName} onChange={(e) => setProfileForm({ ...profileForm, bizName: e.target.value })} required />
                    </div>
                    <div className="form-row">
                      <div className="fg"><label>Shop Type</label>
                        <select className="fi" value={profileForm.shopType} onChange={(e) => setProfileForm({ ...profileForm, shopType: e.target.value })}>
                          <option value="General">General</option>
                          <option value="Grocery">Grocery</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Food/Restaurant">Food & Restaurant</option>
                          <option value="Services">Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="fg"><label>Owner Full Name</label>
                        <input className="fi" placeholder="Owner full name" value={profileForm.ownerName} onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })} />
                      </div>
                    </div>
                    <div className="fg"><label>Shop Logo</label>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                        {profileForm.logo && <img src={profileForm.logo} alt="Logo Preview" style={{ maxHeight: '60px', borderRadius: '4px', border: '1px solid var(--border)' }} />}
                      </div>
                    </div>
                  </>
                )}

                {settingsTab === 'contact' && (
                  <>
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
                      </div>
                    </div>

                    <div className="fg"><label>WhatsApp Number</label>
                      <input className="fi" placeholder="WhatsApp number with prefix (e.g. +91 9876543210)" value={profileForm.whatsapp || ''} onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })} />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                      <h4 style={{ marginBottom: '8px' }}>Social Media Links</h4>
                      <div className="form-row">
                        <div className="fg"><label>Facebook</label>
                          <input className="fi" placeholder="Facebook URL" value={profileForm.socialLinks?.facebook || ''} onChange={(e) => handleSocialLinksChange('facebook', e.target.value)} />
                        </div>
                        <div className="fg"><label>Instagram</label>
                          <input className="fi" placeholder="Instagram URL" value={profileForm.socialLinks?.instagram || ''} onChange={(e) => handleSocialLinksChange('instagram', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="fg"><label>Twitter / X</label>
                          <input className="fi" placeholder="Twitter URL" value={profileForm.socialLinks?.twitter || ''} onChange={(e) => handleSocialLinksChange('twitter', e.target.value)} />
                        </div>
                        <div className="fg"><label>LinkedIn</label>
                          <input className="fi" placeholder="LinkedIn URL" value={profileForm.socialLinks?.linkedin || ''} onChange={(e) => handleSocialLinksChange('linkedin', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {settingsTab === 'address' && (
                  <>
                    <div className="form-row">
                      <div className="fg"><label>Address Line 1</label>
                        <input className="fi" placeholder="Building, Street, Lane" value={profileForm.addressLine1 || ''} onChange={(e) => setProfileForm({ ...profileForm, addressLine1: e.target.value })} />
                      </div>
                      <div className="fg"><label>Address Line 2</label>
                        <input className="fi" placeholder="Locality, Landmark" value={profileForm.addressLine2 || ''} onChange={(e) => setProfileForm({ ...profileForm, addressLine2: e.target.value })} />
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

                    <div className="fg"><label>Office Address (Detailed Display)</label>
                      <textarea className="fi" rows="2" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                      <h4 style={{ marginBottom: '8px' }}>Branch Locations Management</h4>
                      <div className="form-row">
                        <div className="fg" style={{ flex: 1 }}><label>Branch Name</label>
                          <input className="fi" placeholder="e.g. South Branch" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                        </div>
                        <div className="fg" style={{ flex: 2 }}><label>Branch Address</label>
                          <input className="fi" placeholder="Full address" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
                        </div>
                        <div className="fg" style={{ flex: 'none', alignSelf: 'flex-end' }}>
                          <button type="button" className="btn btn--secondary" onClick={addBranch}><i className="fas fa-plus"></i> Add</button>
                        </div>
                      </div>
                      {profileForm.branches && profileForm.branches.length > 0 && (
                        <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          {profileForm.branches.map((b, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < profileForm.branches.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{b.address}</div>
                              </div>
                              <button type="button" className="btn--icon" onClick={() => removeBranch(idx)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {settingsTab === 'reg' && (
                  <>
                    <div className="form-row">
                      <div className="fg">
                        <label>GSTIN Validation</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input className="fi" placeholder="e.g. 29AABCU9603R1ZM" value={profileForm.gstin} onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })} />
                          <button type="button" className="btn btn--sm" onClick={handleGSTVerify}>Verify</button>
                        </div>
                        {gstStatusMsg && <p style={{ fontSize: '11px', color: isGstVerified === 1 ? '#10b981' : '#ef4444', marginTop: '4px' }}>{gstStatusMsg}</p>}
                      </div>
                      <div className="fg"><label>PAN Number</label>
                        <input className="fi" placeholder="PAN Number (10 characters)" maxLength={10} value={profileForm.pan || ''} onChange={(e) => setProfileForm({ ...profileForm, pan: e.target.value.toUpperCase() })} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="fg"><label>Shop Registration Number</label>
                        <input className="fi" placeholder="Registration number" value={profileForm.regNumber || ''} onChange={(e) => setProfileForm({ ...profileForm, regNumber: e.target.value })} />
                      </div>
                      {['Food/Restaurant', 'Grocery'].includes(profileForm.shopType) && (
                        <div className="fg"><label>FSSAI License Number</label>
                          <input className="fi" placeholder="FSSAI License number (14 digits)" maxLength={14} value={profileForm.fssai || ''} onChange={(e) => setProfileForm({ ...profileForm, fssai: e.target.value.replace(/\D/g, '') })} />
                        </div>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="fg">
                        <label>GST Scheme Type</label>
                        <select className="fi" value={profileForm.gstScheme || 'Regular'} onChange={(e) => setProfileForm({ ...profileForm, gstScheme: e.target.value })}>
                          <option value="Regular">Regular Taxpayer (GSTR-1 & GSTR-3B)</option>
                          <option value="Composition">Composition Scheme (Quarterly CMP-08)</option>
                        </select>
                      </div>
                      {profileForm.gstScheme === 'Composition' && (
                        <div className="fg">
                          <label>Composition Tax Rate</label>
                          <select className="fi" value={profileForm.compositionRate || '1%'} onChange={(e) => setProfileForm({ ...profileForm, compositionRate: e.target.value })}>
                            <option value="1%">Traders & Manufacturers (1%)</option>
                            <option value="5%">Restaurant Services (5%)</option>
                            <option value="6%">Other Service Providers (6%)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {settingsTab === 'local' && (
                  <>
                    <div className="form-row">
                      <div className="fg"><label>Financial Year Settings</label>
                        <select className="fi" value={profileForm.financialYear} onChange={(e) => setProfileForm({ ...profileForm, financialYear: e.target.value })}>
                          <option value="Apr-Mar">April - March</option>
                          <option value="Jan-Dec">January - December</option>
                        </select>
                      </div>
                      <div className="fg"><label>Working Hours Configuration</label>
                        <input className="fi" placeholder="e.g. 09:00 - 21:00" value={profileForm.workingHours || ''} onChange={(e) => setProfileForm({ ...profileForm, workingHours: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="fg"><label>Time Zone Settings</label>
                        <select className="fi" value={profileForm.timezone} onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}>
                          <option value="UTC+05:30">UTC+05:30 (India Standard Time)</option>
                          <option value="UTC+00:00">UTC+00:00 (GMT)</option>
                          <option value="UTC-05:00">UTC-05:00 (Eastern Time)</option>
                          <option value="UTC+08:00">UTC+08:00 (Singapore/China)</option>
                        </select>
                      </div>
                      <div className="fg"><label>Base Currency</label>
                        <select className="fi" value={profileForm.currency || 'INR (₹)'} onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}>
                          <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                          <option value="USD ($)">USD ($) - US Dollar</option>
                          <option value="EUR (€)">EUR (€) - Euro</option>
                          <option value="GBP (£)">GBP (£) - British Pound</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="fg"><label>Date Format Settings</label>
                        <select className="fi" value={profileForm.dateFormat} onChange={(e) => setProfileForm({ ...profileForm, dateFormat: e.target.value })}>
                          <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </div>
                      <div className="fg"><label>Language Settings</label>
                        <select className="fi" value={profileForm.language} onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}>
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                          <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                          <option value="Marathi">Marathi (मराठी)</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {settingsTab === 'billing' && (
                  <>
                    <div className="form-row">
                      <div className="fg"><label>Invoice Prefix Configuration</label>
                        <input className="fi" placeholder="e.g. INV" value={profileForm.invoicePrefix || ''} onChange={(e) => setProfileForm({ ...profileForm, invoicePrefix: e.target.value })} />
                      </div>
                      <div className="fg"><label>Invoice Starting Number</label>
                        <input type="number" className="fi" value={profileForm.invoiceStartNumber || '1'} onChange={(e) => setProfileForm({ ...profileForm, invoiceStartNumber: e.target.value })} />
                      </div>
                    </div>
                    <div className="fg"><label>Default Terms & Conditions</label>
                      <textarea className="fi" rows="3" placeholder="Terms & Conditions text displayed on invoice footer..." value={profileForm.termsAndConditions || ''} onChange={(e) => setProfileForm({ ...profileForm, termsAndConditions: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="fg">
                        <label>Digital Signature</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'digitalSignature')} />
                          {profileForm.digitalSignature && <img src={profileForm.digitalSignature} alt="Signature Preview" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid var(--border)' }} />}
                        </div>
                      </div>
                      <div className="fg">
                        <label>Shop Stamp / Seal</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shopStamp')} />
                          {profileForm.shopStamp && <img src={profileForm.shopStamp} alt="Stamp Preview" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid var(--border)' }} />}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {settingsTab === 'bank' && (
                  <>
                    <div className="form-row">
                      <div className="fg"><label>Bank Account Name</label>
                        <input className="fi" placeholder="Account Name" value={profileForm.bankDetails?.accountName || ''} onChange={(e) => handleBankDetailsChange('accountName', e.target.value)} />
                      </div>
                      <div className="fg"><label>Bank Account Number</label>
                        <input className="fi" placeholder="Account Number" value={profileForm.bankDetails?.accountNumber || ''} onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="fg"><label>Bank Name</label>
                        <input className="fi" placeholder="Bank Name" value={profileForm.bankDetails?.bankName || ''} onChange={(e) => handleBankDetailsChange('bankName', e.target.value)} />
                      </div>
                      <div className="fg"><label>IFSC Code</label>
                        <input className="fi" placeholder="IFSC Code (11 characters)" maxLength={11} value={profileForm.bankDetails?.ifscCode || ''} onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div className="fg"><label>UPI ID Configuration</label>
                      <input className="fi" placeholder="e.g. name@upi" value={profileForm.upiId || ''} onChange={(e) => setProfileForm({ ...profileForm, upiId: e.target.value })} />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>Update Profile</button>
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
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '750px', width: '90%' }}>
          <div className="modal__top">
            <h3>{editingProduct ? 'Edit Product Parameters' : 'Add New Product'}</h3>
            <button className="btn--icon" onClick={() => { setShowProductModal(false); setEditingProduct(null); resetProdForm(); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleProductSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
            <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px', color: 'var(--accent)' }}>Basic Details</h4>
            <div className="form-row">
              <div className="fg" style={{ flex: 2 }}><label>Product Name</label>
                <input className="fi" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} required />
              </div>
              <div className="fg"><label>SKU / Product Code</label>
                <input className="fi" value={prodForm.sku} onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Barcode (Auto/Manual)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="fi" placeholder="Manual input or auto-gen" value={prodForm.barcode || ''} onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })} />
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setProdForm({ ...prodForm, barcode: 'BC-' + Math.floor(1000000000 + Math.random() * 9000000000) })} style={{ whiteSpace: 'nowrap' }}>Auto-Gen</button>
                </div>
              </div>
              <div className="fg"><label>Product Image</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="fi" placeholder="Image URL or select file..." value={prodForm.image || ''} onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })} style={{ flex: 1 }} />
                  <label className="btn btn--secondary btn--sm" style={{ margin: 0, whiteSpace: 'nowrap', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 12px' }}>
                    <i className="fas fa-upload"></i> Upload
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.status === 'success') {
                          setProdForm(prev => ({ ...prev, image: data.fileUrl }));
                        } else {
                          alert('Upload failed: ' + (data.message || 'unknown error'));
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Error uploading image');
                      }
                    }} />
                  </label>
                </div>
                {prodForm.image && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={prodForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setProdForm(prev => ({ ...prev, image: '' }))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.85)', border: 'none', color: '#fff', cursor: 'pointer', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', borderBottomLeftRadius: '6px' }}>&times;</button>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Preview Thumbnail</span>
                  </div>
                )}
              </div>
            </div>
            <div className="fg"><label>Product Description</label>
              <textarea className="fi" rows="2" placeholder="Describe the item specifications..." value={prodForm.description || ''} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} />
            </div>

            <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginTop: '16px', marginBottom: '12px', color: 'var(--accent)' }}>Categorization & Units</h4>
            <div className="form-row form-row-3">
              <div className="fg"><label>Category</label>
                <input className="fi" list="categories-list" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} required />
              </div>
              <div className="fg"><label>Sub-Category</label>
                <input className="fi" placeholder="e.g. Mobile Accessories" value={prodForm.subCategory || ''} onChange={(e) => setProdForm({ ...prodForm, subCategory: e.target.value })} />
              </div>
              <div className="fg"><label>Brand</label>
                <input className="fi" list="brands-list" placeholder="e.g. Samsung" value={prodForm.brand || ''} onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Unit of Measurement</label>
                <select className="fi" value={prodForm.unit || 'pcs'} onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="litre">litre (Litres)</option>
                  <option value="metre">metre (Metres)</option>
                  <option value="box">box (Boxes)</option>
                  <option value="pack">pack (Packs)</option>
                  <option value="dozen">dozen (Dozens)</option>
                  <option value="bag">bag (Bags)</option>
                </select>
              </div>
              <div className="fg"><label>Primary SKU / Serial (Non-tracked)</label>
                <input className="fi" placeholder="Reference code" value={prodForm.serialNumber || ''} onChange={(e) => setProdForm({ ...prodForm, serialNumber: e.target.value })} />
              </div>
              <div className="fg"><label>Batch / Lot Reference</label>
                <input className="fi" placeholder="Reference batch code" value={prodForm.batchNumber || ''} onChange={(e) => setProdForm({ ...prodForm, batchNumber: e.target.value })} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: '10px', display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={prodForm.isBatchTracked || false} disabled={prodForm.hasSerialTracking} onChange={(e) => setProdForm({ ...prodForm, isBatchTracked: e.target.checked })} />
                <span style={{ fontWeight: 600 }}>Enable Multi-Batch / Lot Tracking</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={prodForm.hasSerialTracking || false} disabled={prodForm.isBatchTracked} onChange={(e) => setProdForm({ ...prodForm, hasSerialTracking: e.target.checked })} />
                <span style={{ fontWeight: 600 }}>Enable Serial Number Tracking (Electronics)</span>
              </label>
            </div>
            {prodForm.hasSerialTracking && (
              <div className="card" style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)' }}>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontWeight: 600 }}>Tracked Serial Numbers ({ (prodForm.serialNumbers || []).length })</h5>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input id="new-serial-input" className="fi" placeholder="Scan or type a serial and press Add or Enter..." onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      const current = prodForm.serialNumbers || [];
                      if (!current.includes(val)) {
                        const newSerials = [...current, val];
                        setProdForm({ ...prodForm, serialNumbers: newSerials, stock: newSerials.length });
                      }
                      e.target.value = '';
                    }
                  }} />
                  <button type="button" className="btn btn--secondary" onClick={() => {
                    const input = document.getElementById('new-serial-input');
                    if (input && input.value.trim()) {
                      const val = input.value.trim();
                      const current = prodForm.serialNumbers || [];
                      if (!current.includes(val)) {
                        const newSerials = [...current, val];
                        setProdForm({ ...prodForm, serialNumbers: newSerials, stock: newSerials.length });
                      }
                      input.value = '';
                    }
                  }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', background: 'var(--bg-input)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                  {(!prodForm.serialNumbers || prodForm.serialNumbers.length === 0) ? (
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No serial numbers recorded yet. Add some above.</span>
                  ) : (
                    prodForm.serialNumbers.map((sn, snIdx) => (
                      <span key={snIdx} className="badge badge--blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
                        {sn}
                        <i className="fas fa-xmark" style={{ cursor: 'pointer', color: 'var(--red)' }} onClick={() => {
                          const newSerials = prodForm.serialNumbers.filter((_, i) => i !== snIdx);
                          setProdForm({ ...prodForm, serialNumbers: newSerials, stock: newSerials.length });
                        }}></i>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}
            {prodForm.isBatchTracked && (
              <div className="card" style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)' }}>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontWeight: 600 }}>Product Batches / Lots Details</h5>
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>Mfg Date</th>
                      <th>Expiry Date</th>
                      <th style={{ width: '80px' }}>Stock</th>
                      <th style={{ width: '100px' }}>Cost Price</th>
                      <th style={{ width: '100px' }}>Sale Price</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(prodForm.batches || []).map((b, bIdx) => (
                      <tr key={bIdx}>
                        <td>
                          <input className="fi" value={b.batchNumber || ''} onChange={(e) => {
                            const copy = [...(prodForm.batches || [])];
                            copy[bIdx].batchNumber = e.target.value;
                            setProdForm({ ...prodForm, batches: copy });
                          }} placeholder="Batch Code" required style={{ padding: '4px 6px' }} />
                        </td>
                        <td>
                          <input type="date" className="fi" value={b.mfgDate || ''} onChange={(e) => {
                            const copy = [...(prodForm.batches || [])];
                            copy[bIdx].mfgDate = e.target.value;
                            setProdForm({ ...prodForm, batches: copy });
                          }} style={{ padding: '4px 6px' }} />
                        </td>
                        <td>
                          <input type="date" className="fi" value={b.expiryDate || ''} onChange={(e) => {
                            const copy = [...(prodForm.batches || [])];
                            copy[bIdx].expiryDate = e.target.value;
                            setProdForm({ ...prodForm, batches: copy });
                          }} style={{ padding: '4px 6px' }} />
                        </td>
                        <td>
                          <input type="number" className="fi" value={b.stock || 0} onChange={(e) => {
                            const copy = [...(prodForm.batches || [])];
                            copy[bIdx].stock = parseInt(e.target.value) || 0;
                            const totalStock = copy.reduce((sum, item) => sum + (parseInt(item.stock) || 0), 0);
                            setProdForm({ ...prodForm, batches: copy, stock: totalStock });
                          }} style={{ padding: '4px 6px' }} />
                        </td>
                        <td>
                          <input type="number" step="any" className="fi" value={b.purchasePrice || 0} onChange={(e) => {
                            const copy = [...(prodForm.batches || [])];
                            copy[bIdx].purchasePrice = parseFloat(e.target.value) || 0;
                            setProdForm({ ...prodForm, batches: copy });
                          }} style={{ padding: '4px 6px' }} />
                        </td>
                        <td>
                          <input type="number" step="any" className="fi" value={b.sellingPrice || 0} onChange={(e) => {
                            const copy = [...(prodForm.batches || [])];
                            copy[bIdx].sellingPrice = parseFloat(e.target.value) || 0;
                            setProdForm({ ...prodForm, batches: copy });
                          }} style={{ padding: '4px 6px' }} />
                        </td>
                        <td>
                          <button type="button" className="btn--icon" onClick={() => {
                            const copy = (prodForm.batches || []).filter((_, i) => i !== bIdx);
                            const totalStock = copy.reduce((sum, item) => sum + (parseInt(item.stock) || 0), 0);
                            setProdForm({ ...prodForm, batches: copy, stock: totalStock });
                          }}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="btn btn--sm" style={{ marginTop: '8px' }} onClick={() => {
                  const copy = [...(prodForm.batches || [])];
                  copy.push({ batchNumber: '', mfgDate: '', expiryDate: '', stock: 0, purchasePrice: prodForm.purchasePrice || 0, sellingPrice: prodForm.price || 0 });
                  setProdForm({ ...prodForm, batches: copy });
                }}><i className="fas fa-plus"></i> Add Batch Row</button>
              </div>
            )}

            <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginTop: '16px', marginBottom: '12px', color: 'var(--accent)' }}>Pricing & Taxes</h4>
            <div className="form-row form-row-3">
              <div className="fg"><label>Purchase Price (Cost)</label>
                <input type="number" step="any" className="fi" value={prodForm.purchasePrice || 0} onChange={(e) => setProdForm({ ...prodForm, purchasePrice: e.target.value })} required />
              </div>
              <div className="fg"><label>Selling Price (MRP)</label>
                <input type="number" step="any" className="fi" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} required />
              </div>
              <div className="fg"><label>Wholesale Price</label>
                <input type="number" step="any" className="fi" value={prodForm.wholesalePrice || 0} onChange={(e) => setProdForm({ ...prodForm, wholesalePrice: e.target.value })} />
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
                  <span>Tax Inclusive Pricing</span>
                </label>
              </div>
              <div className="fg"><label>HSN / SAC Code</label>
                <input className="fi" placeholder="e.g. 8471" value={prodForm.hsnSac || ''} onChange={(e) => setProdForm({ ...prodForm, hsnSac: e.target.value })} />
              </div>
            </div>

            <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginTop: '16px', marginBottom: '12px', color: 'var(--accent)' }}>Inventory & Warehousing</h4>
            <div className="form-row form-row-3">
              <div className="fg"><label>Stock Quantity</label>
                <input 
                  type="number" 
                  className="fi" 
                  value={prodForm.stock} 
                  onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} 
                  required 
                  disabled={prodForm.hasSerialTracking || prodForm.isBatchTracked} 
                  placeholder={prodForm.hasSerialTracking ? "Computed from serials" : ""}
                />
                {(prodForm.hasSerialTracking || prodForm.isBatchTracked) && (
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginTop: '2px' }}>
                    Calculated from {prodForm.hasSerialTracking ? 'serial numbers' : 'batches'}.
                  </span>
                )}
              </div>
              <div className="fg"><label>Low Stock Alert Level</label>
                <input type="number" className="fi" value={prodForm.lowStockLevel || 5} onChange={(e) => setProdForm({ ...prodForm, lowStockLevel: e.target.value })} required />
              </div>
              <div className="fg"><label>Expiry Date</label>
                <input type="date" className="fi" value={prodForm.expiryDate || ''} onChange={(e) => setProdForm({ ...prodForm, expiryDate: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Warehouse / Godown Name</label>
                <select className="fi" value={prodForm.godownName || 'Main Warehouse'} onChange={(e) => setProdForm({ ...prodForm, godownName: e.target.value })}>
                  {['Main Warehouse', ...(dbData.settings?.branches || []).map(b => b.name)].map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="fg"><label>Rack / Shelf Location</label>
                <input className="fi" placeholder="e.g. Row 3, Shelf B" value={prodForm.rackLocation || ''} onChange={(e) => setProdForm({ ...prodForm, rackLocation: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" className="btn" onClick={() => { setShowProductModal(false); setEditingProduct(null); resetProdForm(); }}>Cancel</button>
              <button type="submit" className="btn btn--primary">{editingProduct ? 'Update Product Parameters' : 'Save Product'}</button>
            </div>
          </form>
        </div>
      )}

      {showPartyModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '600px' }}>
          <div className="modal__top">
            <h3>{editingParty ? 'Edit Party Details' : 'Add New Party'}</h3>
            <button className="btn--icon" onClick={() => { setShowPartyModal(false); setEditingParty(null); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          
          <div className="modal-tabs" style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '15px' }}>
            <div className={`tab-item ${partyModalTab === 'basic' ? 'active' : ''}`} onClick={() => setPartyModalTab('basic')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: partyModalTab === 'basic' ? '2px solid var(--primary)' : 'none', fontWeight: partyModalTab === 'basic' ? 600 : 400 }}>Basic Info</div>
            <div className={`tab-item ${partyModalTab === 'billing' ? 'active' : ''}`} onClick={() => setPartyModalTab('billing')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: partyModalTab === 'billing' ? '2px solid var(--primary)' : 'none', fontWeight: partyModalTab === 'billing' ? 600 : 400 }}>Billing & Tax</div>
            <div className={`tab-item ${partyModalTab === 'credit' ? 'active' : ''}`} onClick={() => setPartyModalTab('credit')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: partyModalTab === 'credit' ? '2px solid var(--primary)' : 'none', fontWeight: partyModalTab === 'credit' ? 600 : 400 }}>Credit & Bank</div>
          </div>

          <form onSubmit={handlePartySubmit}>
            {partyModalTab === 'basic' && (
              <>
                <div className="form-row">
                  <div className="fg"><label>Party Name <span style={{color: 'red'}}>*</span></label>
                    <input className="fi" value={partyForm.name} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} required />
                  </div>
                  <div className="fg"><label>Type</label>
                    <select className="fi" value={partyForm.type} onChange={(e) => setPartyForm({ ...partyForm, type: e.target.value })}>
                      <option>Customer</option>
                      <option>Supplier</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Phone <span style={{color: 'red'}}>*</span></label>
                    <input type="tel" className="fi" value={partyForm.phone} onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })} required />
                  </div>
                  <div className="fg"><label>WhatsApp Number</label>
                    <input type="tel" className="fi" value={partyForm.whatsappNumber} onChange={(e) => setPartyForm({ ...partyForm, whatsappNumber: e.target.value })} placeholder="Same as phone if empty" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Email Address</label>
                    <input type="email" className="fi" value={partyForm.email} onChange={(e) => setPartyForm({ ...partyForm, email: e.target.value })} />
                  </div>
                  {partyForm.type === 'Customer' && (
                    <div className="fg"><label>Customer Group</label>
                      <select className="fi" value={partyForm.customerGroup} onChange={(e) => setPartyForm({ ...partyForm, customerGroup: e.target.value })}>
                        <option>Retail</option>
                        <option>Wholesale</option>
                        <option>VIP</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {partyModalTab === 'billing' && (
              <>
                <div className="fg"><label>Billing Address</label>
                  <textarea className="fi" rows="2" value={partyForm.billingAddress} onChange={(e) => setPartyForm({ ...partyForm, billingAddress: e.target.value })}></textarea>
                </div>
                <div className="fg"><label>Shipping Address</label>
                  <textarea className="fi" rows="2" value={partyForm.shippingAddress} onChange={(e) => setPartyForm({ ...partyForm, shippingAddress: e.target.value })} placeholder="Leave empty if same as billing"></textarea>
                </div>
                <div className="form-row">
                  <div className="fg"><label>State (Place of Supply)</label>
                    <select className="fi" value={partyForm.state || 'Karnataka'} onChange={(e) => setPartyForm({ ...partyForm, state: e.target.value })}>
                      {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>GSTIN</label>
                    <input className="fi" value={partyForm.gstin} onChange={(e) => setPartyForm({ ...partyForm, gstin: e.target.value.toUpperCase() })} placeholder="e.g. 29ABCDE1234F1Z5" maxLength="15" />
                  </div>
                  <div className="fg"><label>PAN Number</label>
                    <input className="fi" value={partyForm.pan} onChange={(e) => setPartyForm({ ...partyForm, pan: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" maxLength="10" />
                  </div>
                </div>
              </>
            )}

            {partyModalTab === 'credit' && (
              <>
                <div className="form-row">
                  <div className="fg"><label>Opening Balance ({getCurrencySymbol()})</label>
                    <input type="number" className="fi" value={partyForm.openingBalance} onChange={(e) => setPartyForm({ ...partyForm, openingBalance: e.target.value })} placeholder="Positive = Receivable, Negative = Payable" />
                  </div>
                  <div className="fg"><label>Credit Limit ({getCurrencySymbol()})</label>
                    <input type="number" className="fi" value={partyForm.creditLimit} onChange={(e) => setPartyForm({ ...partyForm, creditLimit: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Payment Terms</label>
                    <select className="fi" value={partyForm.paymentTerms} onChange={(e) => setPartyForm({ ...partyForm, paymentTerms: e.target.value })}>
                      <option>Due on Receipt</option>
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 45</option>
                      <option>Net 60</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>
                <div className="fg"><label>Bank Details / UPI</label>
                  <textarea className="fi" rows="2" value={partyForm.bankDetails} onChange={(e) => setPartyForm({ ...partyForm, bankDetails: e.target.value })} placeholder="Account no, IFSC, UPI ID, etc."></textarea>
                </div>
                <div className="fg"><label>Notes</label>
                  <textarea className="fi" rows="2" value={partyForm.notes} onChange={(e) => setPartyForm({ ...partyForm, notes: e.target.value })} placeholder="Any internal notes..."></textarea>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => { setShowPartyModal(false); setEditingParty(null); }}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> {editingParty ? 'Update Party' : 'Save Party'}</button>
            </div>
          </form>
        </div>
      )}

      {showExpenseModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
          <div className="modal__top">
            <h3>{editingExpenseId !== null ? 'Edit Expense' : 'Record New Expense'}</h3>
            <button className="btn--icon" onClick={() => { setShowExpenseModal(false); setEditingExpenseId(null); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleExpenseSubmit}>
            <div className="form-row">
              <div className="fg"><label>Date <span style={{color: 'red'}}>*</span></label>
                <input type="date" className="fi" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
              </div>
              <div className="fg"><label>Category <span style={{color: 'red'}}>*</span></label>
                <select className="fi" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                  <option>Rent</option>
                  <option>Electricity</option>
                  <option>Staff salary</option>
                  <option>Transport</option>
                  <option>Marketing</option>
                  <option>Maintenance</option>
                  <option>Office supplies</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                <input type="number" className="fi" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required min="1" />
              </div>
              <div className="fg"><label>Payment Mode</label>
                <select className="fi" value={expenseForm.paymentMode} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                </select>
              </div>
            </div>
            <div className="fg"><label>Description / Notes</label>
              <textarea className="fi" rows="2" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="What was this expense for?"></textarea>
            </div>
            
            <div className="fg" style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                <input 
                  type="checkbox" 
                  checked={expenseForm.isRecurringTemplate || false} 
                  onChange={(e) => setExpenseForm({ 
                    ...expenseForm, 
                    isRecurringTemplate: e.target.checked,
                    frequency: e.target.checked ? (expenseForm.frequency || 'Monthly') : '',
                    nextOccurrenceDate: e.target.checked ? (expenseForm.nextOccurrenceDate || expenseForm.date) : '',
                    isActive: e.target.checked ? (expenseForm.isActive !== undefined ? expenseForm.isActive : true) : undefined
                  })} 
                />
                <span>Set as Recurring Expense Schedule</span>
              </label>
            </div>
            
            {expenseForm.isRecurringTemplate && (
              <div className="form-row" style={{ marginTop: '10px', background: 'var(--bg-2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div className="fg">
                  <label>Recurrence Frequency <span style={{color: 'red'}}>*</span></label>
                  <select 
                    className="fi" 
                    value={expenseForm.frequency || 'Monthly'} 
                    onChange={(e) => setExpenseForm({ ...expenseForm, frequency: e.target.value })}
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Next Occurrence Date <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="date" 
                    className="fi" 
                    value={expenseForm.nextOccurrenceDate || expenseForm.date} 
                    onChange={(e) => setExpenseForm({ ...expenseForm, nextOccurrenceDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>
            )}

            <div className="fg" style={{ marginTop: '12px' }}>
              <label>Attach Receipt / Bill (Max 2MB)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input type="file" className="fi" accept="image/*,application/pdf" onChange={handleReceiptUpload} style={{ padding: '4px' }} />
                {expenseForm.receipt && (
                  <button type="button" className="btn btn--danger btn--sm" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setExpenseForm(prev => ({ ...prev, receipt: '' }))}>
                    <i className="fas fa-trash"></i> Remove
                  </button>
                )}
              </div>
              {expenseForm.receipt && expenseForm.receipt.startsWith('data:image/') && (
                <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                  <img src={expenseForm.receipt} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} alt="Receipt Preview" />
                </div>
              )}
              {expenseForm.receipt && expenseForm.receipt.startsWith('data:application/pdf') && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-3)', padding: '6px 10px', background: 'var(--bg-2)', borderRadius: '4px', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-file-pdf" style={{ color: 'var(--red)', fontSize: '16px' }}></i>
                  <span>Attached PDF Document</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => { setShowExpenseModal(false); setEditingExpenseId(null); }}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> {editingExpenseId !== null ? 'Update Expense' : 'Save Expense'}</button>
            </div>
          </form>
        </div>
      )}

      {activeReceipt && (
        <div className="modal" style={{ display: 'block', zIndex: 1100, maxWidth: '650px', width: '90%' }}>
          <div className="modal__top" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-receipt" style={{ color: 'var(--blue)' }}></i> Receipt Attachment Viewer
            </h3>
            <button className="btn--icon" onClick={() => setActiveReceipt(null)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-1)', minHeight: '300px' }}>
            {activeReceipt.startsWith('data:image/') ? (
              <img src={activeReceipt} style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} alt="Receipt Bill Attachment" />
            ) : activeReceipt.startsWith('data:application/pdf') ? (
              <embed src={activeReceipt} type="application/pdf" width="100%" height="480px" style={{ borderRadius: '6px', border: '1px solid var(--border)' }} />
            ) : (
              <div style={{ color: 'var(--text-3)' }}>Unsupported file type or invalid data url format.</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
            <a href={activeReceipt} download="receipt_attachment" className="btn btn--outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-download"></i> Download Receipt
            </a>
            <button className="btn btn--primary" onClick={() => setActiveReceipt(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Invoice Details view modal */}
      {activeInvoice && (
        <div className="modal invoice-modal" style={{ display: 'block', zIndex: 1000, maxWidth: '640px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #cbd5e1', paddingTop: '12px', marginTop: '12px' }}>
              <div>
                {(activeInvoice.mode === 'UPI' || (activeInvoice.balanceDue !== undefined ? activeInvoice.balanceDue > 0 : activeInvoice.status !== 'Paid')) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent(`upi://pay?pa=${dbData.settings?.upiId || 'merchant@upi'}&pn=${encodeURIComponent(dbData.settings?.businessName || 'Merchant')}&am=${activeInvoice.balanceDue !== undefined ? Math.round(activeInvoice.balanceDue) : Math.round(activeInvoice.amount)}&cu=INR`)}`}
                      alt="UPI QR Code" 
                      style={{ width: '85px', height: '85px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ fontSize: '11px', color: '#475569', textAlign: 'left' }}>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>Scan to Pay via UPI</strong>
                      <span style={{ fontSize: '10px' }}>UPI ID: {dbData.settings?.upiId || 'merchant@upi'}</span>
                      {activeInvoice.balanceDue !== undefined && activeInvoice.balanceDue > 0 && (
                        <span style={{ display: 'block', marginTop: '2px', color: '#ef4444', fontWeight: 'bold' }}>
                          Due: {fmt(activeInvoice.balanceDue)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button className="btn" onClick={() => setActiveInvoice(null)}>Close</button>
            <button className="btn btn--primary" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && adjustmentProduct && (
        <div className="modal" style={{ display: 'block', zIndex: 1000 }}>
          <div className="modal__top">
            <h3>Stock Adjustment</h3>
            <button className="btn--icon" onClick={() => { setShowAdjustmentModal(false); setSelectedAdjustSerials([]); setAdjustSerialsText(''); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Product:</strong> {adjustmentProduct.name} (Current Stock: {adjustmentProduct.stock})
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (viewOnly) return alert('⛔ View-Only Mode');
            
            let sList = null;
            if (adjustmentProduct.hasSerialTracking) {
              if (adjustQty > 0) {
                sList = adjustSerialsText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                if (sList.length !== adjustQty) {
                  return alert(`Please enter exactly ${adjustQty} serial numbers (currently entered: ${sList.length})`);
                }
              } else if (adjustQty < 0) {
                const requiredCount = Math.abs(adjustQty);
                if (selectedAdjustSerials.length !== requiredCount) {
                  return alert(`Please select exactly ${requiredCount} serial numbers (currently selected: ${selectedAdjustSerials.length})`);
                }
                sList = selectedAdjustSerials;
              }
            }
            
            const pid = adjustmentProduct.id || adjustmentProduct._id;
            try {
              const res = await fetch(`/api/products/${encodeURIComponent(pid)}/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  username: user.username, 
                  qty: adjustQty, 
                  reason: adjustReason,
                  serialNumbers: sList
                })
              });
              if (res.ok) {
                alert('Stock adjusted successfully');
                loadDB();
                setShowAdjustmentModal(false);
                setSelectedAdjustSerials([]);
                setAdjustSerialsText('');
              } else alert('Failed to adjust stock');
            } catch { alert('Network error'); }
          }}>
            <div className="fg"><label>Quantity Change (use negative to decrease)</label>
              <input type="number" className="fi" value={adjustQty} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} required />
            </div>
            
            {adjustmentProduct.hasSerialTracking && adjustQty > 0 && (
              <div className="fg" style={{ marginTop: 8 }}>
                <label>Enter New Serial Numbers (comma or line separated)</label>
                <textarea
                  className="fi"
                  rows={3}
                  placeholder="e.g. SN-A1, SN-A2"
                  value={adjustSerialsText}
                  onChange={(e) => setAdjustSerialsText(e.target.value)}
                  required
                />
              </div>
            )}

            {adjustmentProduct.hasSerialTracking && adjustQty < 0 && (
              <div className="fg" style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 600 }}>Select {Math.abs(adjustQty)} Serial Numbers to Remove</label>
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--border)', padding: 6, borderRadius: 6, background: 'var(--bg-input)' }}>
                  {(adjustmentProduct.serialNumbers || []).map(sn => (
                    <label key={sn} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedAdjustSerials.includes(sn)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAdjustSerials([...selectedAdjustSerials, sn]);
                          } else {
                            setSelectedAdjustSerials(selectedAdjustSerials.filter(x => x !== sn));
                          }
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{sn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="fg"><label>Reason</label>
              <select className="fi" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
                <option value="audit">Inventory Audit Correction</option>
                <option value="damaged">Damaged / Expired Goods</option>
                <option value="returned">Customer Return</option>
                <option value="theft">Lost / Theft</option>
                <option value="other">Other Reason</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn" onClick={() => { setShowAdjustmentModal(false); setSelectedAdjustSerials([]); setAdjustSerialsText(''); }}>Cancel</button>
              <button type="submit" className="btn btn--primary">Adjust Stock</button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && transferProduct && (
        <div className="modal" style={{ display: 'block', zIndex: 1000 }}>
          <div className="modal__top">
            <h3>Stock Transfer</h3>
            <button className="btn--icon" onClick={() => { setShowTransferModal(false); setSelectedTransferSerials([]); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Product:</strong> {transferProduct.name} (Source Stock: {transferProduct.stock} at {transferProduct.godownName || 'Main Warehouse'})
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (viewOnly) return alert('⛔ View-Only Mode');
            if (transferProduct.hasSerialTracking && selectedTransferSerials.length === 0) {
              return alert('Please select at least one serial number to transfer');
            }
            const pid = transferProduct.id || transferProduct._id;
            try {
              const res = await fetch(`/api/products/${encodeURIComponent(pid)}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  username: user.username, 
                  qty: transferProduct.hasSerialTracking ? selectedTransferSerials.length : transferQty, 
                  fromBranch: transferProduct.godownName || 'Main Warehouse', 
                  toBranch: transferTargetBranch,
                  serialNumbers: transferProduct.hasSerialTracking ? selectedTransferSerials : null
                })
              });
              if (res.ok) {
                alert('Stock transferred successfully');
                loadDB();
                setShowTransferModal(false);
                setSelectedTransferSerials([]);
              } else alert('Failed to transfer stock');
            } catch { alert('Network error'); }
          }}>
            {transferProduct.hasSerialTracking ? (
              <div className="fg" style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Select Serial Numbers to Transfer ({selectedTransferSerials.length})</label>
                <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8, background: 'var(--bg-input)' }}>
                  {(transferProduct.serialNumbers || []).length === 0 ? (
                    <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No serial numbers available.</div>
                  ) : (
                    (transferProduct.serialNumbers || []).map(sn => (
                      <label key={sn} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
                        <input 
                          type="checkbox" 
                          checked={selectedTransferSerials.includes(sn)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransferSerials([...selectedTransferSerials, sn]);
                            } else {
                              setSelectedTransferSerials(selectedTransferSerials.filter(x => x !== sn));
                            }
                          }} 
                        />
                        <span>{sn}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="fg"><label>Transfer Quantity</label>
                <input type="number" min="1" max={transferProduct.stock} className="fi" value={transferQty} onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)} required />
              </div>
            )}
            <div className="fg"><label>Target Location / Godown</label>
              <select className="fi" value={transferTargetBranch} onChange={(e) => setTransferTargetBranch(e.target.value)} required>
                <option value="">Select location...</option>
                {['Main Warehouse', ...(dbData.settings?.branches || []).map(b => b.name)].filter(l => l !== (transferProduct.godownName || 'Main Warehouse')).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn" onClick={() => { setShowTransferModal(false); setSelectedTransferSerials([]); }}>Cancel</button>
              <button type="submit" className="btn btn--primary">Transfer Stock</button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Audit Modal */}
      {showAuditModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '750px', width: '90%' }}>
          <div className="modal__top">
            <h3>Physical Stock Audit</h3>
            <button className="btn--icon" onClick={() => setShowAuditModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: 12 }}>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 12 }}>Enter the actual physical count for each item to reconcile discrepancies.</p>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>System Stock</th>
                  <th style={{ width: 140 }}>Physical Count</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {dbData.products.filter(p => p.active !== false).flatMap(p => {
                  if (Array.isArray(p.batches) && p.batches.length > 0) {
                    return p.batches.map(b => {
                      const key = `${p.sku}::${b.batchNumber}`;
                      const physical = physicalCounts[key] !== undefined ? physicalCounts[key] : b.stock;
                      const diff = physical - b.stock;
                      return {
                        _id: p._id,
                        id: p.id,
                        sku: p.sku,
                        name: `${p.name} (Batch: ${b.batchNumber})`,
                        batchNumber: b.batchNumber,
                        systemStock: b.stock,
                        physical,
                        diff,
                        key
                      };
                    });
                  }
                  
                  const physical = physicalCounts[p.sku] !== undefined ? physicalCounts[p.sku] : p.stock;
                  const diff = physical - p.stock;
                  return [{
                    _id: p._id,
                    id: p.id,
                    sku: p.sku,
                    name: p.name,
                    batchNumber: '',
                    systemStock: p.stock,
                    physical,
                    diff,
                    key: p.sku
                  }];
                }).map((item, idx) => {
                  const prodObj = dbData.products.find(p => p.sku === item.sku);
                  const isSerial = prodObj?.hasSerialTracking;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>{item.systemStock}</td>
                      <td>
                        {isSerial ? (
                          <textarea
                            className="fi"
                            style={{ padding: '4px 6px', height: 'auto', fontSize: 11, minWidth: 120 }}
                            rows={2}
                            placeholder="Type serials"
                            value={(physicalSerials[item.sku] !== undefined ? physicalSerials[item.sku] : (prodObj.serialNumbers || [])).join(', ')}
                            onChange={(e) => {
                              const list = e.target.value.split(/[\n,]+/).map(x => x.trim()).filter(Boolean);
                              setPhysicalSerials({ ...physicalSerials, [item.sku]: list });
                              setPhysicalCounts({ ...physicalCounts, [item.sku]: list.length });
                            }}
                          />
                        ) : (
                          <input
                            type="number"
                            className="fi"
                            style={{ padding: '4px 8px', height: 'auto' }}
                            value={physicalCounts[item.key] ?? ''}
                            placeholder={item.systemStock}
                            onChange={(e) => {
                              setPhysicalCounts({ ...physicalCounts, [item.key]: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 });
                            }}
                          />
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: item.diff > 0 ? 'var(--green)' : item.diff < 0 ? 'var(--red)' : 'inherit' }}>
                        {item.diff > 0 ? `+${item.diff}` : item.diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <button className="btn" onClick={() => setShowAuditModal(false)}>Close</button>
            <button className="btn btn--primary" onClick={async () => {
              if (viewOnly) return alert('⛔ View-Only Mode');
              try {
                let count = 0;
                const adjustments = [];
                dbData.products.filter(p => p.active !== false).forEach(p => {
                  if (p.hasSerialTracking) {
                    const systemSerials = p.serialNumbers || [];
                    const newSerials = physicalSerials[p.sku];
                    if (newSerials !== undefined) {
                      const qty = newSerials.length - systemSerials.length;
                      if (qty > 0) {
                        const addedSerials = newSerials.filter(sn => !systemSerials.includes(sn));
                        adjustments.push({ pid: p.id || p._id, qty, batchNumber: '', serialNumbers: addedSerials });
                      } else if (qty < 0) {
                        const removedSerials = systemSerials.filter(sn => !newSerials.includes(sn));
                        adjustments.push({ pid: p.id || p._id, qty, batchNumber: '', serialNumbers: removedSerials });
                      }
                    }
                  } else if (Array.isArray(p.batches) && p.batches.length > 0) {
                    p.batches.forEach(b => {
                      const key = `${p.sku}::${b.batchNumber}`;
                      const physical = physicalCounts[key];
                      if (physical !== undefined && physical !== b.stock) {
                        adjustments.push({ pid: p.id || p._id, qty: physical - b.stock, batchNumber: b.batchNumber });
                      }
                    });
                  } else {
                    const physical = physicalCounts[p.sku];
                    if (physical !== undefined && physical !== p.stock) {
                      adjustments.push({ pid: p.id || p._id, qty: physical - p.stock, batchNumber: '' });
                    }
                  }
                });

                for (const adj of adjustments) {
                  await fetch(`/api/products/${encodeURIComponent(adj.pid)}/adjust`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      username: user.username, 
                      qty: adj.qty, 
                      batchNumber: adj.batchNumber, 
                      reason: 'Physical stock reconciliation audit',
                      serialNumbers: adj.serialNumbers || null
                    })
                  });
                  count++;
                }
                
                alert(`Successfully reconciled ${count} stock levels.`);
                loadDB();
                setShowAuditModal(false);
              } catch (e) { alert('Error during reconciliation'); }
            }}><i className="fas fa-check-double"></i> Save Reconciliation</button>
          </div>
        </div>
      )}

      {/* Barcode & QR Modal */}
      {showBarcodeModal && barcodeProduct && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: 360, textAlign: 'center' }}>
          <div className="modal__top">
            <h3>Visual Barcode & QR</h3>
            <button className="btn--icon" onClick={() => setShowBarcodeModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, color: '#000', margin: '12px 0' }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>{barcodeProduct.name}</h4>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>SKU: {barcodeProduct.sku}</p>

            {/* Real Barcode (bwip-js) */}
            <div style={{ margin: '0 auto 20px', width: 200 }}>
              <img src={`/api/admin/barcodes/render?code=${encodeURIComponent(barcodeProduct.barcode || barcodeProduct.sku || 'N/A')}&type=barcode&includetext=false`} style={{ maxHeight: '60px', maxWidth: '200px' }} alt="barcode" />
              <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4, letterSpacing: 2 }}>
                {barcodeProduct.barcode || barcodeProduct.sku || 'N/A'}
              </div>
            </div>

            {/* Real QR Code */}
            <div style={{ display: 'inline-block', border: '12px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#fff' }}>
              <QRCode value={barcodeProduct.barcode || barcodeProduct.sku || 'N/A'} size={120} />
            </div>
            <div style={{ fontSize: 11, color: '#777', marginTop: 12 }}>Scan to view product info</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn" onClick={() => setShowBarcodeModal(false)}>Close</button>
            <button className="btn btn--primary" onClick={async () => {
              let base64Src = '';
              try {
                const url = `/api/admin/barcodes/render?code=${encodeURIComponent(barcodeProduct.barcode || barcodeProduct.sku)}&type=barcode&includetext=false`;
                const res = await fetch(url);
                if (res.ok) {
                  const blob = await res.blob();
                  base64Src = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                  });
                }
              } catch (e) {
                console.error('Failed to pre-fetch image for printing', e);
              }
              const html = `
                <!doctype html>
                <html>
                <head>
                  <title>Print Label - ${barcodeProduct.name}</title>
                  <style>
                    body { font-family: sans-serif; margin: 0; padding: 20px; text-align: center; }
                    .label { 
                      width: 260px; 
                      border: 1px solid #000; 
                      padding: 16px; 
                      margin: 0 auto; 
                      background: #fff;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                    }
                    .title { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
                    .img { max-width: 100%; height: 70px; object-fit: contain; }
                    .code { font-family: monospace; font-size: 11px; margin-top: 6px; }
                    .price { font-size: 12px; font-weight: bold; margin-top: 6px; }
                  </style>
                </head>
                <body>
                  <div class="label">
                    <div class="title">${barcodeProduct.name}</div>
                    <img class="img" src="${base64Src}" />
                    <div class="code">${barcodeProduct.barcode || barcodeProduct.sku}</div>
                    <div class="price">${getCurrencySymbol()}${barcodeProduct.price}</div>
                  </div>
                  <script>
                    window.onload = function() {
                      setTimeout(function() { window.print(); }, 300);
                    }
                  </script>
                </body>
                </html>
              `;
              const w = window.open('', '_blank');
              w.document.write(html);
              w.document.close();
            }}><i className="fas fa-print"></i> Print Label</button>
          </div>
        </div>
      )}

      {showCheckoutModal && checkoutInvoice && (() => {
        const remainingDue = (parseFloat(checkoutInvoice.amount) || 0) - (parseFloat(checkoutInvoice.paymentReceived) || 0);

        const handleCheckoutSubmit = (e) => {
          e.preventDefault();
          if (viewOnly) return alert('⛔ View-Only Mode');

          const pAmt = remainingDue;
          
          const updatedSales = dbData.sales.map(s => {
            if (s.id === checkoutInvoice.id) {
              const prevRec = parseFloat(s.paymentReceived) || 0;
              return {
                ...s,
                paymentReceived: prevRec + pAmt,
                status: 'Paid'
              };
            }
            return s;
          });

          const matchedParty = dbData.parties.find(
            p => p.name.toLowerCase() === checkoutInvoice.customer.toLowerCase()
          );

          let updatedParties = [...dbData.parties];
          if (matchedParty) {
            const pIdx = dbData.parties.findIndex(p => p.id === matchedParty.id);
            if (pIdx !== -1) {
              const newBalance = (parseFloat(updatedParties[pIdx].balance) || 0) + pAmt;
              updatedParties[pIdx] = {
                ...updatedParties[pIdx],
                balance: newBalance,
                lastTxn: new Date().toISOString().substring(0, 10)
              };
            }
          }

          const nextTxnId = Math.max(0, ...dbData.transactions.map(t => parseInt(t.id.replace('TXN-', '')) || 0)) + 1;
          const newTxnId = `TXN-${nextTxnId}`;
          const txn = {
            id: newTxnId,
            date: new Date().toISOString().substring(0, 10),
            type: 'Payment Receive',
            party: checkoutInvoice.customer,
            partyId: matchedParty ? matchedParty.id : '',
            debitAccount: 'Bank/UPI Account',
            creditAccount: 'Accounts Receivable (Asset)',
            debit: pAmt,
            credit: 0,
            mode: selectedGateway === 'stripe' ? 'Credit card / Debit card' : 'UPI / QR code',
            referenceNo: `ONLINE-${selectedGateway.toUpperCase()}-${Date.now().toString().slice(-6)}`,
            balance: matchedParty ? (matchedParty.balance + pAmt) : 0
          };

          // Trigger simulator states
          setSimulatedCheckoutState('processing');
          setTimeout(() => {
            setSimulatedCheckoutState('success');
            saveDB({
              ...dbData,
              sales: updatedSales,
              parties: updatedParties,
              transactions: [...dbData.transactions, txn]
            });
            setTimeout(() => {
              setSimulatedCheckoutState('idle');
              setShowCheckoutModal(false);
              setCheckoutInvoice(null);
            }, 2500);
          }, 2000);
        };

        const upiId = dbData.settings?.upiId || 'vyapar@ybl';
        const bizName = dbData.settings?.bizName || 'Vyapar Store';
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(bizName)}&am=${remainingDue.toFixed(2)}&cu=INR&tn=${encodeURIComponent(checkoutInvoice.id)}`;

        return (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal" style={{ display: 'block', maxWidth: '420px', width: '100%', margin: '0 20px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: 'none', background: '#ffffff' }}>
              
              {/* Header */}
              {selectedGateway === 'stripe' ? (
                <div style={{ background: '#635bff', padding: '20px', color: '#fff', textAlign: 'center', position: 'relative' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px' }}>
                    <i className="fab fa-stripe" style={{ fontSize: '36px' }}></i>
                  </h3>
                  <button className="btn--icon" onClick={() => { setSimulatedCheckoutState('idle'); setShowCheckoutModal(false); }} style={{ position: 'absolute', top: '15px', right: '15px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <i className="fas fa-xmark" style={{ fontSize: '18px' }}></i>
                  </button>
                </div>
              ) : (
                <div style={{ background: '#0c223c', padding: '20px', color: '#fff', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#3397e2', color: '#fff', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>R</div>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ margin: 0, fontSize: '14px' }}>Vyapar Billing System</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Amount: {fmt(remainingDue)}</p>
                    </div>
                  </div>
                  <button className="btn--icon" onClick={() => { setSimulatedCheckoutState('idle'); setShowCheckoutModal(false); }} style={{ position: 'absolute', top: '18px', right: '15px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <i className="fas fa-xmark" style={{ fontSize: '18px' }}></i>
                  </button>
                </div>
              )}

              {/* Simulated States vs Form */}
              {simulatedCheckoutState === 'processing' && (
                <div style={{ padding: '40px 20px', textAlign: 'center', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#1e293b' }}>
                  <div style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid ' + (selectedGateway === 'stripe' ? '#635bff' : '#3397e2'), borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 'bold' }}>Processing Transaction...</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Securing authorization with banking gateways. Please do not close or reload.</p>
                </div>
              )}

              {simulatedCheckoutState === 'success' && (
                <div style={{ padding: '40px 20px', textAlign: 'center', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#1e293b' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'grid', placeItems: 'center', fontSize: '32px', marginBottom: '20px', boxShadow: '0 0 15px rgba(16,185,129,0.15)' }}>
                    <i className="fas fa-circle-check"></i>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#065f46' }}>Payment Successful!</h4>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#047857' }}>Invoice has been fully settled via {selectedGateway.toUpperCase()}.</p>
                  <div style={{ border: '1px dashed #a7f3d0', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#065f46', fontFamily: 'monospace' }}>
                    REF NO: ONLINE-{selectedGateway.toUpperCase()}-{Date.now().toString().slice(-6)}
                  </div>
                </div>
              )}

              {simulatedCheckoutState === 'idle' && (
                <form onSubmit={handleCheckoutSubmit} style={{ padding: '20px', color: '#1e293b' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Payment For Invoice</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--accent)' }}>{checkoutInvoice.id}</div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Customer: <strong style={{ color: '#1e293b' }}>{checkoutInvoice.customer}</strong></div>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '15px 0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>Amount to Pay:</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--green)' }}>{fmt(remainingDue)}</span>
                  </div>

                  {selectedGateway === 'stripe' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                      <div className="fg">
                        <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569' }}>Card Email</label>
                        <input type="email" className="fi" placeholder="customer@domain.com" required defaultValue="customer@domain.com" style={{ fontSize: '12px', padding: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b' }} />
                      </div>
                      <div className="fg">
                        <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569' }}>Card Details</label>
                        <input className="fi" placeholder="4242 4242 4242 4242" required maxLength={19} defaultValue="4242 4242 4242 4242" style={{ fontSize: '12px', padding: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                          <input className="fi" placeholder="MM / YY" required maxLength={5} style={{ width: '80px', fontSize: '12px', padding: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b' }} defaultValue="12/29" />
                          <input className="fi" placeholder="CVC" required maxLength={3} style={{ width: '80px', fontSize: '12px', padding: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b' }} defaultValue="123" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Instant Settlement UPI QR Code</span>
                        
                        <div style={{ margin: '15px 0', background: '#ffffff', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                          <QRCode value={upiUrl} size={150} fgColor="#0c223c" bgColor="#ffffff" level="H" includeMargin={false} />
                        </div>
                        
                        <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600' }}>VPA: <code>{upiId}</code></div>
                        <p style={{ margin: '6px 0 0 0', fontSize: '10.5px', color: '#64748b', lineHeight: '1.4' }}>Scan from any BHIM, Paytm, PhonePe or GPay application to process instant transaction</p>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center', background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569' }} onClick={() => { setSimulatedCheckoutState('idle'); setShowCheckoutModal(false); }}>Cancel</button>
                    <button type="submit" className="btn btn--primary" style={{ flex: 2, justifyContent: 'center', background: selectedGateway === 'stripe' ? '#635bff' : '#10b981', borderColor: selectedGateway === 'stripe' ? '#635bff' : '#10b981', color: '#fff' }}>
                      <i className="fas fa-lock"></i> {selectedGateway === 'stripe' ? `Settle ${fmt(remainingDue)}` : 'Simulate Payment Approval'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {showPaymentModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
          <div className="modal__top">
            <h3>Record Payment</h3>
            <button className="btn--icon" onClick={() => setShowPaymentModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handlePaymentSubmit}>
            {paymentForm.partyId ? (
              <p style={{ marginBottom: '15px' }}>Recording payment for party: <strong>{paymentForm.partyName}</strong></p>
            ) : (
              <div className="fg" style={{ marginBottom: '15px' }}>
                <label>Select Party <span style={{color: 'red'}}>*</span></label>
                <select 
                  className="fi" 
                  value={paymentForm.partyId || ''} 
                  onChange={(e) => {
                    const pId = e.target.value;
                    const matched = dbData.parties.find(p => p.id === pId);
                    setPaymentForm({ 
                      ...paymentForm, 
                      partyId: pId, 
                      partyName: matched ? matched.name : '' 
                    });
                  }}
                  required
                >
                  <option value="">-- Select Customer / Supplier --</option>
                  {dbData.parties
                    .filter(p => {
                      if (paymentForm.type === 'Receive') {
                        return (p.type || '').toLowerCase() === 'customer';
                      } else {
                        return (p.type || '').toLowerCase() === 'supplier';
                      }
                    })
                    .map((p, idx) => (
                      <option key={idx} value={p.id}>
                        {p.name} - Balance: {fmt(p.balance)}
                      </option>
                    ))
                  }
                </select>
              </div>
            )}
            <div className="form-row">
              <div className="fg"><label>Payment Type</label>
                <select className="fi" value={paymentForm.type} onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}>
                  <option value="Receive">Receive Payment (In)</option>
                  <option value="Pay">Make Payment (Out)</option>
                </select>
              </div>
              <div className="fg"><label>Date <span style={{color: 'red'}}>*</span></label>
                <input type="date" className="fi" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                <input type="number" className="fi" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required min="1" step="0.01" />
              </div>
              <div className="fg"><label>Payment Mode</label>
                <select className="fi" value={paymentForm.mode} onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}>
                  <option>Cash</option>
                  <option>UPI / QR code</option>
                  <option>Credit card / Debit card</option>
                  <option>Cheque</option>
                  <option>Bank transfer / NEFT / RTGS</option>
                  <option>Credit (buy now pay later)</option>
                </select>
              </div>
            </div>
            <div className="fg"><label>Reference No / Notes</label>
              <input type="text" className="fi" value={paymentForm.referenceNo} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })} placeholder="Cheque No, UPI Ref, etc." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> Save Payment</button>
            </div>
          </form>
        </div>
      )}

      {showJournalModal && (() => {
        const amt = parseFloat(journalForm.amount) || 0;
        const validation = (() => {
          if (amt <= 0) return { text: 'Amount must be greater than zero', isValid: false, color: 'var(--red)' };
          if (!journalForm.debitAccount || !journalForm.creditAccount) return { text: 'Please select both Debit and Credit accounts', isValid: false, color: 'var(--red)' };
          if (journalForm.debitAccount === journalForm.creditAccount) return { text: 'Debit and Credit accounts must be different', isValid: false, color: 'var(--red)' };
          return { text: `Balanced: Dr ${fmt(amt)} = Cr ${fmt(amt)}`, isValid: true, color: 'var(--accent)' };
        })();

        return (
          <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
            <div className="modal__top">
              <h3>Create Journal Entry</h3>
              <button className="btn--icon" onClick={() => setShowJournalModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
            </div>
            <form onSubmit={handleJournalSubmit}>
              <div className="form-row">
                <div className="fg"><label>Date <span style={{color: 'red'}}>*</span></label>
                  <input type="date" className="fi" value={journalForm.date} onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })} required />
                </div>
                <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                  <input type="number" className="fi" value={journalForm.amount} onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })} required min="0.01" step="0.01" />
                </div>
              </div>

              <div className="form-row">
                <div className="fg"><label>Debit Account (Dr) <span style={{color: 'red'}}>*</span></label>
                  <select className="fi" value={journalForm.debitAccount} onChange={(e) => setJournalForm({ ...journalForm, debitAccount: e.target.value })} required>
                    <option value="">-- Select Account --</option>
                    {(dbData.accounts || []).map((acc, aIdx) => (
                      <option key={aIdx} value={acc.name}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
                <div className="fg"><label>Credit Account (Cr) <span style={{color: 'red'}}>*</span></label>
                  <select className="fi" value={journalForm.creditAccount} onChange={(e) => setJournalForm({ ...journalForm, creditAccount: e.target.value })} required>
                    <option value="">-- Select Account --</option>
                    {(dbData.accounts || []).map((acc, aIdx) => (
                      <option key={aIdx} value={acc.name}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="fg"><label>Memo / Description</label>
                <input type="text" className="fi" value={journalForm.description} onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })} placeholder="Describe this journal entry..." />
              </div>

              <div style={{ marginTop: '15px', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-card-hover)', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: validation.color }}>
                  {validation.text}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn" onClick={() => setShowJournalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={!validation.isValid}><i className="fas fa-check"></i> Post Journal Entry</button>
              </div>
            </form>
          </div>
        );
      })()}

      {showAccountModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
          <div className="modal__top">
            <h3>{editingAccount ? 'Edit Ledger Account' : 'Add New Ledger Account'}</h3>
            <button className="btn--icon" onClick={() => setShowAccountModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleAccountSubmit}>
            <div className="fg"><label>Account Name <span style={{color: 'red'}}>*</span></label>
              <input type="text" className="fi" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required placeholder="e.g. Office Rent Expense" />
            </div>

            <div className="fg"><label>Account Type</label>
              <select className="fi" value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div className="fg"><label>Opening Balance ({getCurrencySymbol()})</label>
              <input 
                type="number" 
                className="fi" 
                value={accountForm.openingBalance} 
                onChange={(e) => setAccountForm({ ...accountForm, openingBalance: e.target.value })} 
                placeholder="0.00" 
                step="0.01" 
              />
            </div>

            <div className="fg"><label>Description</label>
              <textarea className="fi" value={accountForm.description} onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })} placeholder="Enter account details/memo..." rows="3"></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowAccountModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> {editingAccount ? 'Update Account' : 'Save Account'}</button>
            </div>
          </form>
        </div>
      )}

      {showBankModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
          <div className="modal__top">
            <h3>{editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}</h3>
            <button className="btn--icon" onClick={() => {
              setShowBankModal(false);
              setEditingBank(null);
              setBankForm({ accountName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', openingBalance: 0 });
            }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleBankSubmit}>
            <div className="fg"><label>Account / Ledger Name <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                className="fi" 
                value={bankForm.accountName} 
                onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} 
                required 
                placeholder="e.g. HDFC Bank Main" 
              />
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>This name will match the Chart of Accounts ledger name.</p>
            </div>

            <div className="form-row">
              <div className="fg"><label>Bank Name <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  className="fi" 
                  value={bankForm.bankName} 
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} 
                  required 
                  placeholder="e.g. HDFC Bank" 
                />
              </div>
              <div className="fg"><label>Branch Name</label>
                <input 
                  type="text" 
                  className="fi" 
                  value={bankForm.branchName} 
                  onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })} 
                  placeholder="e.g. Connaught Place" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="fg"><label>Account Number</label>
                <input 
                  type="text" 
                  className="fi" 
                  value={bankForm.accountNumber} 
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} 
                  placeholder="e.g. 501002345678" 
                />
              </div>
              <div className="fg"><label>IFSC Code</label>
                <input 
                  type="text" 
                  className="fi" 
                  value={bankForm.ifscCode} 
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })} 
                  placeholder="e.g. HDFC0000123" 
                />
              </div>
            </div>

            <div className="fg"><label>Opening Balance ({getCurrencySymbol()})</label>
              <input 
                type="number" 
                className="fi" 
                value={bankForm.openingBalance} 
                onChange={(e) => setBankForm({ ...bankForm, openingBalance: e.target.value })} 
                placeholder="0.00" 
                disabled={!!editingBank}
              />
              {editingBank && <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Opening balance cannot be changed on edit.</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => {
                setShowBankModal(false);
                setEditingBank(null);
                setBankForm({ accountName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', openingBalance: 0 });
              }}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> {editingBank ? 'Update Account' : 'Save Account'}</button>
            </div>
          </form>
        </div>
      )}

      {showBankTransferModal && (() => {
        const getBankBalance = (bank) => {
          const isDefaultBank = bank.id === 'bank-1' || bank.accountName === 'Bank Account (Asset)';
          
          const txns = [
            ...dbData.transactions.map(t => ({ ...t, isExpense: false })),
            ...(dbData.expenses || []).map(e => {
              const isCash = (e.paymentMode || '').toLowerCase() === 'cash';
              return {
                id: `EXP-${e.id}`,
                date: e.date,
                type: 'Expense',
                party: e.category,
                debit: 0,
                credit: parseFloat(e.amount) || 0,
                debitAccount: 'Expense Account',
                creditAccount: isCash ? 'Cash Account' : 'Bank Account (Asset)',
                isExpense: true,
                description: e.description
              };
            })
          ].filter(t => {
            const dr = (t.debitAccount || '').toLowerCase();
            const cr = (t.creditAccount || '').toLowerCase();
            const targetName = bank.accountName.toLowerCase();
            
            if (dr === targetName || cr === targetName) return true;
            
            if (isDefaultBank) {
              const isGenericBank = (name) => {
                const n = (name || '').toLowerCase();
                return n === 'bank/upi account' || n === 'bank/upi account (asset)' || n === 'bank account (asset)';
              };
              if (isGenericBank(dr) || isGenericBank(cr)) return true;
            }
            
            return false;
          });

          const targetName = bank.accountName.toLowerCase();
          const isTargetAccount = (acc) => {
            if (!acc) return false;
            const lower = acc.toLowerCase();
            if (lower === targetName) return true;
            if (isDefaultBank) {
              return lower === 'bank/upi account' || lower === 'bank/upi account (asset)' || lower === 'bank account (asset)';
            }
            return false;
          };

          const opBal = parseFloat(bank.openingBalance) || 0;
          
          const netDrCr = txns.reduce((sum, t) => {
            const amount = parseFloat(t.debit || t.credit || t.amount || 0);
            const isDr = isTargetAccount(t.debitAccount);
            return sum + (isDr ? amount : -amount);
          }, 0);

          return opBal + netDrCr;
        };

        return (
          <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
            <div className="modal__top">
              <h3>Record Bank Transfer</h3>
              <button className="btn--icon" onClick={() => setShowBankTransferModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
            </div>
            <form onSubmit={handleBankTransferSubmit}>
              <div className="form-row">
                <div className="fg"><label>Date <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="date" 
                    className="fi" 
                    value={bankTransferForm.date} 
                    onChange={(e) => setBankTransferForm({ ...bankTransferForm, date: e.target.value })} 
                    required 
                  />
                </div>
                <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="number" 
                    className="fi" 
                    value={bankTransferForm.amount} 
                    onChange={(e) => setBankTransferForm({ ...bankTransferForm, amount: e.target.value })} 
                    required 
                    min="0.01" 
                    step="0.01" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="fg"><label>From Account (Source) <span style={{color: 'red'}}>*</span></label>
                  <select 
                    className="fi" 
                    value={bankTransferForm.fromAccount} 
                    onChange={(e) => setBankTransferForm({ ...bankTransferForm, fromAccount: e.target.value })} 
                    required
                  >
                    <option value="">-- Select Bank Account --</option>
                    {(dbData.bankAccounts || []).map((b, bIdx) => (
                      <option key={bIdx} value={b.accountName}>{b.accountName} (Bal: {fmt(getBankBalance(b))})</option>
                    ))}
                  </select>
                </div>
                <div className="fg"><label>To Account (Destination) <span style={{color: 'red'}}>*</span></label>
                  <select 
                    className="fi" 
                    value={bankTransferForm.toAccount} 
                    onChange={(e) => setBankTransferForm({ ...bankTransferForm, toAccount: e.target.value })} 
                    required
                  >
                    <option value="">-- Select Bank Account --</option>
                    {(dbData.bankAccounts || []).map((b, bIdx) => (
                      <option key={bIdx} value={b.accountName}>{b.accountName} (Bal: {fmt(getBankBalance(b))})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="fg"><label>Reference / Cheque / UTR No.</label>
                <input 
                  type="text" 
                  className="fi" 
                  value={bankTransferForm.referenceNo} 
                  onChange={(e) => setBankTransferForm({ ...bankTransferForm, referenceNo: e.target.value })} 
                  placeholder="e.g. UTR123456789" 
                />
              </div>

              <div className="fg"><label>Description / Notes</label>
                <textarea 
                  className="fi" 
                  value={bankTransferForm.description} 
                  onChange={(e) => setBankTransferForm({ ...bankTransferForm, description: e.target.value })} 
                  placeholder="Notes about this bank transfer..." 
                  rows="2"
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn" onClick={() => setShowBankTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> Transfer Funds</button>
              </div>
            </form>
          </div>
        );
      })()}

      {showChequeModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '500px' }}>
          <div className="modal__top">
            <h3>{editingCheque ? 'Edit Cheque Record' : 'Record New Cheque'}</h3>
            <button className="btn--icon" onClick={() => setShowChequeModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleChequeSubmit}>
            <div className="form-row">
              <div className="fg"><label>Cheque Number <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  className="fi" 
                  value={chequeForm.chequeNumber} 
                  onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })} 
                  required 
                  placeholder="e.g. 102938" 
                />
              </div>
              <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="number" 
                  className="fi" 
                  value={chequeForm.amount} 
                  onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })} 
                  required 
                  placeholder="0.00" 
                  step="0.01"
                  min="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="fg"><label>Cheque Type</label>
                <select 
                  className="fi" 
                  value={chequeForm.type} 
                  onChange={(e) => setChequeForm({ ...chequeForm, type: e.target.value })}
                >
                  <option value="Received">Received (Incoming)</option>
                  <option value="Issued">Issued (Outgoing)</option>
                </select>
              </div>
              <div className="fg"><label>Bank Account <span style={{color: 'red'}}>*</span></label>
                <select 
                  className="fi" 
                  value={chequeForm.bankAccountId} 
                  onChange={(e) => setChequeForm({ ...chequeForm, bankAccountId: e.target.value })}
                  required
                >
                  <option value="">-- Select Bank Account --</option>
                  {(dbData.bankAccounts || []).map((b, idx) => (
                    <option key={idx} value={b.accountName}>{b.accountName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="fg"><label>Issue Date <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="date" 
                  className="fi" 
                  value={chequeForm.issueDate} 
                  onChange={(e) => setChequeForm({ ...chequeForm, issueDate: e.target.value })} 
                  required 
                />
              </div>
              <div className="fg"><label>Maturity / Due Date <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="date" 
                  className="fi" 
                  value={chequeForm.dueDate} 
                  onChange={(e) => setChequeForm({ ...chequeForm, dueDate: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div className="fg"><label>Party Name <span style={{color: 'red'}}>*</span></label>
              <select 
                className="fi" 
                value={chequeForm.partyName} 
                onChange={(e) => setChequeForm({ ...chequeForm, partyName: e.target.value })}
                required
              >
                <option value="">-- Select Customer/Supplier --</option>
                {(dbData.parties || []).map((p, idx) => (
                  <option key={idx} value={p.name}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>

            <div className="fg"><label>Notes / Description</label>
              <textarea 
                className="fi" 
                value={chequeForm.notes} 
                onChange={(e) => setChequeForm({ ...chequeForm, notes: e.target.value })} 
                placeholder="Memo details about this cheque..." 
                rows="2"
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowChequeModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> {editingCheque ? 'Update Cheque' : 'Record Cheque'}</button>
            </div>
          </form>
        </div>
      )}

      {showBounceModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '450px' }}>
          <div className="modal__top">
            <h3>Record Cheque Bounce</h3>
            <button className="btn--icon" onClick={() => setShowBounceModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleBounceCheque}>
            <div className="fg"><label>Bounce Date <span style={{color: 'red'}}>*</span></label>
              <input 
                type="date" 
                className="fi" 
                value={bounceForm.date} 
                onChange={(e) => setBounceForm({ ...bounceForm, date: e.target.value })} 
                required 
              />
            </div>
            <div className="fg"><label>Bounce Penalty / Bank Charge ({getCurrencySymbol()})</label>
              <input 
                type="number" 
                className="fi" 
                value={bounceForm.bounceCharge} 
                onChange={(e) => setBounceForm({ ...bounceForm, bounceCharge: e.target.value })} 
                placeholder="0.00" 
                step="0.01"
                min="0"
              />
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>Any penalty fees charged by the bank for processing this bounced cheque.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowBounceModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--red"><i className="fas fa-circle-exclamation"></i> Bounce Cheque</button>
            </div>
          </form>
        </div>
      )}

      {showPettyTopupModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '450px' }}>
          <div className="modal__top">
            <h3>Petty Cash Topup</h3>
            <button className="btn--icon" onClick={() => setShowPettyTopupModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handlePettyTopupSubmit}>
            <div className="form-row">
              <div className="fg"><label>Date <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="date" 
                  className="fi" 
                  value={pettyTopupForm.date} 
                  onChange={(e) => setPettyTopupForm({ ...pettyTopupForm, date: e.target.value })} 
                  required 
                />
              </div>
              <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="number" 
                  className="fi" 
                  value={pettyTopupForm.amount} 
                  onChange={(e) => setPettyTopupForm({ ...pettyTopupForm, amount: e.target.value })} 
                  required 
                  placeholder="0.00" 
                  step="0.01"
                  min="0.01"
                />
              </div>
            </div>

            <div className="fg"><label>Source Bank Account <span style={{color: 'red'}}>*</span></label>
              <select 
                className="fi" 
                value={pettyTopupForm.sourceAccount} 
                onChange={(e) => setPettyTopupForm({ ...pettyTopupForm, sourceAccount: e.target.value })}
                required
              >
                <option value="">-- Select Bank Account --</option>
                {(dbData.bankAccounts || []).map((b, idx) => (
                  <option key={idx} value={b.accountName}>{b.accountName}</option>
                ))}
              </select>
            </div>

            <div className="fg"><label>Description / Notes</label>
              <input 
                type="text" 
                className="fi" 
                value={pettyTopupForm.notes} 
                onChange={(e) => setPettyTopupForm({ ...pettyTopupForm, notes: e.target.value })} 
                placeholder="e.g. Weekly topup for office minor costs" 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowPettyTopupModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> Transfer to Petty Cash</button>
            </div>
          </form>
        </div>
      )}

      {showPettyExpenseModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '450px' }}>
          <div className="modal__top">
            <h3>Log Petty Cash Expense</h3>
            <button className="btn--icon" onClick={() => setShowPettyExpenseModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handlePettyExpenseSubmit}>
            <div className="form-row">
              <div className="fg"><label>Date <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="date" 
                  className="fi" 
                  value={pettyExpenseForm.date} 
                  onChange={(e) => setPettyExpenseForm({ ...pettyExpenseForm, date: e.target.value })} 
                  required 
                />
              </div>
              <div className="fg"><label>Amount ({getCurrencySymbol()}) <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="number" 
                  className="fi" 
                  value={pettyExpenseForm.amount} 
                  onChange={(e) => setPettyExpenseForm({ ...pettyExpenseForm, amount: e.target.value })} 
                  required 
                  placeholder="0.00" 
                  step="0.01"
                  min="0.01"
                />
              </div>
            </div>

            <div className="fg"><label>Expense Category / Details <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                className="fi" 
                value={pettyExpenseForm.category} 
                onChange={(e) => setPettyExpenseForm({ ...pettyExpenseForm, category: e.target.value })} 
                required 
                placeholder="e.g. Refreshments, Office Supplies, Tea/Snacks" 
                list="petty-cats"
              />
              <datalist id="petty-cats">
                <option value="Refreshments" />
                <option value="Office Stationery" />
                <option value="Courier & Postage" />
                <option value="Minor Repairs" />
                <option value="Travel / Taxi Fare" />
                <option value="Cleaning Supplies" />
              </datalist>
            </div>

            <div className="fg"><label>Description / Notes</label>
              <input 
                type="text" 
                className="fi" 
                value={pettyExpenseForm.notes} 
                onChange={(e) => setPettyExpenseForm({ ...pettyExpenseForm, notes: e.target.value })} 
                placeholder="e.g. Bought printer paper and envelopes" 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowPettyExpenseModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> Record Expense</button>
            </div>
          </form>
        </div>
      )}

      {showOfferModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '600px' }}>
          <div className="modal__top">
            <h3>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
            <button className="btn--icon" onClick={() => setShowOfferModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <form onSubmit={handleOfferSubmit}>
            <div className="form-row">
              <div className="fg"><label>Coupon Code <span style={{color: 'red'}}>*</span></label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="text" className="fi" value={offerForm.code} onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })} required placeholder="e.g. SUMMER20" />
                  <button type="button" className="btn" onClick={() => setOfferForm({ ...offerForm, code: 'VYAPAR' + Math.floor(Math.random() * 10000) })}><i className="fas fa-magic"></i></button>
                </div>
              </div>
              <div className="fg"><label>Offer Type</label>
                <select className="fi" value={offerForm.type} onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}>
                  <option>Percentage</option>
                  <option>Flat Discount</option>
                  <option>Buy X Get Y</option>
                  <option>Bundle</option>
                  <option>Seasonal</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="fg"><label>Discount Value ({offerForm.type === 'Percentage' ? '%' : getCurrencySymbol()})</label>
                <input type="number" className="fi" value={offerForm.value} onChange={(e) => setOfferForm({ ...offerForm, value: e.target.value })} min="0" step="0.01" />
              </div>
              <div className="fg"><label>Min Bill Amount ({getCurrencySymbol()})</label>
                <input type="number" className="fi" value={offerForm.minBillAmount} onChange={(e) => setOfferForm({ ...offerForm, minBillAmount: e.target.value })} min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="fg"><label>Start Date</label>
                <input type="date" className="fi" value={offerForm.startDate} onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })} />
              </div>
              <div className="fg"><label>End Date</label>
                <input type="date" className="fi" value={offerForm.endDate} onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="fg"><label>Usage Limit (0 for unlimited)</label>
                <input type="number" className="fi" value={offerForm.usageLimit} onChange={(e) => setOfferForm({ ...offerForm, usageLimit: e.target.value })} min="0" />
              </div>
              <div className="fg"><label>Status</label>
                <select className="fi" value={offerForm.isActive ? 'Active' : 'Inactive'} onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.value === 'Active' })}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" onClick={() => setShowOfferModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> Save Offer</button>
            </div>
          </form>
        </div>
      )}

      {/* Categories & Brands Modal */}
      {showCatBrandModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000 }}>
          <div className="modal__top">
            <h3>Manage Categories & Brands</h3>
            <button className="btn--icon" onClick={() => setShowCatBrandModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Categories */}
            <div>
              <h4>Categories</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 8, border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                {customCats.map(cat => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: 13 }}>
                    <span>{cat}</span>
                    <button className="btn--icon" onClick={() => {
                      const updatedCats = customCats.filter(c => c !== cat);
                      setCustomCats(updatedCats);
                      saveCategoriesAndBrands(updatedCats, customBrands);
                    }}><i className="fas fa-trash" style={{ color: 'var(--red)', fontSize: 11 }}></i></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="fi" style={{ padding: '4px 8px', height: 'auto' }} placeholder="New category..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <button className="btn btn--sm btn--primary" onClick={() => {
                  if(newCatName.trim()) {
                    const updatedCats = [...customCats, newCatName.trim()];
                    setCustomCats(updatedCats);
                    saveCategoriesAndBrands(updatedCats, customBrands);
                    setNewCatName('');
                  }
                }}><i className="fas fa-plus"></i></button>
              </div>
            </div>
            {/* Brands */}
            <div>
              <h4>Brands</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 8, border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                {customBrands.map(brand => (
                  <div key={brand} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: 13 }}>
                    <span>{brand}</span>
                    <button className="btn--icon" onClick={() => {
                      const updatedBrands = customBrands.filter(b => b !== brand);
                      setCustomBrands(updatedBrands);
                      saveCategoriesAndBrands(customCats, updatedBrands);
                    }}><i className="fas fa-trash" style={{ color: 'var(--red)', fontSize: 11 }}></i></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="fi" style={{ padding: '4px 8px', height: 'auto' }} placeholder="New brand..." value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} />
                <button className="btn btn--sm btn--primary" onClick={() => {
                  if(newBrandName.trim()) {
                    const updatedBrands = [...customBrands, newBrandName.trim()];
                    setCustomBrands(updatedBrands);
                    saveCategoriesAndBrands(customCats, updatedBrands);
                    setNewBrandName('');
                  }
                }}><i className="fas fa-plus"></i></button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => setShowCatBrandModal(false)}>Close</button>
          </div>
        </div>
      )}

      <datalist id="products-datalist">
        {dbData.products.filter(p => p.active !== false).map(p => (
          <option key={p.id} value={p.name}>{p.name} (Stock: {p.stock} | Price: {fmt(p.price)})</option>
        ))}
      </datalist>
      <datalist id="categories-list">
        {customCats.map(cat => <option key={cat} value={cat} />)}
      </datalist>
      <datalist id="brands-list">
        {customBrands.map(b => <option key={b} value={b} />)}
      </datalist>
      <datalist id="suppliers-datalist">
        {dbData.parties.filter(p => (p.type || '').toLowerCase() === 'supplier').map(p => (
          <option key={p.id} value={p.name}>{p.name} (Phone: {p.phone || 'N/A'} | Balance: {fmt(p.balance)})</option>
        ))}
      </datalist>
      <datalist id="customers-datalist">
        {dbData.parties.filter(p => (p.type || '').toLowerCase() === 'customer').map(p => (
          <option key={p.id} value={p.name}>{p.name} (Phone: {p.phone || 'N/A'} | Balance: {fmt(p.balance)})</option>
        ))}
      </datalist>

      {/* Sales Serial Selector Modal */}
      {serialSelectRowIdx !== null && (
        <div className="modal" style={{ display: 'block', zIndex: 1100, maxWidth: '400px' }}>
          <div className="modal__top">
            <h3>Select Serial Numbers</h3>
            <button className="btn--icon" onClick={() => setSerialSelectRowIdx(null)}><i className="fas fa-xmark"></i></button>
          </div>
          <div style={{ padding: '12px 0' }}>
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-2)' }}>
              Select the serial numbers being sold for <strong>{saleItems[serialSelectRowIdx]?.name}</strong>:
            </div>
            {(() => {
              const item = saleItems[serialSelectRowIdx];
              if (!item) return null;
              const prod = dbData.products.find(p => p.active !== false && p.name.toLowerCase() === item.name.toLowerCase());
              const availableSerials = prod?.serialNumbers || [];
              if (availableSerials.length === 0) {
                return <p style={{ color: 'var(--red)', fontSize: 13 }}>No serial numbers available in inventory!</p>;
              }
              return (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8, background: 'var(--bg-input)' }}>
                  {availableSerials.map(sn => (
                    <label key={sn} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <input
                        type="checkbox"
                        checked={serialSelectTempList.includes(sn)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSerialSelectTempList([...serialSelectTempList, sn]);
                          } else {
                            setSerialSelectTempList(serialSelectTempList.filter(x => x !== sn));
                          }
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{sn}</span>
                    </label>
                  ))}
                </div>
              );
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn--sm" onClick={() => setSerialSelectRowIdx(null)}>Cancel</button>
            <button type="button" className="btn btn--sm btn--primary" onClick={() => {
              const copy = [...saleItems];
              copy[serialSelectRowIdx].serialNumbers = serialSelectTempList;
              copy[serialSelectRowIdx].qty = serialSelectTempList.length;
              setSaleItems(copy);
              setSerialSelectRowIdx(null);
            }}>Confirm Selection</button>
          </div>
        </div>
      )}

      {/* Multi-Location Stock Matrix Modal */}
      {showMultiLocationModal && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '800px', width: '95%' }}>
          <div className="modal__top">
            <h3>Multi-Location Stock Matrix</h3>
            <button className="btn--icon" onClick={() => setShowMultiLocationModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>
          <div style={{ maxHeight: '65vh', overflowY: 'auto', margin: '12px 0' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  {['Main Warehouse', ...(dbData.settings?.branches || []).map(b => b.name)].map(loc => (
                    <th key={loc} style={{ minWidth: 100 }}>{loc}</th>
                  ))}
                  <th style={{ fontWeight: 700 }}>Total Unified Stock</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const uniqueSKUs = {};
                  dbData.products.filter(p => p.active !== false).forEach(p => {
                    const key = p.sku || p.name;
                    if (!uniqueSKUs[key]) {
                      uniqueSKUs[key] = {
                        name: p.name,
                        sku: p.sku || 'N/A',
                        stocks: {},
                        hasSerialTracking: p.hasSerialTracking || false,
                        serialNumbers: {}
                      };
                    }
                    const gName = p.godownName || 'Main Warehouse';
                    uniqueSKUs[key].stocks[gName] = (uniqueSKUs[key].stocks[gName] || 0) + (p.stock || 0);
                    if (p.hasSerialTracking) {
                      uniqueSKUs[key].serialNumbers[gName] = p.serialNumbers || [];
                    }
                  });

                  const list = Object.values(uniqueSKUs);
                  if (list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={3 + (dbData.settings?.branches || []).length} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                          No products found.
                        </td>
                      </tr>
                    );
                  }

                  const locList = ['Main Warehouse', ...(dbData.settings?.branches || []).map(b => b.name)];

                  return list.map(item => {
                    const unifiedTotal = locList.reduce((sum, loc) => sum + (item.stocks[loc] || 0), 0);
                    return (
                      <tr key={item.sku}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12.5px' }}>{item.sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        {locList.map(loc => {
                          const stockCount = item.stocks[loc] || 0;
                          const serials = item.serialNumbers[loc] || [];
                          return (
                            <td key={loc}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: stockCount > 0 ? 600 : 'normal' }}>{stockCount}</span>
                                {item.hasSerialTracking && serials.length > 0 && (
                                  <span 
                                    style={{ fontSize: 9, color: 'var(--accent)', cursor: 'help', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 100 }}
                                    title={serials.join(', ')}
                                  >
                                    SNs: {serials.slice(0, 2).join(', ')}{serials.length > 2 ? '...' : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{unifiedTotal}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button className="btn" onClick={() => setShowMultiLocationModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showStatementModal && selectedStatementParty && (
        <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal__top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-address-card" style={{ fontSize: '22px', color: 'var(--primary)' }}></i>
              <h3 style={{ margin: 0 }}>{selectedStatementParty.name}'s Profile & Statement</h3>
              <span className={`badge ${selectedStatementParty.type === 'Customer' ? 'badge--green' : 'badge--blue'}`}>{selectedStatementParty.type}</span>
            </div>
            <button className="btn--icon" onClick={() => { setShowStatementModal(false); setSelectedStatementParty(null); }}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
          </div>

          <div className="modal-tabs" style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '15px', paddingBottom: '0' }}>
            <div className={`tab-item ${statementTab === 'overview' ? 'active' : ''}`} onClick={() => setStatementTab('overview')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: statementTab === 'overview' ? '2px solid var(--primary)' : 'none', fontWeight: statementTab === 'overview' ? 600 : 400 }}>Profile Overview</div>
            <div className={`tab-item ${statementTab === 'ledger' ? 'active' : ''}`} onClick={() => setStatementTab('ledger')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: statementTab === 'ledger' ? '2px solid var(--primary)' : 'none', fontWeight: statementTab === 'ledger' ? 600 : 400 }}>Transaction Ledger</div>
            <div className={`tab-item ${statementTab === 'purchases' ? 'active' : ''}`} onClick={() => setStatementTab('purchases')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: statementTab === 'purchases' ? '2px solid var(--primary)' : 'none', fontWeight: statementTab === 'purchases' ? 600 : 400 }}>{selectedStatementParty.type === 'Customer' ? 'Purchase History' : 'Sales History'}</div>
            <div className={`tab-item ${statementTab === 'payments' ? 'active' : ''}`} onClick={() => setStatementTab('payments')} style={{ cursor: 'pointer', paddingBottom: '8px', borderBottom: statementTab === 'payments' ? '2px solid var(--primary)' : 'none', fontWeight: statementTab === 'payments' ? 600 : 400 }}>Payment History</div>
          </div>

          {statementTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Balance Card */}
              <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedStatementParty.balance < 0 ? 'rgba(239, 68, 68, 0.08)' : selectedStatementParty.balance > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${selectedStatementParty.balance < 0 ? 'var(--red)' : selectedStatementParty.balance > 0 ? 'var(--yellow)' : 'var(--green)'}` }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-2)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Outstanding Balance</h4>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: selectedStatementParty.balance < 0 ? 'var(--red)' : selectedStatementParty.balance > 0 ? 'var(--yellow)' : 'var(--green)' }}>
                    {fmt(Math.abs(selectedStatementParty.balance))}
                    <span style={{ fontSize: '13px', marginLeft: '8px', fontWeight: 500, color: 'var(--text-2)' }}>
                      {selectedStatementParty.balance < 0 ? '(Due - Customer owes you)' : selectedStatementParty.balance > 0 ? '(Payable - You owe them)' : '(Settled)'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${selectedStatementParty.balance < -50000 ? 'badge--red' : 'badge--green'}`} style={{ fontSize: '12px', padding: '5px 10px' }}>
                    Credit Status: {selectedStatementParty.balance < -50000 ? 'Poor' : 'Excellent'}
                  </span>
                </div>
              </div>

              {/* Send Payment Reminder Panel (only if they owe money) */}
              {selectedStatementParty.balance < 0 && (
                <div className="card" style={{ padding: '15px 20px', border: '1px dashed var(--yellow)', background: 'rgba(245, 158, 11, 0.02)' }}>
                  <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--yellow)' }}>
                    <i className="fas fa-paper-plane"></i> Send Payment Reminder
                  </h5>
                  <div className="fg" style={{ marginBottom: '10px' }}>
                    <textarea 
                      className="fi" 
                      rows="3" 
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                      style={{ fontSize: '12.5px', fontFamily: 'inherit' }}
                    ></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn--sm btn--primary" onClick={() => sendReminder('whatsapp', selectedStatementParty, reminderMessage)}>
                      <i className="fab fa-whatsapp" style={{ marginRight: '5px' }}></i> WhatsApp
                    </button>
                    <button type="button" className="btn btn--sm btn--primary" onClick={() => sendReminder('sms', selectedStatementParty, reminderMessage)}>
                      <i className="fas fa-sms" style={{ marginRight: '5px' }}></i> SMS
                    </button>
                    <button type="button" className="btn btn--sm btn--primary" onClick={() => sendReminder('email', selectedStatementParty, reminderMessage)}>
                      <i className="fas fa-envelope" style={{ marginRight: '5px' }}></i> Email
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Phone Number</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.phone || 'N/A'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>WhatsApp Number</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.whatsappNumber || selectedStatementParty.phone || 'N/A'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Email Address</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.email || 'N/A'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Group Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.customerGroup || 'Retail'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Credit Limit</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.creditLimit ? fmt(selectedStatementParty.creditLimit) : 'No Limit'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Payment Terms</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.paymentTerms || 'Net 30'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>GSTIN</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.gstin || 'UNREGISTERED'}</div>
                </div>
                <div className="card" style={{ padding: '12px 15px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>PAN Number</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{selectedStatementParty.pan || 'N/A'}</div>
                </div>
              </div>

              {/* Addresses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="card" style={{ padding: '15px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Billing Address</h5>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>{selectedStatementParty.billingAddress || 'No billing address provided.'}</p>
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>State: {selectedStatementParty.state || 'Karnataka'}</div>
                </div>
                <div className="card" style={{ padding: '15px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Shipping Address</h5>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>{selectedStatementParty.shippingAddress || selectedStatementParty.billingAddress || 'Same as billing address.'}</p>
                </div>
              </div>

              {/* Notes & Bank Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="card" style={{ padding: '15px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Bank / UPI Details</h5>
                  <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{selectedStatementParty.bankDetails || 'No banking/UPI details recorded.'}</p>
                </div>
                <div className="card" style={{ padding: '15px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Internal Notes</h5>
                  <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.4', color: 'var(--yellow)' }}>{selectedStatementParty.notes || 'No internal notes.'}</p>
                </div>
              </div>
            </div>
          )}

          {statementTab === 'ledger' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>All Journal Ledger Entries</h4>
                <button className="btn btn--sm btn--primary" onClick={() => {
                  const printWindow = window.open('', '_blank');
                  const rows = dbData.transactions
                    .filter(t => t.party === selectedStatementParty.name)
                    .map(t => {
                      const debitNum = Number(t.debit) || 0;
                      const creditNum = Number(t.credit) || 0;
                      const balanceNum = Number(t.balance) || 0;
                      return `
                        <tr>
                          <td>${t.date}</td>
                          <td>${t.id}</td>
                          <td>${t.type}</td>
                          <td align="right">${debitNum > 0 ? debitNum.toFixed(2) : '-'}</td>
                          <td align="right">${creditNum > 0 ? creditNum.toFixed(2) : '-'}</td>
                          <td align="right">${balanceNum.toFixed(2)}</td>
                        </tr>
                      `;
                    }).join('');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Ledger Statement - ${selectedStatementParty.name}</title>
                        <style>
                          body { font-family: sans-serif; padding: 20px; color: #333; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                          th { background-color: #f2f2f2; }
                          .header { margin-bottom: 20px; }
                          .title { font-size: 24px; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="title">Ledger Account Statement</div>
                          <div><strong>Party Name:</strong> ${selectedStatementParty.name}</div>
                          <div><strong>Contact:</strong> ${selectedStatementParty.phone}</div>
                          <div><strong>State:</strong> ${selectedStatementParty.state || 'Karnataka'}</div>
                          <div><strong>GSTIN:</strong> ${selectedStatementParty.gstin || 'Unregistered'}</div>
                          <div><strong>Current Balance:</strong> Rs. ${Math.abs(selectedStatementParty.balance).toFixed(2)} ${selectedStatementParty.balance < 0 ? 'Due' : 'Payable'}</div>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Txn ID</th>
                              <th>Type</th>
                              <th style="text-align: right">Debit (Rs.)</th>
                              <th style="text-align: right">Credit (Rs.)</th>
                              <th style="text-align: right">Balance (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${rows || '<tr><td colspan="6" align="center">No transactions found</td></tr>'}
                          </tbody>
                        </table>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}>
                  <i className="fas fa-print" style={{ marginRight: '5px' }}></i> Print Ledger
                </button>
              </div>

              <div className="card" style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Txn ID</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Debit (Increase)</th>
                      <th style={{ textAlign: 'right' }}>Credit (Decrease)</th>
                      <th style={{ textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.transactions.filter(t => t.party === selectedStatementParty.name).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-3)' }}>No ledger records found for this party.</td>
                      </tr>
                    ) : (
                      dbData.transactions
                        .filter(t => t.party === selectedStatementParty.name)
                        .map((t, index) => (
                          <tr key={index}>
                            <td>{t.date}</td>
                            <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{t.id}</td>
                            <td><span className="badge">{t.type}</span></td>
                            <td style={{ textAlign: 'right', color: t.debit > 0 ? 'var(--red)' : 'inherit' }}>{t.debit > 0 ? fmt(t.debit) : '-'}</td>
                            <td style={{ textAlign: 'right', color: t.credit > 0 ? 'var(--green)' : 'inherit' }}>{t.credit > 0 ? fmt(t.credit) : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(Math.abs(t.balance))} {t.balance < 0 ? 'Dr' : t.balance > 0 ? 'Cr' : ''}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {statementTab === 'purchases' && (
            <div>
              <h4 style={{ marginBottom: '12px' }}>Invoice & Order History</h4>
              <div className="card" style={{ overflowX: 'auto' }}>
                {selectedStatementParty.type === 'Customer' ? (
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Amount</th>
                        <th>Payment Mode</th>
                        <th>Status</th>
                        <th>Items Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbData.sales.filter(s => s.customer === selectedStatementParty.name).length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-3)' }}>No sales history found for this customer.</td>
                        </tr>
                      ) : (
                        dbData.sales
                          .filter(s => s.customer === selectedStatementParty.name)
                          .map((s, index) => (
                            <tr key={index}>
                              <td>{s.date}</td>
                              <td style={{ fontWeight: 600 }}>{s.id}</td>
                              <td style={{ fontWeight: 600 }}>{fmt(s.amount)}</td>
                              <td><span className="badge badge--blue">{s.mode}</span></td>
                              <td>
                                <span className={`badge ${(s.status || '').toLowerCase() === 'paid' ? 'badge--green' : 'badge--yellow'}`}>
                                  {s.status || 'Pending'}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: 'var(--text-3)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(s.items || []).map(it => `${it.name} (x${it.qty})`).join(', ')}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Purchase ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Payment Mode</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbData.purchases.filter(p => p.supplier === selectedStatementParty.name).length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-3)' }}>No purchase history found for this supplier.</td>
                        </tr>
                      ) : (
                        dbData.purchases
                          .filter(p => p.supplier === selectedStatementParty.name)
                          .map((p, index) => (
                            <tr key={index}>
                              <td>{p.date}</td>
                              <td style={{ fontWeight: 600 }}>{p.id}</td>
                              <td><span className="badge">{p.purchaseType || 'Purchase Invoice'}</span></td>
                              <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                              <td><span className="badge badge--blue">{p.mode}</span></td>
                              <td>
                                <span className={`badge ${(p.status || '').toLowerCase() === 'paid' ? 'badge--green' : 'badge--yellow'}`}>
                                  {p.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {statementTab === 'payments' && (
            <div>
              <h4 style={{ marginBottom: '12px' }}>Payment History</h4>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Txn ID</th>
                      <th>Payment Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Account Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.transactions.filter(t => t.party === selectedStatementParty.name && (t.type || '').startsWith('Payment')).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-3)' }}>No payment records found.</td>
                      </tr>
                    ) : (
                      dbData.transactions
                        .filter(t => t.party === selectedStatementParty.name && (t.type || '').startsWith('Payment'))
                        .map((t, index) => {
                          const amt = t.debit > 0 ? t.debit : t.credit;
                          return (
                            <tr key={index}>
                              <td>{t.date}</td>
                              <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{t.id}</td>
                              <td>
                                <span className={`badge ${(t.type || '').includes('Receive') ? 'badge--green' : 'badge--red'}`}>
                                  {t.type}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(amt)}</td>
                              <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                                {t.debitAccount} &rarr; {t.creditAccount}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn--primary" onClick={() => { setShowStatementModal(false); setSelectedStatementParty(null); }}>Close</button>
          </div>
        </div>
      )}

      {/* ==================== DASHBOARD DETAILS MODAL ==================== */}
      {dashboardDetailType && (() => {
        let title = '';
        let content = null;
        
        switch (dashboardDetailType) {
          case 'salesToday': {
            title = 'Total Sales Today Details';
            const list = dbData.sales.filter(s => parseDate(s.date) >= startOfDay);
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total Today: <span style={{ color: '#10b981' }}>{fmt(salesToday)}</span> ({list.length} Invoices)
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Payment Mode</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No sales logged today</td></tr>
                      ) : (
                        list.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.date || 'N/A'}</td>
                            <td>{s.invoiceNo || s.id || 'N/A'}</td>
                            <td>{s.customer || 'Cash Customer'}</td>
                            <td>{s.paymentMode || 'Cash'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(parseFloat(s.amount) || 0)}</td>
                            <td><span className={`badge ${s.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{s.status || 'Paid'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'salesWeek': {
            title = 'Total Sales This Week Details';
            const list = dbData.sales.filter(s => parseDate(s.date) >= startOfWeek);
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total This Week: <span style={{ color: '#10b981' }}>{fmt(salesWeek)}</span> ({list.length} Invoices)
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Payment Mode</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No sales logged this week</td></tr>
                      ) : (
                        list.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.date || 'N/A'}</td>
                            <td>{s.invoiceNo || s.id || 'N/A'}</td>
                            <td>{s.customer || 'Cash Customer'}</td>
                            <td>{s.paymentMode || 'Cash'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(parseFloat(s.amount) || 0)}</td>
                            <td><span className={`badge ${s.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{s.status || 'Paid'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'salesMonth': {
            title = 'Total Sales This Month Details';
            const list = dbData.sales.filter(s => parseDate(s.date) >= startOfMonth);
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total This Month: <span style={{ color: '#10b981' }}>{fmt(salesMonth)}</span> ({list.length} Invoices)
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Payment Mode</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No sales logged this month</td></tr>
                      ) : (
                        list.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.date || 'N/A'}</td>
                            <td>{s.invoiceNo || s.id || 'N/A'}</td>
                            <td>{s.customer || 'Cash Customer'}</td>
                            <td>{s.paymentMode || 'Cash'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(parseFloat(s.amount) || 0)}</td>
                            <td><span className={`badge ${s.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{s.status || 'Paid'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'profit': {
            title = 'Total Profit (Revenue - Expenses) Details';
            const salesList = dbData.sales || [];
            const purchaseList = (dbData.purchases || []).filter(p => p.active !== false && p.purchaseType !== 'Purchase Order');
            content = (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Total Sales Revenue:</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{fmt(Math.round(totalSales))}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Total Purchases:</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{fmt(Math.round(totalPurchases))}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Net Profit:</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: profit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(Math.round(profit))}</div>
                  </div>
                </div>
                <div className="tab-heads" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <button className={`btn ${detailModalTab === 'sales' ? 'btn--primary' : ''}`} onClick={() => setDetailModalTab('sales')}>Sales Invoices ({salesList.length})</button>
                  <button className={`btn ${detailModalTab === 'purchases' ? 'btn--primary' : ''}`} onClick={() => setDetailModalTab('purchases')}>Purchases ({purchaseList.length})</button>
                </div>
                {detailModalTab === 'sales' ? (
                  <div className="table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice ID</th>
                          <th>Customer</th>
                          <th>Payment Mode</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesList.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No sales records found</td></tr>
                        ) : (
                          salesList.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.date || 'N/A'}</td>
                              <td>{s.invoiceNo || s.id || 'N/A'}</td>
                              <td>{s.customer || 'Cash Customer'}</td>
                              <td>{s.paymentMode || 'Cash'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(parseFloat(s.amount) || 0)}</td>
                              <td><span className={`badge ${s.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{s.status || 'Paid'}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Purchase ID</th>
                          <th>Supplier</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseList.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No purchases records found</td></tr>
                        ) : (
                          purchaseList.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.date || 'N/A'}</td>
                              <td>{p.purchaseNo || p.id || 'N/A'}</td>
                              <td>{p.supplier || 'N/A'}</td>
                              <td>{p.purchaseType || 'Purchase Invoice'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: getPurchaseAmount(p) < 0 ? '#ef4444' : '#334155' }}>{fmt(getPurchaseAmount(p))}</td>
                              <td><span className={`badge ${(p.status || '').toLowerCase() === 'pending' ? 'badge--yellow' : 'badge--green'}`}>{p.status || 'Paid'}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
            break;
          }
          case 'receivables': {
            title = 'Total Pending Payments (Receivables)';
            const pendingSales = (dbData.sales || []).filter(s => (s.status || '').toLowerCase() === 'pending');
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total Pending Receivables: <span style={{ color: 'var(--red)' }}>{fmt(totalPendingReceivables)}</span> ({pendingSales.length} Invoices)
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th style={{ textAlign: 'right' }}>Pending Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSales.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No pending receivables found</td></tr>
                      ) : (
                        pendingSales.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.date || 'N/A'}</td>
                            <td>{s.invoiceNo || s.id || 'N/A'}</td>
                            <td>{s.customer || 'N/A'}</td>
                            <td>{s.phone || 'N/A'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(parseFloat(s.amount) || 0)}</td>
                            <td><span className="badge badge--yellow">Pending</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'payables': {
            title = 'Total Outstanding Dues (Payables)';
            const pendingPurchases = (dbData.purchases || []).filter(p => p.active !== false && (p.status || '').toLowerCase() === 'pending');
            const suppliersWithBalance = (dbData.parties || []).filter(p => (p.type || '').toLowerCase() === 'supplier' && parseFloat(p.balance) > 0);
            
            content = (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Pending Purchase Bills:</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{fmt(purchasesPendingSum)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Supplier Balances:</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{fmt(suppliersOutstanding)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Total Payables:</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(totalOutstandingPayables)}</div>
                  </div>
                </div>
                
                <div className="tab-heads" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <button className={`btn ${detailModalTab === 'purchases' ? 'btn--primary' : ''}`} onClick={() => setDetailModalTab('purchases')}>Pending Invoices ({pendingPurchases.length})</button>
                  <button className={`btn ${detailModalTab === 'suppliers' ? 'btn--primary' : ''}`} onClick={() => setDetailModalTab('suppliers')}>Supplier Balances ({suppliersWithBalance.length})</button>
                </div>
                
                {detailModalTab === 'purchases' ? (
                  <div className="table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Purchase ID</th>
                          <th>Supplier</th>
                          <th style={{ textAlign: 'right' }}>Pending Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPurchases.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No pending purchase invoices found</td></tr>
                        ) : (
                          pendingPurchases.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.date || 'N/A'}</td>
                              <td>{p.purchaseNo || p.id || 'N/A'}</td>
                              <td>{p.supplier || 'N/A'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(getPurchaseAmount(p))}</td>
                              <td><span className="badge badge--yellow">Pending</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Supplier Name</th>
                          <th>Phone</th>
                          <th>State</th>
                          <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliersWithBalance.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No suppliers with outstanding balance</td></tr>
                        ) : (
                          suppliersWithBalance.map((s, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{s.name}</td>
                              <td>{s.phone || 'N/A'}</td>
                              <td>{s.state || 'N/A'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--red)' }}>{fmt(parseFloat(s.balance))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
            break;
          }
          case 'expensesToday': {
            title = 'Total Expenses Today';
            const purchasesToday = (dbData.purchases || []).filter(p => p.active !== false && parseDate(p.date) >= startOfDay);
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total Expenses Logged Today: <span style={{ color: 'var(--red)' }}>{fmt(expensesToday)}</span>
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Purchase ID</th>
                        <th>Supplier</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasesToday.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No expenses recorded today</td></tr>
                      ) : (
                        purchasesToday.map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.date || 'N/A'}</td>
                            <td>{p.purchaseNo || p.id || 'N/A'}</td>
                            <td>{p.supplier || 'N/A'}</td>
                            <td>{p.purchaseType || 'Purchase Invoice'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(getPurchaseAmount(p))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'expensesMonth': {
            title = 'Total Expenses This Month';
            const purchasesMonth = (dbData.purchases || []).filter(p => p.active !== false && parseDate(p.date) >= startOfMonth);
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total Expenses Logged This Month: <span style={{ color: 'var(--red)' }}>{fmt(expensesMonth)}</span>
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Purchase ID</th>
                        <th>Supplier</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasesMonth.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No expenses recorded this month</td></tr>
                      ) : (
                        purchasesMonth.map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.date || 'N/A'}</td>
                            <td>{p.purchaseNo || p.id || 'N/A'}</td>
                            <td>{p.supplier || 'N/A'}</td>
                            <td>{p.purchaseType || 'Purchase Invoice'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(getPurchaseAmount(p))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'customers': {
            title = 'Total Customers Count';
            const customerList = (dbData.parties || []).filter(p => (p.type || '').toLowerCase() === 'customer');
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total Registered Customers: <span>{customerList.length}</span>
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>State</th>
                        <th>WhatsApp</th>
                        <th style={{ textAlign: 'right' }}>Receivable Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerList.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No customers found</td></tr>
                      ) : (
                        customerList.map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                            <td>{c.phone || 'N/A'}</td>
                            <td>{c.state || 'N/A'}</td>
                            <td>{c.whatsappNumber || 'N/A'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: parseFloat(c.balance) > 0 ? '#10b981' : '#334155' }}>
                              {fmt(parseFloat(c.balance) || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'suppliers': {
            title = 'Total Suppliers Count';
            const supplierList = (dbData.parties || []).filter(p => (p.type || '').toLowerCase() === 'supplier');
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Total Registered Suppliers: <span>{supplierList.length}</span>
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>State</th>
                        <th>WhatsApp</th>
                        <th style={{ textAlign: 'right' }}>Payable Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierList.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No suppliers found</td></tr>
                      ) : (
                        supplierList.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                            <td>{s.phone || 'N/A'}</td>
                            <td>{s.state || 'N/A'}</td>
                            <td>{s.whatsappNumber || 'N/A'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: parseFloat(s.balance) > 0 ? 'var(--red)' : '#334155' }}>
                              {fmt(parseFloat(s.balance) || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'lowStock': {
            title = 'Low Stock Alerts Count';
            const lowStockProducts = (dbData.products || []).filter(p => p.active !== false && (parseInt(p.stock) || 0) <= (parseInt(p.lowStockLevel) || 5));
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Low Stock Products: <span>{lowStockProducts.length}</span>
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Alert Level</th>
                        <th style={{ textAlign: 'right' }}>Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No low stock alerts</td></tr>
                      ) : (
                        lowStockProducts.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.sku || 'N/A'}</td>
                            <td>{p.category || 'N/A'}</td>
                            <td style={{ textAlign: 'right' }}>{p.lowStockLevel || 5}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--yellow)' }}>{p.stock}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          case 'outOfStock': {
            title = 'Out of Stock Items Count';
            const outOfStockProducts = (dbData.products || []).filter(p => p.active !== false && (parseInt(p.stock) || 0) <= 0);
            content = (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                  Out of Stock Products: <span>{outOfStockProducts.length}</span>
                </div>
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th style={{ textAlign: 'right' }}>Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outOfStockProducts.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No out of stock items</td></tr>
                      ) : (
                        outOfStockProducts.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.sku || 'N/A'}</td>
                            <td>{p.category || 'N/A'}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(parseFloat(p.price) || 0)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--red)' }}>{p.stock}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }
          default:
            break;
        }

        return (
          <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '850px', width: '90%' }}>
            <div className="modal__top">
              <h3>{title}</h3>
              <button className="btn--icon" onClick={() => setDashboardDetailType(null)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              {content}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn--primary" onClick={() => setDashboardDetailType(null)}>Close</button>
            </div>
          </div>
        );
      })()}

      {(showProductModal || showPartyModal || activeInvoice || showAdjustmentModal || showTransferModal || showBarcodeModal || showAuditModal || showCatBrandModal || showMultiLocationModal || serialSelectRowIdx !== null || showStatementModal || dashboardDetailType) && <div className="overlay" style={{ display: 'block', zIndex: 999 }} onClick={() => setDashboardDetailType(null)}></div>}
    </>
  );
}
