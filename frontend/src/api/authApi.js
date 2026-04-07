import api from './axiosConfig';

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/auth/me', data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const updateUserRole = async (id, data) => {
  const response = await api.patch(`/admin/users/${id}/role`, data);
  return response.data;
};

export const toggleUserStatus = async (id) => {
  const response = await api.patch(`/admin/users/${id}/status`);
  return response.data;
};
