import technicianApi from './technicianAxiosConfig';

export const getMyTechnicianTickets = async (params = {}) => {
  const response = await technicianApi.get('/technicians/me/tickets', {
    params: {
      status: params.status,
      page: params.page,
      size: params.size,
    },
  });
  return response.data;
};

export const respondToTechnicianAssignment = async (ticketId, data) => {
  const response = await technicianApi.patch(
    `/technicians/me/tickets/${ticketId}/response`,
    data
  );
  return response.data;
};

export const markTechnicianTicketDone = async (ticketId, data = {}) => {
  const response = await technicianApi.patch(
    `/technicians/me/tickets/${ticketId}/done`,
    data
  );
  return response.data;
};

export const addTechnicianComment = async (ticketId, data) => {
  const response = await technicianApi.post(`/tickets/${ticketId}/comments`, data);
  return response.data;
};
