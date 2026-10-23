import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import BarcodeScannerCamera from '../components/BarcodeScannerCamera';
import { Search, PlusCircle, PenLine, Trash2, AlertTriangle, Barcode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import productService from '../services/productService';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products: localProducts, ready, removeProduct } = useData();
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'barcode'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'inStock', 'lowStock', 'outOfStock'
  const [categories, setCategories] = useState([]);
  const [apiProducts, setApiProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [stockSummary, setStockSummary] = useState(null);
  const [drillModal, setDrillModal] = useState(null);

  const showTotalProductsDrilldown = () => {
    const cols = ["Product Name", "Barcode", "Category", "Price", "Stock"];
    const rows = filtered.map(p => [
      p.productName || p.name || '',
      p.barcode || '-',
      p.category || '-',
      `₹${p.price}`,
      String(p.stock)
    ]);
    setDrillModal({
      title: "All Products Detail List",
      cols,
      rows
    });
  };

  const showLowStockDrilldown = () => {
    const cols = ["Product Name", "Barcode", "Stock", "Min Stock"];
    const lowStockItems = products.filter(p => p.stock <= p.minimumStock && p.stock > 0);
    const rows = lowStockItems.map(p => [
      p.productName || p.name || '',
      p.barcode || '-',
      String(p.stock),
      String(p.minimumStock)
    ]);
    setDrillModal({
      title: "Low Stock Items Alert",
      cols,
      rows
    });
  };

  const showOutOfStockDrilldown = () => {
    const cols = ["Product Name", "Barcode", "Category", "Min Stock"];
    const outOfStockItems = products.filter(p => p.stock === 0);
    const rows = outOfStockItems.map(p => [
      p.productName || p.name || '',
      p.barcode || '-',
      p.category || '-',
      String(p.minimumStock)
    ]);
    setDrillModal({
      title: "Out of Stock Items Alert",
      cols,
      rows
    });
  };

  const showStockValueDrilldown = () => {
    const cols = ["Product Name", "Current Stock", "Price", "Computed Value"];
    const rows = products.map(p => [
      p.productName || p.name || '',
      String(p.stock),
      `₹${p.price}`,
      `₹${(p.stock * p.price).toLocaleString()}`
    ]);
    setDrillModal({
      title: "Current Inventory Valuation Breakdown",
      cols,
      rows
    });
  };

  const canEditInventory = user?.permissions?.canEditInventory || user?.role === 'admin';

  // Fetch products from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch products
        const filters = {
          search,
          category: categoryFilter !== 'all' ? categoryFilter : '',
          inStock: stockFilter === 'inStock' ? 'true' : '',
          lowStock: stockFilter === 'lowStock' ? 'true' : '',
        };

        const productsResponse = await productService.getAllProducts(1, 100, search);
        setApiProducts(productsResponse.products || productsResponse);

        // Fetch categories
        try {
          const categoriesResponse = await productService.getCategories?.();
          setCategories(categoriesResponse || []);
        } catch (err) {
          console.log('Categories not available from API');
        }

        // Fetch stock summary
        try {
          const summary = await productService.getStockSummary?.();
          setStockSummary(summary);
        } catch (err) {
          console.log('Stock summary not available from API');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setApiProducts(localProducts);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, categoryFilter, stockFilter]);

  if (!ready && isLoading) return <Loader />;

  const products = apiProducts.length > 0 ? apiProducts : localProducts;

  // Apply client-side filters
  const filtered = products.filter((product) => {
    let matchesSearch = true;
    if (search) {
      if (searchType === 'name') {
        matchesSearch =
          (product.productName || product.name || '').toLowerCase().includes(search.toLowerCase()) ||
          product.category?.toLowerCase().includes(search.toLowerCase());
      } else if (searchType === 'barcode') {
        matchesSearch = product.barcode?.toLowerCase().includes(search.toLowerCase());
      } else {
        matchesSearch =
          (product.productName || product.name || '').toLowerCase().includes(search.toLowerCase()) ||
          product.category?.toLowerCase().includes(search.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(search.toLowerCase());
      }
    }

    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      matchesCategory = product.category === categoryFilter;
    }

    let matchesStock = true;
    if (stockFilter === 'inStock') {
      matchesStock = product.stock > 0;
    } else if (stockFilter === 'lowStock') {
      matchesStock = product.stock <= product.minimumStock && product.stock > 0;
    } else if (stockFilter === 'outOfStock') {
      matchesStock = product.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleBarcodeSearch = async (barcode) => {
    if (!barcode) return;
    try {
      const product = await productService.searchByBarcode(barcode);
      if (product && product.length > 0) {
        setSearch(product[0].barcode);
        setSearchType('barcode');
        toast.success(`Found: ${product[0].productName || product[0].name}`);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Barcode not found');
    }
    setScannedBarcode('');
    setShowBarcodeScanner(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Inventory Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>View, manage products, stock levels and pricing.</p>
        </div>
        {canEditInventory && (
          <button onClick={() => navigate('/products/new')} className="btn btn--primary">
            <PlusCircle style={{ width: 16, height: 16 }} /> Add Product
          </button>
        )}
      </div>

      {/* Stock Summary Cards */}
      {stockSummary && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div 
            className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
            onClick={showTotalProductsDrilldown}
            style={{ cursor: 'pointer' }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Total Products</p>
            <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{stockSummary.totalProducts}</p>
          </div>
          <div 
            className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
            onClick={showLowStockDrilldown}
            style={{ cursor: 'pointer' }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Low Stock</p>
            <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: 'var(--yellow)' }}>{stockSummary.lowStockCount}</p>
          </div>
          <div 
            className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
            onClick={showOutOfStockDrilldown}
            style={{ cursor: 'pointer' }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Out of Stock</p>
            <p style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: 'var(--red)' }}>{stockSummary.outOfStock}</p>
          </div>
          <div 
            className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
            onClick={showStockValueDrilldown}
            style={{ cursor: 'pointer' }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Stock Value</p>
            <p style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>₹{(stockSummary.totalStockValue / 100000).toFixed(1)}L</p>
          </div>
        </div>
      )}

      {/* Search and Filters + Product Table */}
      <div className="card">
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
              <Search style={{ width: 16, height: 16, color: 'var(--text-3)' }} />
              <input
                type="search"
                placeholder={searchType === 'barcode' ? 'Search by barcode...' : 'Search products...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text-1)', width: '100%' }}
              />
            </div>

            {/* Barcode Scanner Button */}
            <button onClick={() => setShowBarcodeScanner(!showBarcodeScanner)} className="btn">
              <Barcode style={{ width: 16, height: 16 }} /> Scan
            </button>
          </div>

          {/* Barcode Scanner Camera */}
          {showBarcodeScanner && (
            <BarcodeScannerCamera
              onScan={(code) => handleBarcodeSearch(code)}
              onError={(err) => toast.error('Camera error: ' + (err?.message || 'Could not access camera'))}
              onClose={() => setShowBarcodeScanner(false)}
            />
          )}

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {/* Search Type */}
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearch('');
              }}
              className="fi"
              style={{ width: 'auto' }}
            >
              <option value="all">All Fields</option>
              <option value="name">By Name</option>
              <option value="barcode">By Barcode</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="fi"
              style={{ width: 'auto' }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="fi"
              style={{ width: 'auto' }}
            >
              <option value="all">All Stock Levels</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 12, display: 'inline-block', width: 32, height: 32, border: '4px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading products...</p>
              </div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const isLowStock = product.stock <= product.minimumStock && product.stock > 0;
                  const isOutOfStock = product.stock === 0;
                  const statusColor = isOutOfStock ? 'var(--red)' : isLowStock ? 'var(--yellow)' : 'var(--accent)';

                  return (
                    <tr
                      key={product._id}
                      style={{ cursor: canEditInventory ? 'pointer' : 'default' }}
                      onClick={() => canEditInventory && navigate(`/products/${product._id}/edit`)}
                    >
                      <td style={{ fontWeight: 500 }}>{product.productName || product.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{product.barcode || '-'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{product.category || '-'}</td>
                      <td>₹{product.price}</td>
                      <td style={{ fontWeight: 600 }}>{product.stock}</td>
                      <td>{product.minimumStock}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {(isOutOfStock || isLowStock) && <AlertTriangle style={{ width: 14, height: 14, color: statusColor }} />}
                          <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>
                            {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </span>
                      </td>
                      <td>
                        {canEditInventory && (
                          <div className="staff-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/products/${product._id}/edit`);
                              }}
                              className="btn btn--sm"
                            >
                              <PenLine style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (await window.confirm('Delete this product?')) {
                                  removeProduct(product._id);
                                }
                              }}
                              className="btn btn--sm"
                              style={{ color: 'var(--red)' }}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!isLoading && filtered.length === 0 && (
            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>No products match your filters.</p>
          )}
        </div>
      </div>
      {/* Global Drill-down Modal */}
      {drillModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
          onClick={(e) => e.target === e.currentTarget && setDrillModal(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl transition-all duration-300 text-slate-800" 
            style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '85vh' }}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase" style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics Detailed Breakdown</span>
                <h3 className="text-xl font-black mt-0.5" style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>{drillModal.title}</h3>
              </div>
              <button
                onClick={() => setDrillModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '55vh', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {drillModal.cols.map((col, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillModal.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : '#fafafa'
                      }}
                    >
                      {row.map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '12px 16px', color: '#475569' }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                  {drillModal.rows.length === 0 && (
                    <tr>
                      <td colSpan={drillModal.cols.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setDrillModal(null)}
              className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs py-3 rounded-full transition"
              style={{ border: 'none', color: '#fff', backgroundColor: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
