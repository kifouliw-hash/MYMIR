import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mymir.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('myMirUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/login', { email, password }),
  register: (userData) => api.post('/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('myMirUser');
  },
};

export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
};

export const analysisAPI = {
  uploadDocument: (formData) => api.post('/api/analysis/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getHistory: () => api.get('/api/analysis/history'),
};

export default api;
