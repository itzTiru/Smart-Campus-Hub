import api from './axiosConfig';

export const getNotifications = async (page, size) => {
  const response = await api.get('/notifications', {
    params: { page, size },
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const getPreferences = async () => {
  const response = await api.get('/notifications/preferences');
  return response.data;
};

export const updatePreferences = async (prefs) => {
  const response = await api.put('/notifications/preferences', prefs);
  return response.data;
};
