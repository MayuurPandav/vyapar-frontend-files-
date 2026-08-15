import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  ArrowLeft,
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  BarChart2,
  CreditCard,
  Banknote,
  Smartphone,
  HelpCircle,
  Loader2,
} from 'lucide-react';

/* ─────────────── helpers ─────────────── */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const paymentIcon = { Cash: Banknote, Card: CreditCard, UPI: Smartphone, Other: HelpCircle };
const paymentColor = {
  Cash:  { bg: 'rgba(16,185,129,0.08)', text: 'var(--accent)', bar: 'var(--accent)' },
  Card:  { bg: 'rgba(59,130,246,0.08)', text: 'var(--blue)',   bar: 'var(--blue)' },
  UPI:   { bg: 'rgba(139,92,246,0.08)',  text: 'var(--purple)', bar: 'var(--purple)' },
  Other: { bg: 'var(--bg-input)',         text: 'var(--text-2)', bar: 'var(--text-3)' },
};

/* ─────────────── sub-components ─────────────── */
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="card card--lift" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: accent.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: 24, height: 24, color: accent.iconText }} />
    </div>
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>{label}</p>
      <p style={{ marginTop: 2, fontSize: 22, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ marginTop: 2, fontSize: 11, color: 'var(--text-3)' }}>{sub}</p>}
    </div>
  </div>
);

/* ─────────────── main page ─────────────── */
export default function TodaySalesPage() {
  const navigate = useNavigate();
  const { invoices, ready } = useData();

  const todayInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.type === 'sale' && new Date(invoice.billDate).toDateString() === new Date().toDateString()),
    [invoices]
  );

  const salesCount = todayInvoices.length;
  const totalRevenue = useMemo(() => todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0), [todayInvoices]);
  const avgBill = salesCount ? (totalRevenue / salesCount).toFixed(0) : 0;

  const soldProducts = useMemo(() => {
    const aggregated = {};
    todayInvoices.forEach((invoice) => {
      invoice.products.forEach((item) => {
        const key = item.productId || item.name;
        if (!aggregated[key]) {
          aggregated[key] = { name: item.name, price: item.price, quantity: 0, revenue: 0 };
        }
        aggregated[key].quantity += item.quantity;
        aggregated[key].revenue += item.price * item.quantity;
      });
    });
    return Object.values(aggregated);
  }, [todayInvoices]);

  const paymentBreakdown = useMemo(() => {
    return todayInvoices.reduce((acc, invoice) => {
      const mode = invoice.paymentMode || 'Other';
      acc[mode] = (acc[mode] || 0) + invoice.totalAmount;
      return acc;
    }, {});
  }, [todayInvoices]);

  const totalQty = useMemo(() => soldProducts.reduce((s, p) => s + p.quantity, 0), [soldProducts]);

  if (!ready) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 style={{ width: 40, height: 40, color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading today's sales data…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Top header bar ── */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/')} className="btn btn--icon">
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Today's Sales Report</h1>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{today}</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: 'var(--accent)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
          Live
        </span>
      </div>

      {/* ── Summary metrics ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          icon={ShoppingCart}
          label="Total Bills Today"
          value={salesCount}
          sub="Invoices generated today"
          accent={{ iconBg: 'rgba(59,130,246,0.1)', iconText: 'var(--blue)' }}
        />
      </div>

      {/* ── Products + Payment breakdown ── */}
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.5fr 1fr' }}>

        {/* Products Sold */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 style={{ width: 20, height: 20, color: 'var(--blue)' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700 }}>Products Sold Today</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{soldProducts.length} product(s) · {totalQty} units total</p>
            </div>
          </div>

          {soldProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              <ShoppingCart style={{ marginBottom: 12, width: 40, height: 40, strokeWidth: 1 }} />
              <p style={{ fontSize: 13 }}>No products sold yet today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {soldProducts.map((p) => {
                const qtyPct  = totalQty > 0 ? (p.quantity / totalQty) * 100 : 0;
                const revPct  = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontWeight: 700 }}>₹{fmt(p.revenue)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-3)' }}>
                      <span>{p.quantity} units × ₹{fmt(p.price)}</span>
                      <span style={{ marginLeft: 'auto' }}>{qtyPct.toFixed(0)}% of units</span>
                    </div>
                    <div style={{ height: 8, width: '100%', overflow: 'hidden', borderRadius: 4, background: 'var(--bg-input)' }}>
                      <div
                        style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--blue), var(--accent))', transition: 'width 0.7s', width: `${qtyPct}%` }}
                      />
                    </div>
                    <p style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)' }}>{revPct.toFixed(0)}% of revenue</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard style={{ width: 20, height: 20, color: 'var(--purple)' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700 }}>Payment Breakdown</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Revenue split by payment mode</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(paymentBreakdown).map(([mode, amount]) => {
              const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
              const c = paymentColor[mode] || paymentColor.Other;
              const Icon = paymentIcon[mode] || HelpCircle;
              return (
                <div key={mode} style={{ padding: 16, borderRadius: 10, background: c.bg, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon style={{ width: 16, height: 16, color: c.text }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{mode}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>₹{fmt(amount)}</span>
                  </div>
                  <div style={{ marginTop: 12, height: 6, width: '100%', overflow: 'hidden', borderRadius: 3, background: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: c.bar, transition: 'width 0.7s', width: `${pct}%` }} />
                  </div>
                  <p style={{ marginTop: 4, textAlign: 'right', fontSize: 11, color: 'var(--text-3)' }}>{pct.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>

          {/* Total summary */}
          <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'var(--text-1)', color: '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Grand Total Today</p>
            <p style={{ marginTop: 4, fontSize: 22, fontWeight: 700 }}>₹{fmt(totalRevenue)}</p>
            <p style={{ marginTop: 2, fontSize: 11, color: 'var(--text-3)' }}>{salesCount} invoice(s) closed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
