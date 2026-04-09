import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginTechnician } from '../api/technicianAuthApi';

const TechnicianLoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await loginTechnician({ username, password });
      const token = res?.data?.token;
      const technician = res?.data?.technician;

      if (token) localStorage.setItem('technician_token', token);
      if (technician) localStorage.setItem('technician_user', JSON.stringify(technician));

      setSuccess('Technician login successful.');
      setTimeout(() => navigate('/technician/dashboard', { replace: true }), 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">Technician Login</h1>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Sign in with your technician username and password.
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Need an account? <Link to="/technician/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          Back to <Link to="/login" className="text-blue-600 hover:underline">Main Login</Link>
        </p>
      </div>
    </div>
  );
};

export default TechnicianLoginPage;
