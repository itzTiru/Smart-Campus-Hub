import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { checkInBooking, getBookingById } from '../api/bookingApi';

const CheckInPage = () => {
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [booking, setBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const performCheckIn = async () => {
      try {
        const result = await checkInBooking(id);
        setBooking(result.data || result);
        setStatus('success');
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to check in';
        setErrorMessage(message);
        setStatus('error');

        // Still try to load booking details for context
        try {
          const bookingResult = await getBookingById(id);
          setBooking(bookingResult.data || bookingResult);
        } catch {
          // Ignore - booking details are optional for error display
        }
      }
    };

    performCheckIn();
  }, [id]);

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString() : '--';

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-lg text-gray-600 dark:text-gray-300">Processing check-in...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">Check-in Successful!</h1>
          <p className="text-gray-600 dark:text-gray-300">The booking has been checked in.</p>
        </div>

        {booking && (
          <div className="w-full max-w-md rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              <span>Checked in at {formatDate(booking.checkedInAt)}</span>
            </div>
            {booking.resource && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Resource</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{booking.resource.name}</p>
                {booking.resource.location && (
                  <p className="text-xs text-gray-500">{booking.resource.location}</p>
                )}
              </div>
            )}
            {booking.user && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Booked by</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{booking.user.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Schedule</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(booking.startTime)} - {formatDate(booking.endTime)}
              </p>
            </div>
            {booking.purpose && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Purpose</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{booking.purpose}</p>
              </div>
            )}
          </div>
        )}

        <Link
          to={`/bookings/${id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          View Booking Details
        </Link>
      </div>
    );
  }

  // Error state
  const isAlreadyCheckedIn = errorMessage.toLowerCase().includes('already');
  const IsNotApproved = errorMessage.toLowerCase().includes('only approved');
  const isWindowIssue = errorMessage.toLowerCase().includes('not yet') || errorMessage.toLowerCase().includes('expired');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4">
      <div className={`flex h-24 w-24 items-center justify-center rounded-full ${
        isAlreadyCheckedIn
          ? 'bg-yellow-100 dark:bg-yellow-900/30'
          : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        {isAlreadyCheckedIn ? (
          <AlertTriangle className="h-14 w-14 text-yellow-600 dark:text-yellow-400" />
        ) : isWindowIssue ? (
          <Clock className="h-14 w-14 text-red-600 dark:text-red-400" />
        ) : (
          <XCircle className="h-14 w-14 text-red-600 dark:text-red-400" />
        )}
      </div>

      <div className="text-center space-y-2">
        <h1 className={`text-3xl font-bold ${
          isAlreadyCheckedIn
            ? 'text-yellow-700 dark:text-yellow-400'
            : 'text-red-700 dark:text-red-400'
        }`}>
          {isAlreadyCheckedIn ? 'Already Checked In' : 'Check-in Failed'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">{errorMessage}</p>
      </div>

      {booking && (
        <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 space-y-3">
          {booking.user && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Booked by</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{booking.user.name}</p>
              {booking.user.email && (
                <p className="text-xs text-gray-500">{booking.user.email}</p>
              )}
            </div>
          )}
          {booking.resource && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Resource</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{booking.resource.name}</p>
              {booking.resource.location && (
                <p className="text-xs text-gray-500">{booking.resource.location}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{booking.status}</p>
          </div>
          {booking.checkedIn && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Checked in at</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(booking.checkedInAt)}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Schedule</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(booking.startTime)} - {formatDate(booking.endTime)}
            </p>
          </div>
          {booking.purpose && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Purpose</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{booking.purpose}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to={`/bookings/${id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          View Booking
        </Link>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          All Bookings
        </Link>
      </div>
    </div>
  );
};

export default CheckInPage;
