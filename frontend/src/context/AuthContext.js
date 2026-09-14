'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { publicApi } from '../utils/apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore saved session from localStorage on initial mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('pos_auth_token');
      const savedUserStr = localStorage.getItem('pos_user');

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
      localStorage.removeItem('pos_auth_token');
      localStorage.removeItem('pos_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithPin = async (identifier, pinCode) => {
    try {
      const res = await publicApi.post('/api/users/pin-login', {
        identifier: identifier?.trim(),
        employeeCode: identifier?.trim(),
        email: identifier?.trim(),
        pinCode: pinCode?.trim()
      });

      if (res.data?.success) {
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);

        localStorage.setItem('pos_auth_token', newToken);
        localStorage.setItem('pos_user', JSON.stringify(newUser));

        return { success: true, user: newUser };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Invalid Employee ID / Email or PIN code' 
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('pos_auth_token');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_user_role');
    localStorage.removeItem('pos_user_name');
    localStorage.removeItem('pos_user_code');
    setUser(null);
    setToken(null);
  }, []);

  const lockTerminal = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      role: user?.role, 
      loginWithPin, 
      logout,
      lockTerminal, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
