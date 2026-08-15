// Mock dbData State
let dbData = {
  parties: [
    { id: 'p-1', name: 'John Doe Customer', type: 'Customer', balance: 0 },
  ],
  sales: [],
  transactions: []
};

// Mock Helper functions
const fmt = (v) => 'Rs. ' + (Number(v) || 0).toFixed(2);

// Simulate handleSalesSubmit with Partial / Advance Payment
function handleSalesSubmitSimulated(saleCust, grandTotal, saleMode, salePaidAmount, saleDate) {
  const paidAmt = saleMode === 'Credit (Due)' 
    ? 0 
    : (salePaidAmount === '' ? grandTotal : (parseFloat(salePaidAmount) || 0));
  const dueAmt = grandTotal - paidAmt;

  const nextSaleId = dbData.sales.length + 1;
  const nextTxnId = dbData.transactions.length + 1;

  const newSale = {
    id: `INV-${nextSaleId}`,
    customer: saleCust,
    date: saleDate,
    amount: grandTotal,
    mode: saleMode,
    status: paidAmt >= grandTotal ? 'Paid' : (paidAmt > 0 ? 'Partial' : 'Pending'),
    paymentReceived: paidAmt,
    balanceDue: dueAmt
  };

  // Update customer balance based on dueAmt
  dbData.parties = dbData.parties.map(p => {
    if (p.name.toLowerCase() === saleCust.toLowerCase()) {
      return {
        ...p,
        balance: p.balance - dueAmt,
        lastTxn: saleDate
      };
    }
    return p;
  });

  dbData.sales.push(newSale);
  return newSale;
}

// Simulate Online Gateway Checkout Simulation (Stripe / Razorpay)
function handleGatewayCheckoutSimulated(checkoutInvoice, selectedGateway) {
  const remainingDue = checkoutInvoice.amount - checkoutInvoice.paymentReceived;
  const pAmt = remainingDue;

  // Update Invoice
  dbData.sales = dbData.sales.map(s => {
    if (s.id === checkoutInvoice.id) {
      return {
        ...s,
        paymentReceived: s.paymentReceived + pAmt,
        status: 'Paid',
        balanceDue: 0
      };
    }
    return s;
  });

  // Update Party Balance
  dbData.parties = dbData.parties.map(p => {
    if (p.name.toLowerCase() === checkoutInvoice.customer.toLowerCase()) {
      return {
        ...p,
        balance: p.balance + pAmt
      };
    }
    return p;
  });

  // Log Transaction
  const nextTxnId = dbData.transactions.length + 1;
  const txn = {
    id: `TXN-${nextTxnId}`,
    type: 'Payment Receive',
    party: checkoutInvoice.customer,
    debit: pAmt,
    credit: 0,
    mode: selectedGateway === 'stripe' ? 'Credit card / Debit card' : 'UPI / QR code',
    referenceNo: `ONLINE-${selectedGateway.toUpperCase()}-SIMULATED`
  };
  dbData.transactions.push(txn);
}

// --- RUN SIMULATIONS ---

console.log('Initial Customer State:');
console.log(dbData.parties[0]);

// Case 1: Partial payment billing (₹10,000 total, paid ₹4,000 cash, ₹6,000 remaining due)
console.log('\nExecuting Case 1: Partial Payment...');
const inv1 = handleSalesSubmitSimulated('John Doe Customer', 10000, 'Cash', 4000, '2026-06-08');
console.log('Invoice Generated:', inv1);
console.log('Customer State:', dbData.parties[0]); // Expected balance: -6000 (owing ₹6000)

if (inv1.status !== 'Partial' || inv1.balanceDue !== 6000) {
  throw new Error('Partial payment invoice details mismatch.');
}
if (dbData.parties[0].balance !== -6000) {
  throw new Error('Partial payment party balance adjustment incorrect.');
}

// Case 2: Advance payment billing (₹10,000 total, paid ₹12,000 bank, ₹2,000 advance credit)
console.log('\nExecuting Case 2: Advance Payment...');
// Reset balance to 0 first
dbData.parties[0].balance = 0;
const inv2 = handleSalesSubmitSimulated('John Doe Customer', 10000, 'Bank Transfer', 12000, '2026-06-08');
console.log('Invoice Generated:', inv2);
console.log('Customer State:', dbData.parties[0]); // Expected balance: +2000 (advance credit)

if (inv2.status !== 'Paid' || inv2.balanceDue !== -2000) {
  throw new Error('Advance payment invoice details mismatch.');
}
if (dbData.parties[0].balance !== 2000) {
  throw new Error('Advance payment party balance adjustment incorrect.');
}

// Case 3: Gateway checkout simulation (Stripe Pay of remaining ₹6,000 due from Invoice 1)
console.log('\nExecuting Case 3: Stripe Gateway Checkout...');
// Reset balance back to -6000 to match Invoice 1 state
dbData.parties[0].balance = -6000;
handleGatewayCheckoutSimulated(inv1, 'stripe');
console.log('Invoice 1 Updated Status:', dbData.sales.find(s => s.id === inv1.id));
console.log('Customer State after online settlement:', dbData.parties[0]); // Expected balance: 0

const updatedInv1 = dbData.sales.find(s => s.id === inv1.id);
if (updatedInv1.status !== 'Paid' || updatedInv1.paymentReceived !== 10000) {
  throw new Error('Gateway online payment checkout update failed.');
}
if (dbData.parties[0].balance !== 0) {
  throw new Error('Gateway online payment party balance settle failed.');
}
if (dbData.transactions.length !== 1 || dbData.transactions[0].mode !== 'Credit card / Debit card') {
  throw new Error('Gateway online payment transaction ledger entry failed.');
}

console.log('\nAll Partial Payments, Advance Credits, and Stripe/Razorpay Online Checkout math verified successfully!');
