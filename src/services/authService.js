import api from './api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      return response.data;
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        const networkError = new Error('Cannot connect to server. Please check your internet connection or the server might be down.');
        networkError.code = 'ERR_NETWORK';
        networkError.response = {
          data: {
            message: 'Cannot connect to server. Please check your internet connection or the server might be down.'
          }
        };
        throw networkError;
      }
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/admin/profile');
      return response.data.data;
    } catch (error) {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
  },
};