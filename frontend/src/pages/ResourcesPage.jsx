import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock3,
  Filter,
  MapPin,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  createResource,
  deleteResource,
  getResources,
  searchResources,
  toggleResourceStatus,
} from '../api/resourceApi';
import { useAuthStore } from '../store/authStore';
import { RESOURCE_STATUS, RESOURCE_TYPES } from '../utils/constants';

const defaultCreateForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  building: '',
  floor: '',
  description: '',
  availabilityStart: '08:00',
  availabilityEnd: '18:00',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

const PAGE_SIZE = 12;

const resolvePageData = (payload) => {
  const data = payload?.data || payload;
  return data?.content ? data : { content: [], totalPages: 0 };
};

const getTypeLabel = (type) => RESOURCE_TYPES.find((t) => t.value === type)?.label || type;

const ResourcesPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showFilters, setShowFilters] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minCapacityFilter, setMinCapacityFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [creating, setCreating] = useState(false);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let pageData;

      if (searchKeyword.trim()) {
        const result = await searchResources(searchKeyword.trim(), page, PAGE_SIZE);
        pageData = resolvePageData(result);
      } else {
        const result = await getResources({
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          location: locationFilter.trim() || undefined,
          minCapacity: minCapacityFilter ? Number(minCapacityFilter) : undefined,
          page,
          size: PAGE_SIZE,
        });
        pageData = resolvePageData(result);
      }

      setResources(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resources. Please try again.');
      setResources([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [locationFilter, minCapacityFilter, page, searchKeyword, statusFilter, typeFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const stats = useMemo(() => {
    const total = resources.length;
    const active = resources.filter((resource) => resource.status === 'ACTIVE').length;
    const outOfService = resources.filter((resource) => resource.status === 'OUT_OF_SERVICE').length;
    const totalCapacity = resources.reduce((sum, resource) => sum + (resource.capacity || 0), 0);

    return [
      { title: 'Showing', value: total, subtitle: 'resources on this page' },
      { title: 'Available', value: active, subtitle: 'currently active' },
      { title: 'Out Of Service', value: outOfService, subtitle: 'temporarily unavailable' },
      { title: 'Total Capacity', value: totalCapacity, subtitle: 'combined seats/units' },
    ];
  }, [resources]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearchKeyword(searchInput);
  };

  const clearAllFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setLocationFilter('');
    setMinCapacityFilter('');
    setSearchInput('');
    setSearchKeyword('');
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteResource(id);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete resource.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleResourceStatus(id);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle resource status.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createResource({
        ...createForm,
        capacity: Number(createForm.capacity),
      });

      setShowCreate(false);
      setCreateForm(defaultCreateForm);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create resource.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Campus Resources</h1>
            <p className="mt-1 text-sm text-slate-600">Discover, filter, and manage spaces and equipment quickly.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Resource
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((card) => (
            <article key={card.title} className="rounded-xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.title}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sticky top-2 z-10 space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by resource name, type, or location"
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </form>

        {showFilters && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              disabled={Boolean(searchKeyword)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">All Types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              disabled={Boolean(searchKeyword)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value || 'ALL'} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(0);
              }}
              placeholder="Filter by location"
              disabled={Boolean(searchKeyword)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <input
              type="number"
              min="1"
              value={minCapacityFilter}
              onChange={(e) => {
                setMinCapacityFilter(e.target.value);
                setPage(0);
              }}
              placeholder="Min capacity"
              disabled={Boolean(searchKeyword)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        )}

        {searchKeyword && (
          <p className="text-xs text-slate-500">
            Search mode is active for "{searchKeyword}". Clear search to re-enable advanced filters.
          </p>
        )}
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-xl border border-slate-200 p-4">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-full rounded bg-slate-200" />
              <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No resources found</h2>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or reset to see all resources.</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const status = RESOURCE_STATUS[resource.status] || {
                label: resource.status,
                bgClass: 'bg-slate-100 text-slate-700',
              };

              return (
                <article key={resource.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/resources/${resource.id}`} className="text-base font-semibold text-slate-900 hover:text-cyan-700">
                        {resource.name}
                      </Link>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {getTypeLabel(resource.type)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.bgClass}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {resource.location || 'No location specified'}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      Capacity: {resource.capacity || 0}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {resource.building || 'Building N/A'} {resource.floor ? `- Floor ${resource.floor}` : ''}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {resource.availabilityStart || '--:--'} to {resource.availabilityEnd || '--:--'}
                    </p>
                  </div>

                  {resource.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">{resource.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/resources/${resource.id}`}
                      className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                    >
                      View Details
                    </Link>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(resource.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Toggle status"
                        >
                          {resource.status === 'ACTIVE' ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-amber-600" />
                          )}
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          title="Delete resource"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Resource</h2>
                <p className="mt-1 text-sm text-slate-500">Add key details so users can discover and book it easily.</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <input
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Resource name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  required
                  value={createForm.capacity}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Capacity"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={createForm.location}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={createForm.building}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, building: e.target.value }))}
                  placeholder="Building"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={createForm.floor}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, floor: e.target.value }))}
                  placeholder="Floor"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={createForm.availabilityStart}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, availabilityStart: e.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={createForm.availabilityEnd}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, availabilityEnd: e.target.value }))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <textarea
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
