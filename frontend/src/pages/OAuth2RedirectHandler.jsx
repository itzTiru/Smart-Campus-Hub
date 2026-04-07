import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      useAuthStore.setState({ token, isAuthenticated: true });
      checkAuth()
        .then(() => navigate('/', { replace: true }))
        .catch(() => {
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        });
    } else {
      // Defer setState to avoid synchronous setState in effect body
      const timer = setTimeout(() => {
        setError('No authentication token received.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, checkAuth, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl text-red-600">!</span>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Authentication Error</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="mt-2 text-xs text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Completing sign-in...</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;
