import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Wrench,
  ClipboardList,
  ShieldCheck,
  UserCircle,
  Clock,
  LogOut,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  getMyTechnicianTickets,
  respondToTechnicianAssignment,
  markTechnicianTicketDone,
  addTechnicianComment,
} from '../api/technicianTicketApi';
import { TICKET_STATUS, TICKET_CATEGORIES, PRIORITY } from '../utils/constants';

const TechnicianDashboardPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('technician_token');
  const [technician, setTechnician] = useState(() => {
    const raw = localStorage.getItem('technician_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actioningId, setActioningId] = useState('');
  const [declineDrafts, setDeclineDrafts] = useState({});
  const [doneNotesDrafts, setDoneNotesDrafts] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [error, setError] = useState('');
  const isAuthenticatedTechnician = Boolean(token && technician);

  const handleLogout = () => {
    localStorage.removeItem('technician_token');
    localStorage.removeItem('technician_user');
    navigate('/technician/login', { replace: true });
  };

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticatedTechnician) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await getMyTechnicianTickets({
        status: statusFilter || undefined,
        page: 0,
        size: 50,
      });
      const data = response?.data || response;
      setTickets(data?.content || []);

      setTechnician((prev) => {
        if (!prev) {
          return prev;
        }

        const nextUser = {
          ...prev,
          currentActiveJobs: (data?.content || []).filter(
            (t) => ['ASSIGNED', 'WORKING_ON', 'IN_PROGRESS'].includes(t.status)
          ).length,
        };
        localStorage.setItem('technician_user', JSON.stringify(nextUser));
        return nextUser;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned tickets');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticatedTechnician, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const activeJobsCount = useMemo(
    () => tickets.filter((t) => ['ASSIGNED', 'WORKING_ON', 'IN_PROGRESS'].includes(t.status)).length,
    [tickets]
  );

  if (!isAuthenticatedTechnician) {
    return <Navigate to="/technician/login" replace />;
  }

  const handleAccept = async (ticketId) => {
    setActioningId(ticketId);
    try {
      await respondToTechnicianAssignment(ticketId, { accepted: true });
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept ticket');
    } finally {
      setActioningId('');
    }
  };

  const handleDecline = async (ticketId) => {
    const reason = (declineDrafts[ticketId] || '').trim();
    if (!reason) {
      alert('Please provide a decline reason');
      return;
    }

    setActioningId(ticketId);
    try {
      await respondToTechnicianAssignment(ticketId, {
        accepted: false,
        declineReason: reason,
      });
      setDeclineDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline ticket');
    } finally {
      setActioningId('');
    }
  };

  const handleMarkDone = async (ticketId) => {
    setActioningId(ticketId);
    try {
      await markTechnicianTicketDone(ticketId, {
        resolutionNotes: doneNotesDrafts[ticketId] || '',
      });
      setDoneNotesDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark ticket as done');
    } finally {
      setActioningId('');
    }
  };

  const handleAddComment = async (ticketId) => {
    const content = (commentDrafts[ticketId] || '').trim();
    if (!content) {
      return;
    }

    setActioningId(ticketId);
    try {
      await addTechnicianComment(ticketId, { content });
      setCommentDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send comment');
    } finally {
      setActioningId('');
    }
  };

  const statCards = [
    {
      label: 'Active Jobs',
      value: activeJobsCount,
      icon: ClipboardList,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Specialty',
      value: technician?.specialtyCategory || '—',
      icon: Wrench,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Availability',
      value: technician?.available ? 'Available' : 'Unavailable',
      icon: Clock,
      color: technician?.available ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Account',
      value: technician?.isActive ? 'Active' : 'Inactive',
      icon: ShieldCheck,
      color: technician?.isActive ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Technician Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Welcome back, <span className="font-medium">{technician.fullName}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-lg border p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <UserCircle className="h-5 w-5 text-blue-600" />
              Profile
            </h2>
            <div className="grid gap-2 text-sm text-gray-700 dark:text-gray-300">
              <p><span className="text-gray-500">Name:</span> {technician.fullName}</p>
              <p><span className="text-gray-500">Username:</span> {technician.username}</p>
              <p><span className="text-gray-500">Email:</span> {technician.email}</p>
              <p><span className="text-gray-500">Phone:</span> {technician.phone || '—'}</p>
              <p><span className="text-gray-500">Years of Experience:</span> {technician.yearsOfExperience ?? '—'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Work Queue</h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><span className="text-gray-500">Assigned:</span> {tickets.filter((t) => t.status === 'ASSIGNED').length}</p>
              <p><span className="text-gray-500">Working On:</span> {tickets.filter((t) => ['WORKING_ON', 'IN_PROGRESS'].includes(t.status)).length}</p>
              <p><span className="text-gray-500">Resolved:</span> {tickets.filter((t) => t.status === 'RESOLVED').length}</p>
              <p><span className="text-gray-500">Declined:</span> {tickets.filter((t) => t.status === 'DECLINED').length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Tickets</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">All Status</option>
              {Object.entries(TICKET_STATUS).map(([status, meta]) => (
                <option key={status} value={status}>{meta.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No assigned tickets found.</div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const isAssigned = ticket.status === 'ASSIGNED';
                const isWorking = ticket.status === 'WORKING_ON' || ticket.status === 'IN_PROGRESS';
                const isBusy = actioningId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ticket.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TICKET_STATUS[ticket.status]?.bgClass || 'bg-gray-100 text-gray-800'}`}>
                        {TICKET_STATUS[ticket.status]?.label || ticket.status}
                      </span>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 ${PRIORITY[ticket.priority]?.bgClass || 'bg-gray-100 text-gray-800'}`}>
                        {PRIORITY[ticket.priority]?.label || ticket.priority}
                      </span>
                    </div>

                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{ticket.description}</p>
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Location: {ticket.location || 'N/A'}
                    </p>

                    {ticket.technicianDeclineReason && (
                      <p className="mb-2 rounded-md bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                        Decline reason: {ticket.technicianDeclineReason}
                      </p>
                    )}

                    {isAssigned && (
                      <div className="space-y-2">
                        <textarea
                          value={declineDrafts[ticket.id] || ''}
                          onChange={(e) =>
                            setDeclineDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          rows={2}
                          placeholder="Reason if declining (required for decline)"
                          className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAccept(ticket.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecline(ticket.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {isWorking && (
                      <div className="space-y-2">
                        <textarea
                          value={doneNotesDrafts[ticket.id] || ''}
                          onChange={(e) =>
                            setDoneNotesDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          rows={2}
                          placeholder="Resolution notes (optional)"
                          className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleMarkDone(ticket.id)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Mark Job Done
                        </button>
                      </div>
                    )}

                    <div className="mt-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Ticket Chat
                      </p>
                      <div className="mb-2 max-h-40 space-y-2 overflow-y-auto">
                        {(ticket.comments || []).length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">No messages yet.</p>
                        ) : (
                          (ticket.comments || []).map((comment) => (
                            <div key={comment.id} className="rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-800">
                              <p className="font-medium text-gray-700 dark:text-gray-200">
                                {comment.user?.name || 'Unknown'}
                              </p>
                              <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={commentDrafts[ticket.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          placeholder="Type a message for admin..."
                          className="flex-1 rounded-lg border px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(ticket.id)}
                          disabled={isBusy || !(commentDrafts[ticket.id] || '').trim()}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TechnicianDashboardPage;
