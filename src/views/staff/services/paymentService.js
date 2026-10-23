import api from './api';

const paymentService = {
  // Get all payments
  getAllPayments: async (page = 1, limit = 10, filter = {}) => {
    try {
      const params = { page, limit, ...filter };
      const response = await api.get('/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Create payment
  createPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment
  updatePayment: async (id, paymentData) => {
    try {
      const response = await api.put(`/payments/${id}`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Get payment receipt
  getPaymentReceipt: async (id) => {
    try {
      const response = await api.get(`/payments/${id}/receipt`);
      return response.data;
    } catch (error) {
      console.error('Error fetching receipt:', error);
      throw error;
    }
  },

  // Get payments for bill
  getBillPayments: async (billId) => {
    try {
      const response = await api.get(`/payments/bill/${billId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bill payments:', error);
      throw error;
    }
  },

  // Get payment summary
  getPaymentSummary: async (filters = {}) => {
    try {
      const response = await api.get('/payments/summary', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      throw error;
    }
  },
};

export default paymentService;
