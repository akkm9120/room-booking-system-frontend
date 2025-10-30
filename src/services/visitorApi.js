import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://room-booking-system-uow-production.up.railway.app/api';

// Create axios instance
const visitorApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
visitorApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('visitorToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
visitorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('visitorToken');
      localStorage.removeItem('visitorUser');
      window.location.href = '/visitor/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const visitorAuthApi = {
  register: (data) => visitorApi.post('/visitor/register', data),
  login: (credentials) => visitorApi.post('/visitor/login', credentials),
};

// Profile endpoints
export const visitorProfileApi = {
  getProfile: () => visitorApi.get('/visitor/profile'),
  updateProfile: (data) => visitorApi.put('/visitor/profile', data),
};

// Rooms endpoints
export const visitorRoomsApi = {
  getAllRooms: (params) => visitorApi.get('/visitor/rooms', { params }),
  getRoomById: (id) => visitorApi.get(`/visitor/rooms/${id}`),
  checkAvailability: (id, params) => visitorApi.get(`/visitor/rooms/${id}/availability`, { params }),
};

// Bookings endpoints
export const visitorBookingsApi = {
  createBooking: (data) => visitorApi.post('/visitor/bookings', data),
  getAllBookings: (params) => visitorApi.get('/visitor/bookings', { params }),
  getBookingById: (id) => visitorApi.get(`/visitor/bookings/${id}`),
  updateBooking: (id, data) => visitorApi.put(`/visitor/bookings/${id}`, data),
  cancelBooking: (id) => visitorApi.patch(`/visitor/bookings/${id}/cancel`),
  getBookingHistory: (params) => visitorApi.get('/visitor/bookings/history', { params }),
};

export default visitorApi;