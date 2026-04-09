import api from './axiosConfig';

export const getTechnicians = async (params = {}) => {
  const response = await api.get('/technicians', {
    params: {
      specialtyCategory: params.specialtyCategory,
      availableOnly: params.availableOnly,
    },
  });
  return response.data;
};
