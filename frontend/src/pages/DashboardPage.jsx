import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, Wrench, Bell, Plus, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getResources } from '../api/resourceApi';
import { getMyBookings } from '../api/bookingApi';
import { getTickets } from '../api/ticketApi';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [stats, setStats] = useState({ resources: '--', bookings: '--', tickets: '--' });

  useEffect(() => {
    const fetchStats = async () => {
      const [r, b, t] = await Promise.allSettled([
        getResources({ status: 'ACTIVE', size: 1 }),
        getMyBookings(0, 1),
        getTickets({ size: 1 }),
      ]);
      setStats({
        resources: r.status === 'fulfilled' ? (r.value.data || r.value).totalElements || 0 : '--',
        bookings: b.status === 'fulfilled' ? (b.value.data || b.value).totalElements || 0 : '--',
        tickets: t.status === 'fulfilled' ? (t.value.data || t.value).totalElements || 0 : '--',
      });
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Active Resources', value: stats.resources, icon: Building2, color: 'bg-blue-100 text-blue-600', link: '/resources' },
    { label: 'My Bookings', value: stats.bookings, icon: Calendar, color: 'bg-green-100 text-green-600', link: '/bookings' },
    { label: 'Tickets', value: stats.tickets, icon: Wrench, color: 'bg-orange-100 text-orange-600', link: '/tickets' },
    { label: 'Unread Notifications', value: unreadCount, icon: Bell, color: 'bg-purple-100 text-purple-600', link: '#' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Welcome back, <span className="font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link to={link} key={label} className="flex items-center gap-4 rounded-lg border p-4 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/bookings/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Book a Resource
          </Link>
          <Link to="/tickets/new" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            <AlertTriangle className="h-4 w-4" /> Report an Issue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
