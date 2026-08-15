import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PlusCircle, Save, Search, Plus, X, Printer, Share2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader } from '@zxing/browser';
import billService from '../services/billService';
import customerService from '../services/customerService';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
const createInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, customers, addCustomer, addInvoice, recentBills, addProduct } = useData();

  const [productSearch, setProductSearch] = useState('');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    productName: '',
    category: '',
    price: '',
    stock: '',
    minimumStock: '',
    sku: '',
    barcode: '',
    hsn: ''
  });
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [highlightRowId, setHighlightRowId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  // barcodeQuery removed; use manualBarcode in scanner modal
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', gstin: '', openingBalance: '' });
  const [showManualItemForm, setShowManualItemForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [overallDiscountFlat, setOverallDiscountFlat] = useState('');
  const [overallDiscountPercent, setOverallDiscountPercent] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [chargeLabel, setChargeLabel] = useState('Delivery');
  const [discountError, setDiscountError] = useState('');
  const [percentError, setPercentError] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('');
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const scannerActiveRef = useRef(false);
  const [invoiceNumber] = useState(createInvoiceNumber);

  const canDiscount = user?.permissions?.canDiscount;
  const canEditRate = user?.permissions?.canEditRate || user?.permissions?.canEditInventory;

  // Debounce search input so we don't filter on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(productSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const availableProducts = useMemo(() => {
    const q = debouncedQuery;
    if (!q || q.length < 1) return products || [];
    return (products || []).filter(
      (product) =>
        (product.productName || product.name || '').toLowerCase().includes(q) ||
        (product.sku || '').toLowerCase().includes(q) ||
        product.barcode?.toLowerCase().includes(q)
    );
  }, [products, debouncedQuery]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  const lineItems = useMemo(() => {
    return selectedProducts.map((item) => {
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const price = Number(item.price || 0);
      const discountPercent = Number(item.discount || 0);
      const amount = Number((price * quantity * (1 - discountPercent / 100)).toFixed(2));
      const discountAmount = Number((price * quantity * (discountPercent / 100)).toFixed(2));
      const taxAmount = Number(((amount * (Number(item.gstRate || 0) / 100)).toFixed(2)));
      return {
        ...item,
        quantity,
        price,
        amount,
        discountAmount,
        taxAmount,
      };
    });
  }, [selectedProducts]);

  const selectedCustomer = customers.find((customer) => customer._id === customerId) || null;

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.amount, 0), [lineItems]);
  const itemLevelDiscountTotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.discountAmount, 0), [lineItems]);
  const overallDiscount = Number(overallDiscountFlat || 0);
  const additionalAmount = Number(additionalCharges || 0);
  const taxableTotal = Math.max(0, subtotal - overallDiscount);
  const cgst = Number((taxableTotal * 0.09).toFixed(2));
  const sgst = Number((taxableTotal * 0.09).toFixed(2));
  const rawTotal = taxableTotal + cgst + sgst + additionalAmount;
  const roundOff = Number((Math.round(rawTotal) - rawTotal).toFixed(2));
  const totalAmount = Number(Math.round(rawTotal));

  const paymentTotal = useMemo(() => {
    if (paymentMode === 'Split') {
      return Number(splitCash || 0) + Number(splitUpi || 0) + Number(splitCard || 0);
    }
    if (paymentMode === 'Cash') {
      return Number(amountReceived || 0);
    }
    if (paymentMode === 'UPI' || paymentMode === 'Card') {
      return Number(amountReceived || totalAmount);
    }
    return 0;
  }, [paymentMode, splitCash, splitUpi, splitCard, amountReceived, totalAmount]);

  const changeDue = paymentMode === 'Cash' ? Math.max(0, paymentTotal - totalAmount) : 0;
  const amountDue = Math.max(0, totalAmount - paymentTotal);
  const splitRemaining = Math.max(0, totalAmount - paymentTotal);
  const paymentStatus = totalAmount > 0 && paymentTotal >= totalAmount ? 'Completed' : 'Pending';

  const handleAddProduct = (product) => {
    if (product.stock === 0) {
      toast.error('This product is out of stock.');
      return;
    }
    setSelectedProducts((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        // increase qty and highlight
        setHighlightRowId(product._id);
        setTimeout(() => setHighlightRowId(null), 700);
        toast.success(`Qty increased for ${product.productName || product.name}`);
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: Math.min(product.stock, Number(item.quantity) + 1) } : item
        );
      }
      // add new row and auto-scroll to table
      const newItem = {
        productId: product._id,
        name: product.productName || product.name,
        price: product.price,
        quantity: 1,
        discount: 0,
        sku: product.sku || product.barcode || 'N/A',
        gstRate: product.gstRate ?? 18,
        hsn: product.hsn || 'N/A',
        stock: product.stock,
        category: product.category || 'Misc',
      };
      setTimeout(() => {
        const el = document.querySelector('#invoice-items');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return [newItem, ...prev];
    });
    // close dropdown after adding
    setDropdownOpen(false);
    setProductSearch('');
  };

  const updateQuantity = (productId, value) => {
    setSelectedProducts((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const qty = Math.max(1, Number(value) || 1);
        const prod = products.find((p) => p._id === productId);
        if (prod && qty > prod.stock) {
          setValidationErrors((errs) => ({ ...errs, [productId]: `Only ${prod.stock} in stock` }));
        } else {
          setValidationErrors((errs) => {
            const copy = { ...errs };
            delete copy[productId];
            return copy;
          });
        }
        return { ...item, quantity: qty };
      })
    );
  };

  const updateRate = (productId, value) => {
    setSelectedProducts((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, price: Math.max(0, Number(value) || 0) } : item))
    );
  };

  const updateLineDiscount = (productId, value) => {
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, discount: Math.min(100, Math.max(0, Number(value) || 0)) } : item
      )
    );
  };

  const updateGst = (productId, value) => {
    setSelectedProducts((prev) => prev.map((item) => (item.productId === productId ? { ...item, gstRate: Number(value) } : item)));
  };

  const removeProduct = async (productId) => {
    const found = selectedProducts.find((it) => it.productId === productId);
    if (found && found.quantity > 5) {
      if (!await window.confirm('Remove item with quantity > 5?')) return;
    }
    setSelectedProducts((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleScan = () => {
    if (!manualBarcode || !manualBarcode.trim()) {
      toast.error('Enter a barcode or SKU to scan.');
      return;
    }
    handleAddByBarcode(manualBarcode.trim());
    setManualBarcode('');
  };

  const openScanner = () => {
    setShowScannerModal(true);
    setScannerError('');
  };

  const closeScanner = () => {
    setShowScannerModal(false);
    setScannerError('');
    setManualBarcode('');
  };

  useEffect(() => {
    if (showScannerModal) startScanner();
    else stopScanner();
    return () => stopScanner();
  }, [showScannerModal]);

  const handleAddByBarcode = (query) => {
    const q = (query || '').trim();
    if (!q) {
      toast.error('Enter a barcode');
      return;
    }
    const found = products.find((product) => product.barcode === q || product.sku === q || (product.productName || product.name || '').toLowerCase() === q.toLowerCase());
    if (!found) {
      toast.error('No product found for that barcode or SKU');
      setShowManualItemForm(true);
      return;
    }
    handleAddProduct(found);
  };

  const startScanner = async () => {
    setScannerError('');
    if (!navigator?.mediaDevices?.getUserMedia) {
      setScannerError('Camera not supported in this browser');
      return;
    }
    try {
      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;
      await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText();
          if (text) {
            handleAddByBarcode(text);
            try { codeReader.reset(); } catch (e) {}
            setShowScannerModal(false);
          }
        }
        // ignore NotFoundException while scanning frames
      });
    } catch (e) {
      setScannerError('Unable to access camera. ' + (e?.message || ''));
    }
  };

  const stopScanner = () => {
    try {
      if (scannerRef.current) scannerRef.current.reset();
    } catch (e) {}
    scannerRef.current = null;
  };

  // click outside listener to close dropdown
  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchWrapperRef.current) return;
      if (searchWrapperRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleManualItemSave = () => {
    if (!manualName.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!manualPrice || Number(manualPrice) <= 0) {
      toast.error('Valid rate is required');
      return;
    }
    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: `manual-${Date.now()}`,
        name: manualName.trim(),
        price: Number(manualPrice),
        quantity: Number(manualQuantity) || 1,
        discount: 0,
        sku: 'MANUAL',
        gstRate: 18,
        hsn: 'N/A',
      },
    ]);
    setManualName('');
    setManualPrice('');
    setManualQuantity(1);
    setShowManualItemForm(false);
    toast.success('Manual item added');
  };

  const handleNewCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    const created = await addCustomer({
      ...newCustomer,
      openingBalance: Number(newCustomer.openingBalance || 0),
      createdAt: new Date().toISOString(),
    });
    setCustomerId(created._id);
    setShowNewCustomer(false);
    setNewCustomer({ name: '', phone: '', email: '', address: '', gstin: '', openingBalance: '' });
    toast.success('Customer added successfully');
  };

  const handleNewProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductData.productName.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!newProductData.price || Number(newProductData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }
    try {
      const created = await addProduct({
        ...newProductData,
        price: Number(newProductData.price) || 0,
        stock: Number(newProductData.stock) || 0,
        minimumStock: Number(newProductData.minimumStock) || 0,
      });
      if (created) {
        handleAddProduct(created);
        toast.success(`Product "${created.productName || created.name}" created and added to bill`);
        setShowNewProductModal(false);
        setNewProductData({ productName: '', category: '', price: '', stock: '', minimumStock: '', sku: '', barcode: '', hsn: '' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create product');
    }
  };

  const handleSaveInvoice = useCallback(
    async (mode) => {
      if (selectedProducts.length === 0) {
        toast.error('Add at least one product to save the bill.');
        return;
      }

      // validate each line item
      const errs = {};
      for (const item of selectedProducts) {
        if (!item.quantity || Number(item.quantity) < 1) errs[item.productId] = 'Quantity must be at least 1';
        if (!item.price || Number(item.price) <= 0) errs[item.productId] = 'Rate must be greater than 0';
        const prod = products.find((p) => p._id === item.productId);
        if (prod && item.quantity > prod.stock) errs[item.productId] = `Only ${prod.stock} in stock`;
      }
      if (Object.keys(errs).length > 0) {
        setValidationErrors(errs);
        const firstBad = Object.keys(errs)[0];
        const row = document.querySelector(`[data-product-id="${firstBad}"]`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.error('Fix validation errors before saving');
        return;
      }
      if (paymentMode === 'Split' && paymentTotal !== totalAmount && mode !== 'draft') {
        toast.error('Split payment must equal the invoice total.');
        return;
      }
      if (!canDiscount && overallDiscount > 0) {
        toast.error('You do not have permission to apply discounts.');
        return;
      }

      setIsSaving(true);

      const invoicePayload = {
        invoiceNumber,
        billDate,
        dueDate,
        customerId: selectedCustomer?._id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || '',
        customerAddress: selectedCustomer?.address || '',
        customerGSTIN: selectedCustomer?.gstin || '',
        products: selectedProducts.map(({ productId, name, price, quantity, discount, sku, gstRate, hsn }) => ({
          productId,
          name,
          price,
          quantity,
          discount: discount || 0,
          sku,
          gstRate: gstRate || 18,
          hsn,
          amount: price * quantity * (1 - (discount || 0) / 100),
          taxAmount: (price * quantity * (1 - (discount || 0) / 100) * ((gstRate || 18) / 100)),
        })),
        subtotal,
        itemLevelDiscountTotal: itemLevelDiscountTotal,
        discount: overallDiscount,
        discountPercent: Number(overallDiscountPercent || 0),
        taxableTotal: taxableTotal,
        additionalCharges: additionalAmount,
        chargeLabel,
        cgst,
        sgst,
        igst: 0,
        roundOff,
        totalAmount,
        paidAmount: paymentTotal,
        dueAmount: totalAmount - paymentTotal,
        paymentMode,
        cashAmount: paymentMode === 'Split' ? Number(splitCash || 0) : paymentMode === 'Cash' ? paymentTotal : 0,
        upiAmount: paymentMode === 'Split' ? Number(splitUpi || 0) : paymentMode === 'UPI' ? paymentTotal : 0,
        cardAmount: paymentMode === 'Split' ? Number(splitCard || 0) : paymentMode === 'Card' ? paymentTotal : 0,
        upiRef: paymentMode === 'UPI' || paymentMode === 'Split' ? upiRef : '',
        status: mode === 'draft' ? 'Draft' : paymentStatus,
        type: 'sale',
      };

      try {
        // Try to save via API first
        const createdInvoice = await billService.createBill(invoicePayload);
        
        // Also save to localStorage as backup
        addInvoice(invoicePayload, user?._id || 'staff-1');
        
        setIsSaving(false);

        if (!createdInvoice) {
          toast.error('Unable to save invoice. Please try again.');
          return;
        }

        if (mode === 'print') {
          navigate(`/billing/invoice/${createdInvoice._id}`);
          setTimeout(() => window.print(), 600);
          toast.success('Invoice saved and ready to print');
          return;
        }

        if (mode === 'share') {
          navigate(`/billing/invoice/${createdInvoice._id}`);
          const url = `${window.location.origin}/billing/invoice/${createdInvoice._id}`;
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`Invoice ${createdInvoice.invoiceNumber} for ${formatCurrency(createdInvoice.totalAmount)}. View: ${url}`)}`,
            '_blank'
          );
          toast.success('Invoice saved and ready to share');
          return;
        }

        toast.success('Invoice saved successfully');
        navigate('/billing');
      } catch (error) {
        setIsSaving(false);
        console.error('Error saving invoice:', error);
        
        // Fallback to localStorage
        try {
          const createdInvoice = addInvoice(invoicePayload, user?._id || 'staff-1');
          toast.success('Invoice saved locally (backend unavailable)');
          navigate('/billing');
        } catch (fallbackError) {
          toast.error('Failed to save invoice. Please try again.');
        }
      }
    },
    [selectedProducts, paymentMode, paymentTotal, totalAmount, canDiscount, overallDiscount, addInvoice, user, billDate, dueDate, selectedCustomer, subtotal, itemLevelDiscountTotal, additionalAmount, cgst, sgst, roundOff, upiRef, navigate, products, chargeLabel]
  );

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSaveInvoice('save');
      }
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        handleSaveInvoice('print');
      }
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        handleSaveInvoice('save');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [handleSaveInvoice]);

  // derive recent product chips from recentBills
  const recentProducts = useMemo(() => {
    const seen = new Set();
    const list = [];
    (recentBills || []).forEach((bill) => {
      (bill.products || []).forEach((p) => {
        if (!seen.has(p.productId)) {
          const prod = products.find((x) => x._id === p.productId);
          if (prod) {
            seen.add(p.productId);
            list.push(prod);
          }
        }
      });
    });
    return list.slice(0, 6);
  }, [recentBills, products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>New Sale Bill</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Create an invoice with live item pricing, discounts, customer selection, and payment preview.</p>
        </div>
        <button onClick={() => navigate('/billing')} className="btn">
          Back to Billing
        </button>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <div className="card" style={{ border: '1px solid var(--red)', background: 'rgba(239,68,68,0.05)', color: 'var(--red)' }}>
          Some items exceed available stock or contain errors. Please fix them before saving.
        </div>
      )}

      <section className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>1</span>
                Add Items
              </h3>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-2)' }}>Search products by name, SKU, or barcode and add them to the bill</p>
            </div>
            
            {/* Search Bar Row */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <div ref={searchWrapperRef} style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', height: 18, width: 18, color: 'var(--text-3)' }} />
                <input
                  ref={searchInputRef}
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setDropdownOpen(true); setHighlightedIndex(-1); }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex((i) => Math.min(i + 1, availableProducts.length - 1)); return; }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex((i) => Math.max(i - 1, 0)); return; }
                    if (e.key === 'Enter') { e.preventDefault(); const idx = highlightedIndex >= 0 ? highlightedIndex : 0; const prod = availableProducts[idx]; if (prod) handleAddProduct(prod); return; }
                    if (e.key === 'Escape') { setDropdownOpen(false); return; }
                  }}
                  placeholder="Search by product name, SKU or barcode..."
                  className="fi"
                  autoFocus
                  style={{ height: 48, paddingLeft: 44, width: '100%' }}
                />

                {/* Dropdown positioned under the search input */}
                {dropdownOpen && availableProducts.length > 0 && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 50,
                      marginTop: 8,
                      maxHeight: 320,
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      background: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {availableProducts.slice(0, 8).map((product, idx) => {
                        const isOut = product.stock === 0;
                        const isLow = !isOut && product.stock <= (product.minimumStock || 3);
                        const isHighlighted = highlightedIndex === idx;
                        return (
                          <div
                            key={product._id}
                            role="button"
                            tabIndex={0}
                            onMouseEnter={() => { setHighlightedIndex(idx); setHoveredProductId(product._id); }}
                            onMouseLeave={() => setHoveredProductId(null)}
                            onClick={() => !isOut && handleAddProduct(product)}
                            style={{
                              width: '100%',
                              padding: 12,
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16,
                              cursor: isOut ? 'not-allowed' : 'pointer',
                              opacity: isOut ? 0.6 : 1,
                              background: isOut ? 'var(--bg-input)' : isHighlighted ? 'var(--bg-card-hover)' : 'transparent',
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ height: 40, width: 40, borderRadius: 8, background: 'var(--bg-input)' }} />
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{product.productName || product.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>SKU {product.sku || product.barcode || 'N/A'}</div>
                                <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-2)' }}>{product.category || 'Misc'}</span>
                                  {isOut ? (
                                    <span className="badge badge--red">Out of Stock</span>
                                  ) : isLow ? (
                                    <span className="badge badge--yellow">Low Stock — {product.stock} left</span>
                                  ) : (
                                    <span className="badge badge--green">In stock</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>₹{Number(product.price || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>

              <button onClick={openScanner} className="btn btn--primary" style={{ flexShrink: 0, height: 48 }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="7" width="4" height="4" rx="1"/><path d="M7 11H3v6a2 2 0 0 0 2 2h6v-4"/></svg>
                Scan
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowManualItemForm(true)} className="btn" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                <Plus style={{ width: 16, height: 16 }} />
                Add Manually
              </button>
              <button type="button" onClick={() => setShowNewProductModal(true)} className="btn" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                <PlusCircle style={{ width: 16, height: 16 }} />
                New Product
              </button>
            </div>
          </div>

          {/* Scanner modal */}
          {showScannerModal && (
            <div className="overlay" style={{ display: 'block' }}>
              <div className="modal" style={{ display: 'block', maxWidth: 700 }}>
                <div className="modal__top">
                  <h3>Scan Barcode</h3>
                  <button onClick={closeScanner} className="btn btn--sm">Close</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div style={{ height: 256, width: '100%', borderRadius: 'var(--radius)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {/* camera preview */}
                    <video ref={videoRef} style={{ height: '100%', width: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                    {!scannerError && <div style={{ position: 'absolute', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4 }}>Scanning…</div>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)' }}>If camera doesn't work, enter barcode manually:</p>
                    <input value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} placeholder="Enter barcode" className="fi" style={{ marginTop: 12 }} />
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button onClick={() => { handleAddByBarcode(manualBarcode); closeScanner(); }} className="btn btn--primary">Add</button>
                      <button onClick={() => setManualBarcode('')} className="btn">Clear</button>
                    </div>
                    {scannerError && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--red)' }}>{scannerError}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showManualItemForm && (
            <div className="overlay" style={{ display: 'block' }}>
              <div className="modal" style={{ display: 'block', maxWidth: 480 }}>
                <div className="modal__top">
                  <h3>Add Item Manually</h3>
                  <button onClick={() => setShowManualItemForm(false)} className="btn btn--icon">✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  <div className="fg" style={{ marginBottom: 0 }}><label>Product Name*</label><input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Product Name" className="fi" /></div>
                  <div className="fg" style={{ marginBottom: 0 }}><label>Rate ₹*</label><input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="Rate ₹" type="number" className="fi" /></div>
                  <div className="fg" style={{ marginBottom: 0 }}><label>Qty*</label><input value={manualQuantity} onChange={(e) => setManualQuantity(Math.max(1, Number(e.target.value) || 1))} placeholder="Qty" type="number" className="fi" /></div>
                  <div className="form-row" style={{ gap: 8 }}>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>GST %</label>
                      <select className="fi" value={18} readOnly>
                        {[0,5,12,18,28].map(g => <option key={g} value={g}>{g}%</option>)}
                      </select>
                    </div>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>Description</label>
                      <input placeholder="Description" className="fi" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setShowManualItemForm(false)} className="btn">Cancel</button>
                  <button onClick={() => { handleManualItemSave(); }} className="btn btn--primary">Add to Bill</button>
                </div>
              </div>
            </div>
          )}

          {showNewProductModal && (
            <div className="overlay" style={{ display: 'block', zIndex: 10000 }}>
              <div className="modal" style={{ display: 'block', maxWidth: 520, borderRadius: '16px', padding: '24px' }}>
                <div className="modal__top" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle style={{ color: 'var(--accent)', width: 20, height: 20 }} />
                    Create New Product
                  </h3>
                  <button type="button" onClick={() => setShowNewProductModal(false)} className="btn btn--icon">✕</button>
                </div>
                <form onSubmit={handleNewProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label>Product Name*</label>
                    <input
                      value={newProductData.productName}
                      onChange={(e) => setNewProductData({ ...newProductData, productName: e.target.value })}
                      placeholder="e.g. Wireless Mouse"
                      className="fi"
                      required
                    />
                  </div>
                  <div className="form-row" style={{ gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>Category</label>
                      <input
                        value={newProductData.category}
                        onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
                        placeholder="e.g. Electronics"
                        className="fi"
                      />
                    </div>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>Price (Rate)*</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProductData.price}
                        onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                        placeholder="₹ Price"
                        className="fi"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row" style={{ gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>Initial Stock*</label>
                      <input
                        type="number"
                        min="0"
                        value={newProductData.stock}
                        onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                        placeholder="e.g. 50"
                        className="fi"
                        required
                      />
                    </div>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>Min Stock Alert</label>
                      <input
                        type="number"
                        min="0"
                        value={newProductData.minimumStock}
                        onChange={(e) => setNewProductData({ ...newProductData, minimumStock: e.target.value })}
                        placeholder="e.g. 5"
                        className="fi"
                      />
                    </div>
                  </div>
                  <div className="form-row" style={{ gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>SKU</label>
                      <input
                        value={newProductData.sku}
                        onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                        placeholder="SKU"
                        className="fi"
                      />
                    </div>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>Barcode</label>
                      <input
                        value={newProductData.barcode}
                        onChange={(e) => setNewProductData({ ...newProductData, barcode: e.target.value })}
                        placeholder="Barcode"
                        className="fi"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" onClick={() => setShowNewProductModal(false)} className="btn">Cancel</button>
                    <button type="submit" className="btn btn--primary">Save & Add to Bill</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Invoice Items</h3>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>({selectedProducts.length} items)</span>
            </div>
            <div id="invoice-items" style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate ₹</th>
                    <th style={{ textAlign: 'right' }}>Disc %</th>
                    <th style={{ textAlign: 'right' }}>GST %</th>
                    <th style={{ textAlign: 'right' }}>Amount ₹</th>
                    <th style={{ textAlign: 'center' }}>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 400, margin: '0 auto', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>➕</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>No items added yet</div>
                          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Search above to add products</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, index) => {
                      const stockErr = validationErrors[item.productId];
                      return (
                        <tr data-product-id={item.productId} key={item.productId || index} style={{ animation: highlightRowId === item.productId ? 'pulse 0.7s' : '' }}>
                          <td style={{ color: 'var(--text-3)' }}>{index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.category}</div>
                          </td>
                          <td style={{ color: 'var(--text-2)' }}>{item.sku}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="btn btn--sm" style={{ padding: '2px 8px' }}>-</button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.productId, e.target.value)}
                                className="fi"
                                style={{ width: 60, padding: '4px 8px', textAlign: 'right', borderColor: stockErr ? 'var(--red)' : 'var(--border)' }}
                              />
                              <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="btn btn--sm" style={{ padding: '2px 8px' }}>+</button>
                            </div>
                            {stockErr && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--red)' }}>{stockErr}</div>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {canEditRate ? (
                              <input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={(e) => updateRate(item.productId, e.target.value)}
                                className="fi"
                                style={{ width: 80, padding: '4px 8px', textAlign: 'right' }}
                              />
                            ) : (
                              <span style={{ color: 'var(--text-1)' }}>₹{Number(item.price || 0).toLocaleString()}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => updateLineDiscount(item.productId, e.target.value)}
                              className="fi"
                              style={{ width: 60, padding: '4px 8px', textAlign: 'right' }}
                              disabled={!canDiscount}
                            />
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>-₹{item.discountAmount.toFixed(2)}</div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select value={item.gstRate} onChange={(e) => updateGst(item.productId, e.target.value)} className="fi" style={{ width: 75, padding: '4px 8px' }}>
                              {[0,5,12,18,28].map(g=> <option key={g} value={g}>{g}%</option>)}
                            </select>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>CGST {item.gstRate/2}% + SGST {item.gstRate/2}%</div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-1)' }}>₹{(item.amount + item.taxAmount).toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" onClick={() => removeProduct(item.productId)} className="btn btn--icon" style={{ color: 'var(--red)' }}>
                              <X style={{ width: 16, height: 16 }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <button 
                  type="button" 
                  onClick={() => { 
                    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                      setDropdownOpen(true);
                    }, 200);
                  }} 
                  className="btn btn--sm" 
                  style={{ color: 'var(--accent)', cursor: 'pointer' }}
                >
                  Add more items
                </button>
                <div style={{ color: 'var(--text-2)' }}>{selectedProducts.length} items • Subtotal ₹{subtotal.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>3</span>
                Discount & Charges
              </h3>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-2)' }}>Apply overall discount or add extra charges</p>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Overall Discount ₹</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={overallDiscountFlat}
                  onChange={(e) => {
                    let value = Number(e.target.value || 0);
                    if (value < 0) value = 0;
                    if (subtotal && value > subtotal) { setDiscountError('Discount cannot exceed subtotal'); return; } else { setDiscountError(''); }
                    setOverallDiscountFlat(Number(value.toFixed(2)));
                    if (subtotal > 0) {
                      setOverallDiscountPercent(Number(((value / subtotal) * 100).toFixed(2)));
                    }
                  }}
                  className="fi"
                />
                {discountError ? <div style={{ marginTop: 4, fontSize: 11, color: 'var(--red)' }}>{discountError}</div> : <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>Flat discount on total</p>}
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Overall Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={overallDiscountPercent}
                  onChange={(e) => {
                    let value = Number(e.target.value || 0);
                    if (value < 0) value = 0;
                    if (value > 100) { setPercentError('Discount % cannot exceed 100'); return; } else { setPercentError(''); }
                    setOverallDiscountPercent(Number(value.toFixed(2)));
                    if (subtotal > 0) {
                      setOverallDiscountFlat(Number(((subtotal * value) / 100).toFixed(2)));
                    }
                  }}
                  className="fi"
                />
                {percentError ? <div style={{ marginTop: 4, fontSize: 11, color: 'var(--red)' }}>{percentError}</div> : <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>Percentage discount on total</p>}
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Additional Charges ₹</label>
                <input
                  type="number"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(Math.max(0, Number(e.target.value || 0)))}
                  className="fi"
                />
                <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>Extra fees to add</p>
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Charge Label</label>
                <input
                  type="text"
                  value={chargeLabel}
                  onChange={(e) => setChargeLabel(e.target.value)}
                  placeholder="Delivery"
                  className="fi"
                />
                <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>Label shown on invoice</p>
              </div>
            </div>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>2</span>
                Customer
              </h3>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>Search or add a walk-in customer</p>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <button onClick={() => setShowNewCustomer((v) => !v)} className="btn btn--sm">{showNewCustomer ? 'Hide Form' : 'New Customer'}</button>
              </div>
              {showNewCustomer && (
                <form onSubmit={handleNewCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-input)', padding: 12 }}>
                  <div className="fg" style={{ marginBottom: 0 }}><label>Full Name</label><input value={newCustomer.name} onChange={(e)=>setNewCustomer({...newCustomer,name:e.target.value})} placeholder="Full Name" className="fi" required/></div>
                  <div className="fg" style={{ marginBottom: 0 }}><label>Phone</label><input value={newCustomer.phone} onChange={(e)=>setNewCustomer({...newCustomer,phone:e.target.value})} placeholder="Phone" className="fi" required/></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button type="button" onClick={()=>setShowNewCustomer(false)} className="btn btn--sm">Cancel</button>
                    <button type="submit" className="btn btn--sm btn--primary">Save</button>
                  </div>
                </form>
              )}

              <div>
                <div className="fg" style={{ marginBottom: 8 }}>
                  <label>Search Customer</label>
                  <input value={customerSearch} onChange={(e)=>setCustomerSearch(e.target.value)} placeholder="Search by name or phone" className="fi" />
                </div>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>Select Customer</label>
                  <select value={customerId} onChange={(e)=>setCustomerId(e.target.value)} className="fi">
                    <option value=''>Walk-in Customer</option>
                    {filteredCustomers.map(c => <option key={c._id} value={c._id}>{c.name} • {c.phone}</option>)}
                  </select>
                </div>
                {selectedCustomer && (
                  <div style={{ marginTop: 12, borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'var(--accent-glow)', padding: 12, color: 'var(--text-1)' }}>
                    <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>{selectedCustomer.phone}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>4</span>
                Payment
              </h3>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>Choose payment mode and complete the invoice</p>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['Cash','UPI','Card','Split'].map(mode => {
                  const isActive = paymentMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={()=>setPaymentMode(mode)}
                      className="btn"
                      style={{
                        justifyContent: 'center',
                        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                        background: isActive ? 'var(--accent-glow)' : 'var(--bg-input)',
                        color: isActive ? 'var(--accent)' : 'var(--text-2)'
                      }}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>

              {(paymentMode === 'Cash' || paymentMode === 'UPI' || paymentMode === 'Card') && (
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>Amount received</label>
                  <input value={amountReceived} onChange={(e)=>setAmountReceived(e.target.value)} type="number" min="0" placeholder="0" className="fi" />
                </div>
              )}

              {paymentMode === 'Split' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Split Amounts</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <input value={splitCash} onChange={(e)=>setSplitCash(e.target.value)} placeholder="Cash" type="number" className="fi" style={{ padding: '8px 10px' }} />
                    <input value={splitUpi} onChange={(e)=>setSplitUpi(e.target.value)} placeholder="UPI" type="number" className="fi" style={{ padding: '8px 10px' }} />
                    <input value={splitCard} onChange={(e)=>setSplitCard(e.target.value)} placeholder="Card" type="number" className="fi" style={{ padding: '8px 10px' }} />
                  </div>
                </div>
              )}

              {(paymentMode === 'UPI' || paymentMode === 'Split') && (
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>UPI reference / notes</label>
                  <input value={upiRef} onChange={(e)=>setUpiRef(e.target.value)} placeholder="Enter UPI ref or notes" className="fi" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', padding: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Amount due</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>₹{amountDue.toLocaleString()}</p>
                </div>
                <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', padding: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Change to return</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>₹{changeDue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', height: 24, width: 24, alignItems: 'center', justify: 'center', borderRadius: '50%', background: 'var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>3</span>
              Invoice Preview
            </h3>
            <div style={{ marginTop: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-2)' }}>Invoice</span><span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>Date</span><span style={{ color: 'var(--text-1)' }}>{billDate}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>Subtotal</span><span style={{ color: 'var(--text-1)' }}>{formatCurrency(subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>Item discounts</span><span style={{ color: 'var(--text-1)' }}>-{formatCurrency(itemLevelDiscountTotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>Overall discount</span><span style={{ color: 'var(--text-1)' }}>-{formatCurrency(overallDiscount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>Taxable amount</span><span style={{ color: 'var(--text-1)' }}>{formatCurrency(Math.max(0, subtotal - overallDiscount))}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>CGST (9%)</span><span style={{ color: 'var(--text-1)' }}>{formatCurrency(cgst)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>SGST (9%)</span><span style={{ color: 'var(--text-1)' }}>{formatCurrency(sgst)}</span></div>
                {Number(additionalAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>Additional charges ({chargeLabel})</span><span style={{ color: 'var(--text-1)' }}>+{formatCurrency(additionalAmount)}</span></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-2)' }}>Round off</span><span style={{ color: 'var(--text-1)' }}>{formatCurrency(roundOff)}</span></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
                <span>TOTAL</span><span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={()=>handleSaveInvoice('save')} disabled={isSaving} className="btn btn--primary" style={{ flex: 1, justifyContent: 'center' }}>Save</button>
              <button onClick={()=>handleSaveInvoice('print')} disabled={isSaving} className="btn" style={{ flex: 1, justifyContent: 'center' }}>Save & Print</button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={()=>handleSaveInvoice('share')} disabled={isSaving} className="btn btn--sm" style={{ flex: 1, justifyContent: 'center' }}>Share</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default CreateInvoicePage;
