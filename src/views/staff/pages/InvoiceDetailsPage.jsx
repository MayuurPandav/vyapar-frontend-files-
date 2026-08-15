import { useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Download, Printer, Edit3, MessageSquare, Copy } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { findInvoiceById, findCustomerById, findProductById, findUserById, addActivityLog } = useData();
  const invoice = useMemo(() => findInvoiceById(id), [findInvoiceById, id]);
  const customer = useMemo(() => findCustomerById(invoice?.customerId), [findCustomerById, invoice?.customerId]);
  const creator = useMemo(() => findUserById(invoice?.createdBy?._id || invoice?.createdBy), [findUserById, invoice?.createdBy]);
  const invoiceRef = useRef();

  const business = {
    name: 'Vyapar Retail Pvt Ltd',
    gstin: '27AABCU9603R1ZV',
    address: 'Shop 21, Brigade Road, Bangalore, Karnataka, 560025',
    phone: '+91 98765 43210',
    email: 'hello@vyapar.com',
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
  const statusLabel = invoice?.status === 'Completed' ? 'Paid' : invoice?.status === 'Credit Note' ? 'Credit' : 'Pending';
  const billDate = invoice ? new Date(invoice.billDate) : new Date();
  const dueDate = new Date(billDate);
  dueDate.setDate(dueDate.getDate() + 7);

  const lineItems = useMemo(
    () =>
      invoice?.products?.map((item) => {
        const product = item.productId ? findProductById(item.productId) : null;
        return {
          ...item,
          sku: item.sku || product?.sku || product?.barcode || 'N/A',
          hsn: item.hsn || product?.hsn || 'N/A',
          discount: item.discount || 0,
          amount: item.price * item.quantity,
        };
      }) || [],
    [invoice, findProductById]
  );

  const subTotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.amount, 0), [lineItems]);
  const discount = invoice?.discount || 0;
  const taxableTotal = subTotal - discount;
  const isInterState = invoice?.interState || false;
  const cgst = isInterState ? 0 : Number((taxableTotal * 0.09).toFixed(2));
  const sgst = isInterState ? 0 : Number((taxableTotal * 0.09).toFixed(2));
  const igst = isInterState ? Number((taxableTotal * 0.18).toFixed(2)) : 0;
  const totalTax = cgst + sgst + igst;
  const rawTotal = taxableTotal + totalTax;
  const roundOff = Number((Math.round(rawTotal) - rawTotal).toFixed(2));
  const totalAmount = Number(Math.round(rawTotal).toFixed(2));
  const paidAmount = invoice?.paidAmount ?? 0;
  const balanceDue = Number((totalAmount - paidAmount).toFixed(2));

  const cashAmount = invoice?.cashAmount ?? (invoice?.paymentMode === 'Cash' ? paidAmount : 0);
  const upiAmount = invoice?.upiAmount ?? (invoice?.paymentMode === 'UPI' ? paidAmount : 0);
  const cardAmount = invoice?.cardAmount ?? (invoice?.paymentMode === 'Card' ? paidAmount : 0);

  const recordAction = (action) => {
    if (!addActivityLog) return;
    addActivityLog({ userId: user?._id, action });
  };

  const savePdf = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${invoice?.invoiceNumber || id}.pdf`);
    recordAction('Downloaded invoice PDF');
  };

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = `Invoice ${invoice.invoiceNumber || id} for ${formatCurrency(totalAmount)}. Status: ${statusLabel}. ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    recordAction('Shared invoice on WhatsApp');
  };

  const handlePrint = () => {
    recordAction('Printed invoice');
    window.print();
  };

  const canEdit = user?.role === 'admin' || user?.permissions?.canViewAllInvoices || (invoice?.createdBy?._id || invoice?.createdBy) === user?._id || (invoice?.createdBy?.email && invoice?.createdBy?.email === user?.username);

  if (!invoice) return <div className="card">Invoice not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Invoice #{invoice.invoiceNumber || invoice._id.slice(-6)}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Professional invoice layout for screen and print.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={handlePrint} className="btn" style={{ background: 'var(--text-1)', color: '#fff', borderColor: 'transparent' }}>
            <Printer style={{ width: 16, height: 16 }} /> Print
          </button>
          <button onClick={savePdf} className="btn btn--primary">
            <Download style={{ width: 16, height: 16 }} /> Download PDF
          </button>
          <button onClick={handleWhatsApp} className="btn">
            <MessageSquare style={{ width: 16, height: 16 }} /> WhatsApp
          </button>
          {canEdit && (
            <button onClick={() => navigate(`/billing/edit/${id}`)} className="btn">
              <Edit3 style={{ width: 16, height: 16 }} /> Edit Invoice
            </button>
          )}
        </div>
      </div>

      <div ref={invoiceRef} className="card invoice-print-area">
        <div className="form-row" style={{ gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> GST Registered
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{business.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>GSTIN: {business.gstin}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{business.address}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Phone: {business.phone} | Email: {business.email}</p>
          </div>
          <div style={{ padding: 24, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span className="badge" style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: invoice?.status === 'Completed' ? 'rgba(16,185,129,0.1)' : invoice?.status === 'Credit Note' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                color: invoice?.status === 'Completed' ? 'var(--accent)' : invoice?.status === 'Credit Note' ? 'var(--blue)' : 'var(--yellow)'
              }}>
                {statusLabel}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Invoice</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{invoice.invoiceNumber || invoice._id.slice(-6)}</div>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Invoice date</span><span>{billDate.toLocaleDateString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Due date</span><span>{dueDate.toLocaleDateString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Created by</span><span>{creator?.name || user?.name || 'Admin'}</span></div>
            </div>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 32, gap: 24 }}>
          <div style={{ padding: 24, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Bill To</p>
            <p style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>{invoice.customerName}</p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-2)' }}>{invoice.customerAddress || customer?.address || 'Address not available'}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{invoice.customerPhone || customer?.phone || 'Phone not available'}</p>
            {(invoice.customerGSTIN || customer?.gstin) && (
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>GSTIN: {invoice.customerGSTIN || customer?.gstin}</p>
            )}
          </div>
          <div style={{ padding: 24, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Payment Info</p>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment mode</span><span>{invoice.paymentMode || 'Cash'}</span></div>
              {invoice.paymentMode === 'UPI' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>UPI reference</span><span>{invoice.upiRef || 'N/A'}</span></div>
              )}
              {invoice.paymentMode === 'Card' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Card last 4</span><span>{invoice.cardLast4 ? `**** ${invoice.cardLast4}` : 'N/A'}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Counter / POS</span><span>{invoice.counterName || 'Main POS'}</span></div>
            </div>
            {invoice.paymentMode === 'UPI' && (
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRCode value={`upi://pay?pa=vyapar@upi&pn=${encodeURIComponent(invoice.customerName)}&am=${totalAmount}`} size={120} />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 32, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name + SKU</th>
                <th>HSN/SAC</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate ₹</th>
                <th style={{ textAlign: 'right' }}>Disc %</th>
                <th style={{ textAlign: 'right' }}>Amount ₹</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={item.productId || item.name || index}>
                  <td style={{ color: 'var(--text-3)' }}>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>SKU: {item.sku}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{item.hsn}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.price.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{item.discount}%</td>
                  <td style={{ textAlign: 'right' }}>₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 400, padding: 24, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatCurrency(subTotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}><span>Discount</span><span>-{formatCurrency(discount)}</span></div>
              {!isInterState ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CGST (9%)</span><span>{formatCurrency(cgst)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST (9%)</span><span>{formatCurrency(sgst)}</span></div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IGST (18%)</span><span>{formatCurrency(igst)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Round off</span><span>{formatCurrency(roundOff)}</span></div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 18, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}><span>TOTAL</span><span>{formatCurrency(totalAmount)}</span></div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="badge" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'var(--bg-input)', color: 'var(--text-2)' }}>Cash {formatCurrency(cashAmount)}</span>
          <span className="badge" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'var(--bg-input)', color: 'var(--text-2)' }}>UPI {formatCurrency(upiAmount)}</span>
          <span className="badge" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'var(--bg-input)', color: 'var(--text-2)' }}>Card {formatCurrency(cardAmount)}</span>
          <span className="badge" style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: balanceDue > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            color: balanceDue > 0 ? 'var(--red)' : 'var(--accent)'
          }}>
            Balance due {formatCurrency(balanceDue)}
          </span>
        </div>

        <div className="form-row" style={{ marginTop: 40, gap: 24 }}>
          <div style={{ padding: 24, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Terms & Notes</p>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)' }}>Payment due within 7 days. Goods once sold will not be returned.</p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-2)' }}>Thank you for shopping with us!</p>
          </div>
          <div style={{ padding: 24, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ margin: '0 auto 12px', height: 1, width: 112, background: 'var(--text-3)' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Authorised signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
