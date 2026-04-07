import api from './axiosConfig';

export const getResources = async (params) => {
  const response = await api.get('/resources', {
    params: {
      type: params.type,
      status: params.status,
      minCapacity: params.minCapacity,
      location: params.location,
      page: params.page,
      size: params.size,
    },
  });
  return response.data;
};

export const getResourceById = async (id) => {
  const response = await api.get(`/resources/${id}`);
  return response.data;
};

export const createResource = async (data) => {
  const response = await api.post('/resources', data);
  return response.data;
};

export const updateResource = async (id, data) => {
  const response = await api.put(`/resources/${id}`, data);
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}`);
  return response.data;
};

export const toggleResourceStatus = async (id) => {
  const response = await api.patch(`/resources/${id}/status`);
  return response.data;
};

export const searchResources = async (keyword, page, size) => {
  const response = await api.get('/resources/search', {
    params: { keyword, page, size },
  });
  return response.data;
};

export const getAvailableResources = async (startTime, endTime) => {
  const response = await api.get('/resources/available', {
    params: { startTime, endTime },
  });
  return response.data;
};

export const getResourceSchedule = async (id, date) => {
  const response = await api.get(`/resources/${id}/schedule`, {
    params: { date },
  });
  return response.data;
};
