import React, { useState, useRef, useEffect } from 'react'

export default function Dashboard({
  deliveries,
  setDeliveries,
  selectedDeliveryId,
  setSelectedDeliveryId,
  baseCommission,
  requestJson,
  apiBase,
  triggerToast,
  addNotification,
  loadProfile,
  loadDeliveries,
  t
}) {
  const [codAmount, setCodAmount] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [showFailForm, setShowFailForm] = useState(false)
  const [failedReason, setFailedReason] = useState('Customer not available')
  const [customFailedReason, setCustomFailedReason] = useState('')

  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlot, setRescheduleSlot] = useState('9 AM - 11 AM')

  const [showOtpForm, setShowOtpForm] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', ''])
  const [codPaymentMethod, setCodPaymentMethod] = useState('cash')

  const fileInputRef = useRef(null)

  const selectedDelivery = deliveries.find(d => d._id === selectedDeliveryId)
  const driverStatusStr = selectedDelivery ? (selectedDelivery.status || '').toLowerCase() : '';
  const isDriverAssigned = driverStatusStr === 'assigned';
  const isDriverTransit = ['out for delivery', 'out_for_delivery', 'out of delivery'].includes(driverStatusStr);
  const isDriverTerminal = ['delivered', 'failed', 'rescheduled', 'returned', 'cancelled'].includes(driverStatusStr);

  // Reset local state when active order changes
  useEffect(() => {
    setShowFailForm(false)
    setShowRescheduleForm(false)
    setShowOtpForm(false)
    setCustomFailedReason('')
    setCodAmount('')
    setTipAmount('')
    setEnteredOtp(['', '', '', '', '', ''])
    setCodPaymentMethod('cash')
  }, [selectedDeliveryId])

  const handleOtpChange = (index, val) => {
    const cleanVal = val.replace(/[^0-9]/g, '')
    const newOtp = [...enteredOtp]
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : ''
    setEnteredOtp(newOtp)
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-dash-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-dash-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    const newOtp = [...enteredOtp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ''
    }
    setEnteredOtp(newOtp)
    const nextFocusIndex = Math.min(pasted.length, 5)
    const nextInput = document.getElementById(`otp-dash-${nextFocusIndex}`)
    if (nextInput) nextInput.focus()
  }

  // Status Translators
  const translateStatus = (status) => {
    switch (status) {
      case 'Assigned': return 'Assigned'
      case 'Out for delivery': return 'Out for Delivery'
      case 'Delivered': return 'Delivered'
      case 'Failed': return 'Failed'
      case 'Rescheduled': return 'Rescheduled'
      default: return status
    }
  }

  // Handle Order updates
  const handleStatusUpdate = async (status, extraBody = {}) => {
    if (!selectedDeliveryId) return
    try {
      const payload = { status, ...extraBody }
      if (status === 'Delivered') {
        payload.tip = parseFloat(tipAmount) || 0
      }
      const res = await requestJson(`${apiBase}/deliveries/${selectedDeliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // Update state
      setDeliveries(prev => prev.map(d => d._id === selectedDeliveryId ? res : d))
      triggerToast(`${t('statusUpdated')}: ${translateStatus(status)}`)
      setTipAmount('')
      
      // Trigger notifications on specific flows
      if (status === 'Delivered') {
        addNotification("Delivery Completed", `Order ${res.orderId} was successfully delivered to ${res.customerName}! Commission Earned: Rs. ${baseCommission}`, "success")
        await loadProfile()
      } else if (status === 'Failed') {
        addNotification("Delivery Failed", `Order ${res.orderId} failed: ${res.failedReason}`, "error")
      }
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  const handleCashCollection = async (e) => {
    e.preventDefault()
    if (!selectedDeliveryId) return
    const amount = parseFloat(codAmount)
    if (isNaN(amount) || amount <= 0) {
      triggerToast("Please enter a valid payment amount", "error")
      return
    }

    const tip = parseFloat(tipAmount) || 0

    try {
      const res = await requestJson(`${apiBase}/deliveries/${selectedDeliveryId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentCollected: true, amountCollected: amount, tip })
      })

      setDeliveries(prev => prev.map(d => d._id === selectedDeliveryId ? res : d))
      triggerToast(t('paymentUpdated'))
      setCodAmount('')
      setTipAmount('')
      addNotification("Payment Received", `Collected Rs. ${amount} for order ${res.orderId}`, "success")
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  const handleProofUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedDeliveryId) return

    const formData = new FormData()
    formData.append('proofPhoto', file)

    try {
      const res = await fetch(`${apiBase}/deliveries/${selectedDeliveryId}/proof`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('vyapar_token') || localStorage.getItem('driverToken')}` },
        body: formData
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Upload failed")

      setDeliveries(prev => prev.map(d => d._id === selectedDeliveryId ? data : d))
      triggerToast(t('proofUploaded'))
      addNotification("Signature Captured", `Delivery proof uploaded for order ${data.orderId}`, "success")
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  const handleInitiateReturn = async () => {
    if (!selectedDeliveryId) return
    try {
      const res = await requestJson(`${apiBase}/deliveries/${selectedDeliveryId}/return`, {
        method: 'POST'
      })
      setDeliveries(prev => prev.map(d => d._id === selectedDeliveryId ? res : d))
      triggerToast(t('returnInitiated'))
      addNotification("Return Logged", `Return logistics flow registered for order ${res.orderId}`, "info")
    } catch (err) {
      triggerToast(err.message, "error")
    }
  }

  if (!selectedDelivery) {
    return (
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '64px 24px', textAlign: 'center', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M12 21.7c3.6-4.7 7-8.3 7-12a7 7 0 1 0-14 0c0 3.7 3.4 7.3 7 12z"></path>
        </svg>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{t('selectDelivery')}</h3>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
          Please go to the **Management** tab, choose an assigned delivery order, and you will be directed here automatically!
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
      
      {/* Detail Shell Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-hover)' }}>
        <strong style={{ fontSize: '16px' }}>{t('deliveryDetails')}</strong>
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--muted)' }}>{selectedDelivery.orderId}</span>
      </div>

      {/* Spacious Full-width Google Maps Embed */}
      <div className="map-view-frame" style={{ width: '100%', height: '350px', background: 'var(--body-bg)', position: 'relative' }}>
        <iframe 
          title={t('mapLookupTitle')}
          width="100%" 
          height="100%" 
          style={{ border: 0 }}
          loading="lazy" 
          allowFullScreen 
          src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedDelivery.deliveryAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
        />
      </div>

      {/* Customer Specifications & Actions Grid */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Customer Specs Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>{selectedDelivery.customerName}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
              📞 {selectedDelivery.customerPhone} • 🕒 {selectedDelivery.deliveryTimeSlot}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('paymentType')}</span>
            <strong style={{ fontSize: '15px', color: 'var(--primary-color)' }}>{selectedDelivery.paymentType}</strong>
          </div>
        </div>

        {/* Address & Items details cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{t('address')}</span>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, lineHeight: '1.5' }}>{selectedDelivery.deliveryAddress}</p>
            </div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDelivery.deliveryAddress)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', background: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '12px', textDecoration: 'none', width: 'fit-content' }}
            >
              🗺️ Open Navigation in Google Maps
            </a>
          </div>

          <div style={{ padding: '16px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{t('items')}</span>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, lineHeight: '1.5' }}>
              {selectedDelivery.items.map(it => typeof it === 'string' ? it : `${it.name || 'Item'} x${it.qty || 1}`).join(', ')}
            </p>
          </div>
        </div>

        {/* Amount & Status info counters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', background: 'var(--card-bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>Bill Amount</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-color)' }}>Rs. {selectedDelivery.billAmount}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>COD Collected</span>
              <strong style={{ fontSize: '16px', color: selectedDelivery.paymentCollected ? '#10b981' : '#ef4444' }}>
                {selectedDelivery.paymentCollected ? `Rs. ${selectedDelivery.amountCollected || selectedDelivery.billAmount}` : "No"}
              </strong>
            </div>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textAlign: 'right' }}>Status</span>
            <strong style={{ fontSize: '15px', color: selectedDelivery.status === 'Out for delivery' ? '#f59e0b' : '#6366f1' }}>
              {translateStatus(selectedDelivery.status)}
            </strong>
          </div>
        </div>

        {/* Separate Box for Reason of Delivery Failure */}
        {selectedDelivery.status === 'Failed' && selectedDelivery.failedReason && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1.5px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠️ Reason of Delivery Failure</span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-color)' }}>{selectedDelivery.failedReason}</p>
          </div>
        )}

        {/* Separate Box for Rescheduled Parameters */}
        {selectedDelivery.status === 'Rescheduled' && selectedDelivery.rescheduleSlot && (
          <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1.5px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Rescheduled Parameters</span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-color)', lineHeight: '1.4' }}>
              <strong>Date:</strong> {selectedDelivery.rescheduleDate ? new Date(selectedDelivery.rescheduleDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Next Available'}<br />
              <strong>Time Slot:</strong> {selectedDelivery.rescheduleSlot}
            </p>
          </div>
        )}



        {/* Action Controls panel */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Permanent, Always-Accessible Status Controls Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--card-bg-hover)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Update / Change Status Options
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 8px 0', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                💰 Tip Received (Rs.):
              </span>
              <input 
                type="number" 
                placeholder="Enter tip (optional)" 
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                style={{ flex: 1, minHeight: '34px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600, fontSize: '13px' }}
                min="0"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '4px' }}>
              {/* Button: Out for Delivery */}
              {isDriverAssigned && (
                <button 
                  onClick={() => handleStatusUpdate('Out for delivery')}
                  style={{ 
                    minHeight: '38px', 
                    borderRadius: '6px', 
                    background: '#f59e0b', 
                    color: 'white', 
                    fontWeight: 800, 
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    border: 'none',
                    transition: 'all 0.2s',
                    gridColumn: 'span 3'
                  }}
                  type="button"
                >
                  🚚 Start Delivery (Out for Delivery)
                </button>
              )}

              {/* Buttons for Transit state */}
              {isDriverTransit && (
                <>
                  {/* Button: Delivered */}
                  <button 
                    onClick={() => {
                      if (selectedDelivery.otp) {
                        setShowOtpForm(true)
                        setShowFailForm(false)
                        setShowRescheduleForm(false)
                      } else {
                        handleStatusUpdate('Delivered')
                      }
                    }}
                    style={{ 
                      minHeight: '38px', 
                      borderRadius: '6px', 
                      background: 'rgba(16, 185, 129, 0.12)', 
                      color: '#10b981', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    ✅ Delivered
                  </button>

                  {/* Button: Failed */}
                  <button 
                    onClick={() => {
                      setShowFailForm(true)
                      setShowRescheduleForm(false)
                    }}
                    style={{ 
                      minHeight: '38px', 
                      borderRadius: '6px', 
                      background: 'rgba(239, 68, 68, 0.12)', 
                      color: '#ef4444', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    ❌ Failed
                  </button>

                  {/* Button: Rescheduled */}
                  <button 
                    onClick={() => {
                      setShowRescheduleForm(true)
                      setShowFailForm(false)
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      const tomorrowStr = tomorrow.toISOString().slice(0, 10)
                      if (!rescheduleDate) {
                        setRescheduleDate(tomorrowStr)
                      }
                    }}
                    style={{ 
                      minHeight: '38px', 
                      borderRadius: '6px', 
                      background: 'rgba(99, 102, 241, 0.12)', 
                      color: '#6366f1', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    type="button"
                  >
                    🕒 Reschedule
                  </button>
                </>
              )}

              {isDriverTerminal && (
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--muted)', textAlign: 'center', gridColumn: 'span 3', padding: '8px' }}>
                  🎉 Delivery status has been finalized.
                </span>
              )}
            </div>
          </div>

          {/* Custom Failed Reason Form Panel */}
          {showFailForm && (
            <div style={{ background: 'var(--card-bg-hover)', border: '1.5px solid #ef4444', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>Select Reason for Delivery Failure</span>
              <select 
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                style={{ width: '100%', minHeight: '38px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
              >
                <option value="Customer not available">Customer not available</option>
                <option value="Customer refused order">Customer refused order</option>
                <option value="Wrong address">Wrong address</option>
                <option value="Payment not ready">Payment not ready</option>
                <option value="Damaged item">Damaged item</option>
                <option value="Other">Other (Specify below)</option>
              </select>

              {failedReason === 'Other' && (
                <input 
                  type="text"
                  placeholder="Type custom failure reason here..."
                  value={customFailedReason}
                  onChange={(e) => setCustomFailedReason(e.target.value)}
                  style={{ width: '100%', minHeight: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  required
                />
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    const finalReason = failedReason === 'Other' ? customFailedReason.trim() : failedReason
                    if (!finalReason) {
                      triggerToast("Please enter or select a valid reason", "error")
                      return
                    }
                    handleStatusUpdate('Failed', { failedReason: finalReason })
                    setShowFailForm(false)
                  }}
                  style={{ flex: 1, minHeight: '36px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                  type="button"
                >
                  Confirm Failure ❌
                </button>
                <button 
                  onClick={() => setShowFailForm(false)}
                  style={{ flex: 1, minHeight: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Custom Reschedule Form Panel */}
          {showRescheduleForm && (
            <div style={{ background: 'var(--card-bg-hover)', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>Reschedule Order Parameters</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Select Date</label>
                <input 
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  style={{ width: '100%', minHeight: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600, cursor: 'pointer' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Select Time Slot</label>
                <select 
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  style={{ width: '100%', minHeight: '38px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                >
                  <option value="9 AM - 11 AM">9 AM - 11 AM</option>
                  <option value="11 AM - 1 PM">11 AM - 1 PM</option>
                  <option value="1 PM - 3 PM">1 PM - 3 PM</option>
                  <option value="3 PM - 5 PM">3 PM - 5 PM</option>
                  <option value="5 PM - 7 PM">5 PM - 7 PM</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    if (!rescheduleDate) {
                      triggerToast("Please select a date", "error")
                      return
                    }
                    handleStatusUpdate('Rescheduled', { rescheduleDate, rescheduleSlot })
                    setShowRescheduleForm(false)
                  }}
                  style={{ flex: 1, minHeight: '36px', borderRadius: '6px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                  type="button"
                >
                  Reschedule Order 🕒
                </button>
                <button 
                  onClick={() => setShowRescheduleForm(false)}
                  style={{ flex: 1, minHeight: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Customer OTP Verification Form Panel */}
          {showOtpForm && (
            <div style={{ background: 'var(--card-bg-hover)', border: '1.5px solid var(--green)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔑 Customer Verification OTP Required
              </span>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Please request the 6-digit verification code sent to the customer and enter it below to complete this delivery.
              </p>
              
              <div 
                onPaste={handleOtpPaste}
                style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '8px 0' }}
              >
                {enteredOtp.map((val, index) => (
                  <input
                    key={index}
                    id={`otp-dash-${index}`}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color)',
                      background: 'var(--body-bg)',
                      color: 'var(--text-color)',
                      fontWeight: '800',
                      fontSize: '18px',
                      textAlign: 'center',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--green)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    const otpStr = enteredOtp.join('')
                    if (otpStr.length !== 6) {
                      triggerToast("Please enter a valid 6-digit OTP", "error")
                      return
                    }
                    handleStatusUpdate('Delivered', { otp: otpStr })
                    setShowOtpForm(false)
                  }}
                  style={{ flex: 1, minHeight: '36px', borderRadius: '6px', border: 'none', background: 'var(--green)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                  type="button"
                >
                  Verify & Complete ✅
                </button>
                <button 
                  onClick={() => {
                    setShowOtpForm(false)
                    setEnteredOtp(['', '', '', '', '', ''])
                  }}
                  style={{ flex: 1, minHeight: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* COD Payment Section with Cash and UPI options */}
          {selectedDelivery.paymentType === 'COD' && !selectedDelivery.paymentCollected && (
            <div style={{ background: 'var(--card-bg-hover)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  💰 COD Payment Collection
                </span>
                {/* Custom Stylized Segmented Tab Selector */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--body-bg)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setCodPaymentMethod('cash')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: codPaymentMethod === 'cash' ? 'var(--card-bg)' : 'transparent',
                      color: codPaymentMethod === 'cash' ? 'var(--text-color)' : 'var(--muted)',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Pay Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodPaymentMethod('upi')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: codPaymentMethod === 'upi' ? 'var(--card-bg)' : 'transparent',
                      color: codPaymentMethod === 'upi' ? 'var(--text-color)' : 'var(--muted)',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    UPI / QR Code
                  </button>
                </div>
              </div>

              {codPaymentMethod === 'cash' ? (
                <form onSubmit={handleCashCollection} style={{ display: 'flex', gap: '8px', margin: 0 }}>
                  <input 
                    type="number" 
                    placeholder={`Collect Cash (Rs. ${selectedDelivery.billAmount})`}
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    required
                    style={{ flex: 1, minHeight: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
                  />
                  <button 
                    type="submit"
                    style={{ minHeight: '38px', padding: '0 16px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {t('collectCash')}
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                    Ask the customer to scan the QR Code below to pay <strong>Rs. {selectedDelivery.billAmount}</strong>.
                  </p>
                  
                  {/* Premium Styled QR Card */}
                  <div style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    {/* Visual QR Code SVG Mock */}
                    <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        {/* Background */}
                        <rect width="150" height="150" fill="white" rx="8" />
                        
                        {/* Position detection patterns (Outer boxes) */}
                        {/* Top-left */}
                        <rect x="10" y="10" width="35" height="35" fill="#1e293b" />
                        <rect x="15" y="15" width="25" height="25" fill="white" />
                        <rect x="20" y="20" width="15" height="15" fill="#6366f1" />
                        
                        {/* Top-right */}
                        <rect x="105" y="10" width="35" height="35" fill="#1e293b" />
                        <rect x="110" y="15" width="25" height="25" fill="white" />
                        <rect x="115" y="20" width="15" height="15" fill="#6366f1" />
                        
                        {/* Bottom-left */}
                        <rect x="10" y="105" width="35" height="35" fill="#1e293b" />
                        <rect x="15" y="110" width="25" height="25" fill="white" />
                        <rect x="20" y="115" width="15" height="15" fill="#6366f1" />

                        {/* Smaller alignment pattern */}
                        <rect x="105" y="105" width="15" height="15" fill="#1e293b" />
                        <rect x="110" y="110" width="5" height="5" fill="white" />

                        {/* QR Code Dots & Patterns */}
                        {/* Row 1 */}
                        <rect x="55" y="10" width="5" height="10" fill="#1e293b" />
                        <rect x="65" y="10" width="10" height="5" fill="#1e293b" />
                        <rect x="80" y="10" width="5" height="5" fill="#6366f1" />
                        <rect x="90" y="10" width="10" height="10" fill="#1e293b" />
                        
                        {/* Row 2 */}
                        <rect x="50" y="25" width="10" height="5" fill="#1e293b" />
                        <rect x="65" y="20" width="5" height="15" fill="#6366f1" />
                        <rect x="75" y="25" width="15" height="5" fill="#1e293b" />
                        <rect x="95" y="25" width="5" height="10" fill="#1e293b" />

                        {/* Row 3 */}
                        <rect x="10" y="55" width="10" height="5" fill="#1e293b" />
                        <rect x="25" y="50" width="5" height="15" fill="#6366f1" />
                        <rect x="35" y="55" width="15" height="5" fill="#1e293b" />
                        <rect x="55" y="50" width="10" height="10" fill="#1e293b" />
                        <rect x="70" y="55" width="5" height="5" fill="#1e293b" />
                        <rect x="80" y="50" width="15" height="5" fill="#6366f1" />
                        <rect x="100" y="55" width="15" height="10" fill="#1e293b" />
                        <rect x="120" y="50" width="5" height="5" fill="#1e293b" />
                        <rect x="130" y="55" width="10" height="10" fill="#6366f1" />

                        {/* Row 4 */}
                        <rect x="10" y="70" width="15" height="5" fill="#6366f1" />
                        <rect x="30" y="70" width="5" height="10" fill="#1e293b" />
                        <rect x="40" y="70" width="10" height="5" fill="#1e293b" />
                        <rect x="55" y="75" width="5" height="15" fill="#6366f1" />
                        <rect x="65" y="70" width="15" height="5" fill="#1e293b" />
                        <rect x="85" y="70" width="5" height="10" fill="#1e293b" />
                        <rect x="95" y="75" width="10" height="5" fill="#6366f1" />
                        <rect x="110" y="70" width="15" height="15" fill="#1e293b" />
                        <rect x="130" y="75" width="10" height="5" fill="#1e293b" />

                        {/* Row 5 */}
                        <rect x="50" y="95" width="15" height="5" fill="#1e293b" />
                        <rect x="70" y="90" width="10" height="10" fill="#6366f1" />
                        <rect x="85" y="95" width="5" height="5" fill="#1e293b" />
                        <rect x="95" y="90" width="5" height="15" fill="#1e293b" />
                        <rect x="125" y="95" width="15" height="5" fill="#6366f1" />

                        {/* Row 6 */}
                        <rect x="55" y="115" width="10" height="10" fill="#1e293b" />
                        <rect x="70" y="110" width="5" height="5" fill="#1e293b" />
                        <rect x="80" y="115" width="15" height="5" fill="#6366f1" />
                        <rect x="125" y="110" width="5" height="15" fill="#1e293b" />
                        <rect x="135" y="115" width="10" height="5" fill="#1e293b" />

                        {/* Row 7 */}
                        <rect x="50" y="130" width="15" height="5" fill="#6366f1" />
                        <rect x="70" y="135" width="10" height="5" fill="#1e293b" />
                        <rect x="85" y="130" width="5" height="10" fill="#1e293b" />
                        <rect x="95" y="130" width="15" height="5" fill="#1e293b" />
                        <rect x="115" y="135" width="10" height="5" fill="#6366f1" />
                        <rect x="130" y="130" width="10" height="10" fill="#1e293b" />
                      </svg>
                      {/* Subtly stylized UPI Logo in center */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        padding: '4px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#097939', letterSpacing: '-0.5px' }}>UPI</span>
                      </div>
                    </div>
                    {/* QR Details */}
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                      Rs. {selectedDelivery.billAmount}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Scan to Pay with any UPI App
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await requestJson(`${apiBase}/deliveries/${selectedDeliveryId}/payment`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              paymentCollected: true, 
                              amountCollected: selectedDelivery.billAmount, 
                              tip: parseFloat(tipAmount) || 0 
                            })
                          })
                          setDeliveries(prev => prev.map(d => d._id === selectedDeliveryId ? res : d))
                          triggerToast(t('paymentUpdated'))
                          addNotification("UPI Payment Confirmed", `Confirmed UPI transaction of Rs. ${selectedDelivery.billAmount} for order ${res.orderId}`, "success")
                        } catch (err) {
                          triggerToast(err.message, "error")
                        }
                      }}
                      style={{ flex: 1, minHeight: '38px', borderRadius: '8px', border: 'none', background: 'var(--green)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Confirm UPI Payment Verified ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proof Signature Image Upload */}
          {['out for delivery', 'out_for_delivery', 'out of delivery', 'delivered'].includes(driverStatusStr) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleProofUpload}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ width: '100%', minHeight: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {selectedDelivery.proofPhotoUrl ? "Modify Signature / Proof Photo" : t('uploadProof')}
              </button>
              {selectedDelivery.proofPhotoUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', background: 'var(--body-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ✓ Delivery Proof Photo Uploaded
                  </span>
                  <a 
                    href={selectedDelivery.proofPhotoUrl.startsWith('http') ? selectedDelivery.proofPhotoUrl : `${apiBase.replace('/api', '')}${selectedDelivery.proofPhotoUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    title="Click to view full size"
                  >
                    <img 
                      src={selectedDelivery.proofPhotoUrl.startsWith('http') ? selectedDelivery.proofPhotoUrl : `${apiBase.replace('/api', '')}${selectedDelivery.proofPhotoUrl}`} 
                      alt="Proof Preview" 
                      style={{ maxWidth: '100%', maxHeight: '110px', borderRadius: '6px', border: '1px solid var(--border-color)', objectFit: 'contain', cursor: 'zoom-in' }}
                    />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Initiate Return Order */}
          {driverStatusStr === 'failed' && !selectedDelivery.returnInitiated && (
            <button 
              onClick={handleInitiateReturn}
              style={{ width: '100%', minHeight: '40px', borderRadius: '8px', border: 'none', background: '#e11d48', color: 'white', fontWeight: 800, cursor: 'pointer' }}
            >
              {t('initiateReturn')}
            </button>
          )}

          {/* External Google maps directions url redirects */}
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedDelivery.deliveryAddress)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              width: '100%',
              minHeight: '38px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--body-bg)',
              color: 'var(--text-color)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            {t('openInMapPortal')}
          </a>

        </div>

      </div>
    </div>
  )
}
