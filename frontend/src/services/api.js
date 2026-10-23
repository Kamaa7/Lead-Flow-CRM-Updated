import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Handle unauthorized
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // Show error message from server if available
      const errorMessage = error.response.data?.detail || 'An error occurred';
      toast.error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      toast.error(error.message || 'An error occurred');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => 
    api.post('/auth/login', { username: email, password }),
  
  register: (email, password, fullName) =>
    api.post('/auth/register', { email, password, full_name: fullName }),
  
  getProfile: () => 
    api.get('/users/me')
};

// Leads API
export const leadsApi = {
  getLeads: () => api.get('/leads/'),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (lead) => api.post('/leads/', lead),
  updateLead: (id, updates) => api.put(`/leads/${id}`, updates),
  deleteLead: (id) => api.delete(`/leads/${id}`)
};

export default api;