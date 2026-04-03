import api from './axiosConfig';

export const getBookings = async (params) => {
  const response = await api.get('/bookings', {
    params: {
      userId: params.userId,
      status: params.status,
      resourceId: params.resourceId,
      page: params.page,
      size: params.size,
    },
  });
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const createBooking = async (data) => {
  const response = await api.post('/bookings', data);
  return response.data;
};

export const updateBooking = async (id, data) => {
  const response = await api.put(`/bookings/${id}`, data);
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const approveBooking = async (id, data) => {
  const response = await api.patch(`/bookings/${id}/approve`, data);
  return response.data;
};

export const rejectBooking = async (id, data) => {
  const response = await api.patch(`/bookings/${id}/reject`, data);
  return response.data;
};

export const getMyBookings = async (page, size) => {
  const response = await api.get('/bookings/my', {
    params: { page, size },
  });
  return response.data;
};

export const getBookingsByResource = async (resourceId, page, size) => {
  const response = await api.get(`/bookings/resource/${resourceId}`, {
    params: { page, size },
  });
  return response.data;
};

export const checkConflicts = async (resourceId, startTime, endTime) => {
  const response = await api.get('/bookings/conflicts', {
    params: { resourceId, startTime, endTime },
  });
  return response.data;
};

export const getBookingQrCode = async (id) => {
  const response = await api.get(`/bookings/${id}/qr`);
  return response.data;
};

export const checkInBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/checkin`);
  return response.data;
};
