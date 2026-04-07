import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, [checkAuth]);

  return { user, isAuthenticated, isLoading };
};
