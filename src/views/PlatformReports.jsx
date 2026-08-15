import React, { useState, useEffect } from 'react';

const REPORT_TYPES = [
  { id: 'shop_growth', label: 'Shop Growth Report', icon: 'fa-chart-line' },
  { id: 'revenue', label: 'Revenue & Subscriptions', icon: 'fa-rupee-sign' },
  { id: 'users', label: 'User & Staff Activity', icon: 'fa-users' },
  { id: 'invoices', label: 'Invoice Volume', icon: 'fa-file-invoice' },
  { id: 'purchases', label: 'Purchase Report', icon: 'fa-shopping-cart' },
  { id: 'inventory', label: 'Inventory Snapshot', icon: 'fa-boxes' },
  { id: 'gst', label: 'GST Compliance', icon: 'fa-landmark' },
  { id: 'payments', label: 'Payment Collections', icon: 'fa-credit-card' },
  { id: 'expenses', label: 'Expense Report', icon: 'fa-wallet' },
  { id: 'deliveries', label: 'Delivery Performance', icon: 'fa-truck' },
  { id: 'offers', label: 'Offers & Discounts', icon: 'fa-tags' },
  { id: 'support', label: 'Support Tickets', icon: 'fa-headset' }
];

export default function PlatformReports() {
  const [reportType, setReportType] = useState('shop_growth');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({ frequency: 'weekly', email: '' });

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange.startDate, dateRange.endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ type: reportType });
      if (dateRange.startDate) p.set('startDate', dateRange.startDate);
      if (dateRange.endDate) p.set('endDate', dateRange.endDate);
      
      const res = await fetch(`/api/super/reports/generate?${p}`);
      const j = await res.json();
      if (j.status === 'success') {
        setReportData(j);
      } else {
        setReportData(null);
      }
    } catch (e) {
      setReportData(null);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    const p = new URLSearchParams({ type: reportType });
    if (dateRange.startDate) p.set('startDate', dateRange.startDate);
    if (dateRange.endDate) p.set('endDate', dateRange.endDate);
    window.open(`/api/super/reports/export?${p}`, '_blank');
  };

  const handleSaveSchedule = async () => {
    try {
      await fetch('/api/super/reports/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [reportType]: scheduleConfig })
      });
      alert('Report schedule saved successfully!');
      setScheduleModal(false);
    } catch (e) {
      alert('Failed to save schedule');
    }
  };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="topbar__left">
          <h1>Platform Reports & Exports</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>Generate, schedule, and export comprehensive platform-wide analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn--secondary" onClick={() => setScheduleModal(true)} style={{ padding: '10px 16px', borderRadius: '8px' }}>
            <i className="fas fa-clock" style={{ marginRight: '6px' }}></i> Schedule
          </button>
          <button className="btn btn--primary" onClick={handleExportCSV} style={{ padding: '10px 16px', borderRadius: '8px' }}>
            <i className="fas fa-file-csv" style={{ marginRight: '6px' }}></i> Export CSV
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        {/* Sidebar Selector */}
        <div className="card" style={{ padding: '16px 0', height: 'fit-content' }}>
          <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>Report Types</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setReportType(rt.id)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: reportType === rt.id ? 'var(--accent)15' : 'transparent',
                  color: reportType === rt.id ? 'var(--accent)' : 'var(--text-1)',
                  fontWeight: reportType === rt.id ? 700 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: `4px solid ${reportType === rt.id ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
              >
                <i className={`fas ${rt.icon}`} style={{ width: '16px', textAlign: 'center' }}></i>
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filters */}
          <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Start Date</label>
              <input 
                type="date" 
                value={dateRange.startDate} 
                onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>End Date</label>
              <input 
                type="date" 
                value={dateRange.endDate} 
                onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
              />
            </div>
            <button className="btn btn--secondary" onClick={() => setDateRange({ startDate: '', endDate: '' })} style={{ alignSelf: 'flex-end', padding: '9px 16px', borderRadius: '6px' }}>
              Clear
            </button>
          </div>

          {/* Stats Summary */}
          {loading ? <div style={{ padding: '40px', textAlign: 'center' }}>Generating Report...</div> : reportData ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Records</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>{reportData.stats.totalRecords}</div>
                </div>
                {reportData.stats.totalValue !== undefined && (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Aggregated Value</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(reportData.stats.totalValue)}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Table Preview */}
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Data Preview (Top 100 rows)</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Generated: {new Date(reportData.stats.generatedAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="table-responsive" style={{ maxHeight: '500px', overflow: 'auto' }}>
                  {reportData.sampleData.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>No data available for the selected range.</div>
                  ) : (
                    <table className="table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          {Object.keys(reportData.sampleData[0]).filter(k => k !== '_id' && k !== 'password').slice(0, 8).map(k => (
                            <th key={k} style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.sampleData.map((row, i) => (
                          <tr key={i}>
                            {Object.keys(row).filter(k => k !== '_id' && k !== 'password').slice(0, 8).map(k => (
                              <td key={k} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {typeof row[k] === 'object' && row[k] !== null ? JSON.stringify(row[k]) : String(row[k])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>Error generating report.</div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Schedule Auto-Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px' }}>Automatically generate and email the <strong>{REPORT_TYPES.find(r=>r.id===reportType)?.label}</strong>.</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>Frequency</label>
              <select 
                value={scheduleConfig.frequency} 
                onChange={e => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>Email Recipients (comma separated)</label>
              <input 
                type="text" 
                value={scheduleConfig.email} 
                onChange={e => setScheduleConfig({ ...scheduleConfig, email: e.target.value })}
                placeholder="admin@vypar.com"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn--secondary" onClick={() => setScheduleModal(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSaveSchedule}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
