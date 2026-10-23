import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  ArrowLeft,
  IndianRupee,
  BarChart2,
  CreditCard,
  Banknote,
  Smartphone,
  HelpCircle,
  Loader2,
  Clock,
  TrendingUp,
} from 'lucide-react';

/* ─────────────── helpers ─────────────── */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtHour = (hour) => {
  const num = Number(hour);
  const suffix = num === 0 || num === 24 ? '12 AM' : num === 12 ? '12 PM' : num < 12 ? `${num} AM` : `${num - 12} PM`;
  return suffix;
};

const paymentIcon = { Cash: Banknote, Card: CreditCard, UPI: Smartphone, Other: HelpCircle };
const paymentColor = {
  Cash:  { bg: 'rgba(16,185,129,0.08)', text: 'var(--accent)', bar: 'var(--accent)' },
  Card:  { bg: 'rgba(59,130,246,0.08)', text: 'var(--blue)',   bar: 'var(--blue)' },
  UPI:   { bg: 'rgba(139,92,246,0.08)',  text: 'var(--purple)', bar: 'var(--purple)' },
  Other: { bg: 'var(--bg-input)',         text: 'var(--text-2)', bar: 'var(--text-3)' },
};
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TodayRevenuePage() {
  const navigate = useNavigate();
  const { invoices, ready } = useData();

  const todayInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.type === 'sale' && new Date(invoice.billDate).toDateString() === new Date().toDateString()),
    [invoices]
  );

  const totalRevenue = useMemo(() => todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0), [todayInvoices]);
  const billCount = todayInvoices.length;
  const avgBill = billCount > 0 ? (totalRevenue / billCount).toFixed(0) : 0;

  const paymentBreakdown = useMemo(
    () => todayInvoices.reduce((acc, invoice) => {
      const mode = invoice.paymentMode || 'Other';
      acc[mode] = (acc[mode] || 0) + invoice.totalAmount;
      return acc;
    }, {}),
    [todayInvoices]
  );

  const hourlyRevenue = useMemo(() => {
    return todayInvoices.reduce((acc, invoice) => {
      const hour = new Date(invoice.billDate).getHours();
      acc[hour] = (acc[hour] || 0) + invoice.totalAmount;
      return acc;
    }, {});
  }, [todayInvoices]);

  const monthlyRevenue = useMemo(() => {
    const totals = {};
    invoices.forEach((invoice) => {
      if (invoice.type !== 'sale') return;
      const date = new Date(invoice.billDate);
      const month = date.getMonth() + 1;
      totals[month] = totals[month] || { _id: month, total: 0, count: 0 };
      totals[month].total += invoice.totalAmount;
      totals[month].count += 1;
    });
    return Object.values(totals).sort((a, b) => a._id - b._id);
  }, [invoices]);

  if (!ready) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 style={{ width: 40, height: 40, color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading today's revenue data…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const hourlyEntries = useMemo(
    () => Object.entries(hourlyRevenue).sort((a, b) => parseInt(a[0]) - parseInt(b[0])),
    [hourlyRevenue]
  );
  const maxHourly = Math.max(...hourlyEntries.map(([, v]) => v), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/')} className="btn btn--icon">
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Today's Revenue Report</h1>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{today}</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: 'var(--accent)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
          Live
        </span>
      </div>

      {/* ── Revenue Summary Cards ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card card--lift" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IndianRupee style={{ width: 24, height: 24, color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Total Revenue</p>
            <p style={{ marginTop: 2, fontSize: 22, fontWeight: 700 }}>₹{fmt(totalRevenue)}</p>
            <p style={{ marginTop: 2, fontSize: 11, color: 'var(--text-3)' }}>All sales combined today</p>
          </div>
        </div>

        <div className="card card--lift" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard style={{ width: 24, height: 24, color: 'var(--blue)' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Total Bills</p>
            <p style={{ marginTop: 2, fontSize: 22, fontWeight: 700 }}>{billCount}</p>
            <p style={{ marginTop: 2, fontSize: 11, color: 'var(--text-3)' }}>Invoices generating revenue</p>
          </div>
        </div>

        <div className="card card--lift" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp style={{ width: 24, height: 24, color: 'var(--purple)' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>Avg Bill Value</p>
            <p style={{ marginTop: 2, fontSize: 22, fontWeight: 700 }}>₹{fmt(avgBill)}</p>
            <p style={{ marginTop: 2, fontSize: 11, color: 'var(--text-3)' }}>Average revenue per invoice</p>
          </div>
        </div>
      </div>

      {/* ── Hourly Revenue + Payment Breakdown ── */}
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.5fr 1fr' }}>

        {/* Hourly Revenue Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 style={{ width: 20, height: 20, color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700 }}>Hourly Revenue</h2>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Revenue earned each hour today</p>
            </div>
          </div>

          {hourlyEntries.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              <Clock style={{ marginBottom: 12, width: 40, height: 40, strokeWidth: 1 }} />
              <p style={{ fontSize: 13 }}>No hourly revenue data yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {hourlyEntries.map(([hour, amount]) => {
                const pct = (amount / maxHourly) * 100;
                return (
                  <div key={hour} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{fmtHour(hour)}</span>
                      <span style={{ fontWeight: 700 }}>₹{fmt(amount)}</span>
                    </div>
                    <div style={{ height: 8, width: '100%', overflow: 'hidden', borderRadius: 4, background: 'var(--bg-input)' }}>
                      <div
                        style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), rgba(16,185,129,0.6))', transition: 'width 0.7s', width: `${pct}%` }}
                      />
                    </div>
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

          {/* Grand Total */}
          <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'var(--text-1)', color: '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Grand Total Today</p>
            <p style={{ marginTop: 4, fontSize: 22, fontWeight: 700 }}>₹{fmt(totalRevenue)}</p>
            <p style={{ marginTop: 2, fontSize: 11, opacity: 0.6 }}>{billCount} invoice(s)</p>
          </div>
        </div>
      </div>

      {/* ── Monthly Revenue Trend ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp style={{ width: 20, height: 20, color: 'var(--blue)' }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 700 }}>Monthly Revenue Trend</h2>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Revenue across all months</p>
          </div>
        </div>
        {monthlyRevenue.length === 0 ? (
          <p style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>No monthly data available yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {monthlyRevenue.map((m) => {
              const maxMonthly = Math.max(...monthlyRevenue.map((x) => x.total), 1);
              const pct = (m.total / maxMonthly) * 100;
              return (
                <div key={m._id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{monthNames[m._id - 1] || `M${m._id}`}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.count} bills</span>
                      <span style={{ fontWeight: 700 }}>₹{fmt(m.total)}</span>
                    </div>
                  </div>
                  <div style={{ height: 10, width: '100%', overflow: 'hidden', borderRadius: 5, background: 'var(--bg-input)' }}>
                    <div
                      style={{ height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, var(--blue), rgba(59,130,246,0.6))', transition: 'width 0.7s', width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
