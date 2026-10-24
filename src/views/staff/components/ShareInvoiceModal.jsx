import React, { useState } from 'react';
import { X, MessageSquare, Send, Smartphone, Mail, ExternalLink, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareInvoiceModal({ invoice, customer, business, onClose }) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [phone, setPhone] = useState(
    customer?.phone || invoice?.phone || invoice?.customerPhone || ''
  );
  const [email, setEmail] = useState(
    customer?.email || invoice?.customerEmail || invoice?.email || ''
  );
  const [customNote, setCustomNote] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'api-wa' | 'sms' | 'email' | null

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
          toast.success('Dry-run WhatsApp simulated! (Link prepared)');
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

  // 4. Send Transactional Email with PDF (SendGrid / SMTP)
  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter a valid recipient email address');
      return;
    }
    setLoadingAction('email');
    try {
      const res = await fetch('/api/notifications/email/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice._id || invoice.id,
          invoice,
          email: email.trim(),
          customNote: customNote.trim()
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Tax invoice with PDF emailed to ' + email.trim());
        onClose();
      } else {
        toast.error(data.message || 'Failed to send invoice email');
      }
    } catch (err) {
      toast.error('Network error communicating with Email service');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, background: 'rgba(0,0,0,0.65)' }}>
      <div className="card" style={{ maxWidth: '500px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📢</span> Share Invoice #{invoiceNumber}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
              Send real-time digital bill, payment link & PDF
            </p>
          </div>
          <button onClick={onClose} className="btn--icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'whatsapp' ? '#ffffff' : 'transparent',
              color: activeTab === 'whatsapp' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: activeTab === 'whatsapp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <MessageSquare style={{ width: 15, height: 15, color: '#25D366' }} /> WhatsApp & SMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeTab === 'email' ? '#ffffff' : 'transparent',
              color: activeTab === 'email' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: activeTab === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Mail style={{ width: 15, height: 15, color: '#2563eb' }} /> Email (PDF Attached)
          </button>
        </div>

        {/* TAB 1: WhatsApp & SMS */}
        {activeTab === 'whatsapp' && (
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
                Optional Note / Payment Deadline
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
                maxHeight: '130px',
                overflowY: 'auto',
                fontFamily: 'monospace'
              }}>
                {generateMessageText()}
              </pre>
            </div>

            {/* Action Buttons for WhatsApp & SMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
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
            </div>
          </div>
        )}

        {/* TAB 2: Email (SendGrid / SMTP with PDF) */}
        {activeTab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                Recipient Customer Email Address
              </label>
              <input
                type="email"
                className="input"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '14px' }}
              />
              {customerName && (
                <span style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>
                  Customer: <strong>{customerName}</strong>
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                Custom Message / Personal Note (Optional)
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="e.g. Thank you for your continued partnership. Kindly find attached the official invoice."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
              />
            </div>

            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FileText style={{ width: 28, height: 28, color: '#2563eb', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#1e40af' }}>
                <strong>Official PDF Attached Automatically:</strong>
                <div>invoice-{invoiceNumber}.pdf will be generated and attached directly to the email via SendGrid.</div>
              </div>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={loadingAction !== null}
              className="btn btn--primary"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px'
              }}
            >
              {loadingAction === 'email' ? (
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Mail style={{ width: 16, height: 16 }} />
              )}
              Send Email with Invoice PDF
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn"
          style={{ width: '100%', marginTop: '6px', justifyContent: 'center' }}
        >
          Cancel
        </button>

      </div>
    </div>
  );
}
