import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { createBooking, checkConflicts, getMyBookings } from '../api/bookingApi';
import { getResources } from '../api/resourceApi';
import { useAuthStore } from '../store/authStore';

const NewBookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchParams] = useSearchParams();
  const preselectedResource = searchParams.get('resourceId');

  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    resourceId: preselectedResource || '',
    startDate: '', startTimeSlot: '',
    endDate: '', endTimeSlot: '',
    purpose: '', expectedAttendees: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [, setCheckingConflict] = useState(false);
  const [error, setError] = useState(null);
  const [activeBookingCount, setActiveBookingCount] = useState(0);

  useEffect(() => {
    getResources({ status: 'ACTIVE', size: 100 })
      .then((res) => setResources((res.data || res).content || []))
      .catch(() => {});
    // Fetch active booking count
    getMyBookings(0, 100)
      .then((res) => {
        const data = res.data || res;
        const active = (data.content || []).filter(
          (b) => b.status === 'PENDING' || b.status === 'APPROVED'
        );
        setActiveBookingCount(active.length);
      })
      .catch(() => {});
  }, []);

  // Compute selected resource object
  const selectedResource = useMemo(
    () => resources.find((r) => String(r.id) === String(form.resourceId)),
    [resources, form.resourceId]
  );

  // Generate time slot options based on resource availability
  const timeOptions = useMemo(() => {
    const start = selectedResource?.availabilityStart || '08:00';
    const end = selectedResource?.availabilityEnd || '21:00';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    const slots = [];
    for (let m = startMinutes; m <= endMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const label = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push(label);
    }
    return slots;
  }, [selectedResource]);

  // Date constraints
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Combine date + time into ISO string
  const buildDateTime = (date, time) => {
    if (!date || !time) return '';
    return `${date}T${time}:00`;
  };

  const startTime = buildDateTime(form.startDate, form.startTimeSlot);
  const endTime = buildDateTime(form.endDate, form.endTimeSlot);

  useEffect(() => {
    const runConflictCheck = async () => {
      if (!form.resourceId || !startTime || !endTime) return;
      setCheckingConflict(true);
      try {
        const result = await checkConflicts(form.resourceId, startTime, endTime);
        setConflict((result.data !== undefined ? result.data : result) === true);
      } catch {
        setConflict(false);
      } finally {
        setCheckingConflict(false);
      }
    };

    runConflictCheck();
  }, [form.resourceId, startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setError('Please select both start and end date/time');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createBooking({
        resourceId: form.resourceId,
        startTime,
        endTime,
        purpose: form.purpose,
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
      });
      navigate('/bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally { setSubmitting(false); }
  };

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bookings')} className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Booking</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {conflict && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>This time slot conflicts with an existing booking. You can still submit, but it may be rejected.</span>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
        <Info className="h-4 w-4 shrink-0" />
        <span>Active bookings: {activeBookingCount}/5</span>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-lg border p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Resource *</label>
          <select required value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">Select a resource...</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.location || 'No location'}</option>)}
          </select>
        </div>

        {selectedResource && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 space-y-1">
            <p className="font-medium">Booking Rules</p>
            <p>Min: {selectedResource.minBookingHours || 1} hour(s), Max: {selectedResource.maxBookingHours || 4} hour(s)</p>
            <p>Available: {selectedResource.availabilityStart || '08:00'} - {selectedResource.availabilityEnd || '21:00'}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start Date *</label>
            <input required type="date" min={today} max={maxDate} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start Time *</label>
            <select required value={form.startTimeSlot} onChange={(e) => setForm({ ...form, startTimeSlot: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Select time...</option>
              {timeOptions.map((t) => <option key={`start-${t}`} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End Date *</label>
            <input required type="date" min={form.startDate || today} max={maxDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End Time *</label>
            <select required value={form.endTimeSlot} onChange={(e) => setForm({ ...form, endTimeSlot: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Select time...</option>
              {timeOptions.map((t) => <option key={`end-${t}`} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Purpose *</label>
          <textarea required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} placeholder="Describe the purpose of this booking..." className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Expected Attendees</label>
          <input type="number" value={form.expectedAttendees} onChange={(e) => setForm({ ...form, expectedAttendees: e.target.value })} placeholder="Number of attendees" className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate('/bookings')} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBookingPage;
