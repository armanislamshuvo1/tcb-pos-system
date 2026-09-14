'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { publicApi } from '../utils/apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    fullName: 'Sarah Jenkins',
    employeeCode: 'CSH-001',
    role: 'cashier',
    email: 'cashier@pos.local'
  });
  const [token, setToken] = useState('dev-cashier-token');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('pos_auth_token');
    const savedRole = localStorage.getItem('pos_user_role');
    const savedName = localStorage.getItem('pos_user_name');
    const savedCode = localStorage.getItem('pos_user_code');

    if (savedToken) {
      setToken(savedToken);
      setUser({
        fullName: savedName || (savedRole === 'admin' ? 'System Administrator' : 'Sarah Jenkins'),
        employeeCode: savedCode || (savedRole === 'admin' ? 'ADM-001' : 'CSH-001'),
        role: savedRole || 'cashier',
        email: `${savedRole || 'cashier'}@pos.local`
      });
    }
    setLoading(false);
  }, []);

  const loginWithPin = async (employeeCode, pinCode) => {
    try {
      const res = await publicApi.post('/api/users/pin-login', {
        employeeCode,
        pinCode
      });

      if (res.data?.success) {
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);

        localStorage.setItem('pos_auth_token', newToken);
        localStorage.setItem('pos_user_role', newUser.role);
        localStorage.setItem('pos_user_name', newUser.fullName);
        localStorage.setItem('pos_user_code', newUser.employeeCode);

        return { success: true, user: newUser };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Invalid Employee ID or PIN code' 
      };
    }
  };

  const lockTerminal = () => {
    // Switch to unauthenticated or prompt mode
    localStorage.removeItem('pos_auth_token');
    localStorage.removeItem('pos_user_role');
    localStorage.removeItem('pos_user_name');
    localStorage.removeItem('pos_user_code');
    setUser(null);
    setToken(null);
  };

  const switchRole = (newRole) => {
    const newToken = newRole === 'admin' ? 'dev-admin-token' : 'dev-cashier-token';
    const newName = newRole === 'admin' ? 'System Administrator' : 'Sarah Jenkins';
    const newCode = newRole === 'admin' ? 'ADM-001' : 'CSH-001';

    setToken(newToken);
    setUser({
      fullName: newName,
      employeeCode: newCode,
      role: newRole,
      email: `${newRole}@pos.local`
    });

    localStorage.setItem('pos_auth_token', newToken);
    localStorage.setItem('pos_user_role', newRole);
    localStorage.setItem('pos_user_name', newName);
    localStorage.setItem('pos_user_code', newCode);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, loginWithPin, lockTerminal, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
