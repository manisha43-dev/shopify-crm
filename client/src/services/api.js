import axios from 'axios';

const api = axios.create({ baseURL:  process.env.REACT_APP_API_URL + '/api' || 'http://localhost:5000/api' });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('crm_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

//  Auth 
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

//  Dashboard 
export const getDashboard = (shopDomain) =>
  api.get('/dashboard', { params: { shopDomain } });

//  Contacts 
export const getContacts = (params) => api.get('/contacts', { params });
export const getContact = (id) => api.get(`/contacts/${id}`);
export const updateContact = (id, data) => api.patch(`/contacts/${id}`, data);

//  Orders 
export const getOrders = (params) => api.get('/orders', { params });

//  Deals 
export const getDeals = (params) => api.get('/deals', { params });
export const updateDeal = (id, data) => api.patch(`/deals/${id}`, data);

//  Abandoned Carts 
export const getCarts = (params) => api.get('/carts', { params });

//  Shopify Integration 
export const getStores = () => api.get('/shopify/stores');
export const getSyncStatus = (shop) => api.get(`/shopify/sync-status/${shop}`);
export const resync = (shop, entity) => api.post(`/shopify/resync/${shop}`, { entity });
export const disconnectStore = (shop) => api.delete(`/shopify/disconnect/${shop}`);
export const getWebhookLog = () => api.get('/webhooks/log');

export default api;