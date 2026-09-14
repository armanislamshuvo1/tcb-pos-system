'use client';

import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';

function AuthGate({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 text-sm font-medium tracking-wide">Starting TCB POS...</div>
      </div>
    );
  }

  if (!user || !token) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
