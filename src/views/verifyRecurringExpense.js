// Setup initial mock dbData state
let dbData = {
  expenses: [
    {
      id: 1,
      date: '2026-06-01',
      category: 'Rent',
      amount: 1000,
      paymentMode: 'Cash',
      description: 'Monthly office rent schedule',
      isRecurringTemplate: true,
      frequency: 'Monthly',
      nextOccurrenceDate: '2026-06-01', // Today is simulated as 2026-06-08, so this is due!
      isActive: true
    },
    {
      id: 2,
      date: '2026-06-01',
      category: 'Other',
      amount: 50,
      paymentMode: 'Cash',
      description: 'Daily snack budget schedule',
      isRecurringTemplate: true,
      frequency: 'Daily',
      nextOccurrenceDate: '2026-06-07', // Due!
      isActive: true
    },
    {
      id: 3,
      date: '2026-06-01',
      category: 'Marketing',
      amount: 200,
      paymentMode: 'UPI',
      description: 'Monthly active ads template',
      isRecurringTemplate: true,
      frequency: 'Monthly',
      nextOccurrenceDate: '2026-06-15', // NOT due yet (future)
      isActive: true
    }
  ]
};

// Date calculation helper
const getNextOccurrenceDate = (currentDateStr, frequency) => {
  const date = new Date(currentDateStr);
  if (frequency === 'Daily') {
    date.setDate(date.getDate() + 1);
  } else if (frequency === 'Weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'Monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'Yearly') {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().substring(0, 10);
};

// Simulated auto-generator runner
function checkAndGenerateRecurringExpenses(todayDateStr) {
  let updatedExpenses = [...dbData.expenses];
  let hasChanges = false;

  updatedExpenses.forEach((exp, idx) => {
    if (exp.isRecurringTemplate && exp.isActive && exp.nextOccurrenceDate && exp.nextOccurrenceDate <= todayDateStr) {
      // Generate standard instance
      const newInstanceId = Math.max(0, ...updatedExpenses.map(ex => ex.id)) + 1;
      const newInstance = {
        id: newInstanceId,
        date: exp.nextOccurrenceDate,
        category: exp.category,
        amount: parseFloat(exp.amount) || 0,
        paymentMode: exp.paymentMode || 'Cash',
        description: `Auto-generated recurrence: ${exp.description || ''}`,
        receipt: exp.receipt || '',
        isRecurringInstance: true,
        templateId: exp.id
      };

      updatedExpenses.push(newInstance);

      // Advance nextOccurrenceDate
      let nextDate = getNextOccurrenceDate(exp.nextOccurrenceDate, exp.frequency);
      while (nextDate <= todayDateStr) {
        nextDate = getNextOccurrenceDate(nextDate, exp.frequency);
      }

      updatedExpenses[idx] = {
        ...exp,
        nextOccurrenceDate: nextDate,
        lastGeneratedDate: exp.nextOccurrenceDate
      };

      hasChanges = true;
    }
  });

  if (hasChanges) {
    dbData.expenses = updatedExpenses;
  }
}

// --- Run Simulation on Simulated Date: 2026-06-08 ---
console.log('--- Initial Expenses ---');
console.log(dbData.expenses);

checkAndGenerateRecurringExpenses('2026-06-08');

console.log('\n--- After Generation check for 2026-06-08 ---');
console.log(dbData.expenses);

// Verification Assertions:
// 1. Rent template (id 1) should have spawned 1 occurrence (due 2026-06-01) and advanced nextOccurrenceDate to 2026-07-01
const rentTemplate = dbData.expenses.find(ex => ex.id === 1);
if (rentTemplate.nextOccurrenceDate !== '2026-07-01') {
  throw new Error('Rent template next due date not advanced properly. Expected 2026-07-01, got ' + rentTemplate.nextOccurrenceDate);
}

// 2. Daily snack template (id 2) was due 2026-06-07. Today is 2026-06-08.
// It should have generated an occurrence for 2026-06-07, and advanced its next due date to 2026-06-08.
// Wait, is 2026-06-08 <= today (2026-06-08)? Yes! So the loop advances it to 2026-06-09.
// Let's check: nextDate = 2026-06-08. Since 2026-06-08 <= 2026-06-08, the loop does another step: nextDate = 2026-06-09. Correct!
const dailyTemplate = dbData.expenses.find(ex => ex.id === 2);
if (dailyTemplate.nextOccurrenceDate !== '2026-06-09') {
  throw new Error('Daily template next due date not advanced properly. Expected 2026-06-09, got ' + dailyTemplate.nextOccurrenceDate);
}

// 3. Marketing template (id 3) was due 2026-06-15, which is in the future.
// It should NOT have spawned any instances and its next due date should remain 2026-06-15.
const mktTemplate = dbData.expenses.find(ex => ex.id === 3);
if (mktTemplate.nextOccurrenceDate !== '2026-06-15') {
  throw new Error('Future template should not have been updated.');
}

// 4. Assert generated instances exist.
const spawnedInstances = dbData.expenses.filter(ex => ex.isRecurringInstance);
console.log('\nSpawned instances:', spawnedInstances);
if (spawnedInstances.length !== 2) {
  throw new Error('Expected 2 spawned instances, got ' + spawnedInstances.length);
}

const rentInstance = spawnedInstances.find(ex => ex.templateId === 1);
if (!rentInstance || rentInstance.amount !== 1000 || rentInstance.date !== '2026-06-01') {
  throw new Error('Spawned Rent instance incorrect or missing.');
}

const dailyInstance = spawnedInstances.find(ex => ex.templateId === 2);
if (!dailyInstance || dailyInstance.amount !== 50 || dailyInstance.date !== '2026-06-07') {
  throw new Error('Spawned Daily instance incorrect or missing.');
}

console.log('\nAll Auto-Recurring Expense logic checked and verified successfully!');
