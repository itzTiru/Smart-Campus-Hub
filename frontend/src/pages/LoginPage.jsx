import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosConfig';
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const LoginPage = () => {
  const { isAuthenticated, isLoading, setAuth } = useAuthStore();
  const [devLoading, setDevLoading] = useState(false);

  const handleDevLogin = async (role) => {
    setDevLoading(true);
    try {
      const res = await api.post(`/auth/dev-login?role=${role}`);
      const { token, user } = res.data.data;
      setAuth(user, token);
    } catch (err) {
      console.error('Dev login failed:', err);
    }
    setDevLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center dark:bg-gray-800 dark:border-gray-700">
          {/* Logo / Title */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
            SC
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Smart Campus Hub
          </h1>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            Sign in to manage campus resources, bookings, and maintenance
          </p>

          {/* Google Sign-In */}
          <a
            href={`${API_BASE}/oauth2/authorization/google`}
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </a>
        </div>

        {/* Dev login buttons - remove before submission */}
        <div className="mt-4 rounded-xl border border-dashed border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20 dark:border-yellow-600">
          <p className="mb-3 text-xs font-semibold text-yellow-700 dark:text-yellow-400">DEV LOGIN (Testing Only)</p>
          <div className="flex gap-2">
            <button onClick={() => handleDevLogin('ADMIN')} disabled={devLoading}
              className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              Admin
            </button>
            <button onClick={() => handleDevLogin('USER')} disabled={devLoading}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              User
            </button>
            <button onClick={() => handleDevLogin('TECHNICIAN')} disabled={devLoading}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
              Technician
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Use your university Google account to sign in
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
