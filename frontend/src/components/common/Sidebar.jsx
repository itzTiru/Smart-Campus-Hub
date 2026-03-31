import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Wrench,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/resources', label: 'Resources', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: Calendar },
  { to: '/tickets', label: 'Tickets', icon: Wrench },
];

const adminItems = [
  { to: '/admin', label: 'Admin Dashboard', icon: Shield, end: true },
  { to: '/admin/users', label: 'User Management', icon: Users },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
  }`;

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto dark:bg-gray-800 dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">SCH</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClasses} onClick={onClose}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <>
              <div className="my-4 border-t border-gray-200" />
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Administration
              </p>
              <ul className="space-y-1">
                {adminItems.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink to={to} end={end} className={linkClasses} onClick={onClose}>
                      <Icon className="h-5 w-5 shrink-0" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
