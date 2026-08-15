import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initialStoreData } from '../data/seedData';
import productService from '../services/productService';
import customerService from '../services/customerService';
import billService from '../services/billService';
import deliveryService from '../services/deliveryService';
import orderService from '../services/orderService';

const DataContext = createContext(null);
const STORAGE_KEY = 'vyapar-v2-store';

const isSameDay = (first, second) => {
  const a = new Date(first);
  const b = new Date(second);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const DataProvider = ({ children }) => {
  const [store, setStore] = useState(initialStoreData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue);
        setStore({
          ...initialStoreData,
          ...parsed,
          users: Array.isArray(parsed.users) ? parsed.users : initialStoreData.users,
          products: Array.isArray(parsed.products) ? parsed.products : initialStoreData.products,
          customers: Array.isArray(parsed.customers) ? parsed.customers : initialStoreData.customers,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : initialStoreData.invoices,
          deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : initialStoreData.deliveries,
          orders: Array.isArray(parsed.orders) ? parsed.orders : initialStoreData.orders,
          loginHistory: Array.isArray(parsed.loginHistory) ? parsed.loginHistory : initialStoreData.loginHistory,
          activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : initialStoreData.activityLog,
        });
      } catch (error) {
        console.error('Failed to parse persisted store', error);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  }, [store, ready]);

  const setData = (updater) => setStore((current) => (typeof updater === 'function' ? updater(current) : updater));

  const addProduct = async (product) => {
    try {
      const created = await productService.createProduct(product);
      setData((current) => ({
        ...current,
        products: [created, ...current.products.filter((p) => p._id !== created._id)],
      }));
      return created;
    } catch (error) {
      console.warn('Failed to save product to API, saving locally:', error);
      const id = product._id || createId();
      const created = {
        _id: id,
        ...product,
        barcode: product.barcode || `BC${Math.floor(Math.random() * 1000000)}`,
        createdAt: new Date().toISOString()
      };
      setData((current) => ({
        ...current,
        products: [created, ...current.products.filter((p) => p._id !== id)],
      }));
      return created;
    }
  };

  const updateProduct = (id, updates) => {
    setData((current) => ({
      ...current,
      products: current.products.map((item) => (item._id === id ? { ...item, ...updates } : item)),
    }));
  };

  const removeProduct = (id) => {
    setData((current) => ({
      ...current,
      products: current.products.filter((p) => p._id !== id),
    }));
  };

  const adjustStock = (id, quantityChange, reason) => {
    setData((current) => ({
      ...current,
      products: current.products.map((product) => {
        if (product._id !== id) return product;
        return {
          ...product,
          stock: Math.max(0, product.stock + Number(quantityChange)),
          lastStockUpdateReason: reason || product.lastStockUpdateReason,
        };
      }),
    }));
  };

  const addCustomer = async (customer) => {
    try {
      const created = await customerService.createCustomer(customer);
      setData((current) => ({
        ...current,
        customers: [created, ...current.customers.filter((c) => c._id !== created._id)],
      }));
      return created;
    } catch (error) {
      console.warn('Failed to save customer to API, saving locally:', error);
      const id = customer._id || createId();
      const created = { _id: id, ...customer, createdAt: new Date().toISOString() };
      setData((current) => ({
        ...current,
        customers: [created, ...current.customers.filter((c) => c._id !== id)],
      }));
      return created;
    }
  };

  const updateCustomer = (id, updates) => {
    setData((current) => ({
      ...current,
      customers: current.customers.map((customer) => (customer._id === id ? { ...customer, ...updates } : customer)),
    }));
  };

  const addInvoice = (invoice, staffId) => {
    const newInvoice = {
      _id: createId(),
      invoiceNumber: invoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      customerId: invoice.customerId || null,
      customerName: invoice.customerName || 'Walk-in Customer',
      customerPhone: invoice.customerPhone || '',
      customerAddress: invoice.customerAddress || '',
      customerGSTIN: invoice.customerGSTIN || '',
      products: invoice.products.map((item) => ({ ...item })),
      discount: invoice.discount || 0,
      additionalCharges: invoice.additionalCharges || 0,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      paymentMode: invoice.paymentMode || 'Cash',
      cashAmount: invoice.cashAmount || 0,
      upiAmount: invoice.upiAmount || 0,
      cardAmount: invoice.cardAmount || 0,
      upiRef: invoice.upiRef || '',
      status: invoice.status || 'Completed',
      billDate: new Date().toISOString(),
      createdBy: staffId,
      type: 'sale',
    };

    setData((current) => {
      const updatedProducts = current.products.map((product) => {
        const selected = invoice.products.find((item) => item.productId === product._id);
        if (!selected) return product;
        return { ...product, stock: Math.max(0, product.stock - Number(selected.quantity)) };
      });

      const updatedCustomers = invoice.customerId
        ? current.customers.map((customer) =>
            customer._id === invoice.customerId ? { ...customer, lastPurchase: newInvoice.billDate } : customer
          )
        : current.customers;

      return {
        ...current,
        invoices: [newInvoice, ...current.invoices],
        products: updatedProducts,
        customers: updatedCustomers,
      };
    });

    return newInvoice;
  };

  const issueCreditNote = (invoiceId, returnItems, staffId) => {
    setData((current) => {
      const invoice = current.invoices.find((item) => item._id === invoiceId);
      if (!invoice) return current;

      const returnedProducts = returnItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({ ...item }));

      const creditAmount = returnedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const creditNote = {
        _id: createId(),
        invoiceNumber: `CRN-${Date.now().toString().slice(-6)}`,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        products: returnedProducts,
        discount: 0,
        totalAmount: -creditAmount,
        paidAmount: 0,
        paymentMode: 'Credit Note',
        status: 'Credit Note',
        billDate: new Date().toISOString(),
        createdBy: staffId,
        type: 'credit',
        originalInvoiceId: invoiceId,
      };

      const updatedProducts = current.products.map((product) => {
        const returned = returnedProducts.find((item) => item.productId === product._id);
        if (!returned) return product;
        return { ...product, stock: product.stock + Number(returned.quantity) };
      });

      const updatedInvoices = current.invoices.map((item) =>
        item._id === invoiceId ? { ...item, creditNotes: [...(item.creditNotes || []), creditNote._id] } : item
      );

      return {
        ...current,
        invoices: [creditNote, ...updatedInvoices],
        products: updatedProducts,
      };
    });
  };

  const addDelivery = (delivery, staffId) => {
    const id = createId();
    const created = {
      _id: id,
      ...delivery,
      assignedTo: staffId,
      status: delivery.status || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({
      ...current,
      deliveries: [created, ...current.deliveries],
    }));
    return created;
  };

  const updateDeliveryStatus = async (id, status) => {
    try {
      const updated = await deliveryService.updateDelivery(id, { status });
      setData((current) => ({
        ...current,
        deliveries: current.deliveries.map((delivery) => (delivery._id === id ? updated : delivery)),
      }));
      return updated;
    } catch (error) {
      console.warn('Failed to update delivery in API, updating locally:', error);
      setData((current) => ({
        ...current,
        deliveries: current.deliveries.map((delivery) => (delivery._id === id ? { ...delivery, status } : delivery)),
      }));
    }
  };

  const addOrder = (order) => {
    setData((current) => ({
      ...current,
      orders: [
        {
          _id: createId(),
          ...order,
          createdAt: new Date().toISOString(),
        },
        ...current.orders,
      ],
    }));
  };

  const updateOrder = async (id, updates) => {
    try {
      const updated = await orderService.updateOrder(id, updates);
      setData((current) => ({
        ...current,
        orders: current.orders.map((order) => (order._id === id ? updated : order)),
      }));
      return updated;
    } catch (error) {
      console.warn('Failed to update order in API, updating locally:', error);
      setData((current) => ({
        ...current,
        orders: current.orders.map((order) => (order._id === id ? { ...order, ...updates } : order)),
      }));
    }
  };

  const addLoginEvent = ({ userId, device = 'Browser', ip = '127.0.0.1' }) => {
    setData((current) => ({
      ...current,
      loginHistory: [
        { _id: createId(), userId, timestamp: new Date().toISOString(), device, ip },
        ...current.loginHistory,
      ].slice(0, 20),
    }));
  };

  const addActivityLog = ({ userId, action }) => {
    setData((current) => ({
      ...current,
      activityLog: [
        { _id: createId(), userId, action, timestamp: new Date().toISOString() },
        ...current.activityLog,
      ].slice(0, 50),
    }));
  };

  const addUser = (user) => {
    setData((current) => ({
      ...current,
      users: [user, ...current.users],
    }));
  };

  const updateUser = (id, updates) => {
    setData((current) => {
      const exists = current.users.some((user) => user._id === id);
      return {
        ...current,
        users: exists
          ? current.users.map((user) => (user._id === id ? { ...user, ...updates } : user))
          : [{ _id: id, ...updates }, ...current.users],
      };
    });
  };

  const findUserByEmail = (email) => store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  const findUserById = (id) => store.users.find((user) => user._id === id);

  const findCustomerById = (id) => store.customers.find((item) => item._id === id);
  const findDeliveryById = (id) => store.deliveries.find((item) => item._id === id);
  const findInvoiceById = (id) => store.invoices.find((item) => item._id === id);
  const findProductById = (id) => store.products.find((item) => item._id === id);

  const customerOutstanding = useMemo(() => {
    const customersArray = Array.isArray(store.customers) ? store.customers : [];
    const invoicesArray = Array.isArray(store.invoices) ? store.invoices : [];

    return customersArray.reduce((acc, customer) => {
      const due = invoicesArray
        .filter((invoice) => invoice.customerId === customer._id && invoice.status !== 'Completed')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      acc[customer._id] = due;
      return acc;
    }, {});
  }, [store.customers, store.invoices]);

  const todayInvoices = useMemo(
    () => store.invoices.filter((invoice) => isSameDay(invoice.billDate, new Date())),
    [store.invoices]
  );

  const todaySalesCount = todayInvoices.filter((invoice) => invoice.type === 'sale').length;
  const todayRevenue = todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const pendingOrdersCount = store.orders.filter((order) => order.status.toLowerCase() === 'pending').length;
  const openOrdersCount = store.orders.filter((order) => ['pending', 'processing'].includes(order.status.toLowerCase())).length;
  const recentBills = useMemo(
    () => [...store.invoices].sort((a, b) => new Date(b.billDate) - new Date(a.billDate)).slice(0, 8),
    [store.invoices]
  );
  const lowStockAlerts = useMemo(
    () => store.products.filter((product) => product.stock <= product.minimumStock),
    [store.products]
  );

  const invoicesByUser = (user) => {
    if (!user) return [];
    return (user.role === 'admin' || user.permissions?.canViewAllInvoices) ? store.invoices : store.invoices.filter((invoice) => (invoice.createdBy?._id || invoice.createdBy) === user._id);
  };

  const deliveriesByUser = (user) => {
    if (!user) return [];
    return user.permissions?.canManageDelivery
      ? store.deliveries
      : store.deliveries.filter((delivery) => delivery.assignedTo === user._id);
  };

  const loginHistoryForUser = (userId) => store.loginHistory.filter((event) => event.userId === userId).slice(0, 10);

  const refreshData = async () => {
    const token = localStorage.getItem('staffDashboardToken') || localStorage.getItem('vyapar_token');
    if (!token) return;

    try {
      const [productsData, customersData, invoicesData, deliveriesData, ordersData] = await Promise.allSettled([
        productService.getAllProducts(1, 200),
        customerService.getAllCustomers(1, 200),
        billService.getAllBills(1, 200),
        deliveryService.getAllDeliveries(1, 200),
        orderService.getAllOrders(1, 200),
      ]);

      setData((current) => {
        const next = { ...current };
        if (productsData.status === 'fulfilled' && productsData.value) {
          const val = productsData.value.products || productsData.value;
          if (Array.isArray(val)) next.products = val;
        }
        if (customersData.status === 'fulfilled' && customersData.value) {
          const val = customersData.value.customers || customersData.value;
          if (Array.isArray(val)) next.customers = val;
        }
        if (invoicesData.status === 'fulfilled' && invoicesData.value) {
          const val = invoicesData.value.bills || invoicesData.value;
          if (Array.isArray(val)) next.invoices = val;
        }
        if (deliveriesData.status === 'fulfilled' && deliveriesData.value) {
          const val = deliveriesData.value.deliveries || deliveriesData.value;
          if (Array.isArray(val)) next.deliveries = val;
        }
        if (ordersData.status === 'fulfilled' && ordersData.value) {
          const val = ordersData.value.orders || ordersData.value;
          if (Array.isArray(val)) next.orders = val;
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to sync with MERN database, using local fallback:', err);
    }
  };

  useEffect(() => {
    if (ready) {
      const token = localStorage.getItem('staffDashboardToken') || localStorage.getItem('vyapar_token');
      if (token) {
        refreshData();
      }
    }
  }, [ready]);

  const value = {
    ...store,
    ready,
    addProduct,
    updateProduct,
    removeProduct,
    adjustStock,
    addCustomer,
    updateCustomer,
    addInvoice,
    issueCreditNote,
    addDelivery,
    updateDeliveryStatus,
    addOrder,
    updateOrder,
    addLoginEvent,
    addActivityLog,
    updateUser,
    findUserByEmail,
    findUserById,
    findCustomerById,
    findDeliveryById,
    findInvoiceById,
    findProductById,
    customerOutstanding,
    todaySalesCount,
    todayRevenue,
    pendingOrdersCount,
    openOrdersCount,
    recentBills,
    lowStockAlerts,
    invoicesByUser,
    deliveriesByUser,
    loginHistoryForUser,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
