import React, { useState, useEffect } from 'react';
import { X, DollarSign, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CashDrawerModal({ invoices = [], cashierName = 'Cashier', onClose }) {
  const [openingFloat, setOpeningFloat] = useState(() => {
    return Number(localStorage.getItem('vyapar_opening_float') || 2000);
  });
  const [isEditingFloat, setIsEditingFloat] = useState(false);
  const [tempFloat, setTempFloat] = useState(openingFloat);
  const [actualCashCounted, setActualCashCounted] = useState('');

  // Calculate live shift totals from today's completed invoices
  const shiftStats = React.useMemo(() => {
    let totalCash = 0;
    let totalUpi = 0;
    let totalCard = 0;
    let totalSales = 0;
    let billCount = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'Completed' || inv.paidAmount > 0) {
        billCount += 1;
        const paid = Number(inv.paidAmount || inv.totalAmount || 0);
        totalSales += paid;

        if (inv.paymentMode === 'Cash') {
          totalCash += paid;
        } else if (inv.paymentMode === 'UPI') {
          totalUpi += paid;
        } else if (inv.paymentMode === 'Card') {
          totalCard += paid;
        } else if (inv.paymentMode === 'Split') {
          totalCash += Number(inv.cashAmount || 0);
          totalUpi += Number(inv.upiAmount || 0);
          totalCard += Number(inv.cardAmount || 0);
        }
      }
    });

    return { totalCash, totalUpi, totalCard, totalSales, billCount };
  }, [invoices]);

  const expectedCashInDrawer = openingFloat + shiftStats.totalCash;
  const countedNum = actualCashCounted === '' ? null : Number(actualCashCounted);
  const discrepancy = countedNum !== null ? countedNum - expectedCashInDrawer : null;

  const saveFloat = () => {
    const val = Number(tempFloat) || 0;
    setOpeningFloat(val);
    localStorage.setItem('vyapar_opening_float', val.toString());
    setIsEditingFloat(false);
    toast.success('Opening float updated');
  };

  const handlePrintShiftReport = () => {
    const printWindow = window.open('', '', 'width=400,height=650');
    const now = new Date();
    printWindow.document.write(`
      <html>
        <head>
          <title>Shift-Closing-Report</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; font-size: 12px; line-height: 1.4; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .double-divider { border-top: 2px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size: 15px;">VYAPAR POS SHIFT REPORT</div>
          <div class="text-center" style="font-size: 11px;">Shift Register Summary & Reconciliation</div>
          <div class="divider"></div>
          <div class="row"><span>Date & Time:</span><span>${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div class="row"><span>Cashier:</span><span>${cashierName}</span></div>
          <div class="row"><span>Total Bills:</span><span>${shiftStats.billCount}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Opening Cash Float:</span><span>₹${openingFloat.toLocaleString()}</span></div>
          <div class="row"><span>Cash Sales:</span><span>+₹${shiftStats.totalCash.toLocaleString()}</span></div>
          <div class="row font-bold"><span>EXPECTED IN DRAWER:</span><span>₹${expectedCashInDrawer.toLocaleString()}</span></div>
          <div class="divider"></div>
          <div class="row"><span>UPI Collections:</span><span>₹${shiftStats.totalUpi.toLocaleString()}</span></div>
          <div class="row"><span>Card Collections:</span><span>₹${shiftStats.totalCard.toLocaleString()}</span></div>
          <div class="row font-bold"><span>TOTAL SHIFT SALES:</span><span>₹${shiftStats.totalSales.toLocaleString()}</span></div>
          <div class="divider"></div>
          ${countedNum !== null ? `
            <div class="row font-bold"><span>Actual Cash Counted:</span><span>₹${countedNum.toLocaleString()}</span></div>
            <div class="row font-bold"><span>Discrepancy:</span><span>${discrepancy === 0 ? 'BALANCED (₹0)' : (discrepancy > 0 ? `+₹${discrepancy} (SURPLUS)` : `-₹${Math.abs(discrepancy)} (SHORTAGE)`)}</span></div>
          ` : ''}
          <div class="double-divider"></div>
          <div class="text-center" style="margin-top: 15px; font-size: 11px;">
            Cashier Signature: __________________
          </div>
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

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, background: 'rgba(0,0,0,0.65)' }}>
      <div className="card" style={{ maxWidth: '480px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent, #10b981)', padding: '6px', borderRadius: '8px' }}>
              <DollarSign style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Cash Drawer & Shift Tally</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>Reconcile physical cash drawer with sales</p>
            </div>
          </div>
          <button onClick={onClose} className="btn--icon" style={{ cursor: 'pointer' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Shift Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Opening Float</span>
              {!isEditingFloat && (
                <button 
                  onClick={() => setIsEditingFloat(true)} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingFloat ? (
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                <input 
                  type="number" 
                  value={tempFloat} 
                  onChange={(e) => setTempFloat(e.target.value)} 
                  className="fi" 
                  style={{ padding: '4px 6px', fontSize: '13px' }} 
                />
                <button onClick={saveFloat} className="btn btn--sm btn--primary" style={{ padding: '4px 8px' }}>Save</button>
              </div>
            ) : (
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', marginTop: '4px' }}>
                ₹{openingFloat.toLocaleString()}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Cash Sales</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
              +₹{shiftStats.totalCash.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Expected Cash in Drawer */}
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(14,165,233,0.1))', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 600 }}>EXPECTED PHYSICAL CASH IN DRAWER</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-1)', marginTop: '4px' }}>
            ₹{expectedCashInDrawer.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            Opening Float (₹{openingFloat.toLocaleString()}) + Cash Collected (₹{shiftStats.totalCash.toLocaleString()})
          </div>
        </div>

        {/* Other Payments breakdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '12px', marginBottom: '16px' }}>
          <div><span style={{ color: 'var(--text-3)' }}>UPI: </span><b>₹{shiftStats.totalUpi.toLocaleString()}</b></div>
          <div><span style={{ color: 'var(--text-3)' }}>Card: </span><b>₹{shiftStats.totalCard.toLocaleString()}</b></div>
          <div><span style={{ color: 'var(--text-3)' }}>Total Sales: </span><b>₹{shiftStats.totalSales.toLocaleString()}</b></div>
        </div>

        {/* Physical Cash Reconciliation */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Actual Counted Cash in Drawer (₹)
          </label>
          <input
            type="number"
            min="0"
            value={actualCashCounted}
            onChange={(e) => setActualCashCounted(e.target.value)}
            placeholder="Enter physical cash amount counted"
            className="fi"
            style={{ fontSize: '15px', fontWeight: 600 }}
          />

          {countedNum !== null && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: discrepancy === 0 ? '1px solid #10b981' : (discrepancy < 0 ? '1px solid #ef4444' : '1px solid #f59e0b'),
              background: discrepancy === 0 ? 'rgba(16,185,129,0.1)' : (discrepancy < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)')
            }}>
              {discrepancy === 0 ? (
                <>
                  <CheckCircle style={{ color: '#10b981', width: 22, height: 22, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '13px' }}>Drawer Balanced Perfectly!</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>Physical cash matches expected sales to the rupee.</div>
                  </div>
                </>
              ) : discrepancy < 0 ? (
                <>
                  <AlertTriangle style={{ color: '#ef4444', width: 22, height: 22, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '13px' }}>Cash Shortage: -₹{Math.abs(discrepancy).toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>Physical drawer is less than recorded sales.</div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle style={{ color: '#f59e0b', width: 22, height: 22, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px' }}>Cash Surplus: +₹{discrepancy.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>Extra cash found in drawer.</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handlePrintShiftReport} className="btn btn--primary" style={{ flex: 1, justifyContent: 'center' }}>
            <Printer style={{ width: 16, height: 16 }} /> Print Shift Closing Slip
          </button>
          <button onClick={onClose} className="btn" style={{ padding: '0 16px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
