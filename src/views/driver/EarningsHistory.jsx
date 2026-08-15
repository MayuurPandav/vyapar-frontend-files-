import React from 'react'

export default function EarningsHistory({ deliveries, baseCommission, t }) {
  const completedDeliveries = deliveries.filter(d => d.status === 'Delivered')
  
  // Group earnings by date
  const earningsByDate = completedDeliveries.reduce((acc, curr) => {
    const dateObj = curr.createdAt ? new Date(curr.createdAt) : new Date()
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        completedCount: 0,
        commissionEarned: 0,
        codCollected: 0,
        tipsEarned: 0
      }
    }

    acc[dateStr].completedCount += 1
    acc[dateStr].commissionEarned += baseCommission
    acc[dateStr].tipsEarned += curr.tip || 0
    if (curr.paymentType === 'COD' && curr.paymentCollected) {
      acc[dateStr].codCollected += curr.amountCollected || curr.billAmount
    }

    return acc
  }, {})

  const earningsList = Object.values(earningsByDate).sort((a, b) => new Date(b.date) - new Date(a.date))

  // Total accumulators
  const totalCompleted = completedDeliveries.length
  const totalCommissions = totalCompleted * baseCommission
  const totalTips = completedDeliveries.reduce((sum, curr) => sum + (curr.tip || 0), 0)
  const totalCodCollected = completedDeliveries.reduce((sum, curr) => {
    if (curr.paymentType === 'COD' && curr.paymentCollected) {
      return sum + (curr.amountCollected || curr.billAmount)
    }
    return sum
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-header">
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{t('earnHistory')}</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
          Detailed ledger of your earned driver commissions, tips collected, and cash COD deposits.
        </p>
      </div>

      {/* Analytics mini summary row */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }} aria-label="Earnings Summary">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
          <p className="stat-label">Commissions Earned</p>
          <h3 className="stat-value" style={{ color: 'var(--primary-color)' }}>Rs. {totalCommissions}</h3>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{totalCompleted} Completed orders</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--teal)' }}>
          <p className="stat-label">Tips Received</p>
          <h3 className="stat-value" style={{ color: 'var(--teal)' }}>Rs. {totalTips}</h3>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>100% kept by you!</span>
        </div>
        
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <p className="stat-label">Cash (COD) Collected</p>
          <h3 className="stat-value" style={{ color: '#10b981' }}>Rs. {totalCodCollected}</h3>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>To be deposited at hub</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <p className="stat-label">Base Payout Rate</p>
          <h3 className="stat-value" style={{ color: '#f59e0b' }}>Rs. {baseCommission}</h3>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Per completed delivery</span>
        </div>
      </section>

      {/* Grouped Payouts Ledger table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg-hover)' }}>
          <strong style={{ fontSize: '14px' }}>Daily Payouts Log</strong>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Completed Deliveries</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Base Commission</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Commissions Earned</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Tips Received</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Cash (COD) Collected</th>
              </tr>
            </thead>
            <tbody>
              {earningsList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    No completed earnings transactions logged yet.
                  </td>
                </tr>
              ) : (
                earningsList.map((row) => (
                  <tr 
                    key={row.date} 
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.date}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.completedCount}</td>
                    <td style={{ padding: '12px 16px' }}>Rs. {baseCommission}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary-color)' }}>Rs. {row.commissionEarned}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--teal)' }}>Rs. {row.tipsEarned || 0}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>Rs. {row.codCollected}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
