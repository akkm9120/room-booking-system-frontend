import React, { createContext, useState, useContext, useEffect } from 'react';
import { visitorAuthApi } from '../services/visitorApi';
import toast from 'react-hot-toast';

const VisitorAuthContext = createContext(null);

export const useVisitorAuth = () => {
  const context = useContext(VisitorAuthContext);
  if (!context) {
    throw new Error('useVisitorAuth must be used within VisitorAuthProvider');
  }
  return context;
};

export const VisitorAuthProvider = ({ children }) => {
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('visitorToken');
    const storedVisitor = localStorage.getItem('visitorUser');
    
    if (storedToken && storedVisitor) {
      setToken(storedToken);
      setVisitor(JSON.parse(storedVisitor));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await visitorAuthApi.login(credentials);
      const { visitor: visitorData, token: authToken } = response.data.data;
      
      // Store in state
      setVisitor(visitorData);
      setToken(authToken);
      
      // Store in localStorage
      localStorage.setItem('visitorToken', authToken);
      localStorage.setItem('visitorUser', JSON.stringify(visitorData));
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await visitorAuthApi.register(userData);
      toast.success('Registration successful! Please login.');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setVisitor(null);
    setToken(null);
    localStorage.removeItem('visitorToken');
    localStorage.removeItem('visitorUser');
    toast.success('Logged out successfully');
  };

  const updateVisitorData = (newData) => {
    setVisitor(newData);
    localStorage.setItem('visitorUser', JSON.stringify(newData));
  };

  const value = {
    visitor,
    token,
    loading,
    isAuthenticated: !!visitor,
    login,
    register,
    logout,
    updateVisitorData,
  };

  return (
    <VisitorAuthContext.Provider value={value}>
      {children}
    </VisitorAuthContext.Provider>
  );
};