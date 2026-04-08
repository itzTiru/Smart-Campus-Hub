import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Download, FileText } from 'lucide-react';
import { getMyBookings, getBookings, cancelBooking } from '../api/bookingApi';
import { exportToCsv } from '../utils/exportCsv';
import { generateBookingReport } from '../utils/pdfExport';
import { useAuthStore } from '../store/authStore';
import { BOOKING_STATUS } from '../utils/constants';

const BookingsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewAll, setViewAll] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (isAdmin && viewAll) {
        result = await getBookings({ status: statusFilter || undefined, page, size: 10 });
      } else {
        result = await getMyBookings(page, 10);
      }
      const data = result.data || result;
      setBookings(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [page, statusFilter, viewAll]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try { await cancelBooking(id); fetchBookings(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      // Fetch all bookings (large page size) for the report
      let result;
      if (isAdmin && viewAll) {
        result = await getBookings({ status: statusFilter || undefined, page: 0, size: 1000 });
      } else {
        result = await getMyBookings(0, 1000);
      }
      const data = result.data || result;
      const allBookings = data.content || [];
      generateBookingReport(allBookings, { status: statusFilter, viewAll });
    } catch (err) {
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally { setPdfLoading(false); }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookings</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => exportToCsv('bookings.csv', bookings, [
              { key: 'id', label: 'ID' },
              { key: 'resource.name', label: 'Resource' },
              { key: 'startTime', label: 'Start Time' },
              { key: 'endTime', label: 'End Time' },
              { key: 'purpose', label: 'Purpose' },
              { key: 'expectedAttendees', label: 'Attendees' },
              { key: 'status', label: 'Status' },
            ])} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={handleDownloadPdf} disabled={pdfLoading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
              <FileText className="h-4 w-4" /> {pdfLoading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        )}
        <Link to="/bookings/new" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Booking
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <div className="flex rounded-lg border border-gray-300 text-sm">
            <button onClick={() => { setViewAll(false); setPage(0); }} className={`px-3 py-2 ${!viewAll ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>My Bookings</button>
            <button onClick={() => { setViewAll(true); setPage(0); }} className={`px-3 py-2 ${viewAll ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>All Bookings</button>
          </div>
        )}
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Status</option>
          {Object.entries(BOOKING_STATUS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No bookings found.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Resource</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Start</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">End</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Purpose</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{b.resource?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.startTime)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.endTime)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{b.purpose || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BOOKING_STATUS[b.status]?.bgClass || 'bg-gray-100'}`}>
                        {BOOKING_STATUS[b.status]?.label || b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/bookings/${b.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                        {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                          <button onClick={() => handleCancel(b.id)} className="text-red-600 hover:underline text-sm">Cancel</button>
                        )}
                      </div>
                    </td>
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

export default BookingsPage;
