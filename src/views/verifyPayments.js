// Mock dbData State
let dbData = {
  parties: [
    { id: 'p-1', name: 'John Doe Customer', type: 'Customer', balance: -5000 }, // John owes us 5000
    { id: 'p-2', name: 'Acme Supplier', type: 'Supplier', balance: 3000 }      // We owe Acme 3000
  ],
  transactions: []
};

// Form values for Central recording
let paymentForm = {
  partyId: '',
  partyName: '',
  type: '',
  amount: 0,
  mode: 'UPI',
  referenceNo: '',
  date: '2026-06-08'
};

// Submit simulation
function handlePaymentSubmitSimulated(form) {
  const pAmt = parseFloat(form.amount) || 0;
  if (pAmt <= 0) throw new Error('Amount must be > 0');
  
  // Find party
  const pIdx = dbData.parties.findIndex(p => p.id === form.partyId);
  if (pIdx === -1) throw new Error('Party not found');
  
  let newBalance = parseFloat(dbData.parties[pIdx].balance) || 0;
  
  // Update balance
  if (form.type === 'Receive') {
    newBalance += pAmt; // John pays us 2000 -> balance becomes -3000 (closer to 0)
  } else {
    newBalance -= pAmt; // We pay Acme 1000 -> balance becomes 2000 (closer to 0)
  }
  
  dbData.parties[pIdx] = { 
    ...dbData.parties[pIdx], 
    balance: newBalance, 
    lastTxn: form.date 
  };
  
  // Log transaction
  const txnId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
  const isReceive = form.type === 'Receive';
  const txn = {
    id: txnId,
    date: form.date,
    type: 'Payment ' + form.type,
    party: form.partyName,
    partyId: form.partyId,
    debitAccount: isReceive ? 'Bank/UPI Account' : 'Accounts Payable (Liability)',
    creditAccount: isReceive ? 'Accounts Receivable (Asset)' : 'Bank/UPI Account',
    debit: isReceive ? pAmt : 0,
    credit: isReceive ? 0 : pAmt,
    mode: form.mode,
    referenceNo: form.referenceNo,
    balance: newBalance
  };
  
  dbData.transactions.push(txn);
  return txn;
}

// Reversal simulation
function handleDeletePaymentSimulated(txn) {
  const pIdx = dbData.parties.findIndex(p => p.id === txn.partyId || p.name === txn.party);
  if (pIdx !== -1) {
    const amount = parseFloat(txn.debit || txn.credit || 0);
    let newBalance = parseFloat(dbData.parties[pIdx].balance) || 0;
    
    if (txn.type === 'Payment Receive') {
      newBalance -= amount; // John's payment reversed -> John owes us 5000 again
    } else if (txn.type === 'Payment Pay') {
      newBalance += amount; // Our payment to Acme reversed -> We owe Acme 3000 again
    }
    
    dbData.parties[pIdx] = { 
      ...dbData.parties[pIdx], 
      balance: newBalance 
    };
  }
  
  dbData.transactions = dbData.transactions.filter(t => t.id !== txn.id);
}

// --- SIMULATION RUNS ---

console.log('--- Initial Parties ---');
console.log(dbData.parties);

// 1. Record Customer Payment Received: John Doe pays 2000
const txnCustomer = handlePaymentSubmitSimulated({
  partyId: 'p-1',
  partyName: 'John Doe Customer',
  type: 'Receive',
  amount: 2000,
  mode: 'UPI',
  referenceNo: 'UPI-12345',
  date: '2026-06-08'
});

console.log('\n--- After John Doe pays ₹2000 ---');
console.log('Party Balance:', dbData.parties.find(p => p.id === 'p-1').balance); // Expected: -3000
console.log('Transaction posted:', dbData.transactions[0]);
if (dbData.parties[0].balance !== -3000) {
  throw new Error('Customer balance adjustment incorrect.');
}
if (dbData.transactions.length !== 1 || dbData.transactions[0].type !== 'Payment Receive' || dbData.transactions[0].debit !== 2000) {
  throw new Error('Customer transaction log incorrect.');
}

// 2. Record Supplier Payment Made: We pay Acme 1000
const txnSupplier = handlePaymentSubmitSimulated({
  partyId: 'p-2',
  partyName: 'Acme Supplier',
  type: 'Pay',
  amount: 1000,
  mode: 'Bank Transfer',
  referenceNo: 'FT-98765',
  date: '2026-06-08'
});

console.log('\n--- After we pay Acme ₹1000 ---');
console.log('Party Balance:', dbData.parties.find(p => p.id === 'p-2').balance); // Expected: 2000
console.log('Transaction posted:', dbData.transactions[1]);
if (dbData.parties[1].balance !== 2000) {
  throw new Error('Supplier balance adjustment incorrect.');
}
if (dbData.transactions.length !== 2 || dbData.transactions[1].type !== 'Payment Pay' || dbData.transactions[1].credit !== 1000) {
  throw new Error('Supplier transaction log incorrect.');
}

// 3. Delete / Revert Customer Payment
handleDeletePaymentSimulated(txnCustomer);
console.log('\n--- After deleting Customer payment ---');
console.log('Party Balance:', dbData.parties.find(p => p.id === 'p-1').balance); // Expected: -5000 (reverted)
console.log('Transactions remaining:', dbData.transactions.length); // Expected: 1
if (dbData.parties[0].balance !== -5000) {
  throw new Error('Customer balance reversal incorrect.');
}
if (dbData.transactions.length !== 1 || dbData.transactions[0].id === txnCustomer.id) {
  throw new Error('Transaction list not updated after deletion.');
}

// 4. Delete / Revert Supplier Payment
handleDeletePaymentSimulated(txnSupplier);
console.log('\n--- After deleting Supplier payment ---');
console.log('Party Balance:', dbData.parties.find(p => p.id === 'p-2').balance); // Expected: 3000 (reverted)
console.log('Transactions remaining:', dbData.transactions.length); // Expected: 0
if (dbData.parties[1].balance !== 3000) {
  throw new Error('Supplier balance reversal incorrect.');
}
if (dbData.transactions.length !== 0) {
  throw new Error('Transactions list should be empty.');
}

console.log('\nAll inward/outward payment, balance calculations, and reversals checked and verified successfully!');
