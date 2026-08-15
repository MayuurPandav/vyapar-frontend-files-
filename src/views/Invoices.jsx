import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import AnimatedNumber from '../components/AnimatedNumber';

export default function Invoices() {
  const { user } = useApp();
  const [list, setList] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [customer, setCustomer] = useState('');
  const [invoiceType, setInvoiceType] = useState('Sale Invoice (GST)');
  const [billDate, setBillDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().substring(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Items in invoice
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Product Search / Selector State
  const [selectedProductSearch, setSelectedProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Overall Adjustments
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [chargeLabel, setChargeLabel] = useState('Delivery');
  
  // Payments
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [upiRef, setUpiRef] = useState('');
  const [notes, setNotes] = useState('');

  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  const [taxType, setTaxType] = useState('Intra-state (CGST + SGST)');
  const [overallDiscountType, setOverallDiscountType] = useState('flat');
  const [terms, setTerms] = useState('Thank you for your business!');
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyForm, setNewPartyForm] = useState({ name: '', phone: '', email: '', state: 'Karnataka' });
  const [templateStyle, setTemplateStyle] = useState('Classic');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [shopProfile, setShopProfile] = useState({});
  const [printSize, setPrintSize] = useState('A4');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetInvoice, setShareTargetInvoice] = useState(null);
  
  // Bulk & Aging stats states
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [agingData, setAgingData] = useState(null);
  const [showAgingSection, setShowAgingSection] = useState(true);

  const isInvoiceOverdue = (inv) => {
    if (!inv.dueDate) return false;
    const bal = inv.balanceDue !== undefined ? inv.balanceDue : ((inv.totalAmount || inv.amount || 0) - (inv.paymentReceived || 0));
    if (bal <= 0 || inv.status === 'Paid') return false;
    const todayStr = new Date().toISOString().substring(0, 10);
    return inv.dueDate < todayStr;
  };

  // Search & Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 8;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAgingReport = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/invoices-aging?username=${encodeURIComponent(user.username)}`);
      if (res.ok) {
        const d = await res.json();
        setAgingData(d);
      }
    } catch (err) {
      console.error('Failed to load aging stats:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadMetadata();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const delayDebounceFn = setTimeout(() => {
        load();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, filterType, filterStatus, page, user]);

  const load = async () => {
    if (!user) return;
    try {
      let url = `/api/invoices?username=${encodeURIComponent(user.username)}&page=${page}&limit=${pageSize}`;
      if (filterType && filterType !== 'All') url += `&type=${encodeURIComponent(filterType)}`;
      if (filterStatus && filterStatus !== 'All') url += `&status=${encodeURIComponent(filterStatus)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setList(d.data || []);
        setTotalPages(Math.ceil((d.total || 0) / pageSize));
      }
      loadAgingReport();
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const loadMetadata = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch parties
      const partiesRes = await fetch(`/api/list?username=${encodeURIComponent(user.username)}&type=parties`);
      if (partiesRes.ok) {
        const d = await partiesRes.json();
        setParties(d.data || []);
      }

      // Fetch products
      const productsRes = await fetch(`/api/list?username=${encodeURIComponent(user.username)}&type=products`);
      if (productsRes.ok) {
        const d = await productsRes.json();
        setProducts(d.data || []);
      }

      // Fetch shop profile
      const shopRes = await fetch('/api/super/shop-profile');
      if (shopRes.ok) {
        const p = await shopRes.json();
        setShopProfile(p || {});
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add selected product as an item
  const handleAddProduct = (prod) => {
    const existing = selectedItems.find(item => item.productId === prod._id);
    if (existing) {
      setSelectedItems(selectedItems.map(item => 
        item.productId === prod._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      showToast(`Increased quantity for ${prod.name || prod.productName}`);
    } else {
      setSelectedItems([...selectedItems, {
        productId: prod._id,
        name: prod.name || prod.productName,
        price: prod.price || 0,
        quantity: 1,
        discount: 0,
        discountType: 'percent',
        gstRate: prod.gstRate ?? 18,
        sku: prod.sku || 'N/A',
        unit: prod.unit || 'pcs'
      }]);
      showToast(`Added ${prod.name || prod.productName} to invoice`);
    }
    setSelectedProductSearch('');
    setShowProductDropdown(false);
  };

  const updateItemQty = (productId, val) => {
    const qty = Math.max(1, Number(val) || 1);
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, quantity: qty } : item
    ));
  };

  const updateItemRate = (productId, val) => {
    const rate = Math.max(0, Number(val) || 0);
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, price: rate } : item
    ));
  };

  const updateItemDiscount = (productId, val) => {
    const disc = Math.max(0, Number(val) || 0);
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, discount: disc } : item
    ));
  };

  const updateItemDiscountType = (productId, val) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, discountType: val } : item
    ));
  };

  const updateItemGst = (productId, val) => {
    const gst = Number(val) || 0;
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, gstRate: gst } : item
    ));
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
    showToast('Item removed', 'info');
  };

  // Math calculations
  const subtotal = selectedItems.reduce((sum, item) => {
    const discAmt = item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100));
    const amount = Math.max(0, (item.price * item.quantity) - discAmt);
    return sum + amount;
  }, 0);

  const totalGst = selectedItems.reduce((sum, item) => {
    const discAmt = item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100));
    const amount = Math.max(0, (item.price * item.quantity) - discAmt);
    const tax = amount * (item.gstRate / 100);
    return sum + tax;
  }, 0);

  const isInterstate = taxType === 'Inter-state (IGST)';
  const cgst = isInterstate ? 0 : totalGst / 2;
  const sgst = isInterstate ? 0 : totalGst / 2;
  const igst = isInterstate ? totalGst : 0;

  const flatOverallDiscount = overallDiscountType === 'percent' ? (subtotal * (overallDiscount / 100)) : overallDiscount;
  const rawTotal = subtotal + totalGst - flatOverallDiscount + Number(additionalCharges || 0);
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = Math.round(rawTotal);

  // Edit & Cancel Helpers
  const startEdit = (inv) => {
    setEditingInvoiceId(inv.id);
    setCustomer(inv.customer || '');
    setInvoiceType(inv.type || 'Sale Invoice (GST)');
    setBillDate(inv.date || new Date().toISOString().substring(0, 10));
    setDueDate(inv.dueDate || inv.date || new Date().toISOString().substring(0, 10));
    setInvoiceNumber(inv.invoiceNumber || inv.id || '');
    
    // Fallback mapping for items to ensure they contain productId & sku
    const mappedItems = (inv.items || []).map((item, idx) => {
      const matchedProd = products.find(p => (p.name || p.productName) === item.name);
      return {
        ...item,
        productId: item.productId || matchedProd?._id || `temp-id-${idx}-${Date.now()}`,
        sku: item.sku || matchedProd?.sku || 'N/A',
        unit: item.unit || matchedProd?.unit || 'pcs',
        discountType: item.discountType || 'percent'
      };
    });
    setSelectedItems(mappedItems);
    
    setOverallDiscount(inv.discount || 0);
    setAdditionalCharges(inv.additionalCharges || 0);
    setChargeLabel(inv.chargeLabel || 'Delivery');
    setPaymentMode(inv.paymentMode || 'Cash');
    setPaymentReceived(inv.paymentReceived || 0);
    setUpiRef(inv.upiRef || '');
    setNotes(inv.notes || '');
    
    setTaxType(inv.taxType || 'Intra-state (CGST + SGST)');
    setOverallDiscountType(inv.overallDiscountType || 'flat');
    setTerms(inv.terms || 'Thank you for your business!');
    setTemplateStyle(inv.templateStyle || 'Classic');
    setPrintSize(inv.printSize || 'A4');
    
    showToast('Editing Invoice: ' + (inv.invoiceNumber || inv.id), 'info');

    // Scroll smoothly to form top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingInvoiceId(null);
    setCustomer('');
    setInvoiceType('Sale Invoice (GST)');
    setBillDate(new Date().toISOString().substring(0, 10));
    setDueDate(new Date().toISOString().substring(0, 10));
    setInvoiceNumber('');
    setSelectedItems([]);
    setOverallDiscount(0);
    setAdditionalCharges(0);
    setChargeLabel('Delivery');
    setPaymentMode('Cash');
    setPaymentReceived(0);
    setUpiRef('');
    setNotes('');
    setTaxType('Intra-state (CGST + SGST)');
    setOverallDiscountType('flat');
    setTerms('Thank you for your business!');
    setTemplateStyle('Classic');
    setPrintSize('A4');
    showToast('Edit cancelled', 'info');
  };

  const handleSavePartyInline = async () => {
    if (!newPartyForm.name.trim()) return;
    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name: newPartyForm.name.trim(),
          type: 'Customer',
          phone: newPartyForm.phone.trim(),
          email: newPartyForm.email.trim(),
          state: newPartyForm.state,
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        const d = await res.json();
        const createdParty = d.party;
        setParties([...parties, createdParty]);
        setCustomer(createdParty.name);
        setShowAddPartyModal(false);
        showToast(`Party "${createdParty.name}" saved successfully`);
      } else {
        showToast('Failed to save party', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving party', 'error');
    }
  };

  // Submit invoice
  const createInvoiceSubmit = async () => {
    if (!customer.trim()) {
      showToast('Please specify a customer name', 'error');
      return;
    }
    if (selectedItems.length === 0) {
      showToast('Please add at least one item to the invoice', 'error');
      return;
    }

    const payload = {
      username: user.username,
      customer,
      date: billDate,
      dueDate,
      type: invoiceType,
      invoiceNumber: invoiceNumber.trim() || undefined,
      items: selectedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        qty: item.quantity,
        price: item.price,
        rate: item.price,
        discount: item.discount,
        discountType: item.discountType || 'percent',
        gstRate: item.gstRate,
        sku: item.sku || 'N/A',
        unit: item.unit || 'pcs',
        amount: Number((
          (item.price * item.quantity) - 
          (item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100)))
        ).toFixed(2))
      })),
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(overallDiscount || 0),
      overallDiscountType,
      additionalCharges: Number(additionalCharges || 0),
      chargeLabel,
      taxType,
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      totalAmount,
      paymentReceived: Number(paymentReceived || 0),
      balanceDue: Math.max(0, totalAmount - paymentReceived),
      paymentMode,
      upiRef: paymentMode === 'UPI' || paymentMode === 'Split' ? upiRef : '',
      status: paymentReceived >= totalAmount ? 'Paid' : paymentReceived > 0 ? 'Partial' : 'Unpaid',
      notes,
      terms,
      templateStyle,
      printSize
    };

    try {
      const url = editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : '/api/invoices';
      const method = editingInvoiceId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingInvoiceId ? 'Invoice updated successfully' : 'Invoice created successfully');
        cancelEdit();
        load();
      } else {
        const errorMsg = await res.json();
        showToast(errorMsg.message || 'Failed to save invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving invoice', 'error');
    }
  };

  const del = async (id) => {
    if (!await window.confirm('Are you sure you want to delete this invoice?')) return;
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Invoice deleted');
      load();
    } else {
      showToast('Failed to delete invoice', 'error');
    }
  };


  const handleDuplicate = async (id) => {
    if (!await window.confirm('Are you sure you want to duplicate this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showToast('Invoice duplicated successfully');
        load();
      } else {
        showToast('Failed to duplicate invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error duplicating invoice', 'error');
    }
  };

  const handleConvert = async (id) => {
    if (!await window.confirm('Are you sure you want to convert this document to a Sale Invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}/convert`, { method: 'POST' });
      if (res.ok) {
        showToast('Converted to Sale Invoice successfully');
        load();
      } else {
        showToast('Failed to convert', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error converting document', 'error');
    }
  };

  const handleSetupRecurring = async (id) => {
    const days = prompt('Enter recurring interval in days (e.g., 30 for monthly, 7 for weekly):', '30');
    if (days === null) return;
    const interval = Number(days);
    if (isNaN(interval) || interval <= 0) {
      showToast('Please enter a valid number of days', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/invoices/${id}/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalDays: interval })
      });
      if (res.ok) {
        showToast(`Recurring invoice scheduled every ${interval} days`);
        load();
      } else {
        showToast('Failed to setup recurring billing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error scheduling recurring invoice', 'error');
    }
  };

  const handleBulkPrint = () => {
    const selectedInvoices = list.filter(inv => selectedInvoiceIds.includes(inv.id));
    if (!selectedInvoices.length) {
      showToast('No invoices selected', 'error');
      return;
    }
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
        <head>
          <title>Bulk Invoice Print</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Outfit', sans-serif; margin: 0; padding: 20px; background: #ffffff; }
            .invoice-page { page-break-after: always; margin-bottom: 40px; }
            .invoice-page:last-child { page-break-after: avoid; margin-bottom: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 8px 12px; font-size: 13px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
    `;
    selectedInvoices.forEach(inv => {
      html += `<div class="invoice-page">${renderInvoiceHtmlForPrintWindow(inv)}</div>`;
    });
    html += `
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleBulkExport = () => {
    const selectedInvoices = list.filter(inv => selectedInvoiceIds.includes(inv.id));
    if (!selectedInvoices.length) {
      showToast('No invoices selected', 'error');
      return;
    }
    const csvHeaders = ['Invoice Number', 'Customer', 'Date', 'Type', 'Total Amount', 'Received', 'Balance Due', 'Status'];
    const csvRows = selectedInvoices.map(inv => [
      inv.invoiceNumber || inv.id,
      inv.customer,
      inv.date,
      inv.type || 'Sale Invoice',
      inv.totalAmount || 0,
      inv.paymentReceived || 0,
      Math.max(0, (inv.totalAmount || 0) - (inv.paymentReceived || 0)),
      inv.status || 'Unpaid'
    ]);
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selectedInvoices.length} invoices successfully`);
  };

  const handleBulkDelete = async () => {
    const count = selectedInvoiceIds.length;
    if (!count) return;
    if (!await window.confirm(`Are you sure you want to delete ${count} selected invoices?`)) return;
    try {
      await Promise.all(selectedInvoiceIds.map(id => fetch(`/api/invoices/${id}`, { method: 'DELETE' })));
      showToast('Selected invoices deleted successfully');
      setSelectedInvoiceIds([]);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error performing bulk delete', 'error');
    }
  };

  const renderInvoiceHtmlForPrintWindow = (inv) => {
    const isClassic = inv.templateStyle === 'Classic';
    const isModern = inv.templateStyle === 'Modern';
    const isMinimal = inv.templateStyle === 'Minimal';

    const customerParty = parties.find(p => p.name?.toLowerCase() === inv.customer?.trim().toLowerCase()) || {};
    const shopName = shopProfile.shopName || user?.username || 'Vyapar Store';
    const shopPhone = shopProfile.phone || 'N/A';
    const shopEmail = shopProfile.email || 'N/A';
    const shopAddress = `${shopProfile.addressLine1 || ''} ${shopProfile.addressLine2 || ''} ${shopProfile.city || ''} ${shopProfile.state || ''} ${shopProfile.pincode || ''}`.trim() || 'N/A';
    const shopGst = shopProfile.gstin || 'N/A';

    let headerHtml = '';
    if (isClassic) {
      headerHtml = `
        <div style="height: 4px; background: #1e3a8a; width: 100%;"></div>
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-top: 10px;">
          <div>
            <h1 style="font-size: 22px; font-weight: 800; color: #1e3a8a; margin: 0; text-transform: uppercase;">${shopName}</h1>
            <p style="font-size: 12px; color: #475569; margin: 4px 0 0 0; max-width: 300px; line-height: 1.4;">${shopAddress}</p>
            <p style="font-size: 12px; color: #475569; margin: 4px 0 0 0;">Phone: ${shopPhone} | Email: ${shopEmail}</p>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">GSTIN: ${shopGst}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 26px; font-weight: 900; color: #1e3a8a; margin: 0;">${(inv.type || 'Invoice').toUpperCase()}</h2>
            <div style="margin-top: 12px; font-size: 13px; text-align: left; display: inline-grid; grid-template-columns: auto auto; gap: 4px 12px;">
              <span style="font-weight: 600;">Invoice No:</span> <span>${inv.invoiceNumber || inv.id}</span>
              <span style="font-weight: 600;">Date:</span> <span>${inv.date}</span>
              <span style="font-weight: 600;">Due Date:</span> <span>${inv.dueDate || inv.date}</span>
            </div>
          </div>
        </div>
      `;
    } else if (isModern) {
      headerHtml = `
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 24px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase;">${shopName}</h1>
            <p style="font-size: 11px; opacity: 0.9; margin: 4px 0 0 0; max-width: 340px;">${shopAddress}</p>
            <p style="font-size: 11px; opacity: 0.9; margin: 2px 0 0 0;">Phone: ${shopPhone} | GSTIN: ${shopGst}</p>
          </div>
          <div style="text-align: right;">
            <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${inv.type || 'Invoice'}</span>
            <h2 style="font-size: 28px; font-weight: 800; margin: 8px 0 0 0; color: white;">#${inv.invoiceNumber || inv.id}</h2>
            <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
              <div>Date: <strong>${inv.date}</strong></div>
              <div>Due: <strong>${inv.dueDate || inv.date}</strong></div>
            </div>
          </div>
        </div>
      `;
    } else {
      headerHtml = `
        <div style="height: 6px; background: #10b981; width: 100%; border-radius: 3px 3px 0 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 300; color: #0f172a; margin: 0;"><strong>${shopName}</strong></h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.5; max-width: 320px;">
              <div>${shopAddress}</div>
              <div style="margin-top: 2px;">Phone: ${shopPhone} | Email: ${shopEmail}</div>
              <div>GSTIN: ${shopGst}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 30px; font-weight: 800; color: #10b981; margin: 0; text-transform: uppercase;">${(inv.type || 'Invoice').split(' ')[0]}</h2>
            <div style="margin-top: 8px; font-size: 12px; text-align: left; display: inline-grid; grid-template-columns: auto auto; gap: 2px 16px;">
              <span style="color: #64748b;">Number:</span> <span style="font-weight: 600;">#${inv.invoiceNumber || inv.id}</span>
              <span style="color: #64748b;">Issued:</span> <span style="font-weight: 600;">${inv.date}</span>
              <span style="color: #64748b;">Due Date:</span> <span style="font-weight: 600;">${inv.dueDate || inv.date}</span>
            </div>
          </div>
        </div>
      `;
    }

    let partyHtml = '';
    if (isClassic) {
      partyHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
          <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 4px;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: #1e3a8a; margin: 0 0 8px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: bold;">Billed To</h3>
            <p style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0;">${inv.customer}</p>
            ${customerParty.phone ? `<p style="font-size: 12px; margin: 2px 0; color: #475569;">Phone: ${customerParty.phone}</p>` : ''}
            ${customerParty.email ? `<p style="font-size: 12px; margin: 2px 0; color: #475569;">Email: ${customerParty.email}</p>` : ''}
            ${customerParty.state ? `<p style="font-size: 12px; margin: 2px 0; color: #475569;">State: ${customerParty.state}</p>` : ''}
          </div>
          <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 4px;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: #1e3a8a; margin: 0 0 8px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: bold;">Ship To</h3>
            <p style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0;">${inv.customer}</p>
            ${customerParty.state ? `<p style="font-size: 12px; margin: 2px 0; color: #475569;">State: ${customerParty.state}</p>` : ''}
            <p style="font-size: 12px; margin: 2px 0; color: #475569;">Transport: Standard Handover</p>
          </div>
        </div>
      `;
    } else if (isModern) {
      partyHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: 800; margin-bottom: 6px;">Billed Customer</div>
            <p style="font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 4px 0;">${inv.customer}</p>
            ${customerParty.phone ? `<p style="font-size: 12px; margin: 2px 0; color: #475569;">Phone: ${customerParty.phone}</p>` : ''}
            ${customerParty.email ? `<p style="font-size: 12px; margin: 2px 0; color: #475569;">Email: ${customerParty.email}</p>` : ''}
          </div>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: 800; margin-bottom: 6px;">Invoice Metadata</div>
            <div style="font-size: 12.5px; line-height: 1.5;">
              <div>Tax Rule: <strong>${inv.taxType || 'Intra-state'}</strong></div>
              <div>Payment Mode: <strong>${inv.paymentMode || 'Cash'}</strong></div>
            </div>
          </div>
        </div>
      `;
    } else {
      partyHtml = `
        <div style="display: flex; justify-content: space-between; gap: 40px; margin-top: 20px;">
          <div>
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 4px;">Billed To</span>
            <strong style="font-size: 15px; color: #1e293b;">${inv.customer}</strong>
            ${customerParty.phone ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Phone: ${customerParty.phone}</div>` : ''}
            ${customerParty.email ? `<div style="font-size: 12px; color: #64748b;">Email: ${customerParty.email}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 4px;">Tax & Terms</span>
            <div style="font-size: 12px; color: #64748b;">
              <div>Tax Rule: <strong>${inv.taxType || 'Intra-state'}</strong></div>
            </div>
          </div>
        </div>
      `;
    }

    let tableRows = '';
    (inv.items || []).forEach((it, idx) => {
      const rate = Number(it.rate || it.price || 0);
      const qty = Number(it.qty || it.quantity || 1);
      const discAmt = it.discountType === 'flat' ? it.discount : (rate * qty * (it.discount / 100));
      const lineTotal = (rate * qty) - discAmt;

      tableRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td>${idx + 1}</td>
          <td>
            <strong>${it.name}</strong><br>
            <span style="font-size: 10px; color: #94a3b8;">SKU: ${it.sku || 'N/A'} | Unit: ${it.unit || 'pcs'}</span>
          </td>
          <td class="text-center">${qty}</td>
          <td class="text-right">₹${rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="text-right">${it.discount > 0 ? (it.discountType === 'flat' ? `₹${it.discount}` : `${it.discount}%`) : '0%'}</td>
          <td class="text-right">${it.gstRate}%</td>
          <td class="text-right" style="font-weight: 600;">₹${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    });

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
        <thead>
          <tr style="background: ${isClassic || isModern ? '#1e3a8a' : 'transparent'}; color: ${isClassic || isModern ? 'white' : '#1e293b'}; border-bottom: 2px solid ${isMinimal ? '#10b981' : '#cbd5e1'};">
            <th style="padding: 10px 12px;">#</th>
            <th style="padding: 10px 12px; width: 45%;">Item Description</th>
            <th style="padding: 10px 12px;" class="text-center">Qty</th>
            <th style="padding: 10px 12px;" class="text-right">Rate</th>
            <th style="padding: 10px 12px;" class="text-right">Disc</th>
            <th style="padding: 10px 12px;" class="text-right">GST</th>
            <th style="padding: 10px 12px;" class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    const cgst = Number(inv.cgst || 0);
    const sgst = Number(inv.sgst || 0);
    const igst = Number(inv.igst || 0);
    const roundOff = Number(inv.roundOff || 0);
    const overallDiscAmt = inv.overallDiscountType === 'percent' ? (inv.subtotal * (inv.discount / 100)) : inv.discount;
    const balanceDue = Math.max(0, Number(inv.totalAmount || 0) - Number(inv.paymentReceived || 0));

    let totalsRows = `
      <tr>
        <td style="color: #64748b;">Subtotal</td>
        <td class="text-right">₹${Number(inv.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;

    if (inv.discount > 0) {
      totalsRows += `
        <tr>
          <td style="color: #ef4444;">Discount</td>
          <td class="text-right" style="color: #ef4444;">-₹${overallDiscAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }

    if (inv.additionalCharges > 0) {
      totalsRows += `
        <tr>
          <td style="color: #64748b;">${inv.chargeLabel || 'Delivery'} Charges</td>
          <td class="text-right">+₹${Number(inv.additionalCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }

    if (cgst > 0) totalsRows += `<tr><td style="color: #64748b;">CGST (Central Tax)</td><td class="text-right">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`;
    if (sgst > 0) totalsRows += `<tr><td style="color: #64748b;">SGST (State Tax)</td><td class="text-right">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`;
    if (igst > 0) totalsRows += `<tr><td style="color: #64748b;">IGST (Integrated Tax)</td><td class="text-right">₹${igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`;

    if (roundOff !== 0) {
      totalsRows += `
        <tr>
          <td style="color: #64748b;">Round Off</td>
          <td class="text-right">${roundOff > 0 ? '+' : ''}₹${roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }

    totalsRows += `
      <tr style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; font-weight: bold; font-size: 15px;">
        <td style="padding: 10px 0; color: #0f172a;">Grand Total</td>
        <td class="text-right" style="padding: 10px 0; color: #1e3a8a; font-size: 17px;">₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="color: #64748b; padding-top: 8px;">Received Amount</td>
        <td class="text-right" style="color: #10b981; font-weight: bold; padding-top: 8px;">₹${Number(inv.paymentReceived || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr style="font-weight: bold;">
        <td style="color: ${balanceDue <= 0 ? '#10b981' : '#ef4444'};">${balanceDue <= 0 ? 'Change Due' : 'Balance Due'}</td>
        <td class="text-right" style="color: ${balanceDue <= 0 ? '#10b981' : '#ef4444'};">₹${balanceDue.toLocaleString('en-IN')}</td>
      </tr>
    `;

    const summaryHtml = `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-top: 30px;">
        <div>
          ${inv.notes ? `
            <div style="margin-bottom: 15px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Notes / Remarks</span>
              <p style="font-size: 12px; color: #475569; margin: 0; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-line;">${inv.notes}</p>
            </div>
          ` : ''}
          ${inv.terms ? `
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Terms & Conditions</span>
              <p style="font-size: 11px; color: #64748b; margin: 0; white-space: pre-line;">${inv.terms}</p>
            </div>
          ` : ''}
        </div>
        <div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${totalsRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return `
      <div style="padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; margin-bottom: 30px;">
        ${headerHtml}
        ${partyHtml}
        ${tableHtml}
        ${summaryHtml}
      </div>
    `;
  };

  const triggerShare = (inv) => {
    setShareTargetInvoice(inv);
    setShowShareModal(true);
  };

  const renderThermalReceipt = (width) => {
    const is58 = width === '58mm';
    const customerParty = parties.find(p => p.name?.toLowerCase() === customer.trim().toLowerCase()) || {};
    const shopName = shopProfile.shopName || user?.username || 'Vyapar Store';
    const shopPhone = shopProfile.phone || 'N/A';
    const shopEmail = shopProfile.email || 'N/A';
    const shopAddress = `${shopProfile.addressLine1 || ''} ${shopProfile.addressLine2 || ''} ${shopProfile.city || ''} ${shopProfile.state || ''} ${shopProfile.pincode || ''}`.trim() || 'N/A';
    const shopGst = shopProfile.gstin || 'N/A';

    const hr = () => <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }}></div>;

    return (
      <div style={{
        fontFamily: "'Courier New', Courier, monospace",
        color: '#000000',
        fontSize: is58 ? '10.5px' : '12px',
        lineHeight: '1.4',
        padding: '10px'
      }}>
        {/* Shop Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: is58 ? '15px' : '17px', fontWeight: '800', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{shopName}</h2>
          <p style={{ margin: '2px 0' }}>{shopAddress}</p>
          <p style={{ margin: '2px 0' }}>Tel: {shopPhone} | Email: {shopEmail}</p>
          <p style={{ margin: '2px 0' }}>GSTIN: {shopGst}</p>
        </div>

        {hr()}

        {/* Invoice Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div><strong>{invoiceType.toUpperCase()}</strong></div>
          <div>Bill No: {invoiceNumber || 'Auto-generated'}</div>
          <div>Date: {billDate} {dueDate !== billDate && `| Due: ${dueDate}`}</div>
          <div>Customer: {customer}</div>
          {customerParty.phone && <div>Phone: {customerParty.phone}</div>}
          {customerParty.state && <div>State: {customerParty.state} | Tax: {taxType}</div>}
        </div>

        {hr()}

        {/* Items */}
        {is58 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedItems.map((item, idx) => {
              const discAmt = item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100));
              const amount = Math.max(0, (item.price * item.quantity) - discAmt);
              return (
                <div key={item.productId || idx}>
                  <div style={{ fontWeight: '700' }}>{idx + 1}. {item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                    <span>{item.quantity} {item.unit || 'pcs'} x ₹{Number(item.price).toFixed(2)}</span>
                    <span>₹{amount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Rate</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Amt</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, idx) => {
                const discAmt = item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100));
                const amount = Math.max(0, (item.price * item.quantity) - discAmt);
                return (
                  <tr key={item.productId || idx} style={{ verticalAlign: 'top' }}>
                    <td style={{ padding: '4px 0' }}>
                      {idx + 1}. {item.name}
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>₹{Number(item.price).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: '700' }}>₹{amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {hr()}

        {/* Calculations Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {overallDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Discount {overallDiscountType === 'percent' ? `(${overallDiscount}%)` : ''}:</span>
              <span>-₹{flatOverallDiscount.toFixed(2)}</span>
            </div>
          )}
          {additionalCharges > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{chargeLabel} Charges:</span>
              <span>+₹{Number(additionalCharges).toFixed(2)}</span>
            </div>
          )}
          {totalGst > 0 && (
            <>
              {taxType === 'Intra-state (CGST + SGST)' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>  CGST (Central):</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>  SGST (State):</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>  IGST (Integrated):</span>
                  <span>₹{igst.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {roundOff !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Round Off:</span>
              <span>{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: is58 ? '12px' : '14px', fontWeight: '800', borderTop: '1px dashed #000000', paddingTop: '4px', marginTop: '2px' }}>
            <span>TOTAL AMOUNT:</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {hr()}

        {/* Payments details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div>Payment Mode: {paymentMode}</div>
          <div>Amount Received: ₹{Number(paymentReceived).toFixed(2)}</div>
          <div style={{ fontWeight: '700' }}>
            {paymentReceived >= totalAmount 
              ? `Change Due: ₹${(paymentReceived - totalAmount).toFixed(2)}`
              : `Balance Due: ₹${(totalAmount - paymentReceived).toFixed(2)}`}
          </div>
        </div>

        {hr()}

        {/* Footer Notes & Remarks */}
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: is58 ? '9.5px' : '11px' }}>
          {notes && <div style={{ marginBottom: '4px' }}>Notes: {notes}</div>}
          {terms && <div style={{ marginBottom: '6px' }}>Terms: {terms}</div>}
          <div style={{ fontWeight: '700', textTransform: 'uppercase' }}>*** Thank you! Visit Again ***</div>
        </div>
      </div>
    );
  };

  const filteredProducts = products.filter(p => 
    (p.name || p.productName || '').toLowerCase().includes(selectedProductSearch.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(selectedProductSearch.toLowerCase())
  );

  const renderPreviewTable = (style) => {
    const isClassic = style === 'Classic';
    const isMinimal = style === 'Minimal';
    const isModern = style === 'Modern';

    const thStyle = {
      padding: '10px 12px',
      fontSize: '12px',
      fontWeight: '700',
      textAlign: 'left',
      borderBottom: isMinimal ? '2px solid #10b981' : '1px solid #cbd5e1',
      background: isClassic ? '#f1f5f9' : isModern ? '#1e3a8a' : 'transparent',
      color: isClassic ? '#1e293b' : isModern ? '#ffffff' : '#64748b',
      textTransform: 'uppercase',
      letterSpacing: isMinimal ? '0.5px' : 'normal'
    };

    const tdStyle = (idx) => ({
      padding: '10px 12px',
      fontSize: '12.5px',
      color: '#334155',
      borderBottom: isMinimal ? '1px solid #f1f5f9' : '1px solid #e2e8f0',
      borderRight: isClassic ? '1px solid #e2e8f0' : 'none',
      borderLeft: isClassic ? '1px solid #e2e8f0' : 'none',
      background: isModern && idx % 2 === 1 ? '#f8fafc' : 'transparent'
    });

    return (
      <div style={{ marginTop: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: isClassic ? '1px solid #cbd5e1' : 'none' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '4%' }}>#</th>
              <th style={{ ...thStyle, width: '40%' }}>Item Description</th>
              <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Qty</th>
              <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>Rate (₹)</th>
              <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>Disc</th>
              <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>GST</th>
              <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map((item, idx) => {
              const discAmt = item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100));
              const amount = Math.max(0, (item.price * item.quantity) - discAmt);
              return (
                <tr key={item.productId || idx}>
                  <td style={{ ...tdStyle(idx), textAlign: 'left', borderLeft: isClassic ? '1px solid #cbd5e1' : 'none' }}>{idx + 1}</td>
                  <td style={{ ...tdStyle(idx), fontWeight: '600' }}>
                    {item.name}
                    <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 'normal', marginTop: '2px' }}>
                      SKU: {item.sku} | Unit: {item.unit || 'pcs'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle(idx), textAlign: 'center' }}>{item.quantity} {item.unit || 'pcs'}</td>
                  <td style={{ ...tdStyle(idx), textAlign: 'right' }}>₹{Number(item.price).toFixed(2)}</td>
                  <td style={{ ...tdStyle(idx), textAlign: 'right' }}>
                    {item.discount > 0 ? (item.discountType === 'flat' ? `₹${item.discount}` : `${item.discount}%`) : '0%'}
                  </td>
                  <td style={{ ...tdStyle(idx), textAlign: 'right' }}>{item.gstRate}%</td>
                  <td style={{ ...tdStyle(idx), textAlign: 'right', fontWeight: '700', color: '#1e293b', borderRight: isClassic ? '1px solid #cbd5e1' : 'none' }}>
                    ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPreviewFooter = (style) => {
    const isClassic = style === 'Classic';
    const isMinimal = style === 'Minimal';
    const isModern = style === 'Modern';

    const rowValStyle = {
      textAlign: 'right',
      fontSize: '13px',
      color: '#334155',
      padding: '4px 0'
    };

    const rowLblStyle = {
      fontSize: '13px',
      color: '#64748b',
      fontWeight: '500',
      padding: '4px 0',
      textAlign: 'left'
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginTop: '20px' }}>
        {/* Left column: Notes, Terms, Bank info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notes && (
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: isMinimal ? '#10b981' : '#64748b', display: 'block', marginBottom: '4px' }}>
                Notes / Remarks
              </span>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, whiteSpace: 'pre-line', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', lineHeight: '1.4' }}>
                {notes}
              </p>
            </div>
          )}
          {terms && (
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: isMinimal ? '#10b981' : '#64748b', display: 'block', marginBottom: '4px' }}>
                Terms & Conditions
              </span>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                {terms}
              </p>
            </div>
          )}
          
          {/* Signatures spacer */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ width: '120px', borderBottom: '1px solid #cbd5e1', marginBottom: '4px' }}></div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Customer Signature</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '24px' }}>For {shopProfile.shopName || user?.username || 'Store'}</span>
              <div style={{ width: '150px', borderBottom: '1px solid #cbd5e1', marginBottom: '4px', display: 'inline-block' }}></div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Right column: Calculations Summary */}
        <div style={{
          background: isModern ? '#f8fafc' : 'transparent',
          padding: isModern ? '18px' : '0',
          borderRadius: isModern ? '10px' : '0',
          border: isModern ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={rowLblStyle}>Subtotal</td>
                <td style={rowValStyle}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              {overallDiscount > 0 && (
                <tr>
                  <td style={rowLblStyle}>Overall Discount {overallDiscountType === 'percent' ? `(${overallDiscount}%)` : ''}</td>
                  <td style={{ ...rowValStyle, color: '#ef4444' }}>-₹{flatOverallDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              {additionalCharges > 0 && (
                <tr>
                  <td style={rowLblStyle}>{chargeLabel} Charges</td>
                  <td style={rowValStyle}>+₹{Number(additionalCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              {totalGst > 0 && (
                <>
                  {taxType === 'Intra-state (CGST + SGST)' ? (
                    <>
                      <tr>
                        <td style={{ ...rowLblStyle, paddingLeft: '8px', fontSize: '12px' }}>CGST (Central Tax)</td>
                        <td style={rowValStyle}>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td style={{ ...rowLblStyle, paddingLeft: '8px', fontSize: '12px' }}>SGST (State Tax)</td>
                        <td style={rowValStyle}>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ ...rowLblStyle, paddingLeft: '8px', fontSize: '12px' }}>IGST (Integrated Tax)</td>
                      <td style={rowValStyle}>₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                </>
              )}
              {roundOff !== 0 && (
                <tr>
                  <td style={rowLblStyle}>Round Off</td>
                  <td style={rowValStyle}>{roundOff > 0 ? '+' : ''}₹{roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
              
              {/* Grand Total Row */}
              <tr style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1' }}>
                <td style={{ ...rowLblStyle, fontSize: '16px', fontWeight: '800', color: '#0f172a', padding: '12px 0' }}>Grand Total</td>
                <td style={{ ...rowValStyle, fontSize: '18px', fontWeight: '800', color: isMinimal ? '#10b981' : isModern ? '#1e3a8a' : '#1e293b', padding: '12px 0' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Payment Received & Due Info */}
              <tr>
                <td style={{ ...rowLblStyle, padding: '10px 0 4px 0' }}>Payment Mode</td>
                <td style={{ ...rowValStyle, padding: '10px 0 4px 0', fontWeight: '600' }}>{paymentMode}</td>
              </tr>
              <tr>
                <td style={rowLblStyle}>Received Amount</td>
                <td style={{ ...rowValStyle, color: '#10b981', fontWeight: '700' }}>₹{Number(paymentReceived).toLocaleString('en-IN')}</td>
              </tr>
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ ...rowLblStyle, fontWeight: '700', color: paymentReceived >= totalAmount ? '#10b981' : '#ef4444' }}>
                  {paymentReceived >= totalAmount ? 'Change Due' : 'Balance Due'}
                </td>
                <td style={{
                  ...rowValStyle,
                  fontWeight: '700',
                  color: paymentReceived >= totalAmount ? '#10b981' : '#ef4444',
                  fontSize: '14.5px'
                }}>
                  ₹{paymentReceived >= totalAmount 
                    ? (paymentReceived - totalAmount).toLocaleString('en-IN')
                    : (totalAmount - paymentReceived).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 30px', fontFamily: "'Outfit', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : toast.type === 'info' ? '#3b82f6' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white', padding: '12px 24px', borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : toast.type === 'info' ? 'fas fa-info-circle' : 'fas fa-exclamation-circle'}></i>
          {toast.message}
        </div>
      )}

      <div className="sec-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-1)' }}>Billing & Invoice Command Center</h2>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '4px' }}>Draft professional invoices, manage credit slips, and view real-time sales summaries.</p>
      </div>

      <div className="two-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Form: Create Sale Invoice */}
        <div style={{ width: '100%' }}>
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
              {editingInvoiceId ? `Edit Invoice: ${invoiceNumber || editingInvoiceId}` : 'Create Sale Invoice'}
            </h3>

            {/* Step 1: Customer & Invoice Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Customer Name / Party</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-handshake" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                  <input 
                    className="fi fi-icon-padding" 
                    placeholder="Enter customer name or select..." 
                    value={customer} 
                    onChange={e => setCustomer(e.target.value)} 
                    list="party-list"
                    style={{ flex: 1, paddingRight: customer.trim() && !parties.find(p => p.name?.toLowerCase() === customer.trim().toLowerCase()) ? '90px' : '14px' }}
                  />
                  <datalist id="party-list">
                    {parties.map(p => <option key={p.id || p._id} value={p.name} />)}
                  </datalist>
                  {customer.trim() && !parties.find(p => p.name?.toLowerCase() === customer.trim().toLowerCase()) && (
                    <button 
                      type="button" 
                      onClick={() => { setNewPartyForm({ name: customer, phone: '', email: '', state: 'Karnataka' }); setShowAddPartyModal(true); }}
                      className="btn btn--primary" 
                      style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', padding: '5px 8px', fontSize: '10.5px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', zIndex: 10 }}
                    >
                      <i className="fas fa-plus"></i> Save Party
                    </button>
                  )}
                </div>
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Invoice Type</label>
                <select className="fi" style={{ cursor: 'pointer' }} value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                  <option>Sale Invoice (GST)</option>
                  <option>Sale Invoice (Non-GST)</option>
                  <option>Proforma Invoice</option>
                  <option>Delivery Challan</option>
                  <option>Credit Note (return)</option>
                  <option>Debit Note</option>
                  <option>Quotation / Estimate</option>
                  <option>Purchase Order</option>
                </select>
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Tax Type</label>
                <select className="fi" style={{ cursor: 'pointer' }} value={taxType} onChange={e => setTaxType(e.target.value)}>
                  <option>Intra-state (CGST + SGST)</option>
                  <option>Inter-state (IGST)</option>
                </select>
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Invoice Date</label>
                <input type="date" className="fi" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Due Date</label>
                <input type="date" className="fi" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Custom Invoice # (Optional)</label>
                <input className="fi" placeholder="Auto-generated if blank" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Template Style</label>
                <select className="fi" style={{ cursor: 'pointer' }} value={templateStyle} onChange={e => setTemplateStyle(e.target.value)}>
                  <option value="Classic">Classic</option>
                  <option value="Modern">Modern</option>
                  <option value="Minimal">Minimal</option>
                </select>
              </div>
            </div>

            {/* Step 2: Add Products / Line Items */}
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-1)' }}>Add Products</h4>
              <div style={{ position: 'relative', width: '100%' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '13px', pointerEvents: 'none' }}></i>
                <input 
                  placeholder="Search and select product name or SKU..." 
                  className="fi fi-search-padding"
                  value={selectedProductSearch}
                  onChange={e => { setSelectedProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                />
                
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 10,
                    maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)',
                    borderRadius: '8px', background: 'var(--bg-sidebar)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginTop: '4px'
                  }}>
                    {filteredProducts.map(p => (
                      <div 
                        key={p._id || p.id} 
                        style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: 'background 0.2s' }}
                        onClick={() => handleAddProduct(p)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>{p.name || p.productName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>SKU: {p.sku || 'N/A'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-2)' }}>₹{(p.price || 0).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11px', color: '#10b981' }}>Stock: {p.stock ?? 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Selected items Ledger */}
            {selectedItems.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Product</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>Discount</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>GST Slab</th>
                      <th style={{ width: '13%', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ width: '5%', textAlign: 'center' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, idx) => {
                      const discAmt = item.discountType === 'flat' ? item.discount : (item.price * item.quantity * (item.discount / 100));
                      const amount = Math.max(0, (item.price * item.quantity) - discAmt);
                      return (
                        <tr key={item.productId || idx}>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>{item.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>SKU: {item.sku} | Unit: {item.unit || 'pcs'}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button type="button" onClick={() => updateItemQty(item.productId, item.quantity - 1)} className="btn btn--sm" style={{ padding: '2px 8px', cursor: 'pointer' }}>-</button>
                              <input 
                                type="number" 
                                className="fi" 
                                style={{ width: '55px', padding: '4px 6px', textAlign: 'center' }} 
                                value={item.quantity} 
                                onChange={e => updateItemQty(item.productId, e.target.value)}
                              />
                              <button type="button" onClick={() => updateItemQty(item.productId, item.quantity + 1)} className="btn btn--sm" style={{ padding: '2px 8px', cursor: 'pointer' }}>+</button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input 
                              type="number" 
                              className="fi" 
                              style={{ width: '90px', padding: '4px 8px', textAlign: 'right' }} 
                              value={item.price} 
                              onChange={e => updateItemRate(item.productId, e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                              <input 
                                type="number" 
                                className="fi" 
                                style={{ width: '60px', padding: '4px 6px', textAlign: 'right' }} 
                                value={item.discount} 
                                onChange={e => updateItemDiscount(item.productId, e.target.value)}
                              />
                              <select 
                                className="fi" 
                                style={{ width: '45px', padding: '4px 2px', fontSize: '11px', cursor: 'pointer' }}
                                value={item.discountType || 'percent'}
                                onChange={e => updateItemDiscountType(item.productId, e.target.value)}
                              >
                                <option value="percent">%</option>
                                <option value="flat">₹</option>
                              </select>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select 
                              className="fi" 
                              style={{ width: '80px', padding: '4px', cursor: 'pointer' }}
                              value={item.gstRate} 
                              onChange={e => updateItemGst(item.productId, e.target.value)}
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-1)' }}>
                            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => removeItem(item.productId)} className="btn btn--sm btn--icon" style={{ color: 'var(--red)', cursor: 'pointer' }}>
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Step 4: Summary & Payments */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              
              {/* Payment Section (Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-1)' }}>Payment Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Payment Mode</label>
                    <select className="fi" style={{ cursor: 'pointer' }} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Cheque</option>
                      <option>Credit</option>
                      <option>Split</option>
                      <option>Other</option>
                    </select>
                  </div>
                  
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Amount Received (₹)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      placeholder="₹ Amount paid" 
                      value={paymentReceived} 
                      onChange={e => setPaymentReceived(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {(paymentMode === 'UPI' || paymentMode === 'Split') && (
                  <div className="fg" style={{ marginBottom: 0, animation: 'fadeIn 0.2s' }}>
                    <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>UPI Reference / TXN ID</label>
                    <input className="fi" placeholder="Enter transaction ref number" value={upiRef} onChange={e => setUpiRef(e.target.value)} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Notes / Remarks</label>
                    <textarea 
                      className="fi" 
                      placeholder="Enter terms, payment details or internal notes..." 
                      style={{ minHeight: '60px', resize: 'vertical', fontSize: '13px' }} 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>Terms & Conditions</label>
                    <textarea 
                      className="fi" 
                      placeholder="Terms and conditions..." 
                      style={{ minHeight: '60px', resize: 'vertical', fontSize: '13px' }} 
                      value={terms} 
                      onChange={e => setTerms(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Calculations Summary Section (Right) */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-2)' }}>
                  <span>Items Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '4px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Overall Discount</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="number" 
                        className="fi" 
                        style={{ padding: '6px 10px', fontSize: '12.5px', flex: 1 }} 
                        placeholder="Discount"
                        value={overallDiscount}
                        onChange={e => setOverallDiscount(Number(e.target.value) || 0)}
                      />
                      <select 
                        className="fi" 
                        style={{ width: '50px', padding: '4px', cursor: 'pointer', fontSize: '12.5px' }}
                        value={overallDiscountType}
                        onChange={e => setOverallDiscountType(e.target.value)}
                      >
                        <option value="flat">₹</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{chargeLabel} Charge (₹)</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        className="fi" 
                        style={{ padding: '6px 8px', fontSize: '11.5px', flex: 1 }} 
                        value={chargeLabel}
                        onChange={e => setChargeLabel(e.target.value)}
                      />
                      <input 
                        type="number" 
                        className="fi" 
                        style={{ padding: '6px 8px', fontSize: '11.5px', width: '70px', textAlign: 'right' }} 
                        value={additionalCharges}
                        onChange={e => setAdditionalCharges(Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {totalGst > 0 && (
                  <>
                    {!isInterstate ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-3)' }}>
                          <span>CGST (Central Tax)</span>
                          <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-3)' }}>
                          <span>SGST (State Tax)</span>
                          <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-3)' }}>
                        <span>IGST (Integrated Tax)</span>
                        <span>₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                )}

                {roundOff !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-3)' }}>
                    <span>Round Off</span>
                    <span>{roundOff > 0 ? '+' : ''}₹{roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-1)' }}>Grand Total</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: paymentReceived >= totalAmount ? '#10b981' : '#ef4444', fontWeight: '600', marginTop: '2px' }}>
                  <span>{paymentReceived >= totalAmount ? 'Change Due' : 'Balance Due'}</span>
                  <span>
                    ₹{paymentReceived >= totalAmount 
                      ? (paymentReceived - totalAmount).toLocaleString('en-IN')
                      : (totalAmount - paymentReceived).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button 
                type="button"
                onClick={() => setShowPreviewModal(true)} 
                className="btn" 
                style={{ cursor: 'pointer', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-eye"></i> Preview Invoice
              </button>
              {editingInvoiceId ? (
                <>
                  <button 
                    onClick={cancelEdit} 
                    className="btn" 
                    style={{ cursor: 'pointer', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  >
                    <i className="fas fa-times" style={{ marginRight: '6px' }}></i> Cancel Edit
                  </button>
                  <button 
                    onClick={createInvoiceSubmit} 
                    className="btn btn--primary" 
                    style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)' }}
                  >
                    <i className="fas fa-save" style={{ marginRight: '6px' }}></i> Update Invoice
                  </button>
                </>
              ) : (
                <button 
                  onClick={createInvoiceSubmit} 
                  className="btn btn--primary" 
                  style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)' }}
                >
                  <i className="fas fa-file-invoice-dollar" style={{ marginRight: '6px' }}></i> Generate Invoice / Bill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom List: Invoice Ledger */}
        <div style={{ width: '100%' }}>
          {/* Overdue alert banner */}
          {agingData && agingData.summary && agingData.summary.overdueCount > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px',
              padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#ef4444', color: 'white', width: '36px', height: '36px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(239,68,68,0.2)'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: 'var(--text-1)' }}>
                    Attention: {agingData.summary.overdueCount} Overdue Invoices
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-2)' }}>
                    You have outstanding receivables of <strong>₹{agingData.summary.totalOverdue.toLocaleString('en-IN')}</strong> that have passed their due dates.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setFilterStatus('Unpaid'); setPage(1); }} 
                className="btn btn--sm" 
                style={{ background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}
              >
                View Overdue
              </button>
            </div>
          )}

          {/* Aging Report Dashboard */}
          {showAgingSection && agingData && (
            <div className="card" style={{ padding: '24px', marginBottom: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-chart-bar" style={{ color: 'var(--accent)' }}></i> Accounts Receivable Aging Report
                </h3>
                <button 
                  onClick={() => setShowAgingSection(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '13px' }}
                >
                  <i className="fas fa-times"></i> Hide Report
                </button>
              </div>

              {/* Stats Deck */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase' }}>Total Invoices</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-1)' }}>{agingData.summary.totalInvoices}</h4>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase' }}>Total Billed</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-1)' }}>₹{agingData.summary.totalAmount.toLocaleString('en-IN')}</h4>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase' }}>Total Received</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#10b981' }}>₹{agingData.summary.totalReceived.toLocaleString('en-IN')}</h4>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase' }}>Outstanding Receivables</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>₹{agingData.summary.totalOutstanding.toLocaleString('en-IN')}</h4>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase' }}>Overdue Bills</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{agingData.summary.overdueCount}</h4>
                </div>
              </div>

              {/* Visual Bar Chart */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)', display: 'block', marginBottom: '12px' }}>Outstanding Aging Breakdown</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(agingData.buckets).map(([bucketName, amount]) => {
                    const outstanding = agingData.summary.totalOutstanding || 1;
                    const percent = Math.min(100, Math.round((amount / outstanding) * 100));
                    
                    const colorMap = {
                      '0-30': '#10b981',
                      '31-60': '#f59e0b',
                      '61-90': '#f97316',
                      '90+': '#ef4444'
                    };
                    const color = colorMap[bucketName] || 'var(--accent)';

                    return (
                      <div key={bucketName} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ width: '60px', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-2)' }}>{bucketName} Days</span>
                        <div style={{ flex: 1, height: '16px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${percent}%`, height: '100%', background: color,
                            borderRadius: '8px', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                          }} />
                        </div>
                        <span style={{ width: '120px', textAlign: 'right', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-1)' }}>
                          ₹{amount.toLocaleString('en-IN')} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!showAgingSection && agingData && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button 
                onClick={() => setShowAgingSection(true)} 
                className="btn btn--sm" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
              >
                <i className="fas fa-chart-bar"></i> Show Accounts Receivable Aging Report
              </button>
            </div>
          )}

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>Invoice List</h3>
              
              {/* Search & Filter Controls */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '13px', pointerEvents: 'none' }}></i>
                  <input 
                    placeholder="Search invoice or customer..." 
                    className="fi fi-search-padding"
                    style={{ paddingLeft: '34px', fontSize: '13px' }}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="fi" 
                    style={{ fontSize: '13px', padding: '6px 12px', minWidth: '150px', cursor: 'pointer' }}
                    value={filterType} 
                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                  >
                    <option value="All">All Types</option>
                    <option value="Sale Invoice (GST)">Sale Invoice (GST)</option>
                    <option value="Sale Invoice (Non-GST)">Sale Invoice (Non-GST)</option>
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Delivery Challan">Delivery Challan</option>
                    <option value="Credit Note (return)">Credit Note (return)</option>
                    <option value="Debit Note">Debit Note</option>
                    <option value="Quotation / Estimate">Quotation / Estimate</option>
                    <option value="Purchase Order">Purchase Order</option>
                  </select>

                  <select 
                    className="fi" 
                    style={{ fontSize: '13px', padding: '6px 12px', minWidth: '120px', cursor: 'pointer' }}
                    value={filterStatus} 
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  >
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>
                      <input 
                        type="checkbox" 
                        checked={list.length > 0 && selectedInvoiceIds.length === list.length} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoiceIds(list.map(inv => inv.id));
                          } else {
                            setSelectedInvoiceIds([]);
                          }
                        }}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </th>
                    <th>Invoice#</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length ? (
                    list.map(inv => {
                      const isOverdue = isInvoiceOverdue(inv);
                      const displayStatus = isOverdue ? 'Overdue' : (inv.status || 'Unpaid');
                      const statusColor = isOverdue ? '#ef4444' : inv.status === 'Paid' ? '#10b981' : inv.status === 'Partial' ? '#f59e0b' : '#ef4444';
                      const statusBg = isOverdue ? 'rgba(239, 68, 68, 0.1)' : inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : inv.status === 'Partial' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                      
                      return (
                        <tr key={inv.id || inv._id}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedInvoiceIds.includes(inv.id)} 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInvoiceIds([...selectedInvoiceIds, inv.id]);
                                } else {
                                  setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id));
                                }
                              }}
                              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            />
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-1)' }}>{inv.invoiceNumber || inv.id}</td>
                          <td>{inv.customer}</td>
                          <td>{inv.date}</td>
                          <td>
                            {inv.type || 'Sale Invoice'}
                            {inv.recurring && (
                              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', marginLeft: '6px', fontSize: '9px', fontWeight: 'bold' }} title={`Next billing run scheduled: ${inv.recurring.nextRun}`}>
                                <i className="fas fa-redo fa-spin" style={{ marginRight: '3px', fontSize: '8px' }}></i>Every {inv.recurring.intervalDays}d
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-2)' }}>
                            ₹{Number(inv.totalAmount || inv.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span className="badge" style={{ background: statusBg, color: statusColor, fontSize: '10.5px' }}>
                              {displayStatus}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {(inv.type === 'Quotation / Estimate' || inv.type === 'Proforma Invoice') && (
                                <button 
                                  onClick={() => handleConvert(inv.id)} 
                                  className="btn btn--sm btn--primary" 
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#ffffff' }}
                                  title="Convert to Sale Invoice"
                                >
                                  <i className="fas fa-check-circle"></i> Convert
                                </button>
                              )}
                              <button 
                                onClick={() => handleSetupRecurring(inv.id)} 
                                className="btn btn--sm btn--icon" 
                                style={{ color: inv.recurring ? '#8b5cf6' : 'var(--text-3)', cursor: 'pointer' }}
                                title={inv.recurring ? `Recurring Active (Every ${inv.recurring.intervalDays} days)` : "Setup Recurring Billing"}
                              >
                                <i className="fas fa-redo"></i>
                              </button>
                              <button 
                                onClick={() => startEdit(inv)} 
                                className="btn btn--sm btn--icon" 
                                style={{ color: 'var(--accent)', cursor: 'pointer' }}
                                title="Edit Invoice"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                onClick={() => handleDuplicate(inv.id)} 
                                className="btn btn--sm btn--icon" 
                                style={{ color: '#3b82f6', cursor: 'pointer' }}
                                title="Duplicate Invoice"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                              <button 
                                onClick={() => triggerShare(inv)} 
                                className="btn btn--sm" 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'var(--bg-input)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                                title="Share Invoice"
                              >
                                <i className="fas fa-share-alt"></i> Share
                              </button>
                              <button 
                                onClick={() => downloadInvoicePDF(inv.id, inv.invoiceNumber || inv.id)} 
                                className="btn btn--sm" 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              >
                                <i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i> PDF
                              </button>
                              <button 
                                onClick={() => del(inv.id)} 
                                className="btn btn--sm btn--icon" 
                                style={{ color: 'var(--red)', cursor: 'pointer' }}
                                title="Delete Invoice"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>
                        <i className="fas fa-file-invoice" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.3 }}></i>
                        No invoice ledger details found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                  Showing Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                  >
                    <i className="fas fa-chevron-left" style={{ marginRight: '4px' }}></i> Previous
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                  >
                    Next <i className="fas fa-chevron-right" style={{ marginLeft: '4px' }}></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Customer Modal */}
      {showAddPartyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '420px', padding: '24px', position: 'relative', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-1)' }}>Save Customer Inline</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="fg">
                <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-2)', marginBottom: '4px' }}>Customer Name</label>
                <input 
                  className="fi" 
                  value={newPartyForm.name} 
                  onChange={e => setNewPartyForm({ ...newPartyForm, name: e.target.value })}
                />
              </div>

              <div className="fg">
                <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-2)', marginBottom: '4px' }}>Phone Number</label>
                <input 
                  className="fi" 
                  placeholder="+91 98765 43210" 
                  value={newPartyForm.phone} 
                  onChange={e => setNewPartyForm({ ...newPartyForm, phone: e.target.value })}
                />
              </div>

              <div className="fg">
                <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-2)', marginBottom: '4px' }}>Email Address</label>
                <input 
                  className="fi" 
                  placeholder="customer@example.com" 
                  value={newPartyForm.email} 
                  onChange={e => setNewPartyForm({ ...newPartyForm, email: e.target.value })}
                />
              </div>

              <div className="fg">
                <label style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-2)', marginBottom: '4px' }}>State</label>
                <select 
                  className="fi" 
                  style={{ cursor: 'pointer' }}
                  value={newPartyForm.state} 
                  onChange={e => setNewPartyForm({ ...newPartyForm, state: e.target.value })}
                >
                  <option>Andhra Pradesh</option>
                  <option>Arunachal Pradesh</option>
                  <option>Assam</option>
                  <option>Bihar</option>
                  <option>Chhattisgarh</option>
                  <option>Goa</option>
                  <option>Gujarat</option>
                  <option>Haryana</option>
                  <option>Himachal Pradesh</option>
                  <option>Jharkhand</option>
                  <option>Karnataka</option>
                  <option>Kerala</option>
                  <option>Madhya Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Manipur</option>
                  <option>Meghalaya</option>
                  <option>Mizoram</option>
                  <option>Nagaland</option>
                  <option>Odisha</option>
                  <option>Punjab</option>
                  <option>Rajasthan</option>
                  <option>Sikkim</option>
                  <option>Tamil Nadu</option>
                  <option>Telangana</option>
                  <option>Tripura</option>
                  <option>Uttar Pradesh</option>
                  <option>Uttarakhand</option>
                  <option>West Bengal</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => setShowAddPartyModal(false)} 
                className="btn" 
                style={{ cursor: 'pointer', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSavePartyInline} 
                className="btn btn--primary" 
                style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)' }}
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Preview Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-invoice-sheet, .print-invoice-sheet * {
                visibility: visible;
              }
              .print-invoice-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: ${printSize === 'A4' ? '40px' : printSize === 'A5' ? '24px' : printSize === '80mm' ? '12px' : '8px'} !important;
              }
              @page {
                size: ${printSize === 'A4' ? 'A4 portrait' : printSize === 'A5' ? 'A5 portrait' : printSize === '80mm' ? '80mm auto' : '58mm auto'};
                margin: ${printSize.endsWith('mm') ? '0' : '10mm'};
              }
            }
          `}</style>
          
          {/* Top control bar */}
          <div style={{
            width: '100%', maxWidth: '800px', background: 'var(--bg-sidebar)',
            border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 24px',
            display: 'flex', flexDirection: 'column', gap: '14px',
            marginBottom: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'sticky', top: 0, zIndex: 10001
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-1)' }}>Template:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['Classic', 'Modern', 'Minimal'].map(styleName => (
                      <button
                        key={styleName}
                        type="button"
                        onClick={() => setTemplateStyle(styleName)}
                        style={{
                          padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                          fontWeight: '600', fontSize: '11.5px', cursor: 'pointer',
                          background: templateStyle === styleName ? 'var(--accent)' : 'var(--bg-input)',
                          color: templateStyle === styleName ? 'white' : 'var(--text-2)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {styleName}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-1)', marginLeft: '12px' }}>Print Size:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['A4', 'A5', '80mm', '58mm'].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPrintSize(size)}
                        style={{
                          padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                          fontWeight: '600', fontSize: '11.5px', cursor: 'pointer',
                          background: printSize === size ? 'var(--accent)' : 'var(--bg-input)',
                          color: printSize === size ? 'white' : 'var(--text-2)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const mockInv = {
                      invoiceNumber: invoiceNumber || 'Draft',
                      customer,
                      totalAmount,
                      balanceDue: Math.max(0, totalAmount - paymentReceived),
                      type: invoiceType,
                      date: billDate
                    };
                    triggerShare(mockInv);
                  }}
                  className="btn"
                  style={{ padding: '8px 14px', fontSize: '12.5px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className="fas fa-share-alt"></i> Share
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn"
                  style={{ padding: '8px 14px', fontSize: '12.5px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className="fas fa-print"></i> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPreviewModal(false); createInvoiceSubmit(); }}
                  className="btn btn--primary"
                  style={{ padding: '8px 14px', fontSize: '12.5px', background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className="fas fa-save"></i> Save Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="btn"
                  style={{ padding: '8px 14px', fontSize: '12.5px', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>

          {/* A4/A5/Thermal Invoice Sheet Container */}
          <div className="print-invoice-sheet" style={{
            width: '100%',
            maxWidth: printSize === 'A4' ? '800px' : printSize === 'A5' ? '580px' : printSize === '80mm' ? '380px' : '280px',
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '12px',
            padding: printSize === 'A4' ? '40px' : printSize === 'A5' ? '24px' : printSize === '80mm' ? '12px' : '8px',
            boxSizing: 'border-box',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            minHeight: printSize.endsWith('mm') ? 'auto' : '1000px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: printSize.endsWith('mm') ? "'Courier New', Courier, monospace" : "'Inter', sans-serif",
            border: printSize.endsWith('mm') ? '1px dashed #000000' : '1px solid #e2e8f0',
            position: 'relative'
          }}>
            {/* Template Specific Header & Content */}
            {(() => {
              if (printSize === '80mm' || printSize === '58mm') {
                return renderThermalReceipt(printSize);
              }
              const customerParty = parties.find(p => p.name?.toLowerCase() === customer.trim().toLowerCase()) || {};
              const shopName = shopProfile.shopName || user?.username || 'Vyapar Store';
              const shopPhone = shopProfile.phone || 'N/A';
              const shopEmail = shopProfile.email || 'N/A';
              const shopAddress = `${shopProfile.addressLine1 || ''} ${shopProfile.addressLine2 || ''} ${shopProfile.city || ''} ${shopProfile.state || ''} ${shopProfile.pincode || ''}`.trim() || 'N/A';
              const shopGst = shopProfile.gstin || 'N/A';
              const shopPan = shopProfile.pan || 'N/A';

              if (templateStyle === 'Classic') {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                    {/* Top Decorative Border */}
                    <div style={{ height: '4px', background: '#1e3a8a', width: '100%' }}></div>
                    
                    {/* Header: Shop and Invoice Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e3a8a', paddingBottom: '16px' }}>
                      <div>
                        {shopProfile.logoUrl && (
                          <img src={shopProfile.logoUrl} alt="Logo" style={{ maxHeight: '50px', marginBottom: '8px' }} />
                        )}
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e3a8a', margin: 0, textTransform: 'uppercase' }}>{shopName}</h1>
                        <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0', maxWidth: '300px', lineHeight: '1.4' }}>{shopAddress}</p>
                        <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0' }}>Phone: {shopPhone} | Email: {shopEmail}</p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>GSTIN: {shopGst} | PAN: {shopPan}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e3a8a', margin: 0, letterSpacing: '1px' }}>{invoiceType.toUpperCase()}</h2>
                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 12px', fontSize: '13px', textAlign: 'left' }}>
                          <span style={{ fontWeight: '600' }}>Invoice No:</span> <span>{invoiceNumber || 'Auto-generated'}</span>
                          <span style={{ fontWeight: '600' }}>Date:</span> <span>{billDate}</span>
                          <span style={{ fontWeight: '600' }}>Due Date:</span> <span>{dueDate}</span>
                          <span style={{ fontWeight: '600' }}>Tax Type:</span> <span style={{ fontSize: '11px' }}>{taxType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Parties Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '4px' }}>
                        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#1e3a8a', margin: '0 0 8px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontWeight: '700' }}>Billed To</h3>
                        <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' }}>{customer}</p>
                        {customerParty.phone && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}>Phone: {customerParty.phone}</p>}
                        {customerParty.email && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}>Email: {customerParty.email}</p>}
                        {customerParty.state && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}>State: {customerParty.state}</p>}
                      </div>
                      <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '4px' }}>
                        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#1e3a8a', margin: '0 0 8px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontWeight: '700' }}>Ship To</h3>
                        <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' }}>{customer}</p>
                        {customerParty.state && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}>Delivery Destination: {customerParty.state}</p>}
                        <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}>Transport Mode: Standard Handover</p>
                      </div>
                    </div>

                    {/* Table */}
                    {renderPreviewTable('Classic')}

                    {/* Totals & Notes Section */}
                    {renderPreviewFooter('Classic')}
                  </div>
                );
              }

              if (templateStyle === 'Modern') {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                    {/* Modern Top Header Block */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      color: '#ffffff', padding: '24px', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        {shopProfile.logoUrl && (
                          <img src={shopProfile.logoUrl} alt="Logo" style={{ maxHeight: '45px', filter: 'brightness(0) invert(1)', marginBottom: '8px' }} />
                        )}
                        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{shopName}</h1>
                        <p style={{ fontSize: '11px', opacity: 0.9, margin: '4px 0 0 0', maxWidth: '340px' }}>{shopAddress}</p>
                        <p style={{ fontSize: '11px', opacity: 0.9, margin: '2px 0 0 0' }}>Phone: {shopPhone} | GSTIN: {shopGst}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                          {invoiceType}
                        </span>
                        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0', color: '#ffffff' }}>
                          #{invoiceNumber || 'DRAFT'}
                        </h2>
                        <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.9 }}>
                          <div>Date: <strong>{billDate}</strong></div>
                          <div>Due: <strong>{dueDate}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Parties Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: '800', marginBottom: '6px' }}>Billed Customer</div>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>{customer}</p>
                        {customerParty.phone && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}><i className="fas fa-phone" style={{ marginRight: '6px', fontSize: '10px', color: '#94a3b8' }}></i> {customerParty.phone}</p>}
                        {customerParty.email && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}><i className="fas fa-envelope" style={{ marginRight: '6px', fontSize: '10px', color: '#94a3b8' }}></i> {customerParty.email}</p>}
                        {customerParty.state && <p style={{ fontSize: '12px', margin: '2px 0', color: '#475569' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '6px', fontSize: '10px', color: '#94a3b8' }}></i> State: {customerParty.state}</p>}
                      </div>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: '800', marginBottom: '6px' }}>Invoice Metadata</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 8px', fontSize: '12.5px' }}>
                          <span style={{ color: '#64748b' }}>Tax Rule:</span> <strong style={{ color: '#334155' }}>{taxType}</strong>
                          <span style={{ color: '#64748b' }}>Payment Mode:</span> <strong style={{ color: '#334155' }}>{paymentMode}</strong>
                          {upiRef && <><span style={{ color: '#64748b' }}>UPI Ref:</span> <strong style={{ color: '#334155' }}>{upiRef}</strong></>}
                          <span style={{ color: '#64748b' }}>Status:</span> 
                          <span style={{ 
                            fontWeight: '800', color: paymentReceived >= totalAmount ? '#10b981' : '#f59e0b',
                            fontSize: '11px', textTransform: 'uppercase'
                          }}>
                            {paymentReceived >= totalAmount ? 'Paid' : paymentReceived > 0 ? 'Partially Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    {renderPreviewTable('Modern')}

                    {/* Totals & Notes Section */}
                    {renderPreviewFooter('Modern')}
                  </div>
                );
              }

              if (templateStyle === 'Minimal') {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>
                    {/* Top Accent Strip */}
                    <div style={{ height: '6px', background: '#10b981', width: '100%', borderRadius: '3px 3px 0 0' }}></div>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '300', color: '#0f172a', margin: 0 }}>
                          <strong>{shopName}</strong>
                        </h1>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.5', maxWidth: '320px' }}>
                          <div>{shopAddress}</div>
                          <div style={{ marginTop: '2px' }}>Phone: {shopPhone} | Email: {shopEmail}</div>
                          <div>GSTIN: {shopGst}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#10b981', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                          {invoiceType.split(' ')[0]}
                        </h2>
                        <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 16px', fontSize: '12px', textAlign: 'left', justifyContent: 'flex-end' }}>
                          <span style={{ color: '#64748b' }}>Number:</span> <span style={{ fontWeight: '600' }}>#{invoiceNumber || 'Draft'}</span>
                          <span style={{ color: '#64748b' }}>Issued:</span> <span style={{ fontWeight: '600' }}>{billDate}</span>
                          <span style={{ color: '#64748b' }}>Due Date:</span> <span style={{ fontWeight: '600' }}>{dueDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Divider */}
                    <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>

                    {/* Client & Billing Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Billed To</span>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>{customer}</strong>
                        {customerParty.phone && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Phone: {customerParty.phone}</div>}
                        {customerParty.email && <div style={{ fontSize: '12px', color: '#64748b' }}>Email: {customerParty.email}</div>}
                        {customerParty.state && <div style={{ fontSize: '12px', color: '#64748b' }}>State: {customerParty.state}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Tax & Terms</span>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div>Tax Rule: <strong>{taxType}</strong></div>
                          <div>Due Duration: <strong>Same Day</strong></div>
                          <div>Payment Terms: <strong>Immediate</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    {renderPreviewTable('Minimal')}

                    {/* Totals & Notes Section */}
                    {renderPreviewFooter('Minimal')}
                  </div>
                );
              }
            })()}

            {/* Standard bottom watermark */}
            <div style={{
              borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '30px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '11px', color: '#94a3b8'
            }}>
              <span>Generated via Vyapar Billing Software</span>
              <span>Page 1 of 1</span>
              <span>Thank you for your business!</span>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {showShareModal && shareTargetInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', zIndex: 11000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '420px', padding: '24px', position: 'relative', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>Share Invoice</h3>
            
            <p style={{ fontSize: '13.5px', color: 'var(--text-2)', marginBottom: '20px', lineHeight: '1.4' }}>
              Select a channel to share details of <strong>Invoice #{shareTargetInvoice.invoiceNumber || 'Draft'}</strong> (Total: ₹{Number(shareTargetInvoice.totalAmount || 0).toLocaleString('en-IN')}) for customer <strong>{shareTargetInvoice.customer}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const targetParty = parties.find(p => p.name?.toLowerCase() === shareTargetInvoice.customer?.toLowerCase()) || {};
                  const phone = targetParty.phone || '';
                  const msg = encodeURIComponent(`Hi ${shareTargetInvoice.customer},\nHere are the details for your ${shareTargetInvoice.type || 'Invoice'} #${shareTargetInvoice.invoiceNumber || ''}:\nDate: ${shareTargetInvoice.date || ''}\nTotal Amount: ₹${shareTargetInvoice.totalAmount}\nBalance Due: ₹${shareTargetInvoice.balanceDue ?? (shareTargetInvoice.totalAmount - (shareTargetInvoice.paymentReceived || 0))}\n\nGenerated via Vyapar Software.`);
                  window.open(`https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${msg}`, '_blank');
                }}
                className="btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                  background: '#25d366', color: 'white', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', justifyContent: 'center'
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '18px' }}></i> Share via WhatsApp
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => {
                  const targetParty = parties.find(p => p.name?.toLowerCase() === shareTargetInvoice.customer?.toLowerCase()) || {};
                  const email = targetParty.email || '';
                  const subject = encodeURIComponent(`${shareTargetInvoice.type || 'Invoice'} #${shareTargetInvoice.invoiceNumber || ''} - ${shopProfile.shopName || 'Store'}`);
                  const body = encodeURIComponent(`Dear ${shareTargetInvoice.customer},\n\nPlease find the summary of your recent transaction below:\n\nInvoice Number: ${shareTargetInvoice.invoiceNumber || ''}\nDate: ${shareTargetInvoice.date || ''}\nGrand Total: ₹${shareTargetInvoice.totalAmount}\nBalance Due: ₹${shareTargetInvoice.balanceDue ?? (shareTargetInvoice.totalAmount - (shareTargetInvoice.paymentReceived || 0))}\n\nThank you for choosing us!\n\nBest regards,\n${shopProfile.shopName || 'Billing Desk'}`);
                  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
                }}
                className="btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                  background: '#3b82f6', color: 'white', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', justifyContent: 'center'
                }}
              >
                <i className="fas fa-envelope" style={{ fontSize: '16px' }}></i> Share via Email
              </button>

              {/* SMS */}
              <button
                type="button"
                onClick={() => {
                  const targetParty = parties.find(p => p.name?.toLowerCase() === shareTargetInvoice.customer?.toLowerCase()) || {};
                  const phone = targetParty.phone || '';
                  const body = encodeURIComponent(`Invoice #${shareTargetInvoice.invoiceNumber || ''} details:\nTotal: ₹${shareTargetInvoice.totalAmount}\nBalance Due: ₹${shareTargetInvoice.balanceDue ?? (shareTargetInvoice.totalAmount - (shareTargetInvoice.paymentReceived || 0))}\nThank you!`);
                  window.open(`sms:${phone}?body=${body}`, '_self');
                }}
                className="btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                  background: '#10b981', color: 'white', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', justifyContent: 'center'
                }}
              >
                <i className="fas fa-comment-alt" style={{ fontSize: '16px' }}></i> Share via SMS
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="btn"
                style={{ cursor: 'pointer', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Operations Bar */}
      {selectedInvoiceIds.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-sidebar)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: '16px',
          padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 9999, animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)' }}>
            {selectedInvoiceIds.length} Selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleBulkPrint} 
              className="btn btn--sm btn--primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)', border: 'none', color: 'white' }}
            >
              <i className="fas fa-print"></i> Print
            </button>
            <button 
              onClick={handleBulkExport} 
              className="btn btn--sm btn--primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', color: 'white' }}
            >
              <i className="fas fa-file-csv"></i> Export CSV
            </button>
            <button 
              onClick={handleBulkDelete} 
              className="btn btn--sm" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
            >
              <i className="fas fa-trash-alt"></i> Delete
            </button>
          </div>
          <div style={{ height: '20px', width: '1px', background: 'var(--border)' }}></div>
          <button 
            onClick={() => setSelectedInvoiceIds([])} 
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}

// Download helper: fetch PDF from backend and trigger browser download
async function downloadInvoicePDF(id, fallbackName) {
  try {
    const url = `/api/invoices/${id}/pdf`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=>null);
      alert('Failed to download PDF: ' + (txt || resp.statusText));
      return;
    }
    const blob = await resp.blob();
    const cd = resp.headers.get('content-disposition') || '';
    let filename = fallbackName || `invoice-${id}.pdf`;
    const m = /filename\s*=\s*"?([^;\"]+)"?/i.exec(cd);
    if (m && m[1]) filename = m[1].replace(/"/g,'');
    const link = document.createElement('a');
    const urlBlob = window.URL.createObjectURL(blob);
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
  } catch (err) {
    alert('Download error: ' + (err.message || err));
  }
}
