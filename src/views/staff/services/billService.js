import api from './api';

const billService = {
  // Get all bills with pagination and filters
  getAllBills: async (page = 1, limit = 10, search = '', status = '') => {
    try {
      const response = await api.get('/bills', {
        params: { page, limit, search, status },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  },

  // Get single bill by ID
  getBillById: async (id) => {
    try {
      const response = await api.get(`/bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  },

  // Create new bill
  createBill: async (billData) => {
    try {
      const response = await api.post('/bills', billData);
      return response.data;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  },

  // Update bill
  updateBill: async (id, billData) => {
    try {
      const response = await api.put(`/bills/${id}`, billData);
      return response.data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  },

  // Update payment
  updatePayment: async (id, paymentData) => {
    try {
      const response = await api.put(`/bills/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete bill
  deleteBill: async (id) => {
    try {
      const response = await api.delete(`/bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },

  // Issue credit note
  issueCreditNote: async (id, creditNoteData) => {
    try {
      const response = await api.post(`/bills/${id}/credit-note`, creditNoteData);
      return response.data;
    } catch (error) {
      console.error('Error issuing credit note:', error);
      throw error;
    }
  },

  // Get credit notes for a bill
  getCreditNotes: async (id) => {
    try {
      const response = await api.get(`/bills/${id}/credit-notes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      throw error;
    }
  },

  // Get bill as text
  getBillAsText: async (id) => {
    try {
      const response = await api.get(`/bills/${id}/export/text`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting bill as text:', error);
      throw error;
    }
  },

  // Get bill as JSON
  getBillAsJSON: async (id) => {
    try {
      const response = await api.get(`/bills/${id}/export/json`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting bill as JSON:', error);
      throw error;
    }
  },

  // Get bill as CSV
  getBillAsCSV: async (id) => {
    try {
      const response = await api.get(`/bills/${id}/export/csv`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting bill as CSV:', error);
      throw error;
    }
  },

  // Download file helper
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Print bill
  printBill: async (id) => {
    try {
      const bill = await billService.getBillById(id);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${bill.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-number { font-size: 24px; font-weight: bold; }
              .details { margin: 20px 0; }
              .details-row { display: flex; justify-content: space-between; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { text-align: right; margin-top: 20px; }
              .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="invoice-number">Invoice</div>
                <div>${bill.invoiceNumber}</div>
              </div>
              <div class="details">
                <div class="details-row">
                  <span><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString('en-IN')}</span>
                  <span><strong>Status:</strong> ${bill.status}</span>
                </div>
                <div class="details-row">
                  <span><strong>Customer:</strong> ${bill.customerName}</span>
                  <span><strong>Phone:</strong> ${bill.customerPhone || 'N/A'}</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${bill.products.map((item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.price.toFixed(2)}</td>
                      <td>₹${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="summary">
                <div><strong>Subtotal:</strong> ₹${bill.subtotal?.toFixed(2) || '0.00'}</div>
                <div><strong>Tax:</strong> ₹${((bill.cgst || 0) + (bill.sgst || 0)).toFixed(2)}</div>
                <div class="total">Total: ₹${bill.totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing bill:', error);
      throw error;
    }
  },
};

export default billService;
