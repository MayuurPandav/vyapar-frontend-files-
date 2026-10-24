import React, { useState } from 'react';
import { X, Phone, PhoneCall, ShieldCheck, Loader2, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CallCustomerModal({ customerName, customerPhone, orderId, invoiceNumber, amountDue, agentPhone, onClose }) {
  const [callerPhone, setCallerPhone] = useState(agentPhone || '9322372105');
  const [targetPhone, setTargetPhone] = useState(customerPhone || '');
  const [loading, setLoading] = useState(false);
  const [callState, setCallState] = useState(null); // 'initiated' | 'reminder_sent' | null

  const handleStartMaskedCall = async () => {
    if (!targetPhone.trim()) {
      toast.error('Customer phone number is required');
      return;
    }
    setLoading(true);
    setCallState(null);
    try {
      const res = await fetch('/api/notifications/voice/call-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgent: callerPhone.trim(),
          toCustomer: targetPhone.trim(),
          agentName: 'Vyapar Delivery Staff',
          customerName: customerName || 'Valued Customer',
          orderId
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setCallState('initiated');
        toast.success(data.message || 'Masked call initiated! Please answer your phone.');
      } else {
        toast.error(data.message || 'Failed to initiate masked call');
      }
    } catch (err) {
      toast.error('Network error initiating call');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceReminder = async () => {
    if (!targetPhone.trim()) {
      toast.error('Customer phone number is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/voice/reminder-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone.trim(),
          customerName: customerName || 'Customer',
          amount: amountDue || '500',
          invoiceNumber
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setCallState('reminder_sent');
        toast.success('Automated voice reminder dispatched to customer!');
      } else {
        toast.error(data.message || 'Failed to dispatch voice reminder');
      }
    } catch (err) {
      toast.error('Network error sending voice reminder');
    } finally {
      setLoading(false);
    }
  };

  const cleanPhoneForDial = (p) => {
    const digits = String(p || '').replace(/[^\d+]/g, '');
    return digits.startsWith('+') ? digits : `+91${digits.replace(/^0+/, '')}`;
  };

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1250, background: 'rgba(0,0,0,0.65)' }}>
      <div className="card" style={{ maxWidth: '460px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#2563eb' }}>📞</span> Call {customerName || 'Customer'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
              Twilio Cloud Voice Bridge & Masked Calling
            </p>
          </div>
          <button onClick={onClose} className="btn--icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Masking Privacy Badge */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <ShieldCheck style={{ width: 22, height: 22, color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.4' }}>
            <strong>Number Masking Active:</strong> Your personal phone number stays private. The customer will only see your shop's verified business number.
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
              Customer's Phone Number
            </label>
            <input
              type="tel"
              className="input"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="10-digit mobile number"
              style={{ width: '100%', padding: '9px 12px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
              Your Phone Number (Twilio calls you first, then patches to customer)
            </label>
            <input
              type="tel"
              className="input"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              placeholder="Your phone number"
              style={{ width: '100%', padding: '9px 12px', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Call Progress Status Notification */}
        {callState === 'initiated' && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <PhoneCall style={{ width: 20, height: 20, color: '#2563eb', animation: 'bounce 1s infinite' }} />
            <div style={{ fontSize: '12px', color: '#1e40af' }}>
              <strong>Call In Progress:</strong> Your phone (+{callerPhone}) will ring now. Answer it and you will be connected to {customerName || 'customer'}!
            </div>
          </div>
        )}

        {callState === 'reminder_sent' && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 style={{ width: 20, height: 20, color: '#16a34a' }} />
            <div style={{ fontSize: '12px', color: '#15803d' }}>
              <strong>Voice Call Dispatched:</strong> Automated voice announcement has been scheduled to customer.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* 1. Masked Twilio Voice Bridge */}
          <button
            onClick={handleStartMaskedCall}
            disabled={loading}
            className="btn btn--primary"
            style={{
              padding: '12px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
            ) : (
              <PhoneCall style={{ width: 16, height: 16 }} />
            )}
            Start Masked Call (Private Bridge)
          </button>

          {/* 2. Direct Mobile Phone Dialer Fallback */}
          <a
            href={`tel:${cleanPhoneForDial(targetPhone)}`}
            className="btn"
            style={{
              padding: '10px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none',
              background: 'var(--bg-input, #f1f5f9)',
              color: 'var(--text-1)'
            }}
          >
            <Phone style={{ width: 14, height: 14 }} />
            Direct Call (Phone Dialer)
          </a>

          {/* 3. Automated Voice Reminder (if balance/amount exists) */}
          {(amountDue || invoiceNumber) && (
            <button
              onClick={handleVoiceReminder}
              disabled={loading}
              className="btn"
              style={{
                padding: '10px',
                fontWeight: 600,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#fef3c7',
                color: '#92400e',
                borderColor: '#fde68a'
              }}
            >
              <Volume2 style={{ width: 14, height: 14 }} />
              Send Automated IVR Voice Reminder
            </button>
          )}

          <button
            onClick={onClose}
            className="btn"
            style={{ marginTop: '4px', justifyContent: 'center' }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
