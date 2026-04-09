import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus, Wrench } from 'lucide-react';
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

const categoryLabels = {
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  IT_EQUIPMENT: 'IT Equipment',
  FURNITURE: 'Furniture',
  SAFETY: 'Safety',
  HVAC: 'HVAC',
  OTHER: 'Other',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneDigitsPattern = /^\d{9}$/;

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
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!form.username.trim()) {
      nextErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_.-]{4,30}$/.test(form.username.trim())) {
      nextErrors.username = 'Use 4-30 letters, numbers, dot, underscore, or hyphen';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    const normalizedPhone = form.phone.replace(/\D/g, '');

    if (!normalizedPhone) {
      nextErrors.phone = 'Mobile number is required';
    } else if (!phoneDigitsPattern.test(normalizedPhone)) {
      nextErrors.phone = 'Enter the 9 digits after +94';
    }

    if (form.yearsOfExperience !== '') {
      const years = Number(form.yearsOfExperience);
      if (Number.isNaN(years) || years < 0 || years > 60) {
        nextErrors.yearsOfExperience = 'Years of experience must be between 0 and 60';
      }
    }

    return nextErrors;
  }, [form]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      username: true,
      password: true,
      fullName: true,
      email: true,
      phone: true,
      yearsOfExperience: true,
    });

    if (Object.keys(errors).length > 0) {
      setError('Please correct the highlighted fields before submitting.');
      setSuccess('');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await registerTechnician({
        ...form,
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: `+94${form.phone.replace(/\D/g, '')}`,
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

  const inputClassName = (field) => `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
    touched[field] && errors[field]
      ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-300 focus:border-red-500 dark:border-red-700 dark:bg-red-950/30 dark:text-red-100'
      : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
  }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Technician Registration</h1>
              <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
                Create a professional technician account for ticket assignments, job updates, and internal messaging.
              </p>
            </div>
          </div>

          {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
          {success && <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account Details</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Username</label>
                  <input
                    required
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    onBlur={() => handleBlur('username')}
                    placeholder="e.g. nimal.tech"
                    className={inputClassName('username')}
                  />
                  {touched.username && errors.username && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.username}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Minimum 8 characters"
                    className={inputClassName('password')}
                  />
                  {touched.password && errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact Information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Full Name</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Enter technician full name"
                    className={inputClassName('fullName')}
                  />
                  {touched.fullName && errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Email Address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="name@example.com"
                    className={inputClassName('email')}
                  />
                  {touched.email && errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Mobile Number</label>
                  <div className="relative">
                    <input
                      required
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                      onBlur={() => handleBlur('phone')}
                      placeholder="712345678"
                      className={`${inputClassName('phone')} pl-16`}
                    />
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      +94
                    </span>
                  </div>
                  {touched.phone && errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Work Profile</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Specialty Category</label>
                  <select
                    value={form.specialtyCategory}
                    onChange={(e) => updateField('specialtyCategory', e.target.value)}
                    className={inputClassName('specialtyCategory')}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{categoryLabels[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.yearsOfExperience}
                    onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                    onBlur={() => handleBlur('yearsOfExperience')}
                    placeholder="e.g. 5"
                    className={inputClassName('yearsOfExperience')}
                  />
                  {touched.yearsOfExperience && errors.yearsOfExperience && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.yearsOfExperience}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Registering Technician...' : 'Create Technician Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account? <Link to="/technician/login" className="font-medium text-blue-600 hover:underline">Technician Login</Link>
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
          <div className="space-y-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Registration Guidelines</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Use a valid email and mobile number so administrators and users can coordinate service work smoothly.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">What to prepare</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>Choose a professional username that is easy to identify internally.</li>
                <li>Use an active email address for assignment and communication updates.</li>
                <li>Enter the mobile number with country code, for example `+94712345678`.</li>
                <li>Select the specialty that best matches the tickets you will handle.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianRegisterPage;
