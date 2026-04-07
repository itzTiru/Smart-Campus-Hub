import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Calendar, Ticket, MessageCircle, Settings } from 'lucide-react';
import { getPreferences, updatePreferences } from '../api/notificationApi';

const CATEGORIES = [
  {
    key: 'bookingUpdates',
    label: 'Booking Updates',
    description: 'Get notified when your bookings are approved or rejected',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    key: 'ticketUpdates',
    label: 'Ticket Updates',
    description: 'Get notified about ticket status changes and assignments',
    icon: Ticket,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  {
    key: 'commentNotifications',
    label: 'Comments',
    description: 'Get notified when someone comments on your tickets',
    icon: MessageCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/30',
  },
  {
    key: 'systemNotifications',
    label: 'System Notifications',
    description: 'Receive system-wide announcements',
    icon: Settings,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
  },
];

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    getPreferences()
      .then((res) => {
        setPrefs(res.data || res);
      })
      .catch(() => {
        setPrefs({
          bookingUpdates: true,
          ticketUpdates: true,
          commentNotifications: true,
          systemNotifications: true,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const savePrefs = useCallback((updated) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updatePreferences({
          bookingUpdates: updated.bookingUpdates,
          ticketUpdates: updated.ticketUpdates,
          commentNotifications: updated.commentNotifications,
          systemNotifications: updated.systemNotifications,
        });
        setToast('Saved');
        setTimeout(() => setToast(''), 2000);
      } catch {
        setToast('Failed to save');
        setTimeout(() => setToast(''), 3000);
      } finally {
        setSaving(false);
      }
    }, 400);
  }, []);

  const handleToggle = (key) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePrefs(updated);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Preferences
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose which notifications you want to receive. Changes are saved automatically.
        </p>
      </div>

      {/* Preference cards */}
      <div className="space-y-3">
        {CATEGORIES.map(({ key, label, description, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => handleToggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                prefs[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Toast notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
            toast === 'Failed to save'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900'
          }`}
        >
          {toast}
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Saving...
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
