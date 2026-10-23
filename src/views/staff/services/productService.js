import api from './api';

const productService = {
  // Get all products
  getAllProducts: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/products', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Search products by barcode (partial match)
  searchByBarcode: async (barcode) => {
    try {
      const response = await api.get(`/products/barcode/search?barcode=${barcode}`);
      return response.data;
    } catch (error) {
      console.error('Error searching product by barcode:', error);
      throw error;
    }
  },

  // Get product by exact barcode
  getProductByBarcode: async (barcode) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      throw error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Create product
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Update product price
  updatePrice: async (id, newPrice) => {
    try {
      const response = await api.put(`/products/${id}/price`, { price: newPrice });
      return response.data;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  },

  // Update product stock
  updateStock: async (id, quantity, type = 'decrement') => {
    try {
      const response = await api.put(`/products/${id}/stock`, { quantity, type });
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Get low stock products
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/products/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },

  // Get stock summary
  getStockSummary: async () => {
    try {
      const response = await api.get('/products/summary/stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      throw error;
    }
  },
};

export default productService;
