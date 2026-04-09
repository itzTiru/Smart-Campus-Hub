import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Wrench, Clock3, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getTickets } from '../api/ticketApi';

const TechnicianDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    assigned: '--',
    open: '--',
    inProgress: '--',
    resolved: '--',
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [assigned, open, inProgress, resolved] = await Promise.allSettled([
        getTickets({ assignedToId: user?.id, page: 0, size: 1 }),
        getTickets({ status: 'OPEN', page: 0, size: 1 }),
        getTickets({ assignedToId: user?.id, status: 'IN_PROGRESS', page: 0, size: 1 }),
        getTickets({ assignedToId: user?.id, status: 'RESOLVED', page: 0, size: 1 }),
      ]);

      setStats({
        assigned: assigned.status === 'fulfilled' ? (assigned.value.data || assigned.value).totalElements || 0 : '--',
        open: open.status === 'fulfilled' ? (open.value.data || open.value).totalElements || 0 : '--',
        inProgress: inProgress.status === 'fulfilled' ? (inProgress.value.data || inProgress.value).totalElements || 0 : '--',
        resolved: resolved.status === 'fulfilled' ? (resolved.value.data || resolved.value).totalElements || 0 : '--',
      });
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const cards = [
    { label: 'Assigned Tickets', value: stats.assigned, icon: ClipboardList, color: 'bg-sky-100 text-sky-700' },
    { label: 'Open Queue', value: stats.open, icon: Wrench, color: 'bg-amber-100 text-amber-700' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock3, color: 'bg-violet-100 text-violet-700' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Technician Dashboard</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Welcome back, <span className="font-medium text-gray-700 dark:text-gray-200">{user?.name || 'Technician'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/tickets" className="rounded-lg border p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Tickets</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View assigned issues, update ticket status, and keep maintenance work moving.
          </p>
        </Link>
        <Link to="/notifications/preferences" className="rounded-lg border p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notification Preferences</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Choose how you want to receive ticket assignment and status updates.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
