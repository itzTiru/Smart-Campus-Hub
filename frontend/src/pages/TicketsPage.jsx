import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Download, FileText } from 'lucide-react';
import { getTickets } from '../api/ticketApi';
import { exportToCsv } from '../utils/exportCsv';
import { generateTicketReport } from '../utils/pdfExport';
import { useAuthStore } from '../store/authStore';
import { TICKET_STATUS, PRIORITY, TICKET_CATEGORIES } from '../utils/constants';
import { SlaDot } from '../components/tickets/SlaIndicator';

const TicketsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const canViewAll = isAdmin || isTechnician;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        page, size: 10,
      };
      // Non-admin/non-technician users only see their own tickets
      if (!canViewAll) {
        params.reporterId = user?.id;
      }
      const result = await getTickets(params);
      const data = result.data || result;
      setTickets(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTickets(); }, [page, statusFilter, priorityFilter, categoryFilter]);

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const result = await getTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        page: 0, size: 1000,
      });
      const data = result.data || result;
      const allTickets = data.content || [];
      generateTicketReport(allTickets, {
        status: statusFilter, priority: priorityFilter, category: categoryFilter,
      });
    } catch (err) {
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally { setPdfLoading(false); }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString() : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tickets</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            <Filter className="h-4 w-4" /> Filters
          </button>
          {isAdmin && (
            <>
              <button onClick={() => exportToCsv('tickets.csv', tickets, [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'category', label: 'Category' },
                { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status' },
                { key: 'reporter.name', label: 'Reporter' },
                { key: 'location', label: 'Location' },
                { key: 'createdAt', label: 'Created' },
              ])} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button onClick={handleDownloadPdf} disabled={pdfLoading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
                <FileText className="h-4 w-4" /> {pdfLoading ? 'Generating...' : 'Download PDF'}
              </button>
            </>
          )}
          {!isAdmin && (
            <Link to="/tickets/new" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New Ticket
            </Link>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All Status</option>
            {Object.entries(TICKET_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All Priority</option>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {TICKET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); setPage(0); }} className="text-sm text-blue-600 hover:underline">Clear</button>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No tickets found.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">SLA</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reporter</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center"><SlaDot createdAt={t.createdAt} firstResponseAt={t.firstResponseAt} status={t.status} /></td>
                    <td className="px-4 py-3"><Link to={`/tickets/${t.id}`} className="font-medium text-blue-600 hover:underline">{t.title}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{TICKET_CATEGORIES.find(c => c.value === t.category)?.label || t.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY[t.priority]?.bgClass || 'bg-gray-100'}`}>
                        {PRIORITY[t.priority]?.label || t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TICKET_STATUS[t.status]?.bgClass || 'bg-gray-100'}`}>
                        {TICKET_STATUS[t.status]?.label || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.reporter?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.createdAt)}</td>
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
    </div>
  );
};

export default TicketsPage;
