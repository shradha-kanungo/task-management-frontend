import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Backend x-auth-token expect karta hai, isliye ise yahan rakhein
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    req.headers['x-auth-token'] = token;
  }
  return req;
});

export default API;