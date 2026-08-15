import React, { useState, useRef, useEffect } from 'react'

export default function DeliveryHistory({ 
  deliveries, 
  setDeliveries, 
  setSelectedDeliveryId, 
  setActiveTab, 
  apiBase, 
  requestJson, 
  triggerToast, 
  addNotification, 
  t,
  statusFilter: propStatusFilter,
  setStatusFilter: propSetStatusFilter
}) {
  // Date, Time, and Status filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  const [localStatusFilter, setLocalStatusFilter] = useState('All')
  const statusFilter = propSetStatusFilter ? propStatusFilter : localStatusFilter
  const setStatusFilter = propSetStatusFilter ? propSetStatusFilter : setLocalStatusFilter

  // Local Modal States for viewing Details inline
  const [viewingDelivery, setViewingDelivery] = useState(null)
  
  // Failed reason states for modal
  const [showModalFailForm, setShowModalFailForm] = useState(false)
  const [modalFailedReason, setModalFailedReason] = useState('Customer not available')
  const [modalCustomFailedReason, setModalCustomFailedReason] = useState('')

  // Reschedule states for modal
  const [showModalRescheduleForm, setShowModalRescheduleForm] = useState(false)
  const [modalRescheduleDate, setModalRescheduleDate] = useState('')
  const [modalRescheduleSlot, setModalRescheduleSlot] = useState('9 AM - 11 AM')

  const [modalTipAmount, setModalTipAmount] = useState('')

  const [showModalOtpForm, setShowModalOtpForm] = useState(false)
  const [modalEnteredOtp, setModalEnteredOtp] = useState(['', '', '', '', '', ''])

  const handleModalOtpChange = (index, val) => {
    const cleanVal = val.replace(/[^0-9]/g, '')
    const newOtp = [...modalEnteredOtp]
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : ''
    setModalEnteredOtp(newOtp)
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-modal-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleModalOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !modalEnteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-modal-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleModalOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    const newOtp = [...modalEnteredOtp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ''
    }
    setModalEnteredOtp(newOtp)
    const nextFocusIndex = Math.min(pasted.length, 5)
    const nextInput = document.getElementById(`otp-modal-${nextFocusIndex}`)
    if (nextInput) nextInput.focus()
  }

  useEffect(() => {
    setModalEnteredOtp(['', '', '', '', '', ''])
    setShowModalOtpForm(false)
    setShowModalFailForm(false)
    setShowModalRescheduleForm(false)
    setModalTipAmount('')
  }, [viewingDelivery])

  // Time Clock Picker States
  const [activeTimePicker, setActiveTimePicker] = useState(null) // 'start' | 'end' | null
  const [tempHour, setTempHour] = useState(12)
  const [tempMinute, setTempMinute] = useState(0)
  const [tempPeriod, setTempPeriod] = useState('AM')
  const [pickerMode, setPickerMode] = useState('hours') // 'hours' | 'minutes'

  const parseTimeToPicker = (timeStr) => {
    if (!timeStr) {
      setTempHour(12)
      setTempMinute(0)
      setTempPeriod('AM')
      return
    }
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      let h = parseInt(parts[0])
      let m = parseInt(parts[1])
      if (isNaN(h)) h = 12
      if (isNaN(m)) m = 0
      
      let period = 'AM'
      if (h >= 12) {
        period = 'PM'
        if (h > 12) h -= 12
      } else if (h === 0) {
        h = 12
      }
      setTempHour(h)
      setTempMinute(m)
      setTempPeriod(period)
    }
  }

  const saveTimePicker = () => {
    let h = tempHour
    if (tempPeriod === 'PM') {
      if (h !== 12) h += 12
    } else {
      if (h === 12) h = 0
    }
    const formattedHour = String(h).padStart(2, '0')
    const formattedMinute = String(tempMinute).padStart(2, '0')
    const timeVal = `${formattedHour}:${formattedMinute}`
    
    if (activeTimePicker === 'start') {
      setStartTime(timeVal)
    } else if (activeTimePicker === 'end') {
      setEndTime(timeVal)
    }
    setActiveTimePicker(null)
  }

  const getHandRotation = () => {
    if (pickerMode === 'hours') {
      const index = tempHour === 12 ? 0 : tempHour
      return index * 30 - 90
    } else {
      return (tempMinute / 60) * 360 - 90
    }
  }

  const modalFileInputRef = useRef(null)

  // Status Updater inside Modal
  const handleModalStatusUpdate = async (status, extraBody = {}) => {
    if (!viewingDelivery) return
    try {
      const payload = { status, ...extraBody }
      if (status === 'Delivered') {
        payload.tip = parseFloat(modalTipAmount) || 0
      }
      const res = await requestJson(`${apiBase}/deliveries/${viewingDelivery._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // Update parent deliveries state so changes propagate everywhere immediately!
      setDeliveries(prev => prev.map(d => d._id === viewingDelivery._id ? res : d))
      
      // Update local modal state so the popup updates instantly!
      setViewingDelivery(res)
      
      triggerToast(`Status updated successfully: ${status}`)
      setModalTipAmount('')
      
      if (status === 'Delivered') {
        addNotification("Delivery Completed", `Order ${res.orderId} was successfully delivered!`, "success")
      }
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  // Photo Uploader inside Modal
  const handleModalProofUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !viewingDelivery) return

    const formData = new FormData()
    formData.append('proofPhoto', file)

    try {
      const res = await fetch(`${apiBase}/deliveries/${viewingDelivery._id}/proof`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('driverToken')}` },
        body: formData
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Upload failed")

      // Update parent state
      setDeliveries(prev => prev.map(d => d._id === viewingDelivery._id ? data : d))
      
      // Update local modal state
      setViewingDelivery(data)
      
      triggerToast("Proof photo uploaded successfully")
      addNotification("Signature Captured", `Delivery proof uploaded for order ${data.orderId}`, "success")
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  // Filter deliveries based on their status and date-time parameters
  const pastDeliveries = deliveries.filter(d => 
    ['Delivered', 'Failed', 'Rescheduled'].includes(d.status)
  )

  const filteredDeliveries = pastDeliveries.filter((d) => {
    // Status Filter match
    if (statusFilter !== 'All' && d.status !== statusFilter) return false

    // Parse order date (defaulting to createdAt or today if missing)
    const orderDateObj = d.createdAt ? new Date(d.createdAt) : new Date()
    
    // Format order date to YYYY-MM-DD for matching
    const orderDateStr = orderDateObj.toISOString().split('T')[0]
    
    // Parse order hours/minutes in HH:MM format
    const orderTimeStr = orderDateObj.toTimeString().split(' ')[0].substring(0, 5) // "HH:MM"

    // 1. Date Range matching
    if (startDate && orderDateStr < startDate) return false
    if (endDate && orderDateStr > endDate) return false

    // 2. Time Range matching
    if (startTime && orderTimeStr < startTime) return false
    if (endTime && orderTimeStr > endTime) return false

    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return '#10b981'
      case 'Failed': return '#ef4444'
      case 'Rescheduled': return '#f59e0b'
      default: return 'var(--text-color)'
    }
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setStartTime('')
    setEndTime('')
    setStatusFilter('All')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-header">
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{t('deliveryHistory')}</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
          Review and audit your past processed delivery orders.
        </p>
      </div>

      {/* Dynamic Date & Time Range filter inputs */}
      <section className="filters-container" aria-label="Order Filters">
        <div className="filter-group">
          <label htmlFor="startDateInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue)' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Start Date
          </label>
          <input 
            id="startDateInput"
            type="date" 
            className="filter-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="endDateInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue)' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            End Date
          </label>
          <input 
            id="endDateInput"
            type="date" 
            className="filter-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="startTimeInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--amber)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Start Time
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <input 
              id="startTimeInput"
              type="text" 
              placeholder="Pick time..."
              className="filter-input"
              value={startTime}
              readOnly
              onClick={() => {
                setActiveTimePicker('start')
                setPickerMode('hours')
                parseTimeToPicker(startTime)
              }}
              style={{ cursor: 'pointer', paddingRight: '36px', width: '100%' }}
            />
            <svg 
              viewBox="0 0 24 24" 
              width="16" 
              height="16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              onClick={() => {
                setActiveTimePicker('start')
                setPickerMode('hours')
                parseTimeToPicker(startTime)
              }}
              style={{ position: 'absolute', right: '12px', color: 'var(--muted)', cursor: 'pointer', pointerEvents: 'auto' }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="endTimeInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--amber)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            End Time
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <input 
              id="endTimeInput"
              type="text" 
              placeholder="Pick time..."
              className="filter-input"
              value={endTime}
              readOnly
              onClick={() => {
                setActiveTimePicker('end')
                setPickerMode('hours')
                parseTimeToPicker(endTime)
              }}
              style={{ cursor: 'pointer', paddingRight: '36px', width: '100%' }}
            />
            <svg 
              viewBox="0 0 24 24" 
              width="16" 
              height="16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              onClick={() => {
                setActiveTimePicker('end')
                setPickerMode('hours')
                parseTimeToPicker(endTime)
              }}
              style={{ position: 'absolute', right: '12px', color: 'var(--muted)', cursor: 'pointer', pointerEvents: 'auto' }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="statusFilterSelect" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--teal)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
            Status Bar Filter
          </label>
          <select 
            id="statusFilterSelect"
            className="filter-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontWeight: 700, color: statusFilter === 'All' ? 'var(--text-color)' : getStatusColor(statusFilter) }}
          >
            <option value="All" style={{ color: 'var(--text-color)', fontWeight: 700 }}>All Statuses</option>
            <option value="Delivered" style={{ color: '#10b981', fontWeight: 700 }}>✅ Delivered</option>
            <option value="Failed" style={{ color: '#ef4444', fontWeight: 700 }}>❌ Failed</option>
            <option value="Rescheduled" style={{ color: '#f59e0b', fontWeight: 700 }}>🕒 Rescheduled</option>
          </select>
        </div>

        <button 
          className="filter-clear-btn"
          onClick={handleClearFilters}
          style={{ height: '38px', minWidth: '120px' }}
          type="button"
        >
          Reset Filters
        </button>
      </section>

      {/* Past Deliveries Ledger Table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>{t('orderId')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>{t('customer')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>{t('address')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>{t('paymentType')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>{t('amount')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>{t('status')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Proof Photo</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    No matching past deliveries found.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const dateStr = delivery.createdAt 
                    ? new Date(delivery.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A'
                  const timeStr = delivery.createdAt
                    ? new Date(delivery.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : ''

                  return (
                    <tr 
                      key={delivery._id} 
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{delivery.orderId}</td>
                      <td style={{ padding: '12px 16px' }}>{dateStr} <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{timeStr}</span></td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{delivery.customerName}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{delivery.deliveryAddress}</td>
                      <td style={{ padding: '12px 16px' }}>{delivery.paymentType}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>Rs. {delivery.billAmount}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: getStatusColor(delivery.status) }}>
                        {delivery.status}
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        {delivery.proofPhotoUrl ? (
                          <a 
                            href={delivery.proofPhotoUrl.startsWith('http') ? delivery.proofPhotoUrl : `${apiBase.replace('/api', '')}${delivery.proofPhotoUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ display: 'inline-block' }}
                            title="Click to view full image"
                          >
                            <img 
                              src={delivery.proofPhotoUrl.startsWith('http') ? delivery.proofPhotoUrl : `${apiBase.replace('/api', '')}${delivery.proofPhotoUrl}`} 
                              alt="Proof Thumbnail" 
                              style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'block', cursor: 'zoom-in' }} 
                            />
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>No Photo</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <button
                          onClick={() => {
                            setViewingDelivery(delivery)
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-bg)',
                            color: 'var(--primary-color)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--primary-color)'
                            e.currentTarget.style.color = '#ffffff'
                            e.currentTarget.style.borderColor = 'var(--primary-color)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--card-bg)'
                            e.currentTarget.style.color = 'var(--primary-color)'
                            e.currentTarget.style.borderColor = 'var(--border-color)'
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                          type="button"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Interactive Details Modal served inside Delivery History page */}
      {viewingDelivery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--card-bg-hover)'
            }}>
              <strong style={{ fontSize: '16px', color: 'var(--text-color)' }}>Order details: {viewingDelivery.orderId}</strong>
              <button 
                onClick={() => {
                  setViewingDelivery(null)
                  setShowModalFailForm(false)
                  setShowModalRescheduleForm(false)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
                type="button"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Customer Specs */}
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-color)' }}>{viewingDelivery.customerName}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                  📞 {viewingDelivery.customerPhone} • 🕒 {viewingDelivery.deliveryTimeSlot}
                </p>
              </div>

              {/* Address and Items */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Address</span>
                  <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, lineHeight: '1.4', color: 'var(--text-color)' }}>{viewingDelivery.deliveryAddress}</p>
                </div>
                <div style={{ padding: '12px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Items</span>
                  <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, lineHeight: '1.4', color: 'var(--text-color)' }}>{viewingDelivery.items.join(', ')}</p>
                </div>
              </div>

              {/* Bill Details & Current Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '10px 14px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>Total Bill</span>
                  <strong style={{ fontSize: '15px', color: 'var(--text-color)' }}>Rs. {viewingDelivery.billAmount} ({viewingDelivery.paymentType})</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>Current Status</span>
                  <strong style={{ fontSize: '14px', color: viewingDelivery.status === 'Delivered' ? '#10b981' : viewingDelivery.status === 'Failed' ? '#ef4444' : '#f59e0b' }}>
                    {viewingDelivery.status}
                  </strong>
                </div>
              </div>

              {/* failure reason box */}
              {viewingDelivery.status === 'Failed' && viewingDelivery.failedReason && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1.5px solid #ef4444' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>⚠️ Reason of Delivery Failure</span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-color)' }}>{viewingDelivery.failedReason}</p>
                </div>
              )}

              {/* rescheduled box */}
              {viewingDelivery.status === 'Rescheduled' && viewingDelivery.rescheduleSlot && (
                <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1.5px solid #f59e0b' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '4px' }}>📅 Rescheduled Parameters</span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-color)', lineHeight: '1.4' }}>
                    Date: {viewingDelivery.rescheduleDate ? new Date(viewingDelivery.rescheduleDate).toLocaleDateString() : 'Next Day'} <br />
                    Time Slot: {viewingDelivery.rescheduleSlot}
                  </p>
                </div>
              )}



              {/* Interactive Photo Upload and Display Box */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Delivery Proof Photo
                </span>

                {/* Upload Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={modalFileInputRef}
                    onChange={handleModalProofUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    onClick={() => modalFileInputRef.current.click()}
                    style={{ 
                      width: '100%', 
                      minHeight: '36px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-color)', 
                      background: 'var(--body-bg)', 
                      color: 'var(--text-color)', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px'
                    }}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {viewingDelivery.proofPhotoUrl ? "Change Proof / Photo" : "Upload Delivered Product Photo"}
                  </button>

                  {/* Thumbnail / Large Preview */}
                  {viewingDelivery.proofPhotoUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <a 
                        href={viewingDelivery.proofPhotoUrl.startsWith('http') ? viewingDelivery.proofPhotoUrl : `${apiBase.replace('/api', '')}${viewingDelivery.proofPhotoUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'block' }}
                      >
                        <img 
                          src={viewingDelivery.proofPhotoUrl.startsWith('http') ? viewingDelivery.proofPhotoUrl : `${apiBase.replace('/api', '')}${viewingDelivery.proofPhotoUrl}`} 
                          alt="Proof Large Preview" 
                          style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '6px', border: '1px solid var(--border-color)', objectFit: 'contain', cursor: 'zoom-in' }}
                        />
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', fontStyle: 'italic' }}>
                      No delivery proof photo captured yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Status Update Controllers inside modal */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Change Order Status Options
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 8px 0', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    💰 Tip Received (Rs.):
                  </span>
                  <input 
                    type="number" 
                    placeholder="Enter tip (optional)" 
                    value={modalTipAmount}
                    onChange={(e) => setModalTipAmount(e.target.value)}
                    style={{ flex: 1, minHeight: '34px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600, fontSize: '13px' }}
                    min="0"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {/* Button: Out for Delivery */}
                  <button 
                    onClick={() => handleModalStatusUpdate('Out for delivery')}
                    style={{ 
                      minHeight: '36px', 
                      borderRadius: '6px', 
                      background: viewingDelivery.status === 'Out for delivery' ? '#f59e0b' : 'rgba(245, 158, 11, 0.12)', 
                      color: viewingDelivery.status === 'Out for delivery' ? 'white' : '#f59e0b', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      border: viewingDelivery.status === 'Out for delivery' ? 'none' : '1px solid rgba(245, 158, 11, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    🚚 Out for Delivery
                  </button>

                  {/* Button: Delivered */}
                  <button 
                    onClick={() => {
                      if (viewingDelivery.otp) {
                        setShowModalOtpForm(true)
                        setShowModalFailForm(false)
                        setShowModalRescheduleForm(false)
                      } else {
                        handleModalStatusUpdate('Delivered')
                      }
                    }}
                    style={{ 
                      minHeight: '36px', 
                      borderRadius: '6px', 
                      background: viewingDelivery.status === 'Delivered' ? '#10b981' : 'rgba(16, 185, 129, 0.12)', 
                      color: viewingDelivery.status === 'Delivered' ? 'white' : '#10b981', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      border: viewingDelivery.status === 'Delivered' ? 'none' : '1px solid rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    ✅ Delivered
                  </button>

                  {/* Button: Failed */}
                  <button 
                    onClick={() => {
                      setShowModalFailForm(true)
                      setShowModalRescheduleForm(false)
                    }}
                    style={{ 
                      minHeight: '36px', 
                      borderRadius: '6px', 
                      background: viewingDelivery.status === 'Failed' ? '#ef4444' : 'rgba(239, 68, 68, 0.12)', 
                      color: viewingDelivery.status === 'Failed' ? 'white' : '#ef4444', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      border: viewingDelivery.status === 'Failed' ? 'none' : '1px solid rgba(239, 68, 68, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    ❌ Failed
                  </button>

                  {/* Button: Rescheduled */}
                  <button 
                    onClick={() => {
                      setShowModalRescheduleForm(true)
                      setShowModalFailForm(false)
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      const tomorrowStr = tomorrow.toISOString().slice(0, 10)
                      if (!modalRescheduleDate) {
                        setModalRescheduleDate(tomorrowStr)
                      }
                    }}
                    style={{ 
                      minHeight: '36px', 
                      borderRadius: '6px', 
                      background: viewingDelivery.status === 'Rescheduled' ? '#6366f1' : 'rgba(99, 102, 241, 0.12)', 
                      color: viewingDelivery.status === 'Rescheduled' ? 'white' : '#6366f1', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      border: viewingDelivery.status === 'Rescheduled' ? 'none' : '1px solid rgba(99, 102, 241, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    🕒 Reschedule
                  </button>
                </div>

                {/* Inline Failure Form */}
                {showModalFailForm && (
                  <div style={{ background: 'var(--card-bg-hover)', border: '1.5px solid #ef4444', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444' }}>Reason for Failure</span>
                    <select 
                      value={modalFailedReason}
                      onChange={(e) => setModalFailedReason(e.target.value)}
                      style={{ width: '100%', minHeight: '34px', padding: '0 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                    >
                      <option value="Customer not available">Customer not available</option>
                      <option value="Customer refused order">Customer refused order</option>
                      <option value="Wrong address">Wrong address</option>
                      <option value="Payment not ready">Payment not ready</option>
                      <option value="Damaged item">Damaged item</option>
                      <option value="Other">Other (Specify below)</option>
                    </select>

                    {modalFailedReason === 'Other' && (
                      <input 
                        type="text"
                        placeholder="Specify reason..."
                        value={modalCustomFailedReason}
                        onChange={(e) => setModalCustomFailedReason(e.target.value)}
                        style={{ width: '100%', minHeight: '34px', padding: '0 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                        required
                      />
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => {
                          const finalReason = modalFailedReason === 'Other' ? modalCustomFailedReason.trim() : modalFailedReason
                          if (!finalReason) {
                            triggerToast("Please select or type a reason", "error")
                            return
                          }
                          handleModalStatusUpdate('Failed', { failedReason: finalReason })
                          setShowModalFailForm(false)
                        }}
                        style={{ flex: 1, minHeight: '32px', borderRadius: '4px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                        type="button"
                      >
                        Confirm Failure
                      </button>
                      <button 
                        onClick={() => setShowModalFailForm(false)}
                        style={{ flex: 1, minHeight: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Reschedule Form */}
                {showModalRescheduleForm && (
                  <div style={{ background: 'var(--card-bg-hover)', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>Select parameters</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>Select Date</label>
                      <input 
                        type="date"
                        value={modalRescheduleDate}
                        onChange={(e) => setModalRescheduleDate(e.target.value)}
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                        style={{ width: '100%', minHeight: '34px', padding: '0 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600, cursor: 'pointer' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>Select Time Slot</label>
                      <select 
                        value={modalRescheduleSlot}
                        onChange={(e) => setModalRescheduleSlot(e.target.value)}
                        style={{ width: '100%', minHeight: '34px', padding: '0 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                      >
                        <option value="9 AM - 11 AM">9 AM - 11 AM</option>
                        <option value="11 AM - 1 PM">11 AM - 1 PM</option>
                        <option value="1 PM - 3 PM">1 PM - 3 PM</option>
                        <option value="3 PM - 5 PM">3 PM - 5 PM</option>
                        <option value="5 PM - 7 PM">5 PM - 7 PM</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => {
                          if (!modalRescheduleDate) {
                            triggerToast("Please select a date", "error")
                            return
                          }
                          handleModalStatusUpdate('Rescheduled', { rescheduleDate: modalRescheduleDate, rescheduleSlot: modalRescheduleSlot })
                          setShowModalRescheduleForm(false)
                        }}
                        style={{ flex: 1, minHeight: '32px', borderRadius: '4px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                        type="button"
                      >
                        Confirm Reschedule
                      </button>
                      <button 
                        onClick={() => setShowModalRescheduleForm(false)}
                        style={{ flex: 1, minHeight: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline OTP Verification Form */}
                {showModalOtpForm && (
                  <div style={{ background: 'var(--card-bg-hover)', border: '1.5px solid var(--green)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔑 Customer Verification OTP Required
                    </span>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                      Request the 6-digit code from the customer and enter it below:
                    </p>
                    
                    <div 
                      onPaste={handleModalOtpPaste}
                      style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '6px 0' }}
                    >
                      {modalEnteredOtp.map((val, index) => (
                        <input
                          key={index}
                          id={`otp-modal-${index}`}
                          type="text"
                          maxLength="1"
                          value={val}
                          onChange={(e) => handleModalOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleModalOtpKeyDown(index, e)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border-color)',
                            background: 'var(--body-bg)',
                            color: 'var(--text-color)',
                            fontWeight: '800',
                            fontSize: '16px',
                            textAlign: 'center',
                            transition: 'border-color 0.2s',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--green)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => {
                          const otpStr = modalEnteredOtp.join('')
                          if (otpStr.length !== 6) {
                            triggerToast("Please enter a valid 6-digit OTP", "error")
                            return
                          }
                          handleModalStatusUpdate('Delivered', { otp: otpStr })
                          setShowModalOtpForm(false)
                        }}
                        style={{ flex: 1, minHeight: '32px', borderRadius: '4px', border: 'none', background: 'var(--green)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                        type="button"
                      >
                        Verify & Complete ✅
                      </button>
                      <button 
                        onClick={() => {
                          setShowModalOtpForm(false)
                          setModalEnteredOtp(['', '', '', '', '', ''])
                        }}
                        style={{ flex: 1, minHeight: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--card-bg-hover)'
            }}>
              <button 
                onClick={() => {
                  setViewingDelivery(null)
                  setShowModalFailForm(false)
                  setShowModalRescheduleForm(false)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--body-bg)',
                  color: 'var(--text-color)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                type="button"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ⏰ Premium Custom Graphical Circular Clock Face Picker Modal */}
      {activeTimePicker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            width: '300px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            color: 'var(--text-color)'
          }}>
            {/* Header / Active Picker Label */}
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--teal)', letterSpacing: '1px' }}>
              🕒 Set {activeTimePicker === 'start' ? 'Start' : 'End'} Time
            </span>

            {/* Time Display Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '32px', fontWeight: 800 }}>
              {/* Hour button */}
              <button
                onClick={() => setPickerMode('hours')}
                type="button"
                style={{
                  border: 'none',
                  background: pickerMode === 'hours' ? 'rgba(37,99,235,0.1)' : 'transparent',
                  color: pickerMode === 'hours' ? 'var(--primary-color)' : 'var(--text-color)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '32px'
                }}
              >
                {String(tempHour).padStart(2, '0')}
              </button>

              <span>:</span>

              {/* Minute button */}
              <button
                onClick={() => setPickerMode('minutes')}
                type="button"
                style={{
                  border: 'none',
                  background: pickerMode === 'minutes' ? 'rgba(37,99,235,0.1)' : 'transparent',
                  color: pickerMode === 'minutes' ? 'var(--primary-color)' : 'var(--text-color)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '32px'
                }}
              >
                {String(tempMinute).padStart(2, '0')}
              </button>

              {/* AM/PM toggle button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' }}>
                <button
                  onClick={() => setTempPeriod('AM')}
                  type="button"
                  style={{
                    border: 'none',
                    background: tempPeriod === 'AM' ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)',
                    color: tempPeriod === 'AM' ? 'white' : 'var(--muted)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  AM
                </button>
                <button
                  onClick={() => setTempPeriod('PM')}
                  type="button"
                  style={{
                    border: 'none',
                    background: tempPeriod === 'PM' ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)',
                    color: tempPeriod === 'PM' ? 'white' : 'var(--muted)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Circular Dial Dial Face */}
            <div style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'var(--card-bg-hover)',
              border: '1px solid var(--border-color)',
              position: 'relative',
              userSelect: 'none'
            }}>
              {/* Dial center pin */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--primary-color)',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }} />

              {/* Dial rotation indicator hand line */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '74px',
                height: '2px',
                background: 'var(--primary-color)',
                transformOrigin: '0% 50%',
                transform: `translate(0%, -50%) rotate(${getHandRotation()}deg)`,
                pointerEvents: 'none',
                zIndex: 2
              }}>
                {/* Hand end dot */}
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary-color)',
                  opacity: 0.25
                }} />
              </div>

              {/* Dynamic Dial Dial Numbers */}
              {pickerMode === 'hours' ? (
                // Hours 1 to 12
                [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                  const angle = (i * 30 - 90) * Math.PI / 180
                  const x = 110 + Math.cos(angle) * 76
                  const y = 110 + Math.sin(angle) * 76
                  const isSelected = tempHour === h
                  return (
                    <button
                      key={`hour-${h}`}
                      onClick={() => {
                        setTempHour(h)
                        // Transition automatically to minute selection for smooth flow
                        setPickerMode('minutes')
                      }}
                      type="button"
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                        border: 'none',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--primary-color)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-color)',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 5,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {h}
                    </button>
                  )
                })
              ) : (
                // Minutes in steps of 5: 00 to 55
                [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m, i) => {
                  const angle = (i * 30 - 90) * Math.PI / 180
                  const x = 110 + Math.cos(angle) * 76
                  const y = 110 + Math.sin(angle) * 76
                  const isSelected = tempMinute === m
                  return (
                    <button
                      key={`minute-${m}`}
                      onClick={() => setTempMinute(m)}
                      type="button"
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                        border: 'none',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--primary-color)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-color)',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 5,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  )
                })
              )}
            </div>

            {/* Actions panel */}
            <div style={{ display: 'flex', width: '100%', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => setActiveTimePicker(null)}
                type="button"
                style={{
                  flex: 1,
                  minHeight: '36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--body-bg)',
                  color: 'var(--text-color)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveTimePicker}
                type="button"
                style={{
                  flex: 1,
                  minHeight: '36px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-color)',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
