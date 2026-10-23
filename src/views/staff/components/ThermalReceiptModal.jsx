import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { Printer, X, Download } from 'lucide-react';

export default function ThermalReceiptModal({ invoice, customer, business, onClose }) {
  const receiptRef = useRef();

  if (!invoice) return null;

  const billDate = new Date(invoice.billDate || Date.now());
  const formattedDate = billDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = billDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=350,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt-${invoice.invoiceNumber || invoice._id}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 72mm;
              margin: 0 auto;
              color: #000;
              font-size: 12px;
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { text-align: left; padding: 2px 0; }
            td { padding: 2px 0; }
            .qr-container { display: flex; justify-content: center; margin: 8px 0; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const products = invoice.products || [];
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount ?? totalAmount);
  const cashAmount = Number(invoice.cashAmount || (invoice.paymentMode === 'Cash' ? paidAmount : 0));
  const changeDue = Math.max(0, cashAmount - totalAmount);

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, background: 'rgba(0,0,0,0.65)' }}>
      <div className="card" style={{ maxWidth: '420px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧾</span> 80mm Thermal Receipt Preview
          </h3>
          <button onClick={onClose} className="btn--icon" style={{ cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Paper Receipt Simulation Box */}
        <div 
          ref={receiptRef}
          style={{
            background: '#ffffff',
            color: '#111827',
            padding: '16px 14px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '12px',
            lineHeight: 1.35
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{business?.name || 'VYAPAR RETAIL'}</div>
            {business?.address && <div style={{ fontSize: '11px', marginTop: '2px' }}>{business.address}</div>}
            {business?.phone && <div style={{ fontSize: '11px' }}>Ph: {business.phone}</div>}
            {business?.gstin && <div style={{ fontSize: '11px' }}>GSTIN: {business.gstin}</div>}
          </div>

          <div style={{ borderTop: '1px dashed #4b5563', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Bill: #{invoice.invoiceNumber || invoice._id?.slice(-6)}</span>
            <span>{formattedDate} {formattedTime}</span>
          </div>
          {customer?.name && (
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              Cust: {customer.name} {customer.phone ? `(${customer.phone})` : ''}
            </div>
          )}
          {invoice.createdBy?.name && (
            <div style={{ fontSize: '11px', color: '#4b5563' }}>Cashier: {invoice.createdBy.name}</div>
          )}

          <div style={{ borderTop: '1px dashed #4b5563', margin: '8px 0' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Rate</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Amt</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 0', maxWidth: '110px', wordBreak: 'break-word' }}>
                    {p.name || p.productName || 'Item'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '3px 0' }}>{p.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>₹{Number(p.price || 0).toFixed(0)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 'bold' }}>
                    ₹{(Number(p.quantity || 1) * Number(p.price || 0)).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #4b5563', margin: '8px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>₹{Number(invoice.subtotal || totalAmount).toLocaleString()}</span>
            </div>
            {Number(invoice.discount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span>-₹{Number(invoice.discount).toLocaleString()}</span>
              </div>
            )}
            {Number(invoice.cgst || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CGST (9%):</span>
                <span>₹{Number(invoice.cgst).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.sgst || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SGST (9%):</span>
                <span>₹{Number(invoice.sgst).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.roundOff || 0) !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Round Off:</span>
                <span>₹{Number(invoice.roundOff).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
            <span>NET TOTAL:</span>
            <span>₹{totalAmount.toLocaleString()}</span>
          </div>

          <div style={{ borderTop: '1px dashed #4b5563', margin: '8px 0' }} />

          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Payment Mode:</span>
              <span style={{ fontWeight: 'bold' }}>{invoice.paymentMode || 'Cash'}</span>
            </div>
            {invoice.paymentMode === 'Cash' && cashAmount > totalAmount && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cash Tendered:</span>
                  <span>₹{cashAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Change Given:</span>
                  <span>₹{changeDue.toLocaleString()}</span>
                </div>
              </>
            )}
            {invoice.upiRef && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>UPI Ref:</span>
                <span>{invoice.upiRef}</span>
              </div>
            )}
          </div>

          <div className="qr-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <QRCode value={`INV:${invoice.invoiceNumber || invoice._id}|AMT:${totalAmount}|DATE:${formattedDate}`} size={72} />
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '10px', color: '#4b5563' }}>
            <div>*** THANK YOU! VISIT AGAIN ***</div>
            <div style={{ marginTop: '2px' }}>Powered by Vyapar POS 2.0</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={handlePrintReceipt} className="btn btn--primary" style={{ flex: 1, justifyContent: 'center' }}>
            <Printer style={{ width: 16, height: 16 }} /> Print Thermal Slip (80mm)
          </button>
          <button onClick={onClose} className="btn" style={{ padding: '0 16px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
