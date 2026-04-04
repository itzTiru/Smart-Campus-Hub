import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    set({ notifications });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  incrementUnread: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  decrementUnread: () => {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
}));
