import api from './axiosConfig';
import technicianApi from './technicianAxiosConfig';

export const getTechnicians = async (params = {}) => {
  const response = await api.get('/technicians', {
    params: {
      specialtyCategory: params.specialtyCategory,
      availableOnly: params.availableOnly,
    },
  });
  return response.data;
};

export const updateMyTechnicianProfile = async (data) => {
  const response = await technicianApi.patch('/technicians/me', data);
  return response.data;
};
