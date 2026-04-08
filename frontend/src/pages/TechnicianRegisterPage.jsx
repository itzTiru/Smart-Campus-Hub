import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerTechnician } from '../api/technicianAuthApi';

const categories = [
  'ELECTRICAL',
  'PLUMBING',
  'IT_EQUIPMENT',
  'FURNITURE',
  'SAFETY',
  'HVAC',
  'OTHER',
];

const TechnicianRegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    specialtyCategory: 'IT_EQUIPMENT',
    yearsOfExperience: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await registerTechnician({
        ...form,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience, 10) : null,
      });
      setSuccess('Technician registered successfully. Redirecting to technician login...');
      setTimeout(() => navigate('/technician/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register technician');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">Technician Registration</h1>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Create a technician account with specialty category for ticket assignments.
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Username"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Full Name"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.specialtyCategory}
              onChange={(e) => setForm({ ...form, specialtyCategory: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              max="60"
              value={form.yearsOfExperience}
              onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
              placeholder="Years of Exp."
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Registering...' : 'Register Technician'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Back to <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default TechnicianRegisterPage;
