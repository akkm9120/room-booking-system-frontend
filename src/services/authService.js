import api from './api';

export const authService = {
  login: async (email, password, role) => {
    try {
      const endpoint = role === 'admin' ? '/admin/login' : '/visitor/login';
      const response = await api.post(endpoint, { email, password });
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
      // Try to verify admin token first
      const adminResponse = await api.get('/admin/profile');
      if (adminResponse.data.data) {
        return { ...adminResponse.data.data, role: 'admin' };
      }
    } catch (error) {
      // If admin verification fails, try to verify visitor token
      try {
        const userResponse = await api.get('/visitor/profile');
        if (userResponse.data.data) {
          return { ...userResponse.data.data, role: 'visitor' };
        }
      } catch (userError) {
        return null; // Neither token is valid
      }
    }
    return null;
  },

  logout: () => {
    // Remove both tokens on logout to be safe
    localStorage.removeItem('adminToken');
    localStorage.removeItem('visitorToken');
  },
};