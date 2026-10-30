import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return 'http://localhost:5001/api';
  }
  // Trim trailing whitespace and slashes
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  // If the user provided the domain root without /api, append /api automatically
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Automatically attach JWT Token from localStorage to every outgoing request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('khataverse_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;