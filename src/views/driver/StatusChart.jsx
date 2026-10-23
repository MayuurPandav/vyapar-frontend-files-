import React, { useEffect, useRef } from 'react'

export default function StatusChart({ deliveries, t }) {
  const canvasRef = useRef(null)

  const completed = deliveries.filter(d => d.status === 'Delivered').length
  const failed = deliveries.filter(d => d.status === 'Failed').length
  const rescheduled = deliveries.filter(d => d.status === 'Rescheduled').length
  const pending = deliveries.filter(d => ['Assigned', 'Out for delivery'].includes(d.status)).length
  const total = deliveries.length

  const rate = total ? Math.round((completed / total) * 100) : 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    const chartTotal = total || 1

    const data = [
      { value: completed, color: '#16805b' },
      { value: pending, color: '#b86b00' },
      { value: failed, color: '#c23a3a' },
      { value: rescheduled, color: '#2563eb' }
    ]

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 80
    const strokeWidth = 26

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.lineWidth = strokeWidth
    context.lineCap = 'butt' // Crisp flat caps for sharp circle segment edges!

    let start = -Math.PI / 2
    data.forEach((segment) => {
      const slice = (segment.value / chartTotal) * Math.PI * 2
      if (segment.value <= 0) return

      context.beginPath()
      context.strokeStyle = segment.color
      context.arc(centerX, centerY, radius, start, start + slice)
      context.stroke()

      start += slice
    })

    if (total === 0) {
      context.beginPath()
      context.strokeStyle = '#d9e0e7'
      context.arc(centerX, centerY, radius, 0, Math.PI * 2)
      context.stroke()
    }
  }, [deliveries, completed, failed, rescheduled, pending, total])

  return (
    <article className="panel progress-panel" style={{ minHeight: '330px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: '1', minWidth: '280px' }}>
      <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: 0 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0, fontSize: '11px', color: 'var(--teal)', fontWeight: 800, textTransform: 'uppercase' }}>{t('performance') || 'Performance'}</p>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800 }}>{t('todaysProgress') || "Today's Progress"}</h2>
        </div>
        <span id="completionRate" className="rate-badge" style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
          {rate}%
        </span>
      </div>

      <div className="chart-wrap" style={{ position: 'relative', width: '200px', height: '200px', margin: '16px auto' }}>
        <canvas ref={canvasRef} width="200" height="200" aria-label="Delivery status chart"></canvas>
        <div className="chart-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <strong id="chartCenter" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{completed}</strong>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>{t('done') || 'done'}</span>
        </div>
      </div>

      <div className="legend" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', margin: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="legend-dot completed-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#16805b' }}></i>
          <span>{t('delivered') || 'Delivered'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="legend-dot pending-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#b86b00' }}></i>
          <span>{t('pending') || 'Pending'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="legend-dot failed-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#c23a3a' }}></i>
          <span>{t('failed') || 'Failed'}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="legend-dot rescheduled-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></i>
          <span>{t('rescheduled') || 'Rescheduled'}</span>
        </span>
      </div>
    </article>
  )
}
