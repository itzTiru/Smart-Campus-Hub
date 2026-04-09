import { useState, useMemo } from 'react';
import { Wrench } from 'lucide-react';
import { updateMyTechnicianProfile } from '../api/technicianApi';

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

const TechnicianProfileCompletionModal = ({ technician, onComplete }) => {
  const [form, setForm] = useState({
    phone: technician?.phone?.replace('+94', '') || '',
    specialtyCategory: technician?.specialtyCategory === 'OTHER' ? '' : (technician?.specialtyCategory || ''),
    yearsOfExperience: technician?.yearsOfExperience || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validationErrors = useMemo(() => {
    const errs = {};
    const digits = form.phone.replace(/\D/g, '');
    if (!digits) {
      errs.phone = 'Mobile number is required';
    } else if (digits.length !== 9) {
      errs.phone = 'Enter the 9 digits after +94';
    }
    if (!form.specialtyCategory || form.specialtyCategory === 'OTHER') {
      errs.specialtyCategory = 'Please select your specialty';
    }
    if (form.yearsOfExperience !== '' && form.yearsOfExperience !== null) {
      const y = Number(form.yearsOfExperience);
      if (Number.isNaN(y) || y < 0 || y > 60) {
        errs.yearsOfExperience = 'Must be between 0 and 60';
      }
    }
    return errs;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        phone: `+94${form.phone.replace(/\D/g, '')}`,
        specialtyCategory: form.specialtyCategory,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience, 10) : null,
      };
      const res = await updateMyTechnicianProfile(payload);
      const updated = res.data || res;
      onComplete(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Complete Your Profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fill in these details to get started</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Mobile Number
            </label>
            <div className="relative">
              <input
                required
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                placeholder="712345678"
                className={`w-full rounded-xl border px-3 py-2.5 pl-16 text-sm outline-none transition ${
                  validationErrors.phone
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
                }`}
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
                +94
              </span>
            </div>
            {validationErrors.phone && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Specialty Category
            </label>
            <select
              value={form.specialtyCategory}
              onChange={(e) => setForm((p) => ({ ...p, specialtyCategory: e.target.value }))}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
                validationErrors.specialtyCategory
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
              }`}
            >
              <option value="">Select your specialty...</option>
              {categories.filter((c) => c !== 'OTHER').map((c) => (
                <option key={c} value={c}>{categoryLabels[c]}</option>
              ))}
            </select>
            {validationErrors.specialtyCategory && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.specialtyCategory}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Years of Experience <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={form.yearsOfExperience}
              onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: e.target.value }))}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            {validationErrors.yearsOfExperience && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.yearsOfExperience}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicianProfileCompletionModal;
