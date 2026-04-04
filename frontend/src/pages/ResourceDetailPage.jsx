import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getResourceById, updateResource, deleteResource, toggleResourceStatus } from '../api/resourceApi';
import { useAuthStore } from '../store/authStore';
import { RESOURCE_TYPES, RESOURCE_STATUS } from '../utils/constants';
import ResourceTimeline from '../components/resources/ResourceTimeline';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchResource = async () => {
    setLoading(true);
    try {
      const result = await getResourceById(id);
      const data = result.data || result;
      setResource(data);
      setEditForm({
        name: data.name || '', type: data.type || 'LECTURE_HALL', capacity: data.capacity || '',
        location: data.location || '', building: data.building || '', floor: data.floor || '',
        description: data.description || '', availabilityStart: data.availabilityStart || '08:00',
        availabilityEnd: data.availabilityEnd || '18:00',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resource');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchResource(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateResource(id, { ...editForm, capacity: parseInt(editForm.capacity) || 0 });
      setEditing(false);
      fetchResource();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    try { await deleteResource(id); navigate('/resources'); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggle = async () => {
    try { await toggleResourceStatus(id); fetchResource(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to toggle'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  if (!resource) return <div className="py-12 text-center text-gray-500">Resource not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/resources" className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{resource.name}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RESOURCE_STATUS[resource.status]?.bgClass || 'bg-gray-100'}`}>
          {RESOURCE_STATUS[resource.status]?.label || resource.status}
        </span>
      </div>

      {isAdmin && !editing && (
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"><Edit className="h-4 w-4" /> Edit</button>
          <button onClick={handleToggle} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            {resource.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
            {resource.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleUpdate} className="space-y-3 rounded-lg border p-4">
          <h2 className="font-bold">Edit Resource</h2>
          <input required placeholder="Name *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
            {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Capacity" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Building" value={editForm.building} onChange={(e) => setEditForm({ ...editForm, building: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Floor" value={editForm.floor} onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <textarea placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Details</h3>
            <p className="text-sm"><span className="text-gray-500">Type:</span> {RESOURCE_TYPES.find(t => t.value === resource.type)?.label || resource.type}</p>
            <p className="text-sm"><span className="text-gray-500">Capacity:</span> {resource.capacity || '—'}</p>
            <p className="text-sm"><span className="text-gray-500">Description:</span> {resource.description || '—'}</p>
          </div>
          <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Location</h3>
            <p className="text-sm"><span className="text-gray-500">Location:</span> {resource.location || '—'}</p>
            <p className="text-sm"><span className="text-gray-500">Building:</span> {resource.building || '—'}</p>
            <p className="text-sm"><span className="text-gray-500">Floor:</span> {resource.floor || '—'}</p>
          </div>
          <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Availability</h3>
            <p className="text-sm"><span className="text-gray-500">From:</span> {resource.availabilityStart || '—'}</p>
            <p className="text-sm"><span className="text-gray-500">Until:</span> {resource.availabilityEnd || '—'}</p>
          </div>
          <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Quick Actions</h3>
            <Link to={`/bookings/new?resourceId=${resource.id}`} className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Book this Resource</Link>
          </div>
        </div>
      )}

      {/* Resource Availability Timeline */}
      {!editing && resource && (
        <ResourceTimeline
          resourceId={resource.id}
          availabilityStart={resource.availabilityStart || '08:00'}
          availabilityEnd={resource.availabilityEnd || '18:00'}
        />
      )}
    </div>
  );
};

export default ResourceDetailPage;
