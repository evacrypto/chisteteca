import { create } from 'zustand';
import { authAPI, usersAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
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
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ email, username, password });
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
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
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

  clearError: () => set({ error: null })
}));

export default useAuthStore;
