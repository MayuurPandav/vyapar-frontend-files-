// Simulated DB State
const dbData = {
  sales: [
    { date: '2026-05-15', amount: 15000 },
    { date: '2026-06-02', amount: 20000 },
    { date: '2026-06-05', amount: 10000 }
  ],
  expenses: [
    { date: '2026-05-20', category: 'Electricity', amount: 3000, isRecurringTemplate: false },
    { date: '2026-06-01', category: 'Rent', amount: 8000, isRecurringTemplate: false },
    { date: '2026-06-04', category: 'Office supplies', amount: 1500, isRecurringTemplate: false },
    { date: '2026-06-07', category: 'Electricity', amount: 2500, isRecurringTemplate: false },
    { date: '2026-07-01', category: 'Rent', amount: 8000, isRecurringTemplate: true } // recurring template - should be filtered out
  ]
};

// 1. Total Expenses (filtered templates)
const totalExpenses = dbData.expenses
  .filter(exp => !exp.isRecurringTemplate)
  .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

console.log('Total Expenses (without templates):', totalExpenses);
if (totalExpenses !== 15000) {
  throw new Error('Total expenses calculations incorrect. Expected 15000, got ' + totalExpenses);
}

// 2. Category-wise Breakdown
const expenseByCategory = dbData.expenses
  .filter(exp => !exp.isRecurringTemplate)
  .reduce((acc, exp) => {
    const cat = exp.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(exp.amount) || 0);
    return acc;
  }, {});

console.log('Expense By Category:', expenseByCategory);
if (expenseByCategory['Electricity'] !== 5500 || expenseByCategory['Rent'] !== 8000 || expenseByCategory['Office supplies'] !== 1500) {
  throw new Error('Category grouping calculations incorrect.');
}

// 3. Monthly Expense Breakdown
const expenseByMonth = dbData.expenses
  .filter(exp => !exp.isRecurringTemplate)
  .reduce((acc, exp) => {
    const month = exp.date ? exp.date.substring(0, 7) : 'Unknown';
    acc[month] = (acc[month] || 0) + (parseFloat(exp.amount) || 0);
    return acc;
  }, {});

console.log('Expense By Month:', expenseByMonth);
if (expenseByMonth['2026-05'] !== 3000 || expenseByMonth['2026-06'] !== 12000) {
  throw new Error('Monthly expense grouping calculations incorrect.');
}

// 4. Sales Monthly Breakdown
const salesByMonth = dbData.sales.reduce((acc, s) => {
  const month = s.date ? s.date.substring(0, 7) : 'Unknown';
  acc[month] = (acc[month] || 0) + (parseFloat(s.amount) || 0);
  return acc;
}, {});

console.log('Sales By Month:', salesByMonth);
if (salesByMonth['2026-05'] !== 15000 || salesByMonth['2026-06'] !== 30000) {
  throw new Error('Monthly sales grouping calculations incorrect.');
}

// 5. Sorted Months
const allMonthsSet = new Set([
  ...Object.keys(expenseByMonth),
  ...Object.keys(salesByMonth)
]);
const sortedMonths = Array.from(allMonthsSet).sort().filter(m => m !== 'Unknown');
console.log('Combined sorted months:', sortedMonths);
if (sortedMonths.length !== 2 || sortedMonths[0] !== '2026-05' || sortedMonths[1] !== '2026-06') {
  throw new Error('Months combination/sorting logic incorrect.');
}

console.log('All Expense Reports & Revenue Comparison math calculations checked and verified successfully!');
