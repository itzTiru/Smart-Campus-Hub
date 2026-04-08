import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getResources, deleteResource, toggleResourceStatus, createResource, searchResources } from '../api/resourceApi';
import { getBookings } from '../api/bookingApi';
import { getTickets } from '../api/ticketApi';
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
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    resource: null,
    loading: false,
    deleting: false,
    error: null,
    bookings: [],
    tickets: [],
    bookingTotal: 0,
    ticketTotal: 0,
  });
  const [toggleDialog, setToggleDialog] = useState({
    open: false,
    resource: null,
    loading: false,
    toggling: false,
    error: null,
    bookings: [],
    bookingTotal: 0,
    tickets: [],
    ticketTotal: 0,
  });

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

  useEffect(() => { fetchResources(); }, [page, typeFilter, statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); setPage(0); fetchResources(); };

  const handleDelete = async (resource) => {
    setDeleteDialog({
      open: true,
      resource,
      loading: true,
      deleting: false,
      error: null,
      bookings: [],
      tickets: [],
      bookingTotal: 0,
      ticketTotal: 0,
    });

    try {
      const [bookingResult, ticketResult] = await Promise.allSettled([
        getBookings({ resourceId: resource.id, status: 'APPROVED', page: 0, size: 5 }),
        getTickets({ resourceId: resource.id, page: 0, size: 5 }),
      ]);

      const bookingData = bookingResult.status === 'fulfilled'
        ? (bookingResult.value.data || bookingResult.value)
        : { content: [], totalElements: 0 };
      const ticketData = ticketResult.status === 'fulfilled'
        ? (ticketResult.value.data || ticketResult.value)
        : { content: [], totalElements: 0 };

      let combinedError = null;
      if (bookingResult.status === 'rejected' && ticketResult.status === 'rejected') {
        combinedError = 'We could not load reference details right now. You can retry in a moment.';
      } else if (bookingResult.status === 'rejected') {
        combinedError = 'We could not load approved booking details right now. Please retry.';
      }

      setDeleteDialog((prev) => ({
        ...prev,
        loading: false,
        error: combinedError,
        bookings: bookingData.content || [],
        tickets: ticketData.content || [],
        bookingTotal: bookingData.totalElements || 0,
        ticketTotal: ticketData.totalElements || 0,
      }));
    } catch (err) {
      setDeleteDialog((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to check linked bookings/tickets',
      }));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      resource: null,
      loading: false,
      deleting: false,
      error: null,
      bookings: [],
      tickets: [],
      bookingTotal: 0,
      ticketTotal: 0,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.resource) return;
    setDeleteDialog((prev) => ({ ...prev, deleting: true, error: null }));
    try {
      await deleteResource(deleteDialog.resource.id);
      closeDeleteDialog();
      fetchResources();
    } catch (err) {
      setDeleteDialog((prev) => ({
        ...prev,
        deleting: false,
        error: err.response?.data?.message || 'Failed to delete',
      }));
    }
  };

  const handleToggleStatus = async (resource) => {
    // Activation can proceed directly
    if (resource.status !== 'ACTIVE') {
      try { await toggleResourceStatus(resource.id); fetchResources(); }
      catch (err) { alert(err.response?.data?.message || 'Failed to activate resource'); }
      return;
    }

    try {
      const [bookingResult, ticketResult] = await Promise.allSettled([
        getBookings({
          resourceId: resource.id,
          status: 'APPROVED',
          page: 0,
          size: 5,
        }),
        getTickets({ resourceId: resource.id, page: 0, size: 5 }),
      ]);

      const bookingData = bookingResult.status === 'fulfilled'
        ? (bookingResult.value.data || bookingResult.value)
        : { content: [], totalElements: 0 };
      const ticketData = ticketResult.status === 'fulfilled'
        ? (ticketResult.value.data || ticketResult.value)
        : { content: [], totalElements: 0 };

      const approvedCount = bookingData.totalElements || 0;
      const ticketCount = ticketData.totalElements || 0;

      // No approved bookings and no linked tickets -> deactivate directly without popup
      if (approvedCount === 0 && ticketCount === 0) {
        await toggleResourceStatus(resource.id);
        fetchResources();
        return;
      }

      let dialogError = null;
      if (bookingResult.status === 'rejected' && ticketResult.status === 'rejected') {
        dialogError = 'We could not load reference details right now. Please retry.';
      } else if (bookingResult.status === 'rejected') {
        dialogError = 'We could not load approved booking details right now. Please retry.';
      }

      setToggleDialog((prev) => ({
        ...prev,
        open: true,
        resource,
        loading: false,
        toggling: false,
        error: dialogError,
        bookings: bookingData.content || [],
        bookingTotal: approvedCount,
        tickets: ticketData.content || [],
        ticketTotal: ticketCount,
      }));
    } catch {
      setToggleDialog({
        open: true,
        resource,
        loading: false,
        toggling: false,
        error: 'We could not process the status check right now. Please retry.',
        bookings: [],
        bookingTotal: 0,
        tickets: [],
        ticketTotal: 0,
      });
    }
  };

  const closeToggleDialog = () => {
    setToggleDialog({
      open: false,
      resource: null,
      loading: false,
      toggling: false,
      error: null,
      bookings: [],
      bookingTotal: 0,
      tickets: [],
      ticketTotal: 0,
    });
  };

  const confirmDeactivate = async () => {
    if (!toggleDialog.resource) return;
    setToggleDialog((prev) => ({ ...prev, toggling: true, error: null }));
    try {
      await toggleResourceStatus(toggleDialog.resource.id);
      closeToggleDialog();
      fetchResources();
    } catch (err) {
      setToggleDialog((prev) => ({
        ...prev,
        toggling: false,
        error: err.response?.data?.message || 'Could not deactivate this resource right now.',
      }));
    }
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

  const deleteBlocked = deleteDialog.bookingTotal > 0;

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
                          <button onClick={() => handleToggleStatus(r)} title="Toggle status" className="text-gray-500 hover:text-blue-600">
                            {r.status === 'ACTIVE' ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button onClick={() => handleDelete(r)} title="Delete" className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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

      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${deleteBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {deleteBlocked ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Resource</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  You are deleting <span className="font-semibold">{deleteDialog.resource?.name}</span>.
                </p>
              </div>
            </div>

            {deleteDialog.loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Checking linked bookings and tickets...</div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700">Approved Bookings</p>
                    <p className="mt-1 text-xl font-bold text-amber-900">{deleteDialog.bookingTotal}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Linked Tickets</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{deleteDialog.ticketTotal}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 text-sm font-semibold">Current Bookings</h3>
                    {deleteDialog.bookings.length === 0 ? (
                      <p className="text-xs text-gray-500">No approved bookings linked.</p>
                    ) : (
                      <ul className="space-y-1 text-xs text-gray-700">
                        {deleteDialog.bookings.map((b) => (
                          <li key={b.id}>
                            <Link className="text-blue-600 hover:underline" to={`/bookings/${b.id}`}>{b.id}</Link>
                            {' '}| {b.status} | {new Date(b.startTime).toLocaleString()}
                          </li>
                        ))}
                        {deleteDialog.bookingTotal > deleteDialog.bookings.length && (
                          <li className="text-gray-500">...and {deleteDialog.bookingTotal - deleteDialog.bookings.length} more</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 text-sm font-semibold">Current Tickets</h3>
                    {deleteDialog.tickets.length === 0 ? (
                      <p className="text-xs text-gray-500">No tickets linked.</p>
                    ) : (
                      <ul className="space-y-1 text-xs text-gray-700">
                        {deleteDialog.tickets.map((t) => (
                          <li key={t.id}>
                            <Link className="text-blue-600 hover:underline" to={`/tickets/${t.id}`}>{t.id}</Link>
                            {' '}| {t.status} | {t.title}
                          </li>
                        ))}
                        {deleteDialog.ticketTotal > deleteDialog.tickets.length && (
                          <li className="text-gray-500">...and {deleteDialog.ticketTotal - deleteDialog.tickets.length} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {deleteBlocked ? (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    Deletion is blocked because this resource has approved bookings. Cancel or complete those bookings first.
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    No approved booking blockers were found. You can safely delete this resource.
                  </div>
                )}

                {deleteDialog.error && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{deleteDialog.error}</div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={
                  deleteDialog.loading ||
                  deleteDialog.deleting ||
                  deleteBlocked
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteBlocked ? 'Delete Blocked' : (deleteDialog.deleting ? 'Deleting...' : 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toggleDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Deactivate Resource</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Resource: <span className="font-medium">{toggleDialog.resource?.name}</span>
            </p>

            {toggleDialog.loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Checking approved bookings...</div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Approved bookings: <span className="font-semibold">{toggleDialog.bookingTotal}</span>
                  {' '}| Linked tickets: <span className="font-semibold">{toggleDialog.ticketTotal}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 text-sm font-semibold">Current Approved Bookings</h3>
                    {toggleDialog.bookings.length === 0 ? (
                      <p className="text-xs text-gray-500">No approved bookings linked.</p>
                    ) : (
                      <ul className="space-y-1 text-xs text-gray-700">
                        {toggleDialog.bookings.map((b) => (
                          <li key={b.id}>
                            <Link className="text-blue-600 hover:underline" to={`/bookings/${b.id}`}>{b.id}</Link>
                            {' '}| {b.status} | {new Date(b.startTime).toLocaleString()}
                          </li>
                        ))}
                        {toggleDialog.bookingTotal > toggleDialog.bookings.length && (
                          <li className="text-gray-500">...and {toggleDialog.bookingTotal - toggleDialog.bookings.length} more</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 text-sm font-semibold">Current Tickets</h3>
                    {toggleDialog.tickets.length === 0 ? (
                      <p className="text-xs text-gray-500">No tickets linked.</p>
                    ) : (
                      <ul className="space-y-1 text-xs text-gray-700">
                        {toggleDialog.tickets.map((t) => (
                          <li key={t.id}>
                            <Link className="text-blue-600 hover:underline" to={`/tickets/${t.id}`}>{t.id}</Link>
                            {' '}| {t.status} | {t.title}
                          </li>
                        ))}
                        {toggleDialog.ticketTotal > toggleDialog.tickets.length && (
                          <li className="text-gray-500">...and {toggleDialog.ticketTotal - toggleDialog.tickets.length} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {toggleDialog.bookingTotal > 0 && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    This resource has approved bookings, so deactivation is currently blocked.
                  </div>
                )}

                {toggleDialog.error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{toggleDialog.error}</div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeToggleDialog}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={
                  toggleDialog.loading ||
                  toggleDialog.toggling ||
                  toggleDialog.bookingTotal > 0
                }
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {toggleDialog.toggling ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
