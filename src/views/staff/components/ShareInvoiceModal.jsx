import React, { useState } from 'react';
import { X, MessageSquare, Send, Smartphone, Check, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareInvoiceModal({ invoice, customer, business, onClose }) {
  const [phone, setPhone] = useState(
    customer?.phone || invoice?.phone || invoice?.customerPhone || ''
  );
  const [customNote, setCustomNote] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'api-wa' | 'sms' | null

  if (!invoice) return null;

  const invoiceNumber = invoice.invoiceNumber || invoice.id || invoice._id || 'N/A';
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const balanceDue = Number(invoice.balanceDue ?? (totalAmount - paidAmount));
  const customerName = customer?.name || invoice.customerName || 'Valued Customer';
  const bizName = business?.name || business?.businessName || 'Vyapar Merchant';

  // Build the message preview
  const generateMessageText = () => {
    let text = `🧾 *INVOICE: #${invoiceNumber}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏢 *Shop:* ${bizName}\n`;
    text += `👤 *Customer:* ${customerName}\n`;
    text += `💰 *Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n`;
    text += `💳 *Paid:* ₹${paidAmount.toLocaleString('en-IN')}\n`;
    text += `⚠️ *Balance Due:* ₹${balanceDue.toLocaleString('en-IN')}\n`;

    if (customNote.trim()) {
      text += `\n📝 *Note:* ${customNote.trim()}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Thank you for your business! 🙏`;
    return text;
  };

  const cleanPhone = (raw) => {
    let p = String(raw || '').replace(/[^\d+]/g, '');
    if (p.startsWith('+')) p = p.slice(1);
    if (p.length === 10) p = `91${p}`;
    return p;
  };

  // 1. One-Click Direct WhatsApp (Web/App)
  const handleDirectWhatsApp = () => {
    if (!phone.trim()) {
      toast.error('Please enter a recipient phone number');
      return;
    }
    const targetPhone = cleanPhone(phone);
    const text = generateMessageText();
    const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.success('Opened WhatsApp with invoice details!');
    onClose();
  };

  // 2. Automated WhatsApp via Backend (Meta Cloud API / Twilio)
  const handleAutomatedWhatsApp = async () => {
    if (!phone.trim()) {
      toast.error('Please enter a recipient phone number');
      return;
    }
    setLoadingAction('api-wa');
    try {
      const res = await fetch('/api/notifications/whatsapp/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice._id || invoice.id,
          invoice,
          phone: cleanPhone(phone),
          customNote: customNote.trim()
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.result?.dryrun) {
          toast.success('Dry-run WhatsApp simulated! (API keys not set, link prepared)');
          if (data.deepLink) {
            window.open(data.deepLink, '_blank');
          }
        } else {
          toast.success('WhatsApp invoice dispatched successfully!');
        }
        onClose();
      } else {
        toast.error(data.message || 'Failed to send WhatsApp message');
      }
    } catch (err) {
      toast.error('Network error communicating with WhatsApp service');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Automated SMS via Backend (Fast2SMS / Twilio)
  const handleSendSMS = async () => {
    if (!phone.trim()) {
      toast.error('Please enter a recipient phone number');
      return;
    }
    setLoadingAction('sms');
    try {
      const res = await fetch('/api/notifications/sms/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice._id || invoice.id,
          invoice,
          phone: cleanPhone(phone)
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.result?.dryrun) {
          toast.success('Dry-run SMS logged in backend audit');
        } else {
          toast.success('SMS Invoice dispatched successfully!');
        }
        onClose();
      } else {
        toast.error(data.message || 'Failed to send SMS');
      }
    } catch (err) {
      toast.error('Network error communicating with SMS service');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, background: 'rgba(0,0,0,0.65)' }}>
      <div className="card" style={{ maxWidth: '480px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#25D366' }}>💬</span> Share Invoice #{invoiceNumber}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
              Send real-time digital bill & payment link to customer
            </p>
          </div>
          <button onClick={onClose} className="btn--icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Customer & Phone info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
              Recipient Phone Number (WhatsApp / SMS)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                +91
              </span>
              <input
                type="tel"
                className="input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}
              />
            </div>
            {customerName && (
              <span style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>
                Customer: <strong>{customerName}</strong>
              </span>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
              Optional Note / Reminder Note
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Please clear the balance by Friday"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
            />
          </div>

          {/* Message Preview Box */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
              Message Preview
            </label>
            <pre style={{
              background: 'var(--bg-input, #f3f4f6)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--text-1)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '140px',
              overflowY: 'auto',
              fontFamily: 'monospace'
            }}>
              {generateMessageText()}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          
          {/* 1. Direct WhatsApp */}
          <button
            onClick={handleDirectWhatsApp}
            className="btn"
            style={{
              background: '#25D366',
              color: '#ffffff',
              borderColor: 'transparent',
              fontWeight: 600,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare style={{ width: 16, height: 16 }} />
            Open in WhatsApp (One-Click Web/App)
            <ExternalLink style={{ width: 14, height: 14, marginLeft: 'auto' }} />
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* 2. Automated WhatsApp Cloud API */}
            <button
              onClick={handleAutomatedWhatsApp}
              disabled={loadingAction !== null}
              className="btn btn--primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '10px 8px'
              }}
            >
              {loadingAction === 'api-wa' ? (
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send style={{ width: 14, height: 14 }} />
              )}
              WhatsApp API
            </button>

            {/* 3. Fast2SMS / Twilio SMS */}
            <button
              onClick={handleSendSMS}
              disabled={loadingAction !== null}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '10px 8px'
              }}
            >
              {loadingAction === 'sms' ? (
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Smartphone style={{ width: 14, height: 14 }} />
              )}
              Send SMS
            </button>
          </div>

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
