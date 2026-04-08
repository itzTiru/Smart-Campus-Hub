import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { createTicket } from '../api/ticketApi';
import { getResources } from '../api/resourceApi';
import { TICKET_CATEGORIES, PRIORITY } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

const NewTicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', resourceId: '', location: '',
    category: 'IT_EQUIPMENT', priority: 'MEDIUM', contactPhone: '', contactEmail: '',
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getResources({ size: 100 })
      .then((res) => setResources((res.data || res).content || []))
      .catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ticketData = {
        ...form,
        resourceId: form.resourceId || null,
      };
      await createTicket(ticketData, images.length > 0 ? images : null);
      navigate('/tickets');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally { setSubmitting(false); }
  };

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tickets')} className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Report an Issue</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-lg border p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief summary of the issue" className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Detailed description..." className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              {TICKET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Related Resource</label>
          <select value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">None</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Location *</label>
          <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lab 3, Block B, Floor 1" className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contact Phone</label>
            <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+94771234567" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="you@campus.lk" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Attachments (max 3 images)</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                {img.name}
                <button type="button" onClick={() => removeImage(i)} className="ml-2 text-red-500"><X className="inline h-3 w-3" /></button>
              </div>
            ))}
          </div>
          {images.length < 3 && (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <Upload className="h-4 w-4" /> Add Image
              <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate('/tickets')} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicketPage;
