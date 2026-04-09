import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Edit, Trash2, Paperclip } from 'lucide-react';
import { getTicketById, updateTicketStatus, assignTicket, addComment, updateComment, deleteComment } from '../api/ticketApi';
import { getTechnicians } from '../api/technicianApi';
import { useAuthStore } from '../store/authStore';
import { TICKET_STATUS, PRIORITY, TICKET_CATEGORIES } from '../utils/constants';
import SlaIndicator from '../components/tickets/SlaIndicator';

const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Messages
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Admin actions
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [acting, setActing] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const result = await getTicketById(id);
      setTicket(result.data || result);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load ticket'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTicket(); }, [id]);

  useEffect(() => {
    if (isAdmin) {
      getTechnicians({ specialtyCategory: ticket?.category, availableOnly: false }).then((res) => {
        const arr = res.data || res;
        setTechnicians(Array.isArray(arr) ? arr : []);
      }).catch(() => {});
    }
  }, [isAdmin, ticket?.category]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setActing(true);
    try {
      await updateTicketStatus(id, {
        status: newStatus,
        resolutionNotes: newStatus === 'RESOLVED' ? resolutionNotes : undefined,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason : undefined,
      });
      setNewStatus('');
      setResolutionNotes('');
      setRejectionReason('');
      fetchTicket();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update status'); }
    finally { setActing(false); }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    setActing(true);
    try { await assignTicket(id, selectedTech); setSelectedTech(''); fetchTicket(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to assign'); }
    finally { setActing(false); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    try { await addComment(id, { content: commentText }); setCommentText(''); fetchTicket(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to add comment'); }
    finally { setSendingComment(false); }
  };

  const handleUpdateComment = async (commentId) => {
    try { await updateComment(id, commentId, { content: editCommentText }); setEditingComment(null); fetchTicket(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to update comment'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try { await deleteComment(id, commentId); fetchTicket(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete comment'); }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  if (!ticket) return <div className="py-12 text-center text-gray-500">Ticket not found.</div>;

  const statusFlow = {
    OPEN: ['REJECTED'],
    DECLINED: ['REJECTED'],
    WORKING_ON: ['RESOLVED'],
    IN_PROGRESS: ['RESOLVED'],
    RESOLVED: ['CLOSED'],
  };
  const allowedTransitions = statusFlow[ticket.status] || [];
  const matchedTechnicians = technicians.filter((t) => t.specialtyCategory === ticket.category);
  const canAssignNow = ticket.status === 'OPEN' || ticket.status === 'DECLINED' || ticket.status === 'ASSIGNED';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/tickets" className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticket.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TICKET_STATUS[ticket.status]?.bgClass || 'bg-gray-100'}`}>
          {TICKET_STATUS[ticket.status]?.label || ticket.status}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY[ticket.priority]?.bgClass || 'bg-gray-100'}`}>
          {PRIORITY[ticket.priority]?.label || ticket.priority}
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          {TICKET_CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
        </span>
      </div>

      {/* SLA Tracking */}
      <SlaIndicator
        createdAt={ticket.createdAt}
        firstResponseAt={ticket.firstResponseAt}
        resolvedAt={ticket.resolvedAt}
        status={ticket.status}
      />

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Details</h3>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          <p className="text-sm"><span className="text-gray-500">Location:</span> {ticket.location}</p>
          {ticket.resource && <p className="text-sm"><span className="text-gray-500">Resource:</span> {ticket.resource.name}</p>}
          <p className="text-sm"><span className="text-gray-500">Created:</span> {formatDate(ticket.createdAt)}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">People</h3>
          <p className="text-sm"><span className="text-gray-500">Reporter:</span> {ticket.reporter?.name} ({ticket.reporter?.email})</p>
          <p className="text-sm"><span className="text-gray-500">Assigned to:</span> {ticket.assignedTechnicianName || ticket.assignedTo?.name || 'Unassigned'}</p>
          {ticket.contactPhone && <p className="text-sm"><span className="text-gray-500">Phone:</span> {ticket.contactPhone}</p>}
          {ticket.contactEmail && <p className="text-sm"><span className="text-gray-500">Email:</span> {ticket.contactEmail}</p>}
          {ticket.resolutionNotes && <p className="text-sm"><span className="text-gray-500">Resolution:</span> {ticket.resolutionNotes}</p>}
          {ticket.technicianDeclineReason && <p className="text-sm"><span className="text-gray-500">Technician decline reason:</span> {ticket.technicianDeclineReason}</p>}
          {ticket.rejectionReason && <p className="text-sm"><span className="text-gray-500">Rejection reason:</span> {ticket.rejectionReason}</p>}
        </div>
      </div>

      {/* Attachments */}
      {ticket.attachments?.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold text-gray-700">Attachments</h3>
          <div className="flex flex-wrap gap-2">
            {ticket.attachments.map((a) => (
              <a key={a.id} href={`/api/v1/tickets/${id}/attachments/${a.id}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                <Paperclip className="h-4 w-4" /> {a.fileName}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3 dark:border-blue-800 dark:bg-blue-950/40">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            {allowedTransitions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-100">Update Status</label>
                <div className="flex gap-2">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
                    <option value="">Select status...</option>
                    {allowedTransitions.map(s => <option key={s} value={s}>{TICKET_STATUS[s]?.label || s}</option>)}
                  </select>
                  <button onClick={handleStatusUpdate} disabled={!newStatus || acting} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Update</button>
                </div>
                {newStatus === 'RESOLVED' && (
                  <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Resolution notes..." rows={2} className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
                )}
                {newStatus === 'REJECTED' && (
                  <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Rejection reason (required)..." rows={2} className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
                )}
              </div>
            )}
            {canAssignNow && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-100">Assign Technician</label>
                <div className="flex gap-2">
                  <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
                    <option value="">Select technician...</option>
                    {matchedTechnicians.map(t => {
                      const activeJobs = t.currentActiveJobs || 0;
                      const maxedOut = activeJobs >= 4;
                      return (
                        <option key={t.id} value={t.id} disabled={maxedOut}>
                          {t.fullName} ({t.specialtyCategory}) - {activeJobs}/4 jobs {maxedOut ? '[FULL]' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <button onClick={handleAssign} disabled={!selectedTech || acting} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Assign</button>
                </div>
                {matchedTechnicians.length === 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">No active technicians available for this category.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="rounded-lg border p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Messages ({ticket.comments?.length || 0})</h3>
        {ticket.comments?.length > 0 ? (
          <div className="space-y-3">
            {ticket.comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-100">{c.user?.name || 'Unknown'}</span>
                  <span>{formatDate(c.createdAt)} {c.isEdited && '(edited)'}</span>
                </div>
                {editingComment === c.id ? (
                  <div className="mt-2 flex gap-2">
                    <input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="flex-1 rounded-lg border px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
                    <button onClick={() => handleUpdateComment(c.id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">Save</button>
                    <button onClick={() => setEditingComment(null)} className="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Cancel</button>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{c.content}</p>
                )}
                {(c.user?.id === user?.id || isAdmin) && editingComment !== c.id && (
                  <div className="mt-1 flex gap-2">
                    {c.user?.id === user?.id && (
                      <button onClick={() => { setEditingComment(c.id); setEditCommentText(c.content); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                    )}
                    <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet.</p>
        )}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
          <button type="submit" disabled={sendingComment || !commentText.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetailPage;
