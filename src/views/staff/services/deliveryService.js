import api from './api';

const deliveryService = {
  // Get all deliveries
  getAllDeliveries: async (page = 1, limit = 100, search = '') => {
    try {
      const response = await api.get('/deliveries', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
  },

  // Get delivery by ID
  getDeliveryById: async (id) => {
    try {
      const response = await api.get(`/deliveries/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery:', error);
      throw error;
    }
  },

  // Create new delivery
  createDelivery: async (deliveryData) => {
    try {
      const response = await api.post('/deliveries', deliveryData);
      return response.data;
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  },

  // Update delivery status/details
  updateDelivery: async (id, deliveryData) => {
    try {
      const response = await api.put(`/deliveries/${id}`, deliveryData);
      return response.data;
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  },
};

export default deliveryService;
