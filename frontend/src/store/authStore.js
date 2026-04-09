import { create } from 'zustand';
import api from '../api/axiosConfig';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => {
    set({ user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('technician_token');
    localStorage.removeItem('technician_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      // Backend wraps in ApiResponse: { success, data: UserResponse, message }
      const user = response.data?.data || response.data;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('technician_token');
      localStorage.removeItem('technician_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
