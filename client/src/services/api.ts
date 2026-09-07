import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Set token from localStorage on startup
const storedToken = localStorage.getItem('assetorbit_token');
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

// Ensure every request always carries the latest token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('assetorbit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
