import React, { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AnimatedNumber from '../components/AnimatedNumber';
import { useApp } from '../context/AppContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Reports() {
  const { user, dbData } = useApp();
  const username = user?.username || '';

  // Main navigation tabs
  const [tab, setTab] = useState('financial');
  
  // Inner Sub-navigation tabs
  const [financialSubTab, setFinancialSubTab] = useState('pl'); // 'pl', 'bs', 'cf', 'tb', 'db', 'cb', 'bb'
  const [innerInventoryTab, setInnerInventoryTab] = useState('summary'); // 'summary', 'low_stock', 'out_of_stock', 'dead_stock', 'movement', 'expiry'
  const [partySubTab, setPartySubTab] = useState('cust_out'); // 'cust_out', 'supp_out', 'lookup'
  const [gstSubTab, setGstSubTab] = useState('gstr1'); // 'gstr1', 'gstr2', 'gstr3b', 'hsn', 'tax'

  // Custom report builder state
  const [customReportName, setCustomReportName] = useState('My Custom Report');
  const [customEntity, setCustomEntity] = useState('sales');
  const [customFields, setCustomFields] = useState(['id', 'date', 'customer', 'amount']);
  const [customFilters, setCustomFilters] = useState([{ field: '', operator: 'equals', value: '' }]);
  const [customSortBy, setCustomSortBy] = useState('date');
  const [customSortOrder, setCustomSortOrder] = useState('desc');
  const [customTemplates, setCustomTemplates] = useState([]);
  
  // Auto-reports scheduling state
  const [schedules, setSchedules] = useState([]);
  const [schedEmail, setSchedEmail] = useState(user?.email || '');
  const [schedFrequency, setSchedFrequency] = useState('daily');
  const [schedReportType, setSchedReportType] = useState('sales');
  const [schedCustomReportId, setSchedCustomReportId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);


  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [salesByDay, setSalesByDay] = useState(null);
  const [salesByProduct, setSalesByProduct] = useState(null);
  const [tableQ, setTableQ] = useState('');

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/admin/reports/schedules?username=${encodeURIComponent(username)}`);
      const json = await res.json();
      if (json.status === 'success') setSchedules(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomTemplates = async () => {
    try {
      const res = await fetch(`/api/admin/reports/custom?username=${encodeURIComponent(username)}`);
      const json = await res.json();
      if (json.status === 'success') setCustomTemplates(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { 
    fetchTab(); 
    fetchSalesCharts(); 
    if (tab === 'scheduler') fetchSchedules();
    if (tab === 'builder') {
      fetchCustomTemplates();
      fetchSchedules();
    }
  }, [tab]);


  const getReportUrl = (endpoint, extraParams = {}) => {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    for (const [key, val] of Object.entries(extraParams)) {
      if (val !== undefined && val !== null) {
        params.append(key, val);
      }
    }
    const queryString = params.toString();
    return `${endpoint}${queryString ? '?' + queryString : ''}`;
  };

  const fetchTab = async () => {
    setLoading(true);
    try {
      if (tab === 'financial') {
        const res = await fetch(getReportUrl('/api/admin/reports/financial'));
        const json = await res.json();
        setData(json);
      } else if (tab === 'gst') {
        const res = await fetch(getReportUrl('/api/admin/reports/gst'));
        const json = await res.json();
        setData(json.data || []);
      } else if (tab === 'ageing') {
        const res = await fetch(getReportUrl('/api/admin/reports/ageing'));
        const json = await res.json();
        setData(json.data || []);
      } else if (tab === 'purchase') {
        const res = await fetch(getReportUrl('/api/admin/reports/purchase', { groupBy: 'supplier' }));
        const json = await res.json();
        setData(json.data || []);
      } else if (tab === 'inventory') {
        const resOut = await fetch(getReportUrl('/api/admin/reports/inventory/advanced', { type: 'out_of_stock' }));
        const resDead = await fetch(getReportUrl('/api/admin/reports/inventory/advanced', { type: 'dead_stock' }));
        const outJson = await resOut.json();
        const deadJson = await resDead.json();
        setData({ outOfStock: outJson.data || [], deadStock: deadJson.data || [] });
      } else if (tab === 'delivery') {
        const res = await fetch(getReportUrl('/api/admin/reports/delivery'));
        const json = await res.json();
        setData(json.data || []);
      } else if (tab === 'party') {
        setData(null);
      }
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  const fetchSalesCharts = async () => {
    try {
      const dayRes = await fetch(getReportUrl('/api/admin/reports/sales'));
      const dayJson = await dayRes.json();
      setSalesByDay(dayJson.data || []);

      const prodRes = await fetch(getReportUrl('/api/admin/reports/sales', { groupBy: 'product' }));
      const prodJson = await prodRes.json();
      setSalesByProduct(prodJson.data || []);
    } catch (e) { 
      console.error(e); 
    }
  };

  const exportCSV = (endpoint, extraParams = {}) => {
    const url = getReportUrl(endpoint, { ...extraParams, csv: 'true' });
    window.location.href = url;
  };

  const fetchParty = async () => {
    if (!partyId) return alert('Enter party name or ID');
    setLoading(true);
    try {
      const res = await fetch(getReportUrl('/api/admin/reports/party-ledger', { partyId }));
      const json = await res.json();
      setData(json.data || []);
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  const salesDayChart = () => {
    if (!salesByDay) return null;
    const labels = salesByDay.map(r => r.date || new Date(r.date).toLocaleDateString());
    const totals = salesByDay.map(r => Number(r.total || r.revenue || 0));
    const cfg = { 
      labels, 
      datasets: [{ 
        label: 'Sales', 
        data: totals, 
        borderColor: '#3b82f6', 
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }] 
    };
    return <Line data={cfg} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }} />;
  };

  const salesProductChart = () => {
    if (!salesByProduct) return null;
    const labels = salesByProduct.map(r => r.product || r._id || r.product);
    const totals = salesByProduct.map(r => Number(r.revenue || r.qty || 0));
    const cfg = { 
      labels, 
      datasets: [{ 
        label: 'Revenue', 
        data: totals, 
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderRadius: 4
      }] 
    };
    return <Bar data={cfg} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }} />;
  };

  const fmt = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // High fidelity calculations
  const purchaseReportsAggData = useMemo(() => {
    const purchasesList = dbData?.purchases || [];
    const filteredPurchases = purchasesList.filter(p => {
      if (!p.date) return false;
      const d = p.date.substring(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    const totalProcurement = filteredPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const orderCount = filteredPurchases.length;
    const avgPurchaseValue = orderCount > 0 ? (totalProcurement / orderCount) : 0;

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

    const monthlyGroups = {};
    filteredPurchases.forEach(p => {
      const key = p.date.substring(0, 7);
      monthlyGroups[key] = (monthlyGroups[key] || 0) + (Number(p.amount) || 0);
    });
    const sortedLabels = Object.keys(monthlyGroups).sort();
    const sortedValues = sortedLabels.map(lbl => monthlyGroups[lbl]);

    return {
      summary: { totalProcurement, orderCount, avgPurchaseValue, activeSuppliers },
      timeData: { labels: sortedLabels, values: sortedValues },
      supplierData,
      productData
    };
  }, [dbData?.purchases, from, to]);

  const inventoryReportData = useMemo(() => {
    const productsList = dbData?.products || [];
    const salesList = dbData?.sales || [];
    const purchasesList = dbData?.purchases || [];

    const totalSKUs = productsList.length;
    let totalInventoryValue = 0;
    
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

    const lowStockList = productsList.filter(p => {
      const effStock = getEffectiveStock(p);
      const minLevel = Number(p.lowStockLevel) || 5;
      return effStock > 0 && effStock <= minLevel;
    });

    const outOfStockList = productsList.filter(p => getEffectiveStock(p) <= 0);

    const activeSoldProducts = new Set();
    salesList.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          if (item.name) activeSoldProducts.add(item.name.toLowerCase());
        });
      }
    });
    const deadStockList = productsList.filter(p => !activeSoldProducts.has(p.name.toLowerCase()));

    const movementLog = [];
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

    movementLog.sort((a, b) => new Date(b.date) - new Date(a.date));

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
  }, [dbData?.products, dbData?.sales, dbData?.purchases]);

  // Financial Statements Aggregations
  const advancedFinancialReport = useMemo(() => {
    const salesList = dbData?.sales || [];
    const purchasesList = dbData?.purchases || [];
    const expensesList = dbData?.expenses || [];
    const partiesList = dbData?.parties || [];
    const productsList = dbData?.products || [];

    const dateFilter = (itemDate) => {
      if (!itemDate) return false;
      const d = itemDate.substring(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const filteredSales = salesList.filter(s => dateFilter(s.date));
    const filteredPurchases = purchasesList.filter(p => dateFilter(p.date));
    const filteredExpenses = expensesList.filter(e => dateFilter(e.date));

    let totalCashReceived = 0;
    let totalBankReceived = 0;
    filteredSales.forEach(s => {
      const mode = (s.paymentMode || s.paymentMethod || 'Cash').toLowerCase();
      const amt = Number(s.amount || s.total || 0);
      if (mode.includes('cash')) totalCashReceived += amt;
      else totalBankReceived += amt;
    });

    let totalCashPaid = 0;
    let totalBankPaid = 0;
    filteredPurchases.forEach(p => {
      const mode = (p.paymentMode || 'Cash').toLowerCase();
      const amt = Number(p.amount || p.total || 0);
      if (mode.includes('cash')) totalCashPaid += amt;
      else totalBankPaid += amt;
    });

    filteredExpenses.forEach(e => {
      const mode = (e.paymentMode || 'Cash').toLowerCase();
      const amt = Number(e.amount || 0);
      if (mode.includes('cash')) totalCashPaid += amt;
      else totalBankPaid += amt;
    });

    // Day Book, Cash Book, Bank Book logs
    const dayBook = [];
    filteredSales.forEach(s => {
      dayBook.push({
        date: s.date || '',
        description: `Invoice #${s.id || 'N/A'} - ${s.customer || 'Walk-in'}`,
        type: 'Receipt (Sale)',
        mode: s.paymentMode || s.paymentMethod || 'Cash',
        inflow: Number(s.amount || 0),
        outflow: 0
      });
    });

    filteredPurchases.forEach(p => {
      dayBook.push({
        date: p.date || '',
        description: `Purchase PO #${p.id || 'N/A'} - ${p.supplier || 'N/A'}`,
        type: 'Payment (Purchase)',
        mode: p.paymentMode || 'Cash',
        inflow: 0,
        outflow: Number(p.amount || 0)
      });
    });

    filteredExpenses.forEach(e => {
      dayBook.push({
        date: e.date || '',
        description: `Expense - ${e.category || 'Business'} (${e.description || ''})`,
        type: 'Payment (Expense)',
        mode: e.paymentMode || 'Cash',
        inflow: 0,
        outflow: Number(e.amount || 0)
      });
    });

    dayBook.sort((a, b) => new Date(b.date) - new Date(a.date));

    const cashBook = dayBook.filter(item => item.mode.toLowerCase().includes('cash'));
    const bankBook = dayBook.filter(item => !item.mode.toLowerCase().includes('cash'));

    const revenue = filteredSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const purchaseCost = filteredPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const expenseCost = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalExpenses = purchaseCost + expenseCost;
    const netProfit = revenue - totalExpenses;

    // Assets
    const baseCash = Math.max(0, 50000 + (totalCashReceived - totalCashPaid));
    const baseBank = Math.max(0, 150000 + (totalBankReceived - totalBankPaid));
    const totalReceivables = partiesList.filter(p => (p.type || '').toLowerCase() === 'customer').reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
    const totalPayables = partiesList.filter(p => (p.type || '').toLowerCase() === 'supplier').reduce((sum, p) => sum + Math.abs(Number(p.balance) || 0), 0);

    let inventoryValuation = 0;
    productsList.forEach(p => {
      inventoryValuation += (Number(p.stock) || 0) * (Number(p.purchasePrice || p.price * 0.7) || 0);
    });

    const totalAssets = baseCash + baseBank + totalReceivables + inventoryValuation;
    const totalLiabilities = totalPayables;
    const equity = totalAssets - totalLiabilities;

    return {
      revenue,
      purchaseCost,
      expenseCost,
      totalExpenses,
      netProfit,
      dayBook,
      cashBook,
      bankBook,
      cashBalance: baseCash,
      bankBalance: baseBank,
      receivables: totalReceivables,
      payables: totalPayables,
      inventoryValuation,
      totalAssets,
      totalLiabilities,
      equity
    };
  }, [dbData, from, to]);

  // Parties & Outstanding statements reports
  const advancedPartyReport = useMemo(() => {
    const partiesList = dbData?.parties || [];
    
    const customers = partiesList.filter(p => (p.type || '').toLowerCase() === 'customer');
    const suppliers = partiesList.filter(p => (p.type || '').toLowerCase() === 'supplier');

    // Customer Outstanding: list balance > 0
    const customerOutstanding = customers.filter(p => Number(p.balance) > 0);
    const totalCustomerOutstanding = customerOutstanding.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);

    // Supplier Outstanding: list balance < 0
    const supplierOutstanding = suppliers.filter(p => Number(p.balance) < 0 || p.balance < 0);
    const totalSupplierOutstanding = supplierOutstanding.reduce((sum, p) => sum + Math.abs(Number(p.balance) || 0), 0);

    // Ageing calculations (0-30 / 31-60 / 61-90 / 90+ days)
    const ageingBuckets = {
      bucket30: [],
      bucket60: [],
      bucket90: [],
      bucket90Plus: [],
      totals: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    };

    customers.forEach(p => {
      const balance = Number(p.balance) || 0;
      if (balance <= 0) return;

      let days = 15; // default
      if (p.lastTxn) {
        const diffMs = new Date() - new Date(p.lastTxn);
        days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      const item = { name: p.name, balance, days, phone: p.phone || 'N/A' };

      if (days <= 30) {
        ageingBuckets.bucket30.push(item);
        ageingBuckets.totals['0-30'] += balance;
      } else if (days <= 60) {
        ageingBuckets.bucket60.push(item);
        ageingBuckets.totals['31-60'] += balance;
      } else if (days <= 90) {
        ageingBuckets.bucket90.push(item);
        ageingBuckets.totals['61-90'] += balance;
      } else {
        ageingBuckets.bucket90Plus.push(item);
        ageingBuckets.totals['90+'] += balance;
      }
    });

    return {
      customers,
      suppliers,
      customerOutstanding,
      totalCustomerOutstanding,
      supplierOutstanding,
      totalSupplierOutstanding,
      ageingBuckets
    };
  }, [dbData?.parties]);

  const gstReportsData = useMemo(() => {
    const salesList = dbData?.sales || [];
    const purchasesList = dbData?.purchases || [];

    const dateFilter = (itemDate) => {
      if (!itemDate) return false;
      const d = itemDate.substring(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const filteredSales = salesList.filter(s => dateFilter(s.date));
    const filteredPurchases = purchasesList.filter(p => dateFilter(p.date));

    // GSTR-1 (Outward Supplies)
    let gstr1Gross = 0;
    let gstr1Taxable = 0;
    let gstr1Cgst = 0;
    let gstr1Sgst = 0;
    let gstr1Igst = 0;
    let gstr1Tax = 0;
    const gstr1Invoices = filteredSales.map(s => {
      const gross = parseFloat(s.amount) || 0;
      const cgst = parseFloat(s.cgst) || 0;
      const sgst = parseFloat(s.sgst) || 0;
      const igst = parseFloat(s.igst) || 0;
      const tax = parseFloat(s.taxAmount) || (cgst + sgst + igst);
      const taxable = s.subtotal !== undefined ? parseFloat(s.subtotal) : (gross - tax);

      gstr1Gross += gross;
      gstr1Taxable += taxable;
      gstr1Cgst += cgst;
      gstr1Sgst += sgst;
      gstr1Igst += igst;
      gstr1Tax += tax;

      return {
        id: s.id,
        date: s.date,
        customer: s.customer || 'Walk-in',
        gstin: s.customerGstin || s.gstin || '',
        gross,
        taxable,
        cgst,
        sgst,
        igst,
        tax
      };
    });

    // GSTR-2 (Inward Supplies)
    let gstr2Gross = 0;
    let gstr2Taxable = 0;
    let gstr2Cgst = 0;
    let gstr2Sgst = 0;
    let gstr2Igst = 0;
    let gstr2Tax = 0;
    const gstr2Invoices = filteredPurchases.map(p => {
      const gross = parseFloat(p.amount) || 0;
      const cgst = parseFloat(p.cgst) || 0;
      const sgst = parseFloat(p.sgst) || 0;
      const igst = parseFloat(p.igst) || 0;
      const tax = parseFloat(p.taxAmount) || (cgst + sgst + igst);
      const taxable = p.subtotal !== undefined ? parseFloat(p.subtotal) : (gross - tax);

      gstr2Gross += gross;
      gstr2Taxable += taxable;
      gstr2Cgst += cgst;
      gstr2Sgst += sgst;
      gstr2Igst += igst;
      gstr2Tax += tax;

      return {
        id: p.id,
        date: p.date,
        supplier: p.supplier || 'N/A',
        gstin: p.supplierGstin || p.gstin || '',
        gross,
        taxable,
        cgst,
        sgst,
        igst,
        tax
      };
    });

    // HSN/SAC Summary (Sales items)
    const hsnMap = {};
    filteredSales.forEach(s => {
      // Check if interstate
      const isInterstate = (parseFloat(s.igst) || 0) > 0 || ((parseFloat(s.cgst) || 0) === 0 && (parseFloat(s.igst) || 0) > 0);
      const itemsList = s.items && typeof s.items === 'string' ? (() => {
        try { return JSON.parse(s.items); } catch { return []; }
      })() : (Array.isArray(s.items) ? s.items : []);

      itemsList.forEach(it => {
        const code = (it.hsnSac || it.hsn || '').trim() || 'N/A';
        const name = it.name || 'Unknown Item';
        const qty = parseFloat(it.qty || it.quantity) || 0;
        const rate = parseFloat(it.rate || it.price) || 0;
        const totalVal = parseFloat(it.total || it.amount) || (qty * rate);
        const gstRate = parseFloat(it.gstRate) || 18;

        let taxableVal = 0;
        let taxVal = 0;
        if (it.isTaxInclusive) {
          taxableVal = totalVal / (1 + (gstRate / 100));
          taxVal = totalVal - taxableVal;
        } else {
          taxableVal = totalVal;
          taxVal = totalVal * (gstRate / 100);
        }

        const cgst = isInterstate ? 0 : taxVal / 2;
        const sgst = isInterstate ? 0 : taxVal / 2;
        const igst = isInterstate ? taxVal : 0;

        if (!hsnMap[code]) {
          hsnMap[code] = { code, description: name, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        }
        hsnMap[code].qty += qty;
        hsnMap[code].taxable += taxableVal;
        hsnMap[code].cgst += cgst;
        hsnMap[code].sgst += sgst;
        hsnMap[code].igst += igst;
        hsnMap[code].total += (taxableVal + taxVal);
      });
    });
    const hsnSummary = Object.values(hsnMap);

    // Tax Slabs Summary (Sales and Purchases)
    const taxSlabMap = {};
    const getOrInitSlab = (slab) => {
      if (!taxSlabMap[slab]) {
        taxSlabMap[slab] = {
          slab,
          salesTaxable: 0,
          salesCgst: 0,
          salesSgst: 0,
          salesIgst: 0,
          salesTax: 0,
          purchasesTaxable: 0,
          purchasesCgst: 0,
          purchasesSgst: 0,
          purchasesIgst: 0,
          purchasesTax: 0
        };
      }
      return taxSlabMap[slab];
    };

    // Aggregate sales by tax slab
    filteredSales.forEach(s => {
      const isInterstate = (parseFloat(s.igst) || 0) > 0;
      const itemsList = s.items && typeof s.items === 'string' ? (() => {
        try { return JSON.parse(s.items); } catch { return []; }
      })() : (Array.isArray(s.items) ? s.items : []);

      if (itemsList.length > 0) {
        itemsList.forEach(it => {
          const rate = parseFloat(it.gstRate || it.taxSlab) || 0;
          const slabStr = `${rate}%`;
          const itemTotal = Number(it.total || (it.qty * it.rate) || 0);

          let taxable = 0;
          let taxVal = 0;
          if (it.isTaxInclusive) {
            taxable = itemTotal / (1 + (rate / 100));
            taxVal = itemTotal - taxable;
          } else {
            taxable = itemTotal;
            taxVal = itemTotal * (rate / 100);
          }

          const cgst = isInterstate ? 0 : taxVal / 2;
          const sgst = isInterstate ? 0 : taxVal / 2;
          const igst = isInterstate ? taxVal : 0;

          const slabObj = getOrInitSlab(slabStr);
          slabObj.salesTaxable += taxable;
          slabObj.salesCgst += cgst;
          slabObj.salesSgst += sgst;
          slabObj.salesIgst += igst;
          slabObj.salesTax += taxVal;
        });
      } else {
        const cgst = parseFloat(s.cgst) || 0;
        const sgst = parseFloat(s.sgst) || 0;
        const igst = parseFloat(s.igst) || 0;
        const taxVal = parseFloat(s.taxAmount) || (cgst + sgst + igst);
        const taxable = s.subtotal !== undefined ? parseFloat(s.subtotal) : ((parseFloat(s.amount) || 0) - taxVal);
        
        const slabObj = getOrInitSlab('18%');
        slabObj.salesTaxable += taxable;
        slabObj.salesCgst += cgst;
        slabObj.salesSgst += sgst;
        slabObj.salesIgst += igst;
        slabObj.salesTax += taxVal;
      }
    });

    // Aggregate purchases by tax slab
    filteredPurchases.forEach(p => {
      const isInterstate = (parseFloat(p.igst) || 0) > 0;
      const itemsList = p.items && typeof p.items === 'string' ? (() => {
        try { return JSON.parse(p.items); } catch { return []; }
      })() : (Array.isArray(p.items) ? p.items : []);

      if (itemsList.length > 0) {
        itemsList.forEach(it => {
          const rate = parseFloat(it.gstRate || it.taxSlab) || 0;
          const slabStr = `${rate}%`;
          const itemTotal = Number(it.total || (it.qty * it.rate) || 0);

          let taxable = 0;
          let taxVal = 0;
          if (it.isTaxInclusive) {
            taxable = itemTotal / (1 + (rate / 100));
            taxVal = itemTotal - taxable;
          } else {
            taxable = itemTotal;
            taxVal = itemTotal * (rate / 100);
          }

          const cgst = isInterstate ? 0 : taxVal / 2;
          const sgst = isInterstate ? 0 : taxVal / 2;
          const igst = isInterstate ? taxVal : 0;

          const slabObj = getOrInitSlab(slabStr);
          slabObj.purchasesTaxable += taxable;
          slabObj.purchasesCgst += cgst;
          slabObj.purchasesSgst += sgst;
          slabObj.purchasesIgst += igst;
          slabObj.purchasesTax += taxVal;
        });
      } else {
        const cgst = parseFloat(p.cgst) || 0;
        const sgst = parseFloat(p.sgst) || 0;
        const igst = parseFloat(p.igst) || 0;
        const taxVal = parseFloat(p.taxAmount) || (cgst + sgst + igst);
        const taxable = p.subtotal !== undefined ? parseFloat(p.subtotal) : ((parseFloat(p.amount) || 0) - taxVal);

        const slabObj = getOrInitSlab('18%');
        slabObj.purchasesTaxable += taxable;
        slabObj.purchasesCgst += cgst;
        slabObj.purchasesSgst += sgst;
        slabObj.purchasesIgst += igst;
        slabObj.purchasesTax += taxVal;
      }
    });

    const taxSummaryList = Object.values(taxSlabMap);

    return {
      gstr1: {
        invoices: gstr1Invoices,
        totals: {
          gross: gstr1Gross,
          taxable: gstr1Taxable,
          cgst: gstr1Cgst,
          sgst: gstr1Sgst,
          igst: gstr1Igst,
          tax: gstr1Tax
        }
      },
      gstr2: {
        invoices: gstr2Invoices,
        totals: {
          gross: gstr2Gross,
          taxable: gstr2Taxable,
          cgst: gstr2Cgst,
          sgst: gstr2Sgst,
          igst: gstr2Igst,
          tax: gstr2Tax
        }
      },
      gstr3b: {
        outward: {
          taxable: gstr1Taxable,
          cgst: gstr1Cgst,
          sgst: gstr1Sgst,
          igst: gstr1Igst,
          totalTax: gstr1Tax
        },
        inward: {
          taxable: gstr2Taxable,
          cgst: gstr2Cgst,
          sgst: gstr2Sgst,
          igst: gstr2Igst,
          totalTax: gstr2Tax
        },
        net: {
          cgst: gstr1Cgst - gstr2Cgst,
          sgst: gstr1Sgst - gstr2Sgst,
          igst: gstr1Igst - gstr2Igst,
          total: gstr1Tax - gstr2Tax
        }
      },
      hsnSummary,
      taxSummaryList
    };
  }, [dbData?.sales, dbData?.purchases, from, to]);

  const getActiveReportData = () => {
    switch (tab) {
      case 'financial':
        if (financialSubTab === 'pl') return [
          { LineItem: 'Gross Revenue (Income)', Amount: advancedFinancialReport.revenue },
          { LineItem: 'Operating cost (Purchases & Expenses)', Amount: advancedFinancialReport.totalExpenses },
          { LineItem: 'Net Profit Margin', Amount: advancedFinancialReport.netProfit }
        ];
        if (financialSubTab === 'bs') return [
          { Item: 'Cash Balance', Type: 'Asset', Value: advancedFinancialReport.cashBalance },
          { Item: 'Bank Balance', Type: 'Asset', Value: advancedFinancialReport.bankBalance },
          { Item: 'Receivables', Type: 'Asset', Value: advancedFinancialReport.receivables },
          { Item: 'Stock Valuation', Type: 'Asset', Value: advancedFinancialReport.inventoryValuation },
          { Item: 'Payables', Type: 'Liability', Value: advancedFinancialReport.payables },
          { Item: 'Retained Earnings', Type: 'Equity', Value: advancedFinancialReport.netProfit },
          { Item: 'Owner Capital', Type: 'Equity', Value: Math.max(0, advancedFinancialReport.equity - advancedFinancialReport.netProfit) }
        ];
        if (financialSubTab === 'cf') return [
          { Item: 'Cash Inflow (Sales)', Value: advancedFinancialReport.revenue },
          { Item: 'Cash Outflow (Purchases)', Value: -advancedFinancialReport.purchaseCost },
          { Item: 'Cash Outflow (Expenses)', Value: -advancedFinancialReport.expenseCost },
          { Item: 'Net Cash Change', Value: advancedFinancialReport.netProfit }
        ];
        if (financialSubTab === 'tb') return [
          { Account: 'Cash in Hand', Type: 'Asset', Debit: advancedFinancialReport.cashBalance, Credit: 0 },
          { Account: 'Bank Balance', Type: 'Asset', Debit: advancedFinancialReport.bankBalance, Credit: 0 },
          { Account: 'Stock Valuation', Type: 'Asset', Debit: advancedFinancialReport.inventoryValuation, Credit: 0 },
          { Account: 'Accounts Receivable', Type: 'Asset', Debit: advancedFinancialReport.receivables, Credit: 0 },
          { Account: 'Accounts Payable', Type: 'Liability', Debit: 0, Credit: advancedFinancialReport.payables },
          { Account: 'Sales Revenue', Type: 'Revenue', Debit: 0, Credit: advancedFinancialReport.revenue },
          { Account: 'Purchase Cost', Type: 'Expense', Debit: advancedFinancialReport.purchaseCost, Credit: 0 },
          { Account: 'Operating Expenses', Type: 'Expense', Debit: advancedFinancialReport.expenseCost, Credit: 0 }
        ];
        if (financialSubTab === 'db') return advancedFinancialReport.dayBook;
        if (financialSubTab === 'cb') return advancedFinancialReport.cashBook;
        if (financialSubTab === 'bb') return advancedFinancialReport.bankBook;
        return [];
      case 'purchase':
        return purchaseReportsAggData.supplierData;
      case 'inventory':
        if (innerInventoryTab === 'summary') return inventoryReportData.summaryList;
        if (innerInventoryTab === 'low_stock') return inventoryReportData.lowStockList;
        if (innerInventoryTab === 'out_of_stock') return inventoryReportData.outOfStockList;
        if (innerInventoryTab === 'dead_stock') return inventoryReportData.deadStockList;
        if (innerInventoryTab === 'movement') return inventoryReportData.movementLog;
        if (innerInventoryTab === 'expiry') return [...inventoryReportData.expiredList, ...inventoryReportData.expiringSoonList];
        return [];
      case 'delivery':
        return Array.isArray(data) ? data : [];
      case 'gst':
        if (gstSubTab === 'gstr1') return gstReportsData.gstr1.invoices;
        if (gstSubTab === 'gstr2') return gstReportsData.gstr2.invoices;
        if (gstSubTab === 'gstr3b') return [
          { Section: 'Outward Supplies', CGST: gstReportsData.gstr3b.outward.cgst, SGST: gstReportsData.gstr3b.outward.sgst, IGST: gstReportsData.gstr3b.outward.igst, Total: gstReportsData.gstr3b.outward.totalTax },
          { Section: 'Eligible ITC Inward', CGST: gstReportsData.gstr3b.inward.cgst, SGST: gstReportsData.gstr3b.inward.sgst, IGST: gstReportsData.gstr3b.inward.igst, Total: gstReportsData.gstr3b.inward.totalTax },
          { Section: 'Net Tax Balance', CGST: gstReportsData.gstr3b.net.cgst, SGST: gstReportsData.gstr3b.net.sgst, IGST: gstReportsData.gstr3b.net.igst, Total: gstReportsData.gstr3b.net.total }
        ];
        if (gstSubTab === 'hsn') return gstReportsData.hsnSummary;
        if (gstSubTab === 'tax') return gstReportsData.taxSummaryList;
        return [];
      case 'party':
        if (partySubTab === 'cust_out') return advancedPartyReport.customerOutstanding;
        if (partySubTab === 'supp_out') return advancedPartyReport.supplierOutstanding;
        if (partySubTab === 'ageing') return Object.values(advancedPartyReport.ageingBuckets).filter(b => Array.isArray(b)).flat();
        if (partySubTab === 'lookup') return Array.isArray(data) ? data : [];
        return [];
      case 'builder':
        const rawCustomData = dbData[customEntity] || [];
        let filteredCustom = rawCustomData.filter(row => {
          return customFilters.every(f => {
            if (!f.field || !f.operator) return true;
            const val = row[f.field];
            const target = f.value;
            if (val === undefined || val === null) return false;
            switch (f.operator) {
              case 'equals': return String(val).toLowerCase() === String(target).toLowerCase();
              case 'contains': return String(val).toLowerCase().includes(String(target).toLowerCase());
              case 'gt': return Number(val) > Number(target);
              case 'lt': return Number(val) < Number(target);
              default: return true;
            }
          });
        });
        if (customSortBy) {
          filteredCustom.sort((a, b) => {
            const valA = a[customSortBy];
            const valB = b[customSortBy];
            if (customSortOrder === 'desc') return valB > valA ? 1 : -1;
            return valA > valB ? 1 : -1;
          });
        }
        return filteredCustom.map(row => {
          let projected = {};
          customFields.forEach(f => {
            projected[f] = row[f] !== undefined ? row[f] : '-';
          });
          return projected;
        });
      default:
        return [];
    }
  };

  const handleExportCSV = () => {
    const dataToExport = getActiveReportData();
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + "\n" + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `report_${tab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const dataToExport = getActiveReportData();
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `report_${tab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = async () => {
    const container = document.getElementById("report-active-tab-container");
    if (!container) {
      alert("Export container not found.");
      return;
    }
    try {
      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`report_${tab}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF.");
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Premium Header */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px', background: 'linear-gradient(135deg, #2563eb0c, #6366f105)', borderLeft: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-1)' }}>Reports & AI Advisory</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-3)' }}>Real-time business intelligence ledger, 3PL delivery performance, and AI-driven growth suggestions.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge" style={{ backgroundColor: '#2563eb20', color: '#2563eb', border: '1px solid #2563eb30', padding: '6px 12px', fontSize: '12px', borderRadius: '15px', fontWeight: 'bold' }}>
              <i className="fas fa-robot" style={{ marginRight: '6px' }}></i> AI Co-pilot Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="card" style={{ padding: '20px' }}>
        {/* Navigation Tab pills */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button className={`btn ${tab === 'financial' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('financial')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-indian-rupee-sign"></i> Financial
          </button>
          <button className={`btn ${tab === 'purchase' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('purchase')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-cart-shopping"></i> Purchases
          </button>
          <button className={`btn ${tab === 'inventory' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('inventory')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-boxes-stacked"></i> Inventory
          </button>
          <button className={`btn ${tab === 'delivery' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('delivery')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-truck"></i> Delivery
          </button>
          <button className={`btn ${tab === 'gst' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('gst')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-file-invoice"></i> GST
          </button>
          <button className={`btn ${tab === 'party' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('party')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-users"></i> Party Reports
          </button>
          <button className={`btn ${tab === 'builder' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('builder')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-sliders"></i> Custom Builder
          </button>
          <button className={`btn ${tab === 'scheduler' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab('scheduler')} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-clock"></i> Auto-Reports & Email
          </button>
        </div>

        {/* Global Controls & Filters Row */}
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', background: 'var(--bg-1)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-3)' }}>FROM</span>
              <input type="date" className="fi" style={{ width: '150px', height: '36px', fontSize: '13px' }} value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-3)' }}>TO</span>
              <input type="date" className="fi" style={{ width: '150px', height: '36px', fontSize: '13px' }} value={to} onChange={e => setTo(e.target.value)} />
            </div>
            {tab !== 'party' && tab !== 'builder' && tab !== 'scheduler' && (
              <input className="fi" placeholder="Filter rows..." value={tableQ} onChange={e => setTableQ(e.target.value)} style={{ width: '200px', height: '36px', fontSize: '13px' }} />
            )}
            <button className="btn btn--primary" onClick={() => { fetchTab(); fetchSalesCharts(); }} style={{ padding: '8px 16px', height: '36px' }}>
              Apply Filters
            </button>
            <button className="btn" onClick={() => { setFrom(''); setTo(''); setTableQ(''); }} style={{ padding: '8px 16px', height: '36px' }}>
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {tab !== 'scheduler' && (
              <>
                <button className="btn btn--outline" onClick={handleExportCSV} style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}>
                  <i className="fas fa-file-csv" style={{ color: '#10b981' }}></i> CSV
                </button>
                <button className="btn btn--outline" onClick={handleExportExcel} style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}>
                  <i className="fas fa-file-excel" style={{ color: '#0f766e' }}></i> Excel
                </button>
                <button className="btn btn--outline" onClick={handleExportPDF} style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}>
                  <i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i> PDF
                </button>
              </>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-3)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px' }}></i> Loading ledger reports...
          </div>
        )}

        {!loading && (
          <div id="report-active-tab-container">
            {/* Financial Overview Tab */}
            {tab === 'financial' && (
              <div>
                {/* Nested pill tabs for different financial reports */}
                <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '5px', flexWrap: 'wrap' }}>
                  <button className={`btn btn--sm ${financialSubTab === 'pl' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('pl')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Profit & Loss
                  </button>
                  <button className={`btn btn--sm ${financialSubTab === 'bs' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('bs')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Balance Sheet
                  </button>
                  <button className={`btn btn--sm ${financialSubTab === 'cf' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('cf')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Cash Flow Statement
                  </button>
                  <button className={`btn btn--sm ${financialSubTab === 'tb' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('tb')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Trial Balance
                  </button>
                  <button className={`btn btn--sm ${financialSubTab === 'db' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('db')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Day Book
                  </button>
                  <button className={`btn btn--sm ${financialSubTab === 'cb' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('cb')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Cash Book
                  </button>
                  <button className={`btn btn--sm ${financialSubTab === 'bb' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setFinancialSubTab('bb')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Bank Book
                  </button>
                </div>

                {/* Sub Tab contents */}
                {financialSubTab === 'pl' && (
                  <div>
                    <div className="two-col" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      <div style={{ flex: 1, minWidth: '320px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))', borderLeft: '4px solid #10b981' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Gross Revenue</span>
                          <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>
                            {fmt(advancedFinancialReport.revenue)}
                          </h3>
                        </div>
                        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))', borderLeft: '4px solid #ef4444' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Operating Cost</span>
                          <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>
                            {fmt(advancedFinancialReport.totalExpenses)}
                          </h3>
                        </div>
                        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))', borderLeft: '4px solid #3b82f6' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Net Profit</span>
                          <h3 style={{ fontSize: '22px', color: '#3b82f6', margin: '5px 0 0 0', fontWeight: '800' }}>
                            {fmt(advancedFinancialReport.netProfit)}
                          </h3>
                        </div>
                      </div>

                      {/* AI Advisory Panel */}
                      <div className="card" style={{ width: '360px', flexShrink: 0, padding: '15px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))', borderLeft: '4px solid #6366f1' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <i className="fas fa-brain" style={{ color: '#6366f1' }}></i> AI Assistant Suggestions
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                          <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                            <strong>📈 Revenue Momentum</strong>: Sales show positive momentum. AI recommends bundling slow-moving stock with popular accessories.
                          </div>
                          <div style={{ padding: '8px 0 0 0' }}>
                            <strong>🛡️ Stockout Safeguard</strong>: Reorder list has detected items below warning boundaries. Initiate orders to prevent sale drops.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Line & Bar Charts */}
                    <div className="two-col" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div className="card chart-area" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                        <div className="card__head" style={{ marginBottom: '10px' }}><span>Sales Chronological Trend</span></div>
                        <div style={{ height: '240px' }}>{salesDayChart()}</div>
                      </div>
                      <div className="card chart-area" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                        <div className="card__head" style={{ marginBottom: '10px' }}><span>Sales by Catalog Product</span></div>
                        <div style={{ height: '240px' }}>{salesProductChart()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {financialSubTab === 'bs' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Balance Sheet Statement (Estimated Ledger Balances)</h4>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      {/* Assets Column */}
                      <div className="card" style={{ flex: 1, minWidth: '300px', padding: '16px' }}>
                        <h5 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '8px', color: 'var(--green)' }}>ASSETS</h5>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Cash in Hand Balance</span>
                          <strong>{fmt(advancedFinancialReport.cashBalance)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Bank & Digital Wallet Account</span>
                          <strong>{fmt(advancedFinancialReport.bankBalance)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Accounts Receivable (Customer Dues)</span>
                          <strong>{fmt(advancedFinancialReport.receivables)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Stock Valuation (Asset Value)</span>
                          <strong>{fmt(advancedFinancialReport.inventoryValuation)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: '15px', fontWeight: 'bold' }}>
                          <span>TOTAL ASSETS</span>
                          <span style={{ color: 'var(--green)' }}>{fmt(advancedFinancialReport.totalAssets)}</span>
                        </div>
                      </div>

                      {/* Liabilities & Equity Column */}
                      <div className="card" style={{ flex: 1, minWidth: '300px', padding: '16px' }}>
                        <h5 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '8px', color: 'var(--red)' }}>LIABILITIES & EQUITY</h5>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Accounts Payable (Supplier Dues)</span>
                          <strong>{fmt(advancedFinancialReport.payables)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Current Period Retained Earnings</span>
                          <strong>{fmt(advancedFinancialReport.netProfit)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Owner's Capital (Net Worth)</span>
                          <strong>{fmt(Math.max(0, advancedFinancialReport.equity - advancedFinancialReport.netProfit))}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: '15px', fontWeight: 'bold' }}>
                          <span>TOTAL LIABILITIES & EQUITY</span>
                          <span style={{ color: 'var(--red)' }}>{fmt(advancedFinancialReport.totalLiabilities + advancedFinancialReport.equity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {financialSubTab === 'cf' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Cash Flow Statement Summary</h4>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <span><strong>Cash Receipts (Inflow from Sales)</strong></span>
                        <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>+{fmt(advancedFinancialReport.revenue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <span><strong>Cash Outflow (Payments for Purchases)</strong></span>
                        <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>-{fmt(advancedFinancialReport.purchaseCost)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <span><strong>Cash Outflow (Payments for Expenses)</strong></span>
                        <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>-{fmt(advancedFinancialReport.expenseCost)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
                        <span>NET CASH FLOW CHANGE</span>
                        <span style={{ color: advancedFinancialReport.netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {fmt(advancedFinancialReport.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {financialSubTab === 'tb' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Trial Balance (Asset/Expense Debits vs Revenue/Liabilities Credits)</h4>
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
                        <tr>
                          <td>Cash in Hand Account</td>
                          <td>Asset</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.cashBalance)}</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                        </tr>
                        <tr>
                          <td>Bank Account balance</td>
                          <td>Asset</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.bankBalance)}</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                        </tr>
                        <tr>
                          <td>Inventory Asset account</td>
                          <td>Asset</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.inventoryValuation)}</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                        </tr>
                        <tr>
                          <td>Accounts Receivable ledger</td>
                          <td>Asset</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.receivables)}</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                        </tr>
                        <tr>
                          <td>Accounts Payable ledger</td>
                          <td>Liability</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.payables)}</td>
                        </tr>
                        <tr>
                          <td>Sales Revenue Account</td>
                          <td>Revenue</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.revenue)}</td>
                        </tr>
                        <tr>
                          <td>Purchase Cost Account</td>
                          <td>Expense</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.purchaseCost)}</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                        </tr>
                        <tr>
                          <td>Operating Expenses Account</td>
                          <td>Expense</td>
                          <td style={{ textAlign: 'right' }}>{fmt(advancedFinancialReport.expenseCost)}</td>
                          <td style={{ textAlign: 'right' }}>-</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                          <td>TOTAL BALANCED</td>
                          <td>-</td>
                          <td style={{ textAlign: 'right', color: 'var(--green)' }}>
                            {fmt(advancedFinancialReport.cashBalance + advancedFinancialReport.bankBalance + advancedFinancialReport.inventoryValuation + advancedFinancialReport.receivables + advancedFinancialReport.purchaseCost + advancedFinancialReport.expenseCost)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--green)' }}>
                            {fmt(advancedFinancialReport.payables + advancedFinancialReport.revenue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {financialSubTab === 'db' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Chronological Day Book (All Ledger transactions)</h4>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Transaction Description</th>
                          <th>Method</th>
                          <th>Transaction Type</th>
                          <th style={{ textAlign: 'right' }}>Cash Inflow</th>
                          <th style={{ textAlign: 'right' }}>Cash Outflow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedFinancialReport.dayBook.length > 0 ? (
                          advancedFinancialReport.dayBook.map((item, idx) => (
                            <tr key={idx}>
                              <td>{new Date(item.date).toLocaleString()}</td>
                              <td style={{ fontWeight: 600 }}>{item.description}</td>
                              <td><span className="badge" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>{item.mode}</span></td>
                              <td>{item.type}</td>
                              <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 'bold' }}>{item.inflow > 0 ? `+${fmt(item.inflow)}` : '-'}</td>
                              <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>{item.outflow > 0 ? `-${fmt(item.outflow)}` : '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No transactions found for this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {financialSubTab === 'cb' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Cash Book Ledger (Cash Mode transactions)</h4>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'right' }}>Receipt (Debit)</th>
                          <th style={{ textAlign: 'right' }}>Payment (Credit)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedFinancialReport.cashBook.length > 0 ? (
                          advancedFinancialReport.cashBook.map((item, idx) => (
                            <tr key={idx}>
                              <td>{new Date(item.date).toLocaleString()}</td>
                              <td>{item.description}</td>
                              <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 'bold' }}>{item.inflow > 0 ? `+${fmt(item.inflow)}` : '-'}</td>
                              <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>{item.outflow > 0 ? `-${fmt(item.outflow)}` : '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No cash transactions found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {financialSubTab === 'bb' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Bank Book Ledger (Bank & Online UPI transactions)</h4>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Description</th>
                          <th>Online Mode</th>
                          <th style={{ textAlign: 'right' }}>Inflow (Debit)</th>
                          <th style={{ textAlign: 'right' }}>Outflow (Credit)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedFinancialReport.bankBook.length > 0 ? (
                          advancedFinancialReport.bankBook.map((item, idx) => (
                            <tr key={idx}>
                              <td>{new Date(item.date).toLocaleString()}</td>
                              <td>{item.description}</td>
                              <td><code>{item.mode}</code></td>
                              <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 'bold' }}>{item.inflow > 0 ? `+${fmt(item.inflow)}` : '-'}</td>
                              <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>{item.outflow > 0 ? `-${fmt(item.outflow)}` : '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No bank transactions found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Purchase Analytics Tab */}
            {tab === 'purchase' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>Supplier-wise & Product-wise Procurement</h4>
                  <button className="btn btn--sm" onClick={() => exportCSV('/api/admin/reports/purchase', { groupBy: 'supplier' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-file-csv"></i> Export Supplier CSV
                  </button>
                </div>

                {/* KPI Cards Grid */}
                <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))', borderLeft: '4px solid #ef4444' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Procurement Cost</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>
                      {fmt(purchaseReportsAggData.summary.totalProcurement)}
                    </h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))', borderLeft: '4px solid #3b82f6' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Purchase Orders</span>
                    <h3 style={{ fontSize: '22px', color: '#3b82f6', margin: '5px 0 0 0', fontWeight: '800' }}>
                      {purchaseReportsAggData.summary.orderCount}
                    </h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))', borderLeft: '4px solid #8b5cf6' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Avg Ticket Value</span>
                    <h3 style={{ fontSize: '22px', color: '#8b5cf6', margin: '5px 0 0 0', fontWeight: '800' }}>
                      {fmt(purchaseReportsAggData.summary.avgPurchaseValue)}
                    </h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(20, 184, 166, 0.02))', borderLeft: '4px solid #14b8a6' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Suppliers</span>
                    <h3 style={{ fontSize: '22px', color: '#14b8a6', margin: '5px 0 0 0', fontWeight: '800' }}>
                      {purchaseReportsAggData.summary.activeSuppliers}
                    </h3>
                  </div>
                </div>

                {/* Charts and Tables */}
                <div className="two-col" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {/* Supplier Share Doughnut */}
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
                  </div>

                  {/* Monthly Trend Chart */}
                  <div className="card chart-area" style={{ flex: 1, minWidth: '320px', padding: '15px' }}>
                    <div className="card__head" style={{ marginBottom: '10px' }}><span>Monthly Purchase Trend</span></div>
                    <div style={{ height: '180px' }}>
                      {purchaseReportsAggData.timeData.labels.length > 0 ? (
                        <Bar
                          data={{
                            labels: purchaseReportsAggData.timeData.labels,
                            datasets: [{
                              label: 'Procurements',
                              data: purchaseReportsAggData.timeData.values,
                              backgroundColor: 'rgba(239, 68, 68, 0.7)'
                            }]
                          }}
                          options={{ responsive: true, maintainAspectRatio: false }}
                        />
                      ) : (
                        <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-3)' }}>No history.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Supplier Table */}
                <table className="tbl" style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th style={{ textAlign: 'right' }}>Total Cost Amount</th>
                      <th style={{ textAlign: 'right' }}>Invoices count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseReportsAggData.supplierData
                      .filter(r => !tableQ.trim() || r.supplier.toLowerCase().includes(tableQ.toLowerCase()))
                      .map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.supplier}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(r.totalAmount)}</td>
                          <td style={{ textAlign: 'right' }}>{r.invoiceCount}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* Advanced Inventory Reports Tab */}
            {tab === 'inventory' && (
              <div>
                {/* KPI Cards Grid */}
                <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))', borderLeft: '4px solid #3b82f6' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Unique SKUs</span>
                    <h3 style={{ fontSize: '22px', color: '#3b82f6', margin: '5px 0 0 0', fontWeight: '800' }}>{inventoryReportData.totalSKUs}</h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))', borderLeft: '4px solid #10b981' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Inventory Value</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--green)', margin: '5px 0 0 0', fontWeight: '800' }}>{fmt(inventoryReportData.totalInventoryValue)}</h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))', borderLeft: '4px solid #f59e0b' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Low Stock Alert SKUs</span>
                    <h3 style={{ fontSize: '22px', color: '#f59e0b', margin: '5px 0 0 0', fontWeight: '800' }}>{inventoryReportData.lowStockList.length}</h3>
                  </div>
                  <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))', borderLeft: '4px solid #ef4444' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Stockouts</span>
                    <h3 style={{ fontSize: '22px', color: 'var(--red)', margin: '5px 0 0 0', fontWeight: '800' }}>{inventoryReportData.outOfStockList.length}</h3>
                  </div>
                </div>

                {/* Sub-navigation Menu */}
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

                {/* Sub Tab contents */}
                <div className="card" style={{ padding: '16px' }}>
                  {innerInventoryTab === 'summary' && (
                    <div>
                      <h4 style={{ marginBottom: '12px' }}>Inventory Valuation Ledger</h4>
                      <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
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
                          {inventoryReportData.summaryList
                            .filter(r => !tableQ.trim() || r.name.toLowerCase().includes(tableQ.toLowerCase()))
                            .map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.name}</td>
                                <td><code>{p.sku}</code></td>
                                <td style={{ textAlign: 'right', fontWeight: '500' }}>{p.stock}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(p.purchasePrice)}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(p.price)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.valuation)}</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  )}

                  {innerInventoryTab === 'low_stock' && (
                    <div>
                      <h4 style={{ marginBottom: '12px', color: '#f59e0b' }}>Low Stock Warning</h4>
                      <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'right' }}>Current Stock</th>
                            <th style={{ textAlign: 'right' }}>Min Threshold</th>
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
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>Optimal stock. No low levels detected.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {innerInventoryTab === 'out_of_stock' && (
                    <div>
                      <h4 style={{ marginBottom: '12px', color: 'var(--red)' }}>Out of Stock List</h4>
                      <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'right' }}>Current Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.outOfStockList.length > 0 ? (
                            inventoryReportData.outOfStockList.map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.name}</td>
                                <td><code>{p.sku || 'N/A'}</code></td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{p.stock}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No stockout items detected.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {innerInventoryTab === 'dead_stock' && (
                    <div>
                      <h4 style={{ marginBottom: '12px' }}>Dead Stock Reports (0 sales recorded)</h4>
                      <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
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
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>All products actively selling.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {innerInventoryTab === 'movement' && (
                    <div>
                      <h4 style={{ marginBottom: '12px' }}>Stock Movement ledger</h4>
                      <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Product Name</th>
                            <th>Type</th>
                            <th style={{ textAlign: 'right' }}>Qty Change</th>
                            <th>Reference ID</th>
                            <th>Party</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReportData.movementLog.length > 0 ? (
                            inventoryReportData.movementLog.map((m, idx) => (
                              <tr key={idx}>
                                <td>{new Date(m.date).toLocaleString()}</td>
                                <td>{m.product}</td>
                                <td>{m.type}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: m.qty > 0 ? 'var(--green)' : 'var(--red)' }}>
                                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                                </td>
                                <td><code>{m.refId}</code></td>
                                <td>{m.party}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No logs.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {innerInventoryTab === 'expiry' && (
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <h5 style={{ color: 'var(--red)', marginBottom: '8px' }}>Expired Items ({inventoryReportData.expiredList.length})</h5>
                        <table className="tbl" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr><th>Name</th><th>Expiry Date</th></tr>
                          </thead>
                          <tbody>
                            {inventoryReportData.expiredList.length > 0 ? (
                              inventoryReportData.expiredList.map((e, idx) => (
                                <tr key={idx}><td>{e.name}</td><td style={{ color: 'var(--red)', fontWeight: 'bold' }}>{e.expiryDate}</td></tr>
                              ))
                            ) : (
                              <tr><td colSpan="2" style={{ textAlign: 'center' }}>No expired items.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <h5 style={{ color: '#f59e0b', marginBottom: '8px' }}>Expiring Soon (30 Days) ({inventoryReportData.expiringSoonList.length})</h5>
                        <table className="tbl" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr><th>Name</th><th>Expiry Date</th></tr>
                          </thead>
                          <tbody>
                            {inventoryReportData.expiringSoonList.length > 0 ? (
                              inventoryReportData.expiringSoonList.map((e, idx) => (
                                <tr key={idx}><td>{e.name}</td><td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{e.expiryDate}</td></tr>
                              ))
                            ) : (
                              <tr><td colSpan="2" style={{ textAlign: 'center' }}>No items expiring soon.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Analytics Tab */}
            {tab === 'delivery' && (() => {
              const totalShipments = Array.isArray(data) ? data.length : 0;
              const delivered = Array.isArray(data) ? data.filter(d => ['delivered', 'Delivered'].includes(d.status)).length : 0;
              const pending = Array.isArray(data) ? data.filter(d => ['pending', 'assigned', 'out_for_delivery', 'Pending', 'Assigned', 'Out for delivery', 'Rescheduled', 'rescheduled'].includes(d.status)).length : 0;
              const failed = Array.isArray(data) ? data.filter(d => ['failed', 'returned', 'Failed', 'Returned'].includes(d.status) || d.returnInitiated || d.returnInfo).length : 0;
              const denominator = totalShipments - pending;
              const successRate = denominator > 0 ? ((delivered / denominator) * 100).toFixed(1) : '0.0';

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0 }}>Delivery & 3PL Shipment Statistics</h4>
                    <button className="btn btn--sm" onClick={() => exportCSV('/api/admin/reports/delivery')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className="fas fa-file-csv"></i> Export CSV
                    </button>
                  </div>

                  {/* Metrics Cards */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 150, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                      <strong style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Total Shipments</strong>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: '#3b82f6' }}>{totalShipments}</div>
                    </div>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 150, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                      <strong style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Delivery Success Rate</strong>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: '#10b981' }}>{successRate}%</div>
                    </div>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 150, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                      <strong style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Delivered</strong>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: '#10b981' }}>{delivered}</div>
                    </div>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 150, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                      <strong style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Pending Dispatch</strong>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: '#f59e0b' }}>{pending}</div>
                    </div>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 150, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                      <strong style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Failed / Returned</strong>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: '#ef4444' }}>{failed}</div>
                    </div>
                  </div>

                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Driver / Carrier</th>
                        <th>Charges</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(data) && data.filter(r => !tableQ.trim() || JSON.stringify(r).toLowerCase().includes(tableQ.toLowerCase())).map((r, i) => {
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{r.orderId || String(r._id).slice(0, 8)}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{r.customer?.name || r.customerName || '-'}</div>
                              {(r.customer?.phone || r.customerPhone) && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>📞 {r.customer?.phone || r.customerPhone}</div>}
                            </td>
                            <td>
                              <span className={`badge ${['delivered', 'Delivered'].includes(r.status) ? 'badge--green' : ['failed', 'returned', 'Failed', 'Returned'].includes(r.status) ? 'badge--red' : ['out_for_delivery', 'Out for delivery', 'Out For Delivery'].includes(r.status) ? 'badge--blue' : 'badge--yellow'}`} style={{ textTransform: 'capitalize' }}>
                                {(r.status || '').replace('_', ' ')}
                              </span>
                            </td>
                            <td>{r.assignedTo || r.assignedDriver || r.carrierName || '-'}</td>
                            <td>₹{r.billAmount || r.charges || 0}</td>
                            <td>{(r.createdAt || '').slice(0, 10)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* GST Summary Tab */}
            {tab === 'gst' && (
              <div>
                {/* Sub Tab Navigation */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '10px', flexWrap: 'wrap' }}>
                  <button className={`btn btn--sm ${gstSubTab === 'gstr1' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setGstSubTab('gstr1')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    GSTR-1 (Sales)
                  </button>
                  <button className={`btn btn--sm ${gstSubTab === 'gstr2' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setGstSubTab('gstr2')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    GSTR-2 (Purchases)
                  </button>
                  <button className={`btn btn--sm ${gstSubTab === 'gstr3b' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setGstSubTab('gstr3b')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    GSTR-3B (Summary)
                  </button>
                  <button className={`btn btn--sm ${gstSubTab === 'hsn' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setGstSubTab('hsn')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    HSN Summary
                  </button>
                  <button className={`btn btn--sm ${gstSubTab === 'tax' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setGstSubTab('tax')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Tax summary
                  </button>
                </div>

                {/* Sub Tab Contents */}
                {gstSubTab === 'gstr1' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0 }}>GSTR-1 Outward Supplies (Tax on Sales)</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn--sm" onClick={() => exportCSV('/api/admin/reports/gst')}>
                          <i className="fas fa-file-csv"></i> Export GSTR-1 CSV
                        </button>
                      </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>GROSS SALES</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{fmt(gstReportsData.gstr1.totals.gross)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>TAXABLE VALUE</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{fmt(gstReportsData.gstr1.totals.taxable)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>CGST COLLECTED</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--green)' }}>{fmt(gstReportsData.gstr1.totals.cgst)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>SGST COLLECTED</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--green)' }}>{fmt(gstReportsData.gstr1.totals.sgst)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>IGST COLLECTED</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--green)' }}>{fmt(gstReportsData.gstr1.totals.igst)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent)', borderLeft: '3px solid #10b981' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>TOTAL TAX LIABILITY</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--green)' }}>{fmt(gstReportsData.gstr1.totals.tax)}</div>
                      </div>
                    </div>

                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Invoice No.</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>GSTIN</th>
                          <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                          <th style={{ textAlign: 'right' }}>CGST</th>
                          <th style={{ textAlign: 'right' }}>SGST</th>
                          <th style={{ textAlign: 'right' }}>IGST</th>
                          <th style={{ textAlign: 'right' }}>Total Tax</th>
                          <th style={{ textAlign: 'right' }}>Gross Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstReportsData.gstr1.invoices.length > 0 ? (
                          gstReportsData.gstr1.invoices
                            .filter(r => !tableQ.trim() || r.customer.toLowerCase().includes(tableQ.toLowerCase()) || r.id.toLowerCase().includes(tableQ.toLowerCase()))
                            .map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{r.id}</td>
                                <td>{(r.date || '').slice(0, 10)}</td>
                                <td>{r.customer}</td>
                                <td><code>{r.gstin || '-'}</code></td>
                                <td style={{ textAlign: 'right' }}>{fmt(r.taxable)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.cgst > 0 ? fmt(r.cgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.sgst > 0 ? fmt(r.sgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.igst > 0 ? fmt(r.igst) : '-'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--green)' }}>{fmt(r.tax)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(r.gross)}</td>
                              </tr>
                            ))
                        ) : (
                          <tr><td colSpan="10" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No sales transactions found in this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {gstSubTab === 'gstr2' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0 }}>GSTR-2 Inward Supplies (Input Tax Credit)</h4>
                      <button className="btn btn--sm" onClick={() => exportCSV('/api/admin/reports/purchase')}>
                        <i className="fas fa-file-csv"></i> Export GSTR-2 CSV
                      </button>
                    </div>

                    {/* KPI Cards Grid */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>GROSS PROCUREMENT</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{fmt(gstReportsData.gstr2.totals.gross)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>TAXABLE PURCHASES</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{fmt(gstReportsData.gstr2.totals.taxable)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>CGST INPUT (ITC)</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--blue)' }}>{fmt(gstReportsData.gstr2.totals.cgst)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>SGST INPUT (ITC)</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--blue)' }}>{fmt(gstReportsData.gstr2.totals.sgst)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>IGST INPUT (ITC)</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--blue)' }}>{fmt(gstReportsData.gstr2.totals.igst)}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent)', borderLeft: '3px solid #3b82f6' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold' }}>TOTAL ELIGIBLE ITC</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--blue)' }}>{fmt(gstReportsData.gstr2.totals.tax)}</div>
                      </div>
                    </div>

                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Bill Number</th>
                          <th>Date</th>
                          <th>Supplier</th>
                          <th>GSTIN</th>
                          <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                          <th style={{ textAlign: 'right' }}>CGST ITC</th>
                          <th style={{ textAlign: 'right' }}>SGST ITC</th>
                          <th style={{ textAlign: 'right' }}>IGST ITC</th>
                          <th style={{ textAlign: 'right' }}>Total ITC</th>
                          <th style={{ textAlign: 'right' }}>Gross Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstReportsData.gstr2.invoices.length > 0 ? (
                          gstReportsData.gstr2.invoices
                            .filter(r => !tableQ.trim() || r.supplier.toLowerCase().includes(tableQ.toLowerCase()) || r.id.toLowerCase().includes(tableQ.toLowerCase()))
                            .map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{r.id}</td>
                                <td>{(r.date || '').slice(0, 10)}</td>
                                <td>{r.supplier}</td>
                                <td><code>{r.gstin || '-'}</code></td>
                                <td style={{ textAlign: 'right' }}>{fmt(r.taxable)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.cgst > 0 ? fmt(r.cgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.sgst > 0 ? fmt(r.sgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.igst > 0 ? fmt(r.igst) : '-'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--blue)' }}>{fmt(r.tax)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(r.gross)}</td>
                              </tr>
                            ))
                        ) : (
                          <tr><td colSpan="10" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No purchase transactions found in this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {gstSubTab === 'gstr3b' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>GSTR-3B Self-Assessment Statement</h4>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      {/* Outward supplies liability card */}
                      <div className="card" style={{ flex: 1, minWidth: '320px', padding: '16px', borderLeft: '4px solid #10b981' }}>
                        <h5 style={{ color: 'var(--green)', marginTop: 0, marginBottom: '12px' }}>1. Taxable Outward Supplies & Liabilities</h5>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Total Outward Taxable Turnout</span>
                          <strong>{fmt(gstReportsData.gstr3b.outward.taxable)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>CGST Tax Liability Collected</span>
                          <strong>{fmt(gstReportsData.gstr3b.outward.cgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>SGST Tax Liability Collected</span>
                          <strong>{fmt(gstReportsData.gstr3b.outward.sgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>IGST Tax Liability Collected</span>
                          <strong>{fmt(gstReportsData.gstr3b.outward.igst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontWeight: 'bold', fontSize: '15px' }}>
                          <span>TOTAL LIABILITIES</span>
                          <span style={{ color: 'var(--green)' }}>{fmt(gstReportsData.gstr3b.outward.totalTax)}</span>
                        </div>
                      </div>

                      {/* Input Tax Credit (ITC) Card */}
                      <div className="card" style={{ flex: 1, minWidth: '320px', padding: '16px', borderLeft: '4px solid #3b82f6' }}>
                        <h5 style={{ color: 'var(--blue)', marginTop: 0, marginBottom: '12px' }}>2. Eligible Input Tax Credit (ITC)</h5>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>Total Inward Taxable Procurement</span>
                          <strong>{fmt(gstReportsData.gstr3b.inward.taxable)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>CGST Inward ITC Input</span>
                          <strong>{fmt(gstReportsData.gstr3b.inward.cgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>SGST Inward ITC Input</span>
                          <strong>{fmt(gstReportsData.gstr3b.inward.sgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>IGST Inward ITC Input</span>
                          <strong>{fmt(gstReportsData.gstr3b.inward.igst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontWeight: 'bold', fontSize: '15px' }}>
                          <span>TOTAL ELIGIBLE ITC CLAIMABLE</span>
                          <span style={{ color: 'var(--blue)' }}>{fmt(gstReportsData.gstr3b.inward.totalTax)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net computation grid */}
                    <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)', borderLeft: '4px solid #6366f1' }}>
                      <h5 style={{ color: '#6366f1', marginTop: 0, marginBottom: '15px' }}>3. Self-Assessment Net Balance</h5>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div className="card" style={{ padding: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Net CGST Balance</span>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: gstReportsData.gstr3b.net.cgst >= 0 ? 'var(--red)' : 'var(--green)' }}>
                            {gstReportsData.gstr3b.net.cgst >= 0 ? fmt(gstReportsData.gstr3b.net.cgst) : `${fmt(Math.abs(gstReportsData.gstr3b.net.cgst))} (ITC Excess)`}
                          </div>
                        </div>
                        <div className="card" style={{ padding: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Net SGST Balance</span>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: gstReportsData.gstr3b.net.sgst >= 0 ? 'var(--red)' : 'var(--green)' }}>
                            {gstReportsData.gstr3b.net.sgst >= 0 ? fmt(gstReportsData.gstr3b.net.sgst) : `${fmt(Math.abs(gstReportsData.gstr3b.net.sgst))} (ITC Excess)`}
                          </div>
                        </div>
                        <div className="card" style={{ padding: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Net IGST Balance</span>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: gstReportsData.gstr3b.net.igst >= 0 ? 'var(--red)' : 'var(--green)' }}>
                            {gstReportsData.gstr3b.net.igst >= 0 ? fmt(gstReportsData.gstr3b.net.igst) : `${fmt(Math.abs(gstReportsData.gstr3b.net.igst))} (ITC Excess)`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                        <div>
                          <strong style={{ fontSize: '16px', color: 'var(--text-1)' }}>ESTIMATED NET TAX PAYABLE (AFTER ITC SET-OFF)</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Positive value represents liability to pay. Negative value indicates excess ITC for carryover.</p>
                        </div>
                        <strong style={{ fontSize: '24px', color: gstReportsData.gstr3b.net.total >= 0 ? 'var(--red)' : 'var(--green)' }}>
                          {gstReportsData.gstr3b.net.total >= 0 ? fmt(gstReportsData.gstr3b.net.total) : `${fmt(Math.abs(gstReportsData.gstr3b.net.total))} (Excess ITC)`}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {gstSubTab === 'hsn' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>HSN / SAC Summary (Outward sales)</h4>

                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>HSN/SAC Code</th>
                          <th>Description (Item Name)</th>
                          <th style={{ textAlign: 'right' }}>Total Qty</th>
                          <th style={{ textAlign: 'right' }}>Taxable value</th>
                          <th style={{ textAlign: 'right' }}>CGST Amount</th>
                          <th style={{ textAlign: 'right' }}>SGST Amount</th>
                          <th style={{ textAlign: 'right' }}>IGST Amount</th>
                          <th style={{ textAlign: 'right' }}>Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstReportsData.hsnSummary.length > 0 ? (
                          gstReportsData.hsnSummary
                            .filter(r => !tableQ.trim() || r.code.toLowerCase().includes(tableQ.toLowerCase()) || r.description.toLowerCase().includes(tableQ.toLowerCase()))
                            .map((r, i) => (
                              <tr key={i}>
                                <td><code>{r.code}</code></td>
                                <td style={{ fontWeight: 600 }}>{r.description}</td>
                                <td style={{ textAlign: 'right', fontWeight: 500 }}>{r.qty}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(r.taxable)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.cgst > 0 ? fmt(r.cgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.sgst > 0 ? fmt(r.sgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.igst > 0 ? fmt(r.igst) : '-'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--green)' }}>{fmt(r.total)}</td>
                              </tr>
                            ))
                        ) : (
                          <tr><td colSpan="8" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No sales line items mapped with HSN/SAC in this date range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {gstSubTab === 'tax' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>GST Rate Slabs summary</h4>

                    <table className="tbl">
                      <thead>
                        <tr>
                          <th rowSpan="2" style={{ verticalAlign: 'middle' }}>GST Slab</th>
                          <th colSpan="4" style={{ textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Outward Supplies (Sales)</th>
                          <th colSpan="4" style={{ textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Inward Supplies (Purchases)</th>
                        </tr>
                        <tr>
                          <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                          <th style={{ textAlign: 'right' }}>CGST</th>
                          <th style={{ textAlign: 'right' }}>SGST</th>
                          <th style={{ textAlign: 'right' }}>IGST</th>
                          <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                          <th style={{ textAlign: 'right' }}>CGST ITC</th>
                          <th style={{ textAlign: 'right' }}>SGST ITC</th>
                          <th style={{ textAlign: 'right' }}>IGST ITC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstReportsData.taxSummaryList.length > 0 ? (
                          gstReportsData.taxSummaryList
                            .filter(r => !tableQ.trim() || r.slab.toLowerCase().includes(tableQ.toLowerCase()))
                            .map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 'bold' }}>{r.slab}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(r.salesTaxable)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.salesCgst > 0 ? fmt(r.salesCgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.salesSgst > 0 ? fmt(r.salesSgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.salesIgst > 0 ? fmt(r.salesIgst) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(r.purchasesTaxable)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.purchasesCgst > 0 ? fmt(r.purchasesCgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.purchasesSgst > 0 ? fmt(r.purchasesSgst) : '-'}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.purchasesIgst > 0 ? fmt(r.purchasesIgst) : '-'}</td>
                              </tr>
                            ))
                        ) : (
                          <tr><td colSpan="9" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No transactions under any GST slabs in this range.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Party Reports Tab */}
            {tab === 'party' && (
              <div>
                {/* Sub Tab selection */}
                <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '5px', flexWrap: 'wrap' }}>
                  <button className={`btn btn--sm ${partySubTab === 'cust_out' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPartySubTab('cust_out')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Customer Outstanding ({advancedPartyReport.customerOutstanding.length})
                  </button>
                  <button className={`btn btn--sm ${partySubTab === 'supp_out' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPartySubTab('supp_out')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Supplier Outstanding ({advancedPartyReport.supplierOutstanding.length})
                  </button>
                  <button className={`btn btn--sm ${partySubTab === 'ageing' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPartySubTab('ageing')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Ageing Report
                  </button>
                  <button className={`btn btn--sm ${partySubTab === 'lookup' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPartySubTab('lookup')} style={{ borderRadius: '15px', padding: '6px 12px', fontSize: '12px' }}>
                    Statement Ledgers Lookup
                  </button>
                </div>

                {partySubTab === 'cust_out' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0 }}>Customer Outstanding Balances (Accounts Receivable)</h4>
                      <strong style={{ color: 'var(--green)', fontSize: '16px' }}>Total Receivables: {fmt(advancedPartyReport.totalCustomerOutstanding)}</strong>
                    </div>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Customer Name</th>
                          <th>Contact Phone</th>
                          <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedPartyReport.customerOutstanding.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.phone || 'N/A'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--green)' }}>{fmt(p.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {partySubTab === 'supp_out' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0 }}>Supplier Outstanding Balances (Accounts Payable)</h4>
                      <strong style={{ color: 'var(--red)', fontSize: '16px' }}>Total Payables: {fmt(advancedPartyReport.totalSupplierOutstanding)}</strong>
                    </div>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Supplier Name</th>
                          <th>Contact Phone</th>
                          <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedPartyReport.supplierOutstanding.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.phone || 'N/A'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(Math.abs(p.balance))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {partySubTab === 'ageing' && (
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Customer Overdue Ageing Analysis</h4>
                    
                    {/* Ageing Summary Cards */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>0-30 DAYS</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--green)' }}>{fmt(advancedPartyReport.ageingBuckets.totals['0-30'])}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>31-60 DAYS</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{fmt(advancedPartyReport.ageingBuckets.totals['31-60'])}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>61-90 DAYS</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(advancedPartyReport.ageingBuckets.totals['61-90'])}</div>
                      </div>
                      <div className="card" style={{ padding: '12px', flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>90+ DAYS</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(advancedPartyReport.ageingBuckets.totals['90+'])}</div>
                      </div>
                    </div>

                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Party Name</th>
                          <th>Contact Phone</th>
                          <th>Days Outstanding</th>
                          <th style={{ textAlign: 'right' }}>Amount Overdue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(advancedPartyReport.ageingBuckets)
                          .filter(bucket => Array.isArray(bucket))
                          .flat()
                          .map((p, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{p.name}</td>
                              <td>{p.phone}</td>
                              <td>
                                <span className="badge" style={{ 
                                  backgroundColor: p.days > 90 ? 'rgba(239,68,68,0.1)' : p.days > 30 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                  color: p.days > 90 ? 'var(--red)' : p.days > 30 ? '#f59e0b' : 'var(--green)'
                                }}>
                                  {p.days} Days Overdue
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.balance)}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )}

                {partySubTab === 'lookup' && (
                  <div>
                    <h4>Statement Ledger Lookup (Customer / Supplier)</h4>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '15px 0' }}>
                      <input className="fi" placeholder="Enter party name or ID..." value={partyId} onChange={e => setPartyId(e.target.value)} style={{ width: '300px', height: '38px' }} />
                      <button className="btn btn--primary" onClick={fetchParty} style={{ height: '38px' }}>
                        <i className="fas fa-search"></i> Fetch Statement Ledger
                      </button>
                    </div>

                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Transaction Date</th>
                          <th>Description / Entry Type</th>
                          <th style={{ textAlign: 'right' }}>Ledger Balance Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(data) ? (
                          data.map((r, i) => (
                            <tr key={i}>
                              <td>{(r.date || '').slice(0, 10)}</td>
                              <td>
                                <span className="badge" style={{ 
                                  backgroundColor: r.type === 'Sale' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                  color: r.type === 'Sale' ? 'var(--green)' : 'var(--red)'
                                }}>
                                  {r.type}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: r.type === 'Sale' ? 'var(--green)' : 'var(--red)' }}>
                                {r.type === 'Sale' ? `+` : `-`}{fmt(r.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>Enter customer or vendor details above to run statement query.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Custom Report Builder Tab */}
            {tab === 'builder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Configuration Panel */}
                  <div className="card" style={{ flex: 1, minWidth: '320px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <i className="fas fa-cog"></i> Configure Custom Report
                    </h4>
                    
                    {/* Name */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>REPORT NAME</label>
                      <input className="fi" value={customReportName} onChange={e => setCustomReportName(e.target.value)} placeholder="e.g. High Value Sales" style={{ width: '100%', height: '38px' }} />
                    </div>

                    {/* Data Source Entity */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>DATA SOURCE (ENTITY)</label>
                      <select className="fi" value={customEntity} onChange={e => {
                        const ent = e.target.value;
                        setCustomEntity(ent);
                        if (ent === 'sales') setCustomFields(['id', 'date', 'customer', 'amount']);
                        else if (ent === 'purchases') setCustomFields(['id', 'date', 'supplier', 'amount']);
                        else if (ent === 'products') setCustomFields(['name', 'sku', 'stock', 'price']);
                        else if (ent === 'parties') setCustomFields(['name', 'type', 'phone', 'balance']);
                        else if (ent === 'expenses') setCustomFields(['date', 'category', 'amount', 'paymentMode']);
                        setCustomFilters([{ field: '', operator: 'equals', value: '' }]);
                      }} style={{ width: '100%', height: '38px', background: 'var(--bg-input)' }}>
                        <option value="sales">Sales Invoices</option>
                        <option value="purchases">Purchase Bills</option>
                        <option value="products">Inventory / Products</option>
                        <option value="parties">Parties (Customers & Suppliers)</option>
                        <option value="expenses">Business Expenses</option>
                      </select>
                    </div>

                    {/* Projected Fields Checklist */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>SELECT FIELDS TO DISPLAY</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'var(--bg-input)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {(customEntity === 'sales' ? ['id', 'date', 'customer', 'amount', 'mode', 'taxAmount', 'subtotal'] :
                          customEntity === 'purchases' ? ['id', 'date', 'supplier', 'amount', 'mode', 'taxAmount', 'subtotal'] :
                          customEntity === 'products' ? ['name', 'sku', 'stock', 'price', 'purchasePrice', 'lowStockLevel'] :
                          customEntity === 'parties' ? ['name', 'type', 'phone', 'balance', 'lastTxn'] :
                          ['date', 'category', 'description', 'amount', 'paymentMode']
                        ).map(f => (
                          <label key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer', margin: '4px 8px 4px 0' }}>
                            <input type="checkbox" checked={customFields.includes(f)} onChange={e => {
                              if (e.target.checked) setCustomFields([...customFields, f]);
                              else setCustomFields(customFields.filter(cf => cf !== f));
                            }} />
                            {f.toUpperCase()}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Filter Rule Builder */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>FILTER RULES (ALL MUST MATCH)</label>
                      {customFilters.map((filt, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <select className="fi" value={filt.field} onChange={e => {
                            const updated = [...customFilters];
                            updated[idx].field = e.target.value;
                            setCustomFilters(updated);
                          }} style={{ flex: 1, height: '34px', background: 'var(--bg-input)' }}>
                            <option value="">-- Select Field --</option>
                            {(customEntity === 'sales' ? ['id', 'customer', 'amount', 'mode'] :
                              customEntity === 'purchases' ? ['id', 'supplier', 'amount', 'mode'] :
                              customEntity === 'products' ? ['name', 'sku', 'stock', 'price', 'purchasePrice'] :
                              customEntity === 'parties' ? ['name', 'type', 'phone', 'balance'] :
                              ['category', 'description', 'amount', 'paymentMode']
                            ).map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                          </select>

                          <select className="fi" value={filt.operator} onChange={e => {
                            const updated = [...customFilters];
                            updated[idx].operator = e.target.value;
                            setCustomFilters(updated);
                          }} style={{ width: '100px', height: '34px', background: 'var(--bg-input)' }}>
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="gt">&gt; (Greater)</option>
                            <option value="lt">&lt; (Less)</option>
                          </select>

                          <input className="fi" value={filt.value} onChange={e => {
                            const updated = [...customFilters];
                            updated[idx].value = e.target.value;
                            setCustomFilters(updated);
                          }} placeholder="Value" style={{ flex: 1, height: '34px' }} />

                          <button className="btn btn--sm" onClick={() => setCustomFilters(customFilters.filter((_, i) => i !== idx))} style={{ color: 'var(--red)', padding: '6px 10px', height: '34px' }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                      <button className="btn btn--sm btn--outline" onClick={() => setCustomFilters([...customFilters, { field: '', operator: 'equals', value: '' }])} style={{ padding: '6px 12px', marginTop: '4px' }}>
                        <i className="fas fa-plus"></i> Add Filter Rule
                      </button>
                    </div>

                    {/* Sorting */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>SORT BY</label>
                        <select className="fi" value={customSortBy} onChange={e => setCustomSortBy(e.target.value)} style={{ width: '100%', height: '36px', background: 'var(--bg-input)' }}>
                          {customFields.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>ORDER</label>
                        <select className="fi" value={customSortOrder} onChange={e => setCustomSortOrder(e.target.value)} style={{ width: '100%', height: '36px', background: 'var(--bg-input)' }}>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <button className="btn btn--primary" onClick={async () => {
                      if (!customReportName.trim()) return alert("Enter report name");
                      try {
                        const res = await fetch('/api/admin/reports/custom', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            username,
                            name: customReportName,
                            entity: customEntity,
                            fields: customFields,
                            filters: customFilters,
                            sortBy: customSortBy,
                            sortOrder: customSortOrder
                          })
                        });
                        const json = await res.json();
                        if (json.status === 'success') {
                          alert("Custom report template saved successfully!");
                          fetchCustomTemplates();
                        } else {
                          alert("Error: " + json.message);
                        }
                      } catch (e) {
                        console.error(e);
                        alert("Failed to save template.");
                      }
                    }} style={{ width: '100%', height: '38px', fontWeight: 'bold' }}>
                      <i className="fas fa-save"></i> Save Report Template
                    </button>
                  </div>

                  {/* Templates List panel */}
                  <div className="card" style={{ width: '300px', padding: '20px', flexShrink: 0 }}>
                    <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <i className="fas fa-file-lines"></i> Saved Templates
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {customTemplates.length > 0 ? (
                        customTemplates.map((t, idx) => (
                          <div key={idx} className="card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)' }}>
                            <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => {
                              setCustomReportName(t.name);
                              setCustomEntity(t.entity);
                              setCustomFields(t.fields || []);
                              setCustomFilters(t.filters || [{ field: '', operator: 'equals', value: '' }]);
                              setCustomSortBy(t.sortBy || '');
                              setCustomSortOrder(t.sortOrder || 'desc');
                            }}>
                              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--blue)' }}>{t.name}</strong>
                              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Source: {t.entity}</span>
                            </div>
                            <button className="btn btn--sm" onClick={async () => {
                              if (!await window.confirm("Delete this custom report template?")) return;
                              try {
                                const res = await fetch(`/api/admin/reports/custom/${t._id}`, { method: 'DELETE' });
                                const json = await res.json();
                                if (json.status === 'success') {
                                  alert("Deleted template.");
                                  fetchCustomTemplates();
                                }
                              } catch (e) { console.error(e); }
                            }} style={{ color: 'var(--red)', padding: '4px' }}>
                              <i className="fas fa-trash-can"></i>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-3)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No saved templates.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Grid */}
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Live Report Preview Grid</span>
                    <span className="badge" style={{ backgroundColor: '#2563eb12', color: '#2563eb' }}>
                      {getActiveReportData().length} rows match
                    </span>
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          {customFields.map(f => <th key={f}>{f.toUpperCase()}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {getActiveReportData().length > 0 ? (
                          getActiveReportData().map((row, idx) => (
                            <tr key={idx}>
                              {customFields.map(f => (
                                <td key={f} style={{ fontWeight: f === 'id' || f === 'name' ? '600' : 'normal' }}>
                                  {typeof row[f] === 'number' && (f.includes('amount') || f.includes('price') || f.includes('balance') || f.includes('total') || f.includes('subtotal') || f.includes('Valuation') || f.includes('Value')) ? fmt(row[f]) : String(row[f])}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={customFields.length} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                              No records match filter criteria. Configure data source and filters above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-Reports Scheduler Tab */}
            {tab === 'scheduler' && (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Add/Edit Schedule Card */}
                <div className="card" style={{ flex: 1, minWidth: '320px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <i className="fas fa-clock"></i> {selectedScheduleId ? 'Edit Email Schedule' : 'Schedule Auto-Report Email'}
                  </h4>

                  {/* Recipient Email */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>RECIPIENT EMAIL</label>
                    <input className="fi" type="email" value={schedEmail} onChange={e => setSchedEmail(e.target.value)} placeholder="e.g. boss@mybusiness.com" style={{ width: '100%', height: '38px' }} />
                  </div>

                  {/* Frequency */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>FREQUENCY CYCLE</label>
                    <select className="fi" value={schedFrequency} onChange={e => setSchedFrequency(e.target.value)} style={{ width: '100%', height: '38px', background: 'var(--bg-input)' }}>
                      <option value="daily">Daily summary</option>
                      <option value="weekly">Weekly summary</option>
                      <option value="monthly">Monthly summary</option>
                    </select>
                  </div>

                  {/* Report Type */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>REPORT TYPE</label>
                    <select className="fi" value={schedReportType} onChange={e => {
                      const type = e.target.value;
                      setSchedReportType(type);
                      if (type === 'custom' && customTemplates.length > 0) {
                        setSchedCustomReportId(customTemplates[0]._id);
                      }
                    }} style={{ width: '100%', height: '38px', background: 'var(--bg-input)' }}>
                      <option value="sales">Sales Invoice ledger</option>
                      <option value="purchases">Purchase PO ledger</option>
                      <option value="inventory">Inventory Status report</option>
                      <option value="financial">Financial summary</option>
                      <option value="custom">Custom Report template</option>
                    </select>
                  </div>

                  {/* Selected Custom Template */}
                  {schedReportType === 'custom' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-2)' }}>CHOOSE CUSTOM REPORT TEMPLATE</label>
                      <select className="fi" value={schedCustomReportId} onChange={e => setSchedCustomReportId(e.target.value)} style={{ width: '100%', height: '38px', background: 'var(--bg-input)' }}>
                        {customTemplates.map(t => (
                          <option key={t._id} value={t._id}>{t.name} ({t.entity})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn--primary" onClick={async () => {
                      if (!schedEmail.trim()) return alert("Enter recipient email address");
                      
                      let customConfig = null;
                      if (schedReportType === 'custom') {
                        const selectedT = customTemplates.find(t => t._id === schedCustomReportId);
                        if (!selectedT) return alert("Select a valid custom template");
                        customConfig = selectedT;
                      }

                      try {
                        const res = await fetch('/api/admin/reports/schedules', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: selectedScheduleId,
                            username,
                            email: schedEmail,
                            frequency: schedFrequency,
                            reportType: schedReportType,
                            customConfig
                          })
                        });
                        const json = await res.json();
                        if (json.status === 'success') {
                          alert("Report schedule saved successfully!");
                          setSelectedScheduleId(null);
                          setSchedEmail(user?.email || '');
                          fetchSchedules();
                        }
                      } catch (e) {
                        console.error(e);
                        alert("Failed to save schedule.");
                      }
                    }} style={{ flex: 1, height: '38px', fontWeight: 'bold' }}>
                      <i className="fas fa-check"></i> {selectedScheduleId ? 'Update Schedule' : 'Schedule Report'}
                    </button>
                    {selectedScheduleId && (
                      <button className="btn" onClick={() => {
                        setSelectedScheduleId(null);
                        setSchedEmail(user?.email || '');
                      }} style={{ height: '38px' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Schedules List Grid */}
                <div className="card" style={{ flex: 2, minWidth: '320px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <i className="fas fa-list"></i> Active Email Schedules
                  </h4>

                  <table className="tbl" style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Report Type</th>
                        <th>Frequency</th>
                        <th>Recipient Email</th>
                        <th>Last Sent Timestamp</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.length > 0 ? (
                        schedules.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>
                              {s.reportType === 'custom' ? `Custom: ${s.customConfig?.name || 'Template'}` : s.reportType.toUpperCase()}
                            </td>
                            <td>
                              <span className="badge" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                                {s.frequency}
                              </span>
                            </td>
                            <td><code>{s.email}</code></td>
                            <td>{s.lastSent ? new Date(s.lastSent).toLocaleString() : 'Never sent'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button className="btn btn--sm btn--outline" onClick={async () => {
                                  if (!await window.confirm("Send this report via email immediately?")) return;
                                  try {
                                    const res = await fetch(`/api/admin/reports/schedules/trigger/${s._id}`, { method: 'POST' });
                                    const json = await res.json();
                                    if (json.status === 'success') {
                                      alert("Report email dispatched successfully!");
                                      fetchSchedules();
                                    } else {
                                      alert("Error sending email: " + json.message);
                                    }
                                  } catch (e) {
                                    console.error(e);
                                    alert("Trigger failed.");
                                  }
                                }} style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fas fa-paper-plane" style={{ color: 'var(--green)' }}></i> Send Now
                                </button>
                                <button className="btn btn--sm" onClick={() => {
                                  setSelectedScheduleId(s._id);
                                  setSchedEmail(s.email);
                                  setSchedFrequency(s.frequency);
                                  setSchedReportType(s.reportType);
                                  if (s.reportType === 'custom') setSchedCustomReportId(s.customConfig?._id || '');
                                }} style={{ padding: '4px 6px' }}>
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="btn btn--sm" onClick={async () => {
                                  if (!await window.confirm("Delete this schedule?")) return;
                                  try {
                                    const res = await fetch(`/api/admin/reports/schedules/${s._id}`, { method: 'DELETE' });
                                    const json = await res.json();
                                    if (json.status === 'success') {
                                      alert("Schedule deleted.");
                                      fetchSchedules();
                                    }
                                  } catch (e) { console.error(e); }
                                }} style={{ color: 'var(--red)', padding: '4px 6px' }}>
                                  <i className="fas fa-trash-can"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                            No active report schedules configured. Complete the scheduling form on the left.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
