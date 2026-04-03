import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, Wrench, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getResources } from '../api/resourceApi';
import { getBookings } from '../api/bookingApi';
import { getTickets } from '../api/ticketApi';
import { getAllUsers } from '../api/authApi';
import { RESOURCE_TYPES } from '../utils/constants';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ resources: 0, pendingBookings: 0, openTickets: 0, users: 0 });
  const [resourceTypeData, setResourceTypeData] = useState([]);
  const [ticketStatusData, setTicketStatusData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch stats
        const [resourcesRes, pendingRes, openRes, usersRes] = await Promise.allSettled([
          getResources({ size: 1 }),
          getBookings({ status: 'PENDING', size: 1 }),
          getTickets({ status: 'OPEN', size: 1 }),
          getAllUsers(),
        ]);

        const totalResources = resourcesRes.status === 'fulfilled' ? (resourcesRes.value.data || resourcesRes.value).totalElements || 0 : 0;
        const pendingBookings = pendingRes.status === 'fulfilled' ? (pendingRes.value.data || pendingRes.value).totalElements || 0 : 0;
        const openTickets = openRes.status === 'fulfilled' ? (openRes.value.data || openRes.value).totalElements || 0 : 0;
        const usersList = usersRes.status === 'fulfilled' ? (usersRes.value.data || usersRes.value) : [];
        const totalUsers = Array.isArray(usersList) ? usersList.length : 0;

        setStats({ resources: totalResources, pendingBookings, openTickets, users: totalUsers });

        // Fetch data for charts — resources by type
        const allResourcesRes = await getResources({ size: 100 }).catch(() => null);
        if (allResourcesRes) {
          const resources = (allResourcesRes.data || allResourcesRes).content || [];
          const typeCounts = {};
          resources.forEach(r => {
            const label = RESOURCE_TYPES.find(t => t.value === r.type)?.label || r.type;
            typeCounts[label] = (typeCounts[label] || 0) + 1;
          });
          setResourceTypeData(Object.entries(typeCounts).map(([name, count]) => ({ name, count })));
        }

        // Booking status distribution
        const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
        const bookingCounts = await Promise.all(
          statuses.map(s => getBookings({ status: s, size: 1 }).then(r => ({ status: s, count: (r.data || r).totalElements || 0 })).catch(() => ({ status: s, count: 0 })))
        );
        setBookingStatusData(bookingCounts.filter(b => b.count > 0));

        // Ticket status distribution
        const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
        const ticketCounts = await Promise.all(
          ticketStatuses.map(s => getTickets({ status: s, size: 1 }).then(r => ({ status: s, count: (r.data || r).totalElements || 0 })).catch(() => ({ status: s, count: 0 })))
        );
        setTicketStatusData(ticketCounts.filter(t => t.count > 0));

      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const statCards = [
    { label: 'Total Resources', value: stats.resources, icon: Building2, color: 'bg-blue-100 text-blue-600', link: '/resources' },
    { label: 'Pending Bookings', value: stats.pendingBookings, icon: Calendar, color: 'bg-yellow-100 text-yellow-600', link: '/bookings' },
    { label: 'Open Tickets', value: stats.openTickets, icon: Wrench, color: 'bg-orange-100 text-orange-600', link: '/tickets' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-purple-100 text-purple-600', link: '/admin/users' },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>

      {/* Stat cards */}
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resources by Type - Bar Chart */}
        {resourceTypeData.length > 0 && (
          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">Resources by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resourceTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Booking Status - Pie Chart */}
        {bookingStatusData.length > 0 && (
          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">Booking Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={bookingStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {bookingStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ticket Status - Pie Chart */}
        {ticketStatusData.length > 0 && (
          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">Ticket Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ticketStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {ticketStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/bookings" className="rounded-lg border p-4 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Review Bookings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Approve or reject pending booking requests</p>
        </Link>
        <Link to="/tickets" className="rounded-lg border p-4 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Manage Tickets</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Assign technicians and update ticket status</p>
        </Link>
        <Link to="/admin/users" className="rounded-lg border p-4 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">User Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage user roles and account status</p>
        </Link>
        <Link to="/resources" className="rounded-lg border p-4 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Resource Catalogue</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, or deactivate campus resources</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
