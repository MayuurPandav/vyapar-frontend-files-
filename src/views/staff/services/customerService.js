import api from './api';

const customerService = {
  // Get all customers
  getAllCustomers: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/customers', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  // Create customer
  createCustomer: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Get customer invoices
  getCustomerInvoices: async (id, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/customers/${id}/invoices`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  },

  // Get customer payment history
  getCustomerPaymentHistory: async (id) => {
    try {
      const response = await api.get(`/customers/${id}/payment-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Get customer credit limit
  getCustomerCreditLimit: async (id) => {
    try {
      const response = await api.get(`/customers/${id}/credit-limit`);
      return response.data;
    } catch (error) {
      console.error('Error fetching credit limit:', error);
      throw error;
    }
  },
};

export default customerService;
