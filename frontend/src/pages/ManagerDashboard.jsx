import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarDays, ClipboardCheck, BellRing } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getResources } from '../api/resourceApi';
import { getMyBookings } from '../api/bookingApi';
import { getTickets } from '../api/ticketApi';
import { useNotificationStore } from '../store/notificationStore';

const ManagerDashboard = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [stats, setStats] = useState({
    resources: '--',
    myBookings: '--',
    myTickets: '--',
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [resources, bookings, tickets] = await Promise.allSettled([
        getResources({ status: 'ACTIVE', size: 1 }),
        getMyBookings(0, 1),
        getTickets({ reporterId: user?.id, page: 0, size: 1 }),
      ]);

      setStats({
        resources: resources.status === 'fulfilled' ? (resources.value.data || resources.value).totalElements || 0 : '--',
        myBookings: bookings.status === 'fulfilled' ? (bookings.value.data || bookings.value).totalElements || 0 : '--',
        myTickets: tickets.status === 'fulfilled' ? (tickets.value.data || tickets.value).totalElements || 0 : '--',
      });
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const cards = [
    { label: 'Active Resources', value: stats.resources, icon: Building2, color: 'bg-blue-100 text-blue-700', to: '/resources' },
    { label: 'My Bookings', value: stats.myBookings, icon: CalendarDays, color: 'bg-emerald-100 text-emerald-700', to: '/bookings' },
    { label: 'Reported Tickets', value: stats.myTickets, icon: ClipboardCheck, color: 'bg-orange-100 text-orange-700', to: '/tickets' },
    { label: 'Unread Notifications', value: unreadCount, icon: BellRing, color: 'bg-rose-100 text-rose-700', to: '/notifications/preferences' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manager Dashboard</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Welcome back, <span className="font-medium text-gray-700 dark:text-gray-200">{user?.name || 'Manager'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="rounded-lg border p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/bookings/new" className="rounded-lg border p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Plan a New Booking</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Reserve a room, lab, or equipment for upcoming meetings and events.
          </p>
        </Link>
        <Link to="/tickets/new" className="rounded-lg border p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report an Issue</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Submit facility or IT issues quickly so technicians can take action.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default ManagerDashboard;
