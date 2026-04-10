import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, QrCode, Download } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { getBookingById, approveBooking, rejectBooking, cancelBooking } from '../api/bookingApi';
import { useAuthStore } from '../store/authStore';
import { BOOKING_STATUS } from '../utils/constants';

const BookingDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [acting, setActing] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const result = await getBookingById(id);
      setBooking(result.data || result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBooking(); }, [id]);

  const handleApprove = async () => {
    setActing(true);
    try { await approveBooking(id, { remarks }); fetchBooking(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to approve'); }
    finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!remarks.trim()) { alert('Please provide a reason for rejection'); return; }
    setActing(true);
    try { await rejectBooking(id, { remarks }); fetchBooking(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to reject'); }
    finally { setActing(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    try { await cancelBooking(id); fetchBooking(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString() : '—';
  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const qrUrl = booking?.qrCodeUrl || `${window.location.origin}/bookings/${id}/checkin`;

  const handleDownloadPass = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    const qrImage = canvas.toDataURL('image/png');

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Smart Campus Hub', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Booking Pass', 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.text(`Resource: ${booking.resource?.name || '—'}`, 20, 50);
    doc.text(`Location: ${booking.resource?.location || '—'}`, 20, 60);
    doc.text(`Date: ${new Date(booking.startTime).toLocaleDateString()}`, 20, 70);
    doc.text(`Time: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`, 20, 80);
    doc.text(`Purpose: ${booking.purpose || '—'}`, 20, 90);
    doc.text(`Booked by: ${booking.user?.name || '—'}`, 20, 100);
    doc.text(`Status: ${booking.status}`, 20, 110);

    doc.addImage(qrImage, 'PNG', 65, 120, 80, 80);
    doc.setFontSize(10);
    doc.text('Show this QR code at the venue for check-in', 105, 210, { align: 'center' });

    doc.save(`booking-pass-${booking.id}.pdf`);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  if (!booking) return <div className="py-12 text-center text-gray-500">Booking not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/bookings" className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking #{booking.id}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BOOKING_STATUS[booking.status]?.bgClass || 'bg-gray-100'}`}>
          {BOOKING_STATUS[booking.status]?.label || booking.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Resource</h3>
          <p className="text-sm">{booking.resource?.name || '—'}</p>
          <p className="text-sm text-gray-500">{booking.resource?.location || ''}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Requester</h3>
          <p className="text-sm">{booking.user?.name || '—'}</p>
          <p className="text-sm text-gray-500">{booking.user?.email || ''}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Schedule</h3>
          <p className="text-sm"><span className="text-gray-500">Start:</span> {formatDate(booking.startTime)}</p>
          <p className="text-sm"><span className="text-gray-500">End:</span> {formatDate(booking.endTime)}</p>
          <p className="text-sm"><span className="text-gray-500">Attendees:</span> {booking.expectedAttendees || '—'}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Details</h3>
          <p className="text-sm"><span className="text-gray-500">Purpose:</span> {booking.purpose || '—'}</p>
          <p className="text-sm"><span className="text-gray-500">Created:</span> {formatDate(booking.createdAt)}</p>
          {booking.adminRemarks && <p className="text-sm"><span className="text-gray-500">Admin Remarks:</span> {booking.adminRemarks}</p>}
          {booking.reviewedBy && <p className="text-sm"><span className="text-gray-500">Reviewed by:</span> {booking.reviewedBy.name}</p>}
        </div>
      </div>

      {/* QR Code Check-in Section */}
      {booking.status === 'APPROVED' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
          {booking.checkedIn ? (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Checked In</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Checked in at {formatDate(booking.checkedInAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">QR Code Check-in</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Show this QR code at the venue for staff to scan and check you in.
              </p>
              <div className="flex justify-center">
                <div className="rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-700 bg-white p-4">
                  <QRCodeSVG
                    value={qrUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              {/* Hidden canvas for PDF generation */}
              <div style={{ display: 'none' }}>
                <QRCodeCanvas id="qr-canvas" value={qrUrl} size={200} />
              </div>
              <button
                onClick={handleDownloadPass}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" /> Download Booking Pass
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Valid for check-in from 30 minutes before until the end of the booking.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Admin review panel */}
      {isAdmin && booking.status === 'PENDING' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <h3 className="font-semibold text-blue-900">Admin Review</h3>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks / reason for rejection..." rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleApprove} disabled={acting} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
            <button onClick={handleReject} disabled={acting} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Cancel button for owner */}
      {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
        <button onClick={handleCancel} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cancel Booking</button>
      )}
    </div>
  );
};

export default BookingDetailPage;
