import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Clock, User, Info } from 'lucide-react';
import { getResourceSchedule } from '../../api/resourceApi';

const ResourceTimeline = ({ resourceId, date: initialDate, availabilityStart = '08:00', availabilityEnd = '18:00' }) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const timelineRef = useRef(null);
  const tooltipRef = useRef(null);

  // Parse availability hours
  const startHour = parseInt(availabilityStart?.split(':')[0], 10) || 8;
  const endHour = parseInt(availabilityEnd?.split(':')[0], 10) || 18;
  const totalHours = endHour - startHour;
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getResourceSchedule(resourceId, selectedDate);
        setBookings(result.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load schedule');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    if (resourceId && selectedDate) fetchSchedule();
  }, [resourceId, selectedDate]);

  // Calculate current time marker position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (selectedDate !== todayStr) return null;

    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < startHour || currentHour > endHour) return null;

    return ((currentHour - startHour) / totalHours) * 100;
  }, [selectedDate, startHour, endHour, totalHours]);

  // Convert booking times to position/width percentages
  const bookingBlocks = useMemo(() => {
    return bookings.map((booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      const startFrac = start.getHours() + start.getMinutes() / 60;
      const endFrac = end.getHours() + end.getMinutes() / 60;

      // Clamp to availability window
      const clampedStart = Math.max(startFrac, startHour);
      const clampedEnd = Math.min(endFrac, endHour);

      if (clampedStart >= clampedEnd) return null;

      const left = ((clampedStart - startHour) / totalHours) * 100;
      const width = ((clampedEnd - clampedStart) / totalHours) * 100;

      const formatTime = (d) =>
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        id: booking.id,
        left,
        width,
        status: booking.status,
        bookerName: booking.user?.name || 'Unknown',
        purpose: booking.purpose || 'No purpose specified',
        timeRange: `${formatTime(start)} - ${formatTime(end)}`,
        startTime: start,
        endTime: end,
      };
    }).filter(Boolean);
  }, [bookings, startHour, endHour, totalHours]);

  const handleBlockHover = (e, block) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const timelineRect = timelineRef.current?.getBoundingClientRect();
    if (!timelineRect) return;

    setTooltip({
      ...block,
      x: rect.left - timelineRect.left + rect.width / 2,
      y: rect.top - timelineRect.top,
    });
  };

  const handleBlockLeave = () => {
    setTooltip(null);
  };

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return {
      bg: 'bg-blue-500/80',
      hoverBg: 'hover:bg-blue-600/90',
      border: 'border-blue-600',
      label: 'Approved',
      dot: 'bg-blue-500',
    };
    return {
      bg: 'bg-amber-400/80',
      hoverBg: 'hover:bg-amber-500/90',
      border: 'border-amber-500',
      label: 'Pending',
      dot: 'bg-amber-400',
    };
  };

  const formatHour = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}${suffix}`;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Availability Timeline</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">View booked and available time slots</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-500/80" />
          Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-400/80" />
          Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30" />
          Available
        </span>
        {currentTimePosition !== null && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-0.5 bg-red-500" />
            Current time
          </span>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="ml-2 text-sm text-gray-500">Loading schedule...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
      ) : (
        <div ref={timelineRef} className="relative">
          {/* Hour labels */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {hours.map((h, i) => (
              <div
                key={h}
                className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400"
                style={{
                  width: i < hours.length - 1 ? `${100 / totalHours}%` : '0%',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <span className="relative -left-1/2">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Grid lines + booking blocks */}
          <div className="relative mt-1 h-16 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            {/* Vertical grid lines */}
            {hours.map((h, i) => (
              <div
                key={`grid-${h}`}
                className="absolute top-0 h-full border-l border-gray-200/60 dark:border-gray-700/60"
                style={{ left: `${(i / totalHours) * 100}%` }}
              />
            ))}

            {/* Booking blocks */}
            {bookingBlocks.map((block) => {
              const color = getStatusColor(block.status);
              return (
                <div
                  key={block.id}
                  className={`absolute top-1.5 bottom-1.5 z-10 cursor-pointer rounded-md border ${color.bg} ${color.hoverBg} ${color.border} transition-all duration-150`}
                  style={{
                    left: `${block.left}%`,
                    width: `${block.width}%`,
                    minWidth: '2px',
                  }}
                  onMouseEnter={(e) => handleBlockHover(e, block)}
                  onMouseLeave={handleBlockLeave}
                >
                  {block.width > 8 && (
                    <div className="flex h-full items-center overflow-hidden px-1.5">
                      <span className="truncate text-[10px] font-medium text-white drop-shadow-sm">
                        {block.bookerName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current time marker */}
            {currentTimePosition !== null && (
              <div
                className="absolute top-0 z-20 h-full w-0.5 bg-red-500"
                style={{ left: `${currentTimePosition}%` }}
              >
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
              </div>
            )}

            {/* Empty state */}
            {bookingBlocks.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs text-emerald-600 dark:text-emerald-400">No bookings - fully available</span>
              </div>
            )}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              ref={tooltipRef}
              className="absolute z-30 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
              style={{
                left: `${Math.min(Math.max(tooltip.x, 112), (timelineRef.current?.offsetWidth || 400) - 112)}px`,
                top: `${tooltip.y - 8}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${getStatusColor(tooltip.status).dot}`} />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {getStatusColor(tooltip.status).label}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <User className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{tooltip.bookerName}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{tooltip.purpose}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Clock className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{tooltip.timeRange}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
            </div>
          )}

          {/* Hour ticks (bottom) */}
          <div className="mt-1 flex">
            {hours.map((h, i) => (
              <div
                key={`tick-${h}`}
                className="text-center"
                style={{
                  width: i < hours.length - 1 ? `${100 / totalHours}%` : '0%',
                  flexShrink: 0,
                }}
              >
                <div className="mx-auto h-1.5 w-px bg-gray-300 dark:bg-gray-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && bookingBlocks.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
          <Info className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {bookingBlocks.length} booking{bookingBlocks.length !== 1 ? 's' : ''} on{' '}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ResourceTimeline;
