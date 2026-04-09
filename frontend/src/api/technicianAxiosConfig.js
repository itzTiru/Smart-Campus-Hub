import axios from 'axios';

const technicianApi = axios.create({
  baseURL: '/api/v1',
});

technicianApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('technician_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

technicianApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('technician_token');
      localStorage.removeItem('technician_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default technicianApi;
