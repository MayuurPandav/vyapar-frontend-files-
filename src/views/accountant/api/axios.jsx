import axios from 'axios';

const baseURL = '/api/accountant';

const api = axios.create({ baseURL });

// Attach token if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('vyapar_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
