import api from './axiosConfig';

export const getTickets = async (params) => {
  const response = await api.get('/tickets', {
    params: {
      reporterId: params.reporterId,
      assignedToId: params.assignedToId,
      resourceId: params.resourceId,
      status: params.status,
      priority: params.priority,
      category: params.category,
      page: params.page,
      size: params.size,
    },
  });
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (ticketData, images) => {
  const formData = new FormData();
  formData.append(
    'ticket',
    new Blob([JSON.stringify(ticketData)], { type: 'application/json' })
  );
  if (images) {
    images.forEach((image) => {
      formData.append('images', image);
    });
  }
  const response = await api.post('/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateTicket = async (id, data) => {
  const response = await api.put(`/tickets/${id}`, data);
  return response.data;
};

export const deleteTicket = async (id) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
};

export const updateTicketStatus = async (id, data) => {
  const response = await api.patch(`/tickets/${id}/status`, data);
  return response.data;
};

export const assignTicket = async (id, technicianId) => {
  const response = await api.patch(`/tickets/${id}/assign`, null, {
    params: { technicianId },
  });
  return response.data;
};

export const uploadAttachment = async (ticketId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(
    `/tickets/${ticketId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const deleteAttachment = async (ticketId, attachmentId) => {
  const response = await api.delete(
    `/tickets/${ticketId}/attachments/${attachmentId}`
  );
  return response.data;
};

export const getAttachmentUrl = (ticketId, attachmentId) => {
  return `/tickets/${ticketId}/attachments/${attachmentId}`;
};

export const addComment = async (ticketId, data) => {
  const response = await api.post(`/tickets/${ticketId}/comments`, data);
  return response.data;
};

export const updateComment = async (ticketId, commentId, data) => {
  const response = await api.put(
    `/tickets/${ticketId}/comments/${commentId}`,
    data
  );
  return response.data;
};

export const deleteComment = async (ticketId, commentId) => {
  const response = await api.delete(
    `/tickets/${ticketId}/comments/${commentId}`
  );
  return response.data;
};

export const getComments = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/comments`);
  return response.data;
};
