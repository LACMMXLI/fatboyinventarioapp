import axios from 'axios';
import { useAuthStore } from '../context/auth-store';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// ===========================
// Auth API
// ===========================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ===========================
// Users API
// ===========================
export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}`, data),
};

// ===========================
// Branches API
// ===========================
export const branchesApi = {
  list: (params?: Record<string, unknown>) => api.get('/branches', { params }),
  getById: (id: string) => api.get(`/branches/${id}`),
  create: (data: Record<string, unknown>) => api.post('/branches', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/branches/${id}`, data),
};

// ===========================
// Categories API
// ===========================
export const categoriesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/categories', { params }),
  create: (data: Record<string, unknown>) => api.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/categories/${id}`, data),
};

// ===========================
// Products API
// ===========================
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getByCategory: (isActive = true) =>
    api.get('/products/by-category', { params: { isActive } }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/products/${id}`, data),
};

// ===========================
// Counts API
// ===========================
export const countsApi = {
  list: (params?: Record<string, unknown>) => api.get('/counts', { params }),
  getCurrentDraft: () => api.get('/counts/current'),
  getById: (id: string) => api.get(`/counts/${id}`),
  create: (notes?: string) => api.post('/counts', { notes }),
  updateItems: (id: string, items: { productId: string; quantity: number }[]) =>
    api.patch(`/counts/${id}/items`, { items }),
  finalize: (id: string) => api.post(`/counts/${id}/finalize`),
};

// ===========================
// Reports API
// ===========================
export const reportsApi = {
  countsSummary: (params?: Record<string, unknown>) =>
    api.get('/reports/counts-summary', { params }),
  productHistory: (productId: string, params?: Record<string, unknown>) =>
    api.get(`/reports/product-history/${productId}`, { params }),
};
