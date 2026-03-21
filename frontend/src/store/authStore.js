import { create } from 'zustand';
import { authAPI, usersAPI } from '../services/api';

const safeParseUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: safeParseUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return { success: true, user };
    } catch (error) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || error.response?.data?.error ||
        (error.response?.status === 401 ? 'Email o contraseña incorrectos' : null) ||
        (error.code === 'ERR_NETWORK' ? 'No se pudo conectar. Revisa tu conexión.' : null) ||
        'Error al iniciar sesión';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg, code };
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ email, username, password });
      const { user } = response.data.data || {};
      set({ isLoading: false });
      return { success: true, user, needsVerification: true };
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error ||
        (error.code === 'ERR_NETWORK' ? 'No se pudo conectar. Revisa tu conexión.' : null) ||
        'Error al crear la cuenta';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      error: null
    });
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const response = await usersAPI.updateProfile(data);
      const result = response.data;
      
      if (result.success) {
        const updatedUser = { ...get().user, ...result.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      set({ isLoading: false });
      return { success: false, message };
    }
  },

  updateAvatar: async (avatarUrl) => {
    const user = get().user;
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  resendVerification: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.resendVerification(email);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error ||
        'Error al reenviar el email';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
