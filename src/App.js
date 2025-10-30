import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Rooms from './pages/Rooms';
import Users from './pages/Users';
// Visitor Components
import { VisitorAuthProvider } from './contexts/VisitorAuthContext';
import VisitorLogin from './pages/VisitorLogin';
import VisitorRegister from './pages/VisitorRegister';
import VisitorLayout from './components/VisitorLayout';
import VisitorProtectedRoute from './components/VisitorProtectedRoute';
import VisitorRooms from './pages/VisitorRooms';
import VisitorBookings from './pages/VisitorBookings';
import VisitorProfile from './pages/VisitorProfile';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VisitorAuthProvider>
          <Router>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/visitor/login" replace />} />

              {/* Visitor Routes - Public */}
              <Route path="/visitor/login" element={<VisitorLogin />} />
              <Route path="/visitor/register" element={<VisitorRegister />} />

              {/* Visitor Routes - Protected */}
              <Route
                path="/visitor/*"
                element={
                  <VisitorProtectedRoute>
                    <VisitorLayout />
                  </VisitorProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/visitor/rooms" replace />} />
                <Route path="rooms" element={<VisitorRooms />} />
                <Route path="bookings" element={<VisitorBookings />} />
                <Route path="profile" element={<VisitorProfile />} />
              </Route>

              {/* Admin / Staff Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Bookings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/rooms" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Rooms />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </VisitorAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;