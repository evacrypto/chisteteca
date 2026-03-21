import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE = API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';

/** URL para compartir en redes sociales. Usa el endpoint /o/:id del backend que devuelve HTML con meta OG para crawlers (Facebook, X). */
export const getShareUrl = (contentId) => {
  const base = API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}/o/${contentId}`;
};

/** Convierte rutas de uploads a URL válida. En dev usa ruta relativa (proxy Vite). En prod usa URL completa del backend. */
export const getUploadUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // En desarrollo: ruta relativa para que pase por el proxy de Vite (/uploads -> backend)
  if (import.meta.env.DEV) return path.startsWith('/') ? path : `/${path}`;
  // En producción: URL completa del backend
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Con FormData, no fijar Content-Type: axios pone el boundary automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors with retry logic
let isServerDownToastShown = false;

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const withLimitParam = (limit) => ({ params: { limit } });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || error.config?.baseURL || '');
      const isAuthRequest = /\/auth\/(login|register)/.test(url);
      const isOnAuthPage = typeof window !== 'undefined' && 
        (window.location.pathname === '/login' || window.location.pathname === '/register');
      if (!isAuthRequest && !isOnAuthPage) {
        clearAuthAndRedirect();
      }
    }
    
    // Handle connection errors
    if (!error.response && error.code === 'ERR_NETWORK') {
      if (!isServerDownToastShown) {
        isServerDownToastShown = true;
        toast.error('⚠️ Servidor no disponible. Intentando reconectar...', {
          autoClose: 5000,
          onClose: () => {
            isServerDownToastShown = false;
          }
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// Users API
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (data) => api.put('/users/avatar', data, { timeout: 30000 }),
  getFavorites: () => api.get('/users/favorites'),
  getPublicFavorites: (userId) => api.get(`/users/${userId}/favorites`),
  addToFavorites: (contentId) => api.post(`/users/favorites/${contentId}`),
  removeFromFavorites: (contentId) => api.delete(`/users/favorites/${contentId}`),
  followUser: (userId) => api.post(`/users/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/users/unfollow/${userId}`),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`)
};

// Content API
export const contentAPI = {
  getAll: (params) => api.get('/content', { params }),
  getOne: (id) => api.get(`/content/${id}`),
  getAdjacent: (id) => api.get(`/content/${id}/adjacent`),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  getPopular: (params) => api.get('/content/popular', { params: typeof params === 'number' ? { limit: params } : params }),
  getRandom: (limit) => api.get('/content/random', withLimitParam(limit)),
  report: (id, reason) => api.post(`/content/${id}/report`, { reason }),
  share: (id) => api.post(`/content/${id}/share`)
};

// Interactions API
export const interactionsAPI = {
  likeContent: (contentId) => api.post(`/interactions/like/${contentId}`),
  getComments: (contentId, params) => api.get(`/interactions/comment/${contentId}`, { params }),
  createComment: (contentId, data) => api.post(`/interactions/comment/${contentId}`, data),
  likeComment: (commentId) => api.post(`/interactions/comment/${commentId}/like`),
  updateComment: (commentId, data) => api.put(`/interactions/comment/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/interactions/comment/${commentId}`)
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (period) => api.get('/admin/analytics', { params: { period } }),
  getUsers: (params) => api.get('/users', { params }),
  getPendingContent: (params) => api.get('/admin/content/pending', { params }),
  getAllContent: (params) => api.get('/admin/content/all', { params }),
  approveAllPendingContent: () => api.put('/admin/content/approve-all'),
  approveContent: (id) => api.put(`/admin/content/${id}/approve`),
  rejectContent: (id, reason) => api.put(`/admin/content/${id}/reject`, { reason }),
  deleteContent: (id) => api.delete(`/admin/content/${id}`),
  suspendUser: (id, reason) => api.put(`/admin/users/${id}/suspend`, { reason }),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getReportedContent: () => api.get('/admin/content/reported'),
  getDuplicates: (params) => api.get('/admin/content/duplicates', { params }),
  getPendingCategories: () => api.get('/admin/categories/pending'),
  approveAllCategories: () => api.put('/admin/categories/approve-all'),
  approveCategory: (id) => api.put(`/admin/categories/${id}/approve`),
  rejectCategory: (id, reason) => api.put(`/admin/categories/${id}/reject`, { reason })
};

export default api;
