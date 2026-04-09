import api from './axiosConfig';

export const registerTechnician = async (data) => {
  const response = await api.post('/auth/technicians/register', data);
  return response.data;
};

export const loginTechnician = async (data) => {
  const response = await api.post('/auth/technicians/login', data);
  return response.data;
};
