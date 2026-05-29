import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import AnimatedNumber from '../components/AnimatedNumber';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function Reports() {
  const [tab, setTab] = useState('financial');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [salesByDay, setSalesByDay] = useState(null);
  const [salesByProduct, setSalesByProduct] = useState(null);
  const [tableQ, setTableQ] = useState('');

  useEffect(() => { fetchTab(); fetchSalesCharts(); }, [tab]);

  const qs = (extra = '') => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return (extra ? ('&' + extra) : '') + (params.toString() ? ('?' + params.toString()).replace('?','') : '');
  };

  const fetchTab = async () => {
    setLoading(true);
    try {
      if (tab === 'financial') {
        const res = await fetch('/api/admin/reports/financial' + (from||to ? `?from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}` : ''));
        setData(await res.json());
      } else if (tab === 'gst') {
        const res = await fetch('/api/admin/reports/gst' + (from||to ? `?from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}` : ''));
        setData(await res.json());
      } else if (tab === 'ageing') {
        const res = await fetch('/api/admin/reports/ageing');
        setData(await res.json());
      } else if (tab === 'purchase') {
        const res = await fetch(`/api/admin/reports/purchase?groupBy=supplier${from||to ? `&from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}` : ''}`);
        setData(await res.json());
      } else if (tab === 'inventory') {
        const resOut = await fetch('/api/admin/reports/inventory/advanced?type=out_of_stock');
        const resDead = await fetch('/api/admin/reports/inventory/advanced?type=dead_stock');
        setData({ outOfStock: await resOut.json(), deadStock: await resDead.json() });
      } else if (tab === 'delivery') {
        const res = await fetch('/api/admin/reports/delivery' + (from||to ? `?from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}` : ''));
        setData(await res.json());
      } else if (tab === 'party') {
        setData(null);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchSalesCharts = async () => {
    try {
      const dayRes = await fetch(`/api/admin/reports/sales${from||to?`?from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}`:''}`);
      const dayJson = await dayRes.json();
      setSalesByDay(dayJson || []);

      const prodRes = await fetch(`/api/admin/reports/sales?groupBy=product${from||to?`&from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}`:''}`);
      const prodJson = await prodRes.json();
      setSalesByProduct(prodJson || []);
    } catch (e) { console.error(e); }
  };

  const exportCSV = (endpoint) => {
    const url = new URL(endpoint, window.location.origin);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    url.searchParams.set('csv', 'true');
    window.location.href = url.toString();
  };

  const fetchParty = async () => {
    if (!partyId) return alert('Enter party id');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/party-ledger?partyId=${encodeURIComponent(partyId)}`);
      setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const salesDayChart = () => {
    if (!salesByDay) return null;
    const labels = salesByDay.map(r => r.date || new Date(r.date).toLocaleDateString());
    const totals = salesByDay.map(r => Number(r.total || r.revenue || 0));
    const cfg = { labels, datasets: [{ label: 'Sales', data: totals, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.15)' }] };
    return <Line data={cfg} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutCubic' }, plugins: { legend: { display: false } } }} />;
  };

  const salesProductChart = () => {
    if (!salesByProduct) return null;
    const labels = salesByProduct.map(r => r.product || r._id || r.product);
    const totals = salesByProduct.map(r => Number(r.revenue || r.qty || 0));
    const cfg = { labels, datasets: [{ label: 'Revenue', data: totals, backgroundColor: 'rgba(16,185,129,0.6)' }] };
    return <Bar data={cfg} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutCubic' }, plugins: { legend: { display: false } } }} />;
  };

  return (
    <main className="main">
      <div className="card">
        <div className="card__head">
          <h3>Reports & Analytics — Full</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${tab==='financial'?'btn--primary':''}`} onClick={() => setTab('financial')}>Financial</button>
            <button className={`btn ${tab==='purchase'?'btn--primary':''}`} onClick={() => setTab('purchase')}>Purchases</button>
            <button className={`btn ${tab==='inventory'?'btn--primary':''}`} onClick={() => setTab('inventory')}>Inventory</button>
            <button className={`btn ${tab==='delivery'?'btn--primary':''}`} onClick={() => setTab('delivery')}>Delivery</button>
            <button className={`btn ${tab==='gst'?'btn--primary':''}`} onClick={() => setTab('gst')}>GST</button>
            <button className={`btn ${tab==='ageing'?'btn--primary':''}`} onClick={() => setTab('ageing')}>Ageing</button>
            <button className={`btn ${tab==='party'?'btn--primary':''}`} onClick={() => setTab('party')}>Party Ledger</button>
          </div>
        </div>

          <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: '#666' }}>From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
            <label style={{ fontSize: 12, color: '#666' }}>To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
            <input className="fi" placeholder="Filter rows..." value={tableQ} onChange={e=>setTableQ(e.target.value)} style={{ width: 200 }} />
            <button className="btn" onClick={()=>{ fetchTab(); fetchSalesCharts(); }}>Apply</button>
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={()=>exportCSV('/api/admin/reports/financial')}>Export Financial CSV</button>
          </div>

          {loading && <div>Loading...</div>}

          {tab === 'financial' && data && (
            <div>
              <h4>Financial Summary</h4>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="card" style={{ padding: 12 }}><strong>Revenue</strong><div style={{ fontSize: 20 }}><AnimatedNumber value={Number(data.revenue)||0} duration={1200} formatter={v => String(Math.round(v))} /></div></div>
                <div className="card" style={{ padding: 12 }}><strong>Cost</strong><div style={{ fontSize: 20 }}><AnimatedNumber value={Number(data.cost)||0} duration={1200} formatter={v => String(Math.round(v))} /></div></div>
                <div className="card" style={{ padding: 12 }}><strong>Profit</strong><div style={{ fontSize: 20 }}><AnimatedNumber value={Number(data.profit)||0} duration={1200} formatter={v => String(Math.round(v))} /></div></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <h5>Sales — by day</h5>
                <div style={{ height: 240 }}>{salesDayChart()}</div>
                <h5 style={{ marginTop: 12 }}>Sales — by product</h5>
                <div style={{ height: 320 }}>{salesProductChart()}</div>
              </div>
            </div>
          )}

          {tab === 'purchase' && (
            <div>
              <h4>Supplier-wise Purchases</h4>
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => exportCSV('/api/admin/reports/purchase?groupBy=supplier')}>Export CSV</button>
              </div>
              <table className="tbl" style={{ marginTop: 12 }}>
                <thead><tr><th>Supplier</th><th>Total Cost</th><th>Count</th></tr></thead>
                <tbody>
                  {Array.isArray(data) && data.filter(r => !tableQ.trim() || JSON.stringify(r).toLowerCase().includes(tableQ.toLowerCase())).map((r,i)=>(<tr key={i}><td>{r.supplier}</td><td><AnimatedNumber value={Number(r.total)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td><AnimatedNumber value={Number(r.count)||0} duration={600} formatter={v=>Math.round(v)} /></td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'inventory' && data && (
            <div>
              <h4>Advanced Inventory Reports</h4>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5>Out of Stock</h5>
                    <button className="btn btn--sm" onClick={() => exportCSV('/api/admin/reports/inventory/advanced?type=out_of_stock')}>Export</button>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                    {data.outOfStock && data.outOfStock.map((p,i) => <li key={i} style={{ padding: 4, borderBottom: '1px solid #eee' }}>{p.name} (SKU: {p.sku})</li>)}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h5>Dead Stock (No recent sales)</h5>
                    <button className="btn btn--sm" onClick={() => exportCSV('/api/admin/reports/inventory/advanced?type=dead_stock')}>Export</button>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                    {data.deadStock && data.deadStock.map((p,i) => <li key={i} style={{ padding: 4, borderBottom: '1px solid #eee' }}>{p.name} (SKU: {p.sku})</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {tab === 'delivery' && (
            <div>
              <h4>Delivery Report</h4>
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => exportCSV('/api/admin/reports/delivery')}>Export CSV</button>
              </div>
              <table className="tbl" style={{ marginTop: 12 }}>
                <thead><tr><th>ID</th><th>Customer</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {Array.isArray(data) && data.filter(r => !tableQ.trim() || JSON.stringify(r).toLowerCase().includes(tableQ.toLowerCase())).map((r,i)=>(<tr key={i}><td>{r._id}</td><td>{r.customer?.name}</td><td>{r.status}</td><td>{(r.createdAt||'').slice(0,10)}</td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'gst' && (
            <div>
              <h4>GST Summary</h4>
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => exportCSV('/api/admin/reports/gst')}>Export CSV</button>
              </div>
              <table className="tbl" style={{ marginTop: 12 }}>
                <thead><tr><th>Rate</th><th>Taxable</th><th>GST Amount</th></tr></thead>
                <tbody>
                  {Array.isArray(data) && data.filter(r => !tableQ.trim() || JSON.stringify(r).toLowerCase().includes(tableQ.toLowerCase())).map((r,i)=>(<tr key={i}><td>{r.gstRate}</td><td><AnimatedNumber value={Number(r.taxable)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td><AnimatedNumber value={Number(r.gstAmount)||0} duration={700} formatter={v=>String(Math.round(v))} /></td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'ageing' && (
            <div>
              <h4>Ageing Report</h4>
              <div style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => exportCSV('/api/admin/reports/ageing')}>Export CSV</button>
              </div>
              <table className="tbl" style={{ marginTop: 12 }}>
                <thead><tr><th>Party</th><th>Amount</th><th>Outstanding</th><th>Days Overdue</th></tr></thead>
                <tbody>
                  {Array.isArray(data) && data.filter(r => !tableQ.trim() || JSON.stringify(r).toLowerCase().includes(tableQ.toLowerCase())).map((r,i)=>(<tr key={i}><td>{r.customer}</td><td><AnimatedNumber value={Number(r.amount)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td><AnimatedNumber value={Number(r.outstanding)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td><AnimatedNumber value={Number(r.daysOverdue)||0} duration={500} formatter={v=>Math.round(v)} /></td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'party' && (
            <div>
              <h4>Party Ledger</h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Party ID" value={partyId} onChange={e=>setPartyId(e.target.value)} />
                <button className="btn" onClick={fetchParty}>Fetch</button>
                <button className="btn" onClick={()=>exportCSV(`/api/admin/reports/party-ledger?partyId=${encodeURIComponent(partyId)}`)}>Export CSV</button>
              </div>
              <table className="tbl" style={{ marginTop: 12 }}>
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
                <tbody>
                  {Array.isArray(data) && data.filter(r => !tableQ.trim() || JSON.stringify(r).toLowerCase().includes(tableQ.toLowerCase())).map((r,i)=>(<tr key={i}><td>{r.date}</td><td>{r.type}</td><td><AnimatedNumber value={Number(r.amount)||0} duration={700} formatter={v=>String(Math.round(v))} /></td></tr>))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
