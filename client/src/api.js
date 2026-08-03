import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
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