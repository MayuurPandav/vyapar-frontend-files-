import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import AnimatedNumber from '../components/AnimatedNumber';

export default function PaginatedList({ type }) {
  const { dbData } = useApp();
  const username = dbData.settings?.username;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/list?username=${encodeURIComponent(username)}&type=${encodeURIComponent(type)}&page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setItems(d.items || []);
          setTotal(d.total || 0);
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, [username, type, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>Showing page <AnimatedNumber value={page} duration={400} formatter={v=>Math.round(v)} /> / <AnimatedNumber value={totalPages} duration={400} formatter={v=>Math.round(v)} /> — <AnimatedNumber value={total} duration={700} formatter={v=>Math.round(v)} /> items</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input className="fi" placeholder="Filter table..." value={q} onChange={e => setQ(e.target.value)} style={{ width: 180 }} />
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button className="btn btn--sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}>Prev</button>
          <button className="btn btn--sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              {type === 'sales' && (<><th>Invoice #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></>)}
              {type === 'purchases' && (<><th>PO #</th><th>Supplier</th><th>Date</th><th>Amount</th><th>Status</th></>)}
              {type === 'products' && (<><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Price</th></>)}
              {type === 'parties' && (<><th>Name</th><th>Type</th><th>Phone</th><th>Balance</th><th>LastTxn</th></>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading…</td></tr>
            ) : items.length ? (
              (() => {
                const lower = q.trim().toLowerCase();
                const filtered = !lower ? items : items.filter(it => JSON.stringify(it).toLowerCase().includes(lower));
                return filtered.length ? filtered.map((it, i) => (
                  <tr key={i}>
                    {type === 'sales' && (<><td style={{ fontWeight:600 }}>{it.id}</td><td>{it.customer}</td><td style={{ color: 'var(--text-3)' }}>{it.date}</td><td style={{ fontWeight:600 }}><AnimatedNumber value={Number(it.amount)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td><span className={`badge ${it.status==='Paid'?'badge--green':'badge--yellow'}`}>{it.status}</span></td></>)}
                    {type === 'purchases' && (<><td style={{ fontWeight:600 }}>{it.id}</td><td>{it.supplier}</td><td style={{ color: 'var(--text-3)' }}>{it.date}</td><td style={{ fontWeight:600 }}><AnimatedNumber value={Number(it.amount)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td><span className={`badge ${it.status==='Paid'?'badge--green':'badge--yellow'}`}>{it.status}</span></td></>)}
                    {type === 'products' && (<><td style={{ fontWeight:500 }}>{it.name}</td><td style={{ color: 'var(--text-3)' }}>{it.sku}</td><td><span className="badge badge--blue">{it.category}</span></td><td style={{ fontWeight:600 }}><AnimatedNumber value={Number(it.stock)||0} duration={700} formatter={v=>Math.round(v)} /></td><td><AnimatedNumber value={Number(it.price)||0} duration={700} formatter={v=>String(Math.round(v))} /></td></>)}
                    {type === 'parties' && (<><td style={{ fontWeight:500 }}>{it.name}</td><td><span className={`badge ${it.type==='Customer'?'badge--green':'badge--blue'}`}>{it.type}</span></td><td style={{ color: 'var(--text-3)' }}>{it.phone} ({it.state||'N/A'})</td><td style={{ fontWeight:600 }}><AnimatedNumber value={Number(it.balance)||0} duration={700} formatter={v=>String(Math.round(v))} /></td><td style={{ color: 'var(--text-3)' }}>{it.lastTxn}</td></>)}
                  </tr>
                )) : (<tr><td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--text-3)' }}>No records match</td></tr>);
              })()
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--text-3)' }}>No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
