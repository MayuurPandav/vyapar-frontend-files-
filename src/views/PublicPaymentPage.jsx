import React, { useEffect, useState } from 'react';

export default function PublicPaymentPage({ invoiceId: propInvoiceId }) {
  // Extract invoice ID from prop or window URL
  const [invoiceId, setInvoiceId] = useState(propInvoiceId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // UTR / Manual Confirmation state
  const [referenceNo, setReferenceNo] = useState('');
  const [payerInfo, setPayerInfo] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let resolvedId = propInvoiceId;
    if (!resolvedId) {
      const path = window.location.pathname;
      if (path.startsWith('/pay/')) {
        resolvedId = decodeURIComponent(path.replace('/pay/', ''));
      } else {
        const params = new URLSearchParams(window.location.search);
        resolvedId = params.get('pay') || '';
      }
    }
    setInvoiceId(resolvedId);
  }, [propInvoiceId]);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoicePaymentDetails(invoiceId);
    }
  }, [invoiceId]);

  const fetchInvoicePaymentDetails = async (id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/payments/public/${encodeURIComponent(id)}`);
      const result = await res.json();
      if (!res.ok || result.status !== 'ok') {
        throw new Error(result.message || 'Invoice details could not be loaded');
      }
      setData(result);
      if (result.invoice?.status === 'Paid' || result.invoice?.dueAmount <= 0) {
        setPaymentSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async () => {
    try {
      setConfirming(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay Payment Gateway SDK failed to load. Please check your connection.');
        setConfirming(false);
        return;
      }

      const invoiceDisplayId = data?.invoice?.id || invoiceId;
      const dueAmt = data?.invoice?.dueAmount || data?.invoice?.totalAmount;

      // 1. Create order or use existing
      let rzpOrder = data?.payment?.razorpayOrder;
      if (!rzpOrder || !rzpOrder.id) {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: dueAmt, invoiceId: invoiceDisplayId })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok || orderData.status !== 'ok') {
          throw new Error(orderData.message || 'Failed to initialize gateway order');
        }
        rzpOrder = orderData.order;
      }

      // 2. Configure options
      const options = {
        key: rzpOrder.keyId || 'rzp_test_key',
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || 'INR',
        name: data?.merchant?.name || 'Vyapar Store',
        description: `Payment for Invoice #${invoiceDisplayId}`,
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            // Verify signature on server
            const verifyRes = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id || rzpOrder.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature || 'verified',
                invoiceId: data?.invoice?.rawId || data?.invoice?.id || invoiceId,
                amount: dueAmt,
                payerInfo: response.razorpay_payment_id
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.status === 'ok') {
              setPaymentSuccess(true);
              fetchInvoicePaymentDetails(invoiceId);
            } else {
              alert(verifyData.message || 'Payment signature verification failed.');
            }
          } catch (vErr) {
            alert(`Verification error: ${vErr.message}`);
          } finally {
            setConfirming(false);
          }
        },
        prefill: {
          name: data?.invoice?.customer || '',
          contact: data?.invoice?.customerPhone || ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (resp) {
        alert(`Payment failed: ${resp.error.description || 'Transaction cancelled'}`);
        setConfirming(false);
      });
      paymentObject.open();
    } catch (err) {
      alert(`Razorpay checkout error: ${err.message}`);
      setConfirming(false);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!referenceNo.trim()) {
      alert('Please enter your 12-digit UPI UTR or Bank Transaction Reference Number');
      return;
    }

    try {
      setConfirming(true);
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: data?.invoice?.rawId || data?.invoice?.id || invoiceId,
          amount: data?.invoice?.dueAmount || data?.invoice?.totalAmount,
          paymentMode: 'UPI / Online Transfer',
          referenceNo: referenceNo.trim(),
          payerInfo: payerInfo.trim()
        })
      });

      const result = await res.json();
      if (!res.ok || result.status !== 'ok') {
        throw new Error(result.message || 'Verification could not be processed');
      }

      setPaymentSuccess(true);
      // Refresh details
      fetchInvoicePaymentDetails(invoiceId);
    } catch (err) {
      alert(`Payment confirmation error: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        color: '#334155',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #cbd5e1',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', fontWeight: 600, fontSize: '16px' }}>
          Loading Secure Payment Gateway...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#fee2e2',
            color: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px'
          }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Invoice Not Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            {error || `The invoice #${invoiceId} could not be located or may have been removed.`}
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              background: '#2563eb',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Go to Merchant Home
          </a>
        </div>
      </div>
    );
  }

  const { invoice, merchant, payment } = data;
  const isPaid = paymentSuccess || invoice.status === 'Paid' || invoice.dueAmount <= 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '32px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a'
    }}>
      {/* Header bar */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
          }}>
            <i className="fas fa-shield-halved"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                {merchant.name || 'Vyapar Merchant'}
              </span>
              <span style={{
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #a7f3d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-check-circle"></i> Verified Merchant
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Vyapar Smart Pay &bull; End-to-End Encrypted UPI Gateway
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <i className={copiedLink ? "fas fa-check text-emerald-600" : "fas fa-share-nodes"}></i>
            {copiedLink ? 'Link Copied!' : 'Share'}
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <i className="fas fa-print"></i> Print Receipt
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Column: Invoice Details & Items */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)'
        }}>
          {/* Invoice Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '16px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#64748b',
                letterSpacing: '0.5px'
              }}>
                Invoice Summary
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                #{invoice.id}
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Issued: {invoice.date || 'Today'}
                {invoice.dueDate && ` &bull; Due: ${invoice.dueDate}`}
              </p>
            </div>
            <div>
              <span style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isPaid ? '#ecfdf5' : '#fef3c7',
                color: isPaid ? '#059669' : '#d97706',
                border: `1px solid ${isPaid ? '#a7f3d0' : '#fde68a'}`
              }}>
                <i className={isPaid ? "fas fa-check-circle" : "fas fa-clock"}></i>
                {isPaid ? 'PAID & SETTLED' : 'PAYMENT DUE'}
              </span>
            </div>
          </div>

          {/* Customer / Billed To */}
          <div style={{
            padding: '16px 0',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
                Billed To
              </span>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                {invoice.customer || 'Walk-in Customer'}
              </p>
              {invoice.customerPhone && (
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                  <i className="fas fa-phone" style={{ marginRight: '6px' }}></i>
                  {invoice.customerPhone}
                </p>
              )}
            </div>
            {merchant.phone && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
                  Merchant Support
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                  <i className="fas fa-headset" style={{ marginRight: '6px', color: '#2563eb' }}></i>
                  {merchant.phone}
                </p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              Items & Services
            </span>
            {invoice.items && invoice.items.length > 0 ? (
              <div style={{ marginTop: '10px' }}>
                {invoice.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx === invoice.items.length - 1 ? 'none' : '1px dashed #f1f5f9'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                        {item.name || item.productName || `Item #${idx + 1}`}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Qty: {item.quantity || item.qty || 1} &times; ₹{Number(item.price || item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {item.gstRate ? ` (${item.gstRate}% GST)` : ''}
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      ₹{Number(item.total || (item.quantity * item.price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0 0' }}>
                Total services and products included in invoice.
              </p>
            )}
          </div>

          {/* Pricing Calculation Summary */}
          <div style={{ padding: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
              <span>Total Invoice Amount</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                ₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {invoice.paymentReceived > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#059669' }}>
                <span>Paid Previously</span>
                <span style={{ fontWeight: 600 }}>
                  - ₹{Number(invoice.paymentReceived).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '12px',
              marginTop: '4px',
              borderTop: '2px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Balance Due
              </span>
              <span style={{
                fontSize: '24px',
                fontWeight: 900,
                color: isPaid ? '#059669' : '#2563eb',
                letterSpacing: '-0.5px'
              }}>
                ₹{Number(isPaid ? 0 : invoice.dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic UPI Payment & Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isPaid ? (
            /* Paid Success State */
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '2px solid #a7f3d0',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                background: '#dcfce7',
                color: '#16a34a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }}>
                <i className="fas fa-check"></i>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Payment Complete!
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                This invoice has been successfully paid and reconciled in Vyapar. A confirmation has been registered for merchant <b>{merchant.name}</b>.
              </p>

              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Invoice ID:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>#{invoice.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Amount Settled:</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>
                    ₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Settlement Mode:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Instant UPI / Digital</span>
                </div>
              </div>

              <button
                onClick={handlePrint}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                <i className="fas fa-file-invoice" style={{ marginRight: '8px' }}></i>
                Download Official Tax Receipt
              </button>
            </div>
          ) : (
            /* Unpaid: Active UPI Card */
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#2563eb',
                  letterSpacing: '1px'
                }}>
                  Instant UPI Checkout
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                  Scan & Pay via any UPI App
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Google Pay &bull; PhonePe &bull; Paytm &bull; BHIM &bull; CRED
                </p>
              </div>

              {/* Dynamic QR Display */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'inline-block'
                }}>
                  <img
                    src={payment.qrCodeUrl}
                    alt="UPI Payment QR Code"
                    style={{
                      width: '220px',
                      height: '220px',
                      display: 'block',
                      borderRadius: '8px'
                    }}
                  />
                </div>

                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Merchant VPA:</span>
                  <p style={{
                    margin: '2px 0 0',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    background: '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {merchant.upiId || 'mayurpandav128@okhdfcbank'}
                  </p>
                </div>
              </div>

              {/* Mobile Intent Button */}
              <div style={{ marginTop: '16px' }}>
                <a
                  href={payment.upiString}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    textAlign: 'center'
                  }}
                >
                  <i className="fas fa-mobile-screen"></i>
                  Pay ₹{Number(invoice.dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} on Phone / UPI App
                </a>
              </div>

              {/* Manual Confirmation / UTR Entry */}
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Already transferred? Confirm your payment:
                </p>
                <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <input
                      type="text"
                      placeholder="12-digit UTR / Bank Reference No."
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name or Phone (optional)"
                      value={payerInfo}
                      onChange={(e) => setPayerInfo(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={confirming}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: confirming ? 'not-allowed' : 'pointer',
                      opacity: confirming ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {confirming ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Verifying with Merchant Ledger...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-double"></i> Submit UTR & Verify Receipt
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Secure Trust Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: '#64748b',
            fontSize: '12px',
            padding: '8px'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-lock" style={{ color: '#10b981' }}></i> 256-Bit SSL
            </span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-building-columns"></i> NPCI & UPI Compatible
            </span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-shield"></i> RBI Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
