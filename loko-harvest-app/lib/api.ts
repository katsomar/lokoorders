import axios from 'axios';

const getBaseURL = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    return `http://${hostname}:8000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Idempotency key for mutating state requests
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    if (!config.headers['X-Request-ID'] && !config.headers['X-Idempotency-Key']) {
      const requestId = 'REQ-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      config.headers['X-Request-ID'] = requestId;
      config.headers['X-Idempotency-Key'] = requestId;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
