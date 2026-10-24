import React, { useState } from 'react';
import { X, QrCode, CreditCard, Banknote, CheckCircle2, Copy, ExternalLink, Loader2 } from 'lucide-react';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

export default function CollectPaymentModal({ invoice, business, onPaymentSuccess, onClose }) {
  const [activeMethod, setActiveMethod] = useState('upi'); // 'upi' | 'razorpay' | 'cash'
  const [cashTendered, setCashTendered] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (!invoice) return null;

  const invoiceId = invoice.invoiceNumber || invoice.id || invoice._id || 'INV';
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const balanceDue = Math.max(0, Number(invoice.balanceDue ?? (totalAmount - paidAmount)));
  const bizName = business?.name || business?.businessName || 'Vyapar Merchant';
  const vpa = business?.upiId || 'vyapar@upi';

  // Build standard Dynamic UPI Intent string
  const upiIntentString = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(bizName)}&am=${balanceDue.toFixed(2)}&tr=${encodeURIComponent(invoiceId)}&tn=${encodeURIComponent(`Bill #${invoiceId}`)}&cu=INR`;

  const origin = window.location.origin;
  const paymentLink = `${origin}/pay/${encodeURIComponent(invoiceId)}`;

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success('Public payment link copied to clipboard!');
  };

  const copyUpiString = () => {
    navigator.clipboard.writeText(upiIntentString);
    toast.success('UPI payment string copied!');
  };

  // 1. Confirm Manual / UPI Settlement
  const handleConfirmManualPayment = async (mode, ref) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice._id || invoice.id || invoiceId,
          amount: balanceDue,
          paymentMode: mode,
          referenceNo: ref || `REF-${Date.now().toString().slice(-6)}`,
          payerInfo: invoice.customerName || 'Customer'
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        toast.success(`Payment of ₹${balanceDue.toLocaleString()} recorded via ${mode}!`);
        if (onPaymentSuccess) onPaymentSuccess(data);
        onClose();
      } else {
        toast.error(data.message || 'Failed to record payment');
      }
    } catch (err) {
      toast.error('Network error confirming payment');
    } finally {
      setLoading(false);
    }
  };

  // 2. Razorpay Online Gateway Checkout
  const handleRazorpayCheckout = async () => {
    setLoading(true);
    try {
      // Load script
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      // Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: balanceDue,
          invoiceId
        })
      });
      const orderData = await orderRes.json();
      if (orderData.status !== 'ok' || !orderData.order) {
        throw new Error(orderData.message || 'Could not initiate Razorpay order');
      }

      const order = orderData.order;

      const options = {
        key: order.keyId || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: bizName,
        description: `Payment for Invoice #${invoiceId}`,
        order_id: order.id,
        prefill: {
          name: invoice.customerName || '',
          contact: invoice.customerPhone || invoice.phone || '',
          email: invoice.customerEmail || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                invoiceId: invoice._id || invoice.id || invoiceId,
                amount: balanceDue
              })
            });
            const vData = await verifyRes.json();
            if (vData.status === 'ok') {
              toast.success('Payment verified and settled successfully!');
              if (onPaymentSuccess) onPaymentSuccess(vData);
              onClose();
            } else {
              toast.error(vData.message || 'Signature verification failed');
            }
          } catch (vErr) {
            toast.error('Error confirming payment with server');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Failed to start Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  const cashNum = Number(cashTendered || 0);
  const changeDue = Math.max(0, cashNum - balanceDue);

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1250, background: 'rgba(0,0,0,0.65)' }}>
      <div className="card" style={{ maxWidth: '480px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💳</span> Collect Payment
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
              Invoice #{invoiceId} • Balance: <strong style={{ color: '#ef4444' }}>₹{balanceDue.toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn--icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Payment Method Switcher Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setActiveMethod('upi')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeMethod === 'upi' ? '#ffffff' : 'transparent',
              color: activeMethod === 'upi' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: activeMethod === 'upi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <QrCode style={{ width: 15, height: 15, color: '#16a34a' }} /> Dynamic UPI QR
          </button>
          
          <button
            type="button"
            onClick={() => setActiveMethod('razorpay')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeMethod === 'razorpay' ? '#ffffff' : 'transparent',
              color: activeMethod === 'razorpay' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: activeMethod === 'razorpay' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <CreditCard style={{ width: 15, height: 15, color: '#2563eb' }} /> Razorpay Online
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('cash')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeMethod === 'cash' ? '#ffffff' : 'transparent',
              color: activeMethod === 'cash' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: activeMethod === 'cash' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Banknote style={{ width: 15, height: 15, color: '#d97706' }} /> Cash / POS
          </button>
        </div>

        {/* METHOD 1: Dynamic UPI QR Code */}
        {activeMethod === 'upi' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}>
              <QRCode value={upiIntentString} size={180} />
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                onClick={copyPaymentLink}
                className="btn"
                style={{ flex: 1, fontSize: '12px', justifyContent: 'center', gap: '6px' }}
              >
                <Copy style={{ width: 14, height: 14 }} /> Copy Payment Link
              </button>
              <button
                type="button"
                onClick={copyUpiString}
                className="btn"
                style={{ flex: 1, fontSize: '12px', justifyContent: 'center', gap: '6px' }}
              >
                <Copy style={{ width: 14, height: 14 }} /> Copy UPI String
              </button>
            </div>

            {/* Quick manual UTR confirmation */}
            <div style={{ width: '100%', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                Customer already paid? Enter UPI UTR / Reference No to confirm:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 429381928391"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                />
                <button
                  type="button"
                  onClick={() => handleConfirmManualPayment('UPI App', utrNumber || `UPI-${Date.now().toString().slice(-6)}`)}
                  disabled={loading}
                  className="btn btn--primary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  Confirm Paid
                </button>
              </div>
            </div>
          </div>
        )}

        {/* METHOD 2: Razorpay Online Checkout */}
        {activeMethod === 'razorpay' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '13px',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              <strong>Instant Payment Gateway:</strong> Accept credit cards, debit cards, net banking, UPI, and wallets directly with auto-reconciliation.
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-2)' }}>Amount to Charge:</span>
                <strong>₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-2)' }}>Customer:</span>
                <span>{invoice.customerName || 'Valued Customer'}</span>
              </div>
            </div>

            <button
              onClick={handleRazorpayCheckout}
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
                <CreditCard style={{ width: 16, height: 16 }} />
              )}
              Launch Razorpay Checkout
            </button>
          </div>
        )}

        {/* METHOD 3: Cash / Counter POS */}
        {activeMethod === 'cash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                Cash Tendered by Customer (₹)
              </label>
              <input
                type="number"
                className="input"
                placeholder={String(balanceDue)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                style={{ width: '100%', fontSize: '16px', fontWeight: 700, padding: '10px 12px' }}
              />
            </div>

            {cashNum > 0 && (
              <div style={{
                padding: '12px 16px',
                background: changeDue > 0 ? '#f0fdf4' : 'var(--bg-input)',
                border: `1px solid ${changeDue > 0 ? '#bbf7d0' : 'var(--border)'}`,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>Change to Return:</span>
                <strong style={{ fontSize: '18px', color: changeDue > 0 ? '#16a34a' : 'var(--text-1)' }}>
                  ₹{changeDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}

            <button
              onClick={() => handleConfirmManualPayment('Cash', `CASH-${Date.now().toString().slice(-6)}`)}
              disabled={loading || (cashNum > 0 && cashNum < balanceDue)}
              className="btn"
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
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
                <CheckCircle2 style={{ width: 16, height: 16 }} />
              )}
              Confirm Cash Settle (₹{balanceDue.toLocaleString()})
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn"
          style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
        >
          Close
        </button>

      </div>
    </div>
  );
}
