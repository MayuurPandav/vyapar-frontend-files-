import React, { useState } from 'react'

export default function NewOrder({ requestJson, apiBase, triggerToast, addNotification, loadDeliveries, setActiveTab, t }) {
  const [loading, setLoading] = useState(false)

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    setLoading(true)

    const itemsStr = e.target.items.value.trim()
    const itemsList = itemsStr ? itemsStr.split(',').map(it => it.trim()).filter(Boolean) : ['Store Order']

    const payload = {
      customerName: e.target.customerName.value.trim(),
      customerPhone: e.target.customerPhone.value.trim(),
      deliveryAddress: e.target.deliveryAddress.value.trim(),
      items: itemsList,
      billAmount: parseFloat(e.target.billAmount.value) || 0,
      paymentType: e.target.paymentType.value,
      deliveryTimeSlot: e.target.timeSlot.value
    }

    try {
      const res = await requestJson(`${apiBase}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      triggerToast("New order created successfully!")
      addNotification("Order Assigned", `New delivery order ${res.orderId} was added and assigned to you!`, "info")
      
      // Clear form
      e.target.reset()
      
      // Reload active orders
      await loadDeliveries()
      
      // Redirect back to Management tab so the driver can see and select the new order!
      setActiveTab('management')
    } catch (err) {
      triggerToast(err.message || "Could not add delivery", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{t('quickAddOrder')}</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
          Directly create and assign a new logistics order to your active assignments ledger.
        </p>
      </div>

      <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {t('customerName')} <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <input 
              name="customerName" 
              type="text" 
              placeholder="Rahul Joshi" 
              required
              style={{ minHeight: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
            />
          </label>

          <label style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {t('customerPhone')} <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <input 
              name="customerPhone" 
              type="text" 
              placeholder="9876543210" 
              required
              style={{ minHeight: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            {t('deliveryAddress')} <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input 
            name="deliveryAddress" 
            type="text" 
            placeholder="e.g. MG Road, Indiranagar, Bengaluru, Karnataka" 
            required
            style={{ minHeight: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            {t('itemsSeparated')} <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input 
            name="items" 
            type="text" 
            placeholder="e.g. Running shoes x1, Socks pack x1" 
            required
            style={{ minHeight: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
          />
        </label>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {t('billAmount')} <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <input 
              name="billAmount" 
              type="number" 
              min="0"
              step="1"
              placeholder="1499" 
              required
              style={{ minHeight: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 700 }}
            />
          </label>

          <label style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {t('paymentType')}
            </span>
            <select 
              name="paymentType"
              style={{ minHeight: '38px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
            >
              <option value="COD">COD</option>
              <option value="Prepaid">Prepaid</option>
            </select>
          </label>

          <label style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {t('timeSlot')}
            </span>
            <select 
              name="timeSlot"
              style={{ minHeight: '38px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--body-bg)', color: 'var(--text-color)', fontWeight: 600 }}
            >
              <option value="9 AM - 11 AM">9 AM - 11 AM</option>
              <option value="11 AM - 1 PM">11 AM - 1 PM</option>
              <option value="1 PM - 3 PM">1 PM - 3 PM</option>
              <option value="3 PM - 5 PM">3 PM - 5 PM</option>
              <option value="5 PM - 7 PM">5 PM - 7 PM</option>
            </select>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', minHeight: '40px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', marginTop: '8px' }}
        >
          {loading ? "Creating Order..." : t('createDelivery')}
        </button>
      </form>
    </div>
  )
}
