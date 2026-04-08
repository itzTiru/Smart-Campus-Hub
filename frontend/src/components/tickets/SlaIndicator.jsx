import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const SLA_THRESHOLDS = {
  response: { green: 4, yellow: 8 },   // hours
  resolution: { green: 24, yellow: 48 }, // hours
};

function getHoursBetween(start, end) {
  if (!start) return null;
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  return Math.max(0, (e - s) / (1000 * 60 * 60));
}

function formatDuration(hours) {
  if (hours == null) return '--';
  if (hours < 1) {
    const mins = Math.floor(hours * 60);
    return `${mins}m`;
  }
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function getSlaColor(hours, type) {
  if (hours == null) return 'gray';
  const t = SLA_THRESHOLDS[type];
  if (hours <= t.green) return 'green';
  if (hours <= t.yellow) return 'yellow';
  return 'red';
}

const colorStyles = {
  green:  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: 'text-emerald-500' },
  yellow: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   icon: 'text-amber-500' },
  red:    { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     icon: 'text-red-500' },
  gray:   { bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-500',    dot: 'bg-gray-400',    icon: 'text-gray-400' },
};

function SlaMetric({ label, hours, type, isLive }) {
  const color = getSlaColor(hours, type);
  const styles = colorStyles[color];
  const Icon = color === 'green' ? CheckCircle : color === 'red' ? AlertTriangle : Clock;

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${styles.bg} ${styles.border}`}>
      <Icon className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${styles.text}`}>
            {hours != null ? formatDuration(hours) : 'Awaiting'}
          </p>
          {isLive && hours != null && (
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${styles.dot}`}></span>
              <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dot}`}></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SlaIndicator({ createdAt, firstResponseAt, resolvedAt, status }) {
  const [now, setNow] = useState(new Date());

  const isActive =
    status === 'OPEN' ||
    status === 'ASSIGNED' ||
    status === 'WORKING_ON' ||
    status === 'IN_PROGRESS';

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [isActive]);

  const responseHours = firstResponseAt
    ? getHoursBetween(createdAt, firstResponseAt)
    : (isActive ? getHoursBetween(createdAt, now) : null);

  const resolutionHours = resolvedAt
    ? getHoursBetween(createdAt, resolvedAt)
    : (isActive ? getHoursBetween(createdAt, now) : null);

  const responseIsLive = isActive && !firstResponseAt;
  const resolutionIsLive = isActive && !resolvedAt;

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">SLA Tracking</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <SlaMetric
          label={firstResponseAt ? 'First Response' : 'Awaiting Response'}
          hours={responseHours}
          type="response"
          isLive={responseIsLive}
        />
        <SlaMetric
          label={resolvedAt ? 'Resolution Time' : 'Time to Resolution'}
          hours={resolutionHours}
          type="resolution"
          isLive={resolutionIsLive}
        />
      </div>
    </div>
  );
}

/**
 * Compact SLA dot for ticket list rows.
 * Shows response-time color as a small dot.
 */
export function SlaDot({ createdAt, firstResponseAt, status }) {
  const [now, setNow] = useState(new Date());
  const isActive =
    status === 'OPEN' ||
    status === 'ASSIGNED' ||
    status === 'WORKING_ON' ||
    status === 'IN_PROGRESS';

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [isActive]);

  const responseHours = firstResponseAt
    ? getHoursBetween(createdAt, firstResponseAt)
    : (isActive ? getHoursBetween(createdAt, now) : null);

  const color = getSlaColor(responseHours, 'response');
  const styles = colorStyles[color];

  const label = responseHours != null
    ? `Response: ${formatDuration(responseHours)}`
    : 'No response data';

  return (
    <span title={label} className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} />
  );
}
