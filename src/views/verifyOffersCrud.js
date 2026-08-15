// Mock dbData State
let dbData = {
  offers: [
    { id: 1, code: 'WELCOME50', type: 'Flat Discount', value: 50, startDate: '2026-06-01', endDate: '2026-06-30', minBillAmount: 500, usageLimit: 10, usedCount: 2, isActive: true }
  ]
};

// Simulate handleOfferSubmit (Create & Edit)
function handleOfferSubmitSimulated(editingOffer, offerForm) {
  let updatedOffers = [...(dbData.offers || [])];
  
  if (editingOffer) {
    const idx = updatedOffers.findIndex(o => o.id === editingOffer.id);
    if (idx !== -1) {
      updatedOffers[idx] = { ...editingOffer, ...offerForm };
    }
  } else {
    const newId = Math.max(0, ...updatedOffers.map(o => o.id)) + 1;
    updatedOffers.push({ ...offerForm, id: newId, usedCount: 0 });
  }
  
  dbData.offers = updatedOffers;
}

// Simulate handleOfferToggle
function handleOfferToggleSimulated(id) {
  dbData.offers = dbData.offers.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o);
}

// Simulate deleteOffer
function deleteOfferSimulated(id) {
  dbData.offers = dbData.offers.filter(o => o.id !== id);
}

// --- RUN SIMULATION TESTS ---

console.log('Initial Offers List:');
console.log(dbData.offers);

// 1. Create a new offer (Percentage discount)
console.log('\nSimulating Creating a new offer...');
const newOfferForm = {
  code: 'SUMMER20',
  type: 'Percentage',
  value: 20,
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  minBillAmount: 1000,
  usageLimit: 50,
  isActive: true
};
handleOfferSubmitSimulated(null, newOfferForm);
console.log('Offers List:', dbData.offers);

if (dbData.offers.length !== 2) {
  throw new Error('Offer creation failed. Length should be 2.');
}
if (dbData.offers[1].id !== 2 || dbData.offers[1].code !== 'SUMMER20' || dbData.offers[1].usedCount !== 0) {
  throw new Error('New offer attributes are incorrect.');
}

// 2. Edit the offer (WELCOME50 -> WELCOME100, Flat Discount: 100)
console.log('\nSimulating Editing an existing offer...');
const existingOffer = dbData.offers[0]; // WELCOME50
const editOfferForm = {
  ...existingOffer,
  code: 'WELCOME100',
  value: 100
};
handleOfferSubmitSimulated(existingOffer, editOfferForm);
console.log('Offers List:', dbData.offers);

if (dbData.offers[0].code !== 'WELCOME100' || dbData.offers[0].value !== 100) {
  throw new Error('Offer edit failed.');
}

// 3. Toggle active status of WELCOME100
console.log('\nSimulating Toggling active status...');
handleOfferToggleSimulated(1);
console.log('Offers List after toggle:', dbData.offers);

if (dbData.offers[0].isActive !== false) {
  throw new Error('Offer active status toggle failed.');
}

// 4. Delete offer SUMMER20
console.log('\nSimulating Deleting an offer...');
deleteOfferSimulated(2);
console.log('Offers List after delete:', dbData.offers);

if (dbData.offers.length !== 1 || dbData.offers.some(o => o.id === 2)) {
  throw new Error('Offer deletion failed.');
}

console.log('\nAll Offer CRUD actions (Create, Edit, Status Toggle, and Delete) simulated and verified successfully!');
