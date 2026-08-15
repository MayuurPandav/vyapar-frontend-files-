import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import BarcodeScannerCamera from '../components/BarcodeScannerCamera';
import { Search, PenLine, AlertTriangle, Barcode, Archive, Bell, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import productService from '../services/productService';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products: localProducts, ready } = useData();
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState('all'); 
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'inStock', 'lowStock', 'outOfStock'
  const [apiProducts, setApiProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [stockSummary, setStockSummary] = useState(null);
  const [drillModal, setDrillModal] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const productsResponse = await productService.getAllProducts(1, 100, search);
        setApiProducts(productsResponse.products || productsResponse);
        
        try {
          const summary = await productService.getStockSummary?.();
          setStockSummary(summary);
        } catch (err) {}
      } catch (error) {
        setApiProducts(localProducts);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, stockFilter, localProducts]);

  if (!ready && isLoading) return <Loader />;

  const products = apiProducts.length > 0 ? apiProducts : localProducts;

  const filtered = products.filter((product) => {
    let matchesSearch = true;
    if (search) {
      if (searchType === 'name') {
        matchesSearch = (product.productName || product.name || '').toLowerCase().includes(search.toLowerCase());
      } else if (searchType === 'barcode') {
        matchesSearch = product.barcode?.toLowerCase().includes(search.toLowerCase());
      } else {
        matchesSearch =
          (product.productName || product.name || '').toLowerCase().includes(search.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(search.toLowerCase());
      }
    }

    let matchesStock = true;
    if (stockFilter === 'inStock') {
      matchesStock = product.stock > 0;
    } else if (stockFilter === 'lowStock') {
      matchesStock = product.stock <= product.minimumStock && product.stock > 0;
    } else if (stockFilter === 'outOfStock') {
      matchesStock = product.stock === 0;
    }

    return matchesSearch && matchesStock;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minimumStock && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const handleBarcodeSearch = async (barcode) => {
    if (!barcode) return;
    try {
      const product = await productService.searchByBarcode(barcode);
      if (product && product.length > 0) {
        setSearch(product[0].barcode);
        setSearchType('barcode');
        toast.success(`Found: ${product[0].productName || product[0].name}`);
      } else {
        toast.error('Product not found in inventory');
      }
    } catch (error) {
      toast.error('Barcode not found');
    }
    setScannedBarcode('');
    setShowBarcodeScanner(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Inventory Dashboard</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Monitor stock levels, scan barcodes, and view low stock alerts.</p>
          </div>
          <div className="stat__icon stat__icon--b">
            <Archive className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Stock Summary & Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {stockSummary && (
          <div 
            className="card card--lift md:col-span-1 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
            onClick={showStockValueDrilldown}
            style={{ cursor: 'pointer' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Total Stock Value</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent)' }}>₹{(stockSummary.totalStockValue / 100000).toFixed(1)}L</p>
            <div className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--text-2)' }}>
              <div><span className="font-semibold" style={{ color: 'var(--text-1)' }}>{stockSummary.totalProducts}</span> Products</div>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        <div className="card md:col-span-2" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" style={{ color: 'var(--yellow)' }} />
                <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Inventory Alerts</h3>
             </div>
             <button 
                onClick={() => {
                  setStockFilter('lowStock');
                  setTimeout(() => {
                    document.getElementById('inventory-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="text-xs font-medium underline"
                style={{ color: 'var(--yellow)' }}
              >
                View All
             </button>
          </div>
          <div className="space-y-2">
            {outOfStockProducts.length > 0 && (
               <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--red)' }}>
                 <AlertTriangle className="h-4 w-4" />
                 <span>{outOfStockProducts.length} items</span> are completely out of stock!
               </div>
            )}
            {lowStockProducts.length > 0 ? (
               <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--yellow)' }}>
                 <AlertTriangle className="h-4 w-4" />
                 <span>{lowStockProducts.length} items</span> are running low on stock.
               </div>
            ) : (
               <div className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Stock levels look good.</div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="topbar__search" style={{ width: '100%' }}>
                <i className="fas fa-search" style={{ left: '16px' }}></i>
                <input
                  type="search"
                  placeholder={searchType === 'barcode' ? 'Search by barcode...' : 'Search inventory...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '44px' }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
              className="btn btn--primary"
            >
              <Barcode className="h-4 w-4" /> Scan Barcode
            </button>
          </div>

          {showBarcodeScanner && (
            <BarcodeScannerCamera
              onScan={(code) => handleBarcodeSearch(code)}
              onError={(err) => toast.error('Camera error: ' + (err?.message || 'Could not access camera'))}
              onClose={() => setShowBarcodeScanner(false)}
            />
          )}

          <div className="flex flex-wrap gap-3">
            <select value={searchType} onChange={(e) => { setSearchType(e.target.value); setSearch(''); }} className="fi" style={{ width: 'auto' }}>
              <option value="all">All Fields</option>
              <option value="name">By Name</option>
              <option value="barcode">By Barcode</option>
            </select>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="fi" style={{ width: 'auto' }}>
              <option value="all">All Stock Levels</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div id="inventory-table" className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}></div>
                <p className="text-sm font-medium text-slate-500" style={{ color: 'var(--text-3)' }}>Loading inventory data...</p>
              </div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Barcode</th>
                  <th>Current Stock</th>
                  <th>Min Stock Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const isLowStock = product.stock <= product.minimumStock && product.stock > 0;
                  const isOutOfStock = product.stock === 0;
                  const statusColor = isOutOfStock ? 'var(--red)' : isLowStock ? 'var(--yellow)' : 'var(--accent)';
                  const statusBg = isOutOfStock ? 'rgba(239, 68, 68, 0.05)' : isLowStock ? 'rgba(245, 158, 11, 0.05)' : 'transparent';

                  return (
                    <tr key={product._id} style={{ background: statusBg }}>
                      <td style={{ fontWeight: '500', color: 'var(--text-1)' }}>{product.productName || product.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-3)' }}>{product.barcode || '-'}</td>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--text-1)' }}>{product.stock}</span> units
                      </td>
                      <td style={{ color: 'var(--text-3)' }}>{product.minimumStock} units</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {(isOutOfStock || isLowStock) && <AlertTriangle className="h-4 w-4" style={{ color: statusColor }} />}
                          <span className="badge" style={{
                            backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.1)' : isLowStock ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: statusColor
                          }}>
                            {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {canEditInventory ? (
                          <button
                            onClick={() => navigate(`/products/${product._id}/edit`)}
                            className="btn btn--sm btn--primary"
                          >
                            <PenLine className="h-3.5 w-3.5" /> Adjust Stock
                          </button>
                        ) : (
                           <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: 'var(--text-3)' }}>
               <Package className="h-12 w-12 mx-auto mb-3" style={{ opacity: 0.5 }} />
               <p className="font-medium">No inventory found matching your criteria.</p>
            </div>
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

export default InventoryPage;
