import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, User, Menu, Check, Trash2, Sun, Moon, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate, Link } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../../api/notificationApi';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const { unreadCount, setUnreadCount, setNotifications, notifications } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef(null);

  // Fetch unread count on mount
  useEffect(() => {
    getUnreadCount().then((res) => {
      setUnreadCount((res.data !== undefined ? res.data : res) || 0);
    }).catch(() => { /* ignore */ });
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const togglePanel = async () => {
    const opening = !showPanel;
    setShowPanel(opening);
    if (opening) {
      setLoadingNotifs(true);
      try {
        const res = await getNotifications(0, 20);
        const data = res.data || res;
        setNotifications(data.content || []);
      } catch { /* ignore */ } finally { setLoadingNotifs(false); }
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      useNotificationStore.getState().markAsRead(id);
      useNotificationStore.getState().decrementUnread();
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      const updated = notifications.map(n => ({ ...n, isRead: true, read: true }));
      setNotifications(updated);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-blue-600 sm:text-xl">Smart Campus Hub</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification bell + panel */}
        <div ref={panelRef} className="relative">
          <button onClick={togglePanel} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showPanel && (
            <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-semibold">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                )}
              </div>
              {loadingNotifs ? (
                <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No notifications</div>
              ) : (
                <div className="divide-y">
                  {notifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-2 px-4 py-3 text-sm ${n.isRead || n.read ? 'bg-white' : 'bg-blue-50'}`}>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {!(n.isRead || n.read) && (
                          <button onClick={() => handleMarkRead(n.id)} title="Mark read" className="text-blue-500 hover:text-blue-700"><Check className="h-3.5 w-3.5" /></button>
                        )}
                        <button onClick={() => handleDelete(n.id)} title="Delete" className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification preferences */}
        <Link to="/notifications/preferences" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Notification settings" title="Notification settings">
          <Settings className="h-5 w-5" />
        </Link>

        {/* Dark mode toggle */}
        <button onClick={toggleTheme} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle dark mode">
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User info */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-center text-[10px] font-medium text-blue-700">{user?.role || 'USER'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors" aria-label="Logout">
          <LogOut className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
