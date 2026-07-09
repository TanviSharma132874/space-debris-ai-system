import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

const isAuthError = (error) => {
  const status = error.response?.status;
  const message = `${error.response?.data?.message || ''} ${error.response?.data?.error || ''}`.toLowerCase();

  return (
    status === 401 ||
    message.includes('invalid token') ||
    message.includes('expired token') ||
    message.includes('invalid or expired token')
  );
};

const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:session-expired'));
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthError(error)) {
      clearAuthSession();
      error.isAuthError = true;

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default api;
