import api from './api';

export const bookingService = {
  getAllBookings: async () => {
    const response = await api.get('/admin/bookings');
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/visitor/bookings');
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/visitor/bookings', bookingData);
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data;
  },

  approveBooking: async (id) => {
    const response = await api.patch(`/admin/bookings/${id}/approve`);
    return response.data;
  },

  rejectBooking: async (id, reason) => {
    const response = await api.patch(`/admin/bookings/${id}/reject`, { reason });
    return response.data;
  },

  // Admin cancel booking
  cancelBooking: async (id) => {
    const response = await api.patch(`/admin/bookings/${id}/cancel`);
    return response.data;
  },

  // Admin update booking
  updateBooking: async (id, data) => {
    const response = await api.put(`/admin/bookings/${id}`, data);
    return response.data;
  },

  // Admin delete booking
  deleteBooking: async (id) => {
    const response = await api.delete(`/admin/bookings/${id}`);
    return response.data;
  },

  getBookingStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
};