import api from './api';

export const adminService = {
  // Get all admins
  getAllAdmins: async () => {
    const response = await api.get('/admin/admins');
    return response.data;
  },

  // Create new admin (super admin only)
  createAdmin: async (adminData) => {
    const response = await api.post('/admin/register', adminData);
    return response.data;
  },

  // Get admin profile
  getProfile: async () => {
    const response = await api.get('/admin/profile');
    return response.data;
  },

  // Get single admin
  getAdmin: async (id) => {
    const response = await api.get(`/admin/admins/${id}`);
    return response.data;
  },

  // Activate admin
  activateAdmin: async (id) => {
    const response = await api.patch(`/admin/admins/${id}/activate`);
    return response.data;
  },

  // Deactivate admin
  deactivateAdmin: async (id) => {
    const response = await api.patch(`/admin/admins/${id}/deactivate`);
    return response.data;
  },

  // Check if current user is super admin
  checkSuperAdmin: async () => {
    const response = await api.get('/admin/check-super-admin');
    return response.data;
  },
};
