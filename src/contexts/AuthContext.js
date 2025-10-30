import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);

  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('visitorToken');
      if (token) {
        // Verify token is still valid
        const userData = await authService.verifyToken();
        if (userData) {
          const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
          setUser({ ...userData, name });
          setRole(userData.role);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('visitorToken');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('visitorToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email, password, role) => {
    try {
      const response = await authService.login(email, password, role);
      const { token } = response.data;
      const userData = response.data.visitor || response.data.admin;

      if (role === 'admin') {
        localStorage.setItem('adminToken', token);
      } else {
        localStorage.setItem('visitorToken', token);
      }
      
      const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      setUser({ ...userData, name });
      setRole(role);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle network errors with a more user-friendly message
      if (error.code === 'ERR_NETWORK') {
        return { 
          success: false, 
          message: 'Cannot connect to server. Please check your internet connection or try again later.'
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    role,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};