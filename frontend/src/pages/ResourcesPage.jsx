import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getResources, deleteResource, toggleResourceStatus, createResource, searchResources } from '../api/resourceApi';
import { useAuthStore } from '../store/authStore';
import { RESOURCE_TYPES, RESOURCE_STATUS } from '../utils/constants';

const ResourcesPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', type: 'LECTURE_HALL', capacity: '', location: '',
    building: '', floor: '', description: '', availabilityStart: '08:00', availabilityEnd: '18:00',
  });
  const [creating, setCreating] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (searchKeyword.trim()) {
        result = await searchResources(searchKeyword, page, 10);
      } else {
        result = await getResources({
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          page, size: 10,
        });
      }
      const data = result.data || result;
      setResources(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchResources(); }, [page, typeFilter, statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); setPage(0); fetchResources(); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    try { await deleteResource(id); fetchResources(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggleStatus = async (id) => {
    try { await toggleResourceStatus(id); fetchResources(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to toggle status'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createResource({ ...createForm, capacity: parseInt(createForm.capacity) || 0 });
      setShowCreate(false);
      setCreateForm({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', building: '', floor: '', description: '', availabilityStart: '08:00', availabilityEnd: '18:00' });
      fetchResources();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create'); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Resources</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            <Filter className="h-4 w-4" /> Filters
          </button>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Resource
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search resources..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Search</button>
      </form>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All Types</option>
            {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
          <button onClick={() => { setTypeFilter(''); setStatusFilter(''); setSearchKeyword(''); setPage(0); }} className="text-sm text-blue-600 hover:underline">Clear</button>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : resources.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No resources found.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Link to={`/resources/${r.id}`} className="font-medium text-blue-600 hover:underline">{r.name}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{RESOURCE_TYPES.find(t => t.value === r.type)?.label || r.type}</td>
                    <td className="px-4 py-3 text-gray-600">{r.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.capacity || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${RESOURCE_STATUS[r.status]?.bgClass || 'bg-gray-100 text-gray-800'}`}>
                        {RESOURCE_STATUS[r.status]?.label || r.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleStatus(r.id)} title="Toggle status" className="text-gray-500 hover:text-blue-600">
                            {r.status === 'ACTIVE' ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button onClick={() => handleDelete(r.id)} title="Delete" className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-bold dark:text-gray-100">Create Resource</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Name *" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Capacity" value={createForm.capacity} onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Location" value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Building" value={createForm.building} onChange={(e) => setCreateForm({ ...createForm, building: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Floor" value={createForm.floor} onChange={(e) => setCreateForm({ ...createForm, floor: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
              </div>
              <textarea placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
