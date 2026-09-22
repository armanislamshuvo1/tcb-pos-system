'use client';

import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '../lib/queryClient';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { CloudUpload, RefreshCw } from 'lucide-react';

function OfflineSyncBanner() {
  const { pendingCount, isSyncing, syncNow } = useOfflineSync();

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[200] bg-amber-500 text-black px-3.5 py-2 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border border-amber-400 animate-in slide-in-from-bottom-2">
      {isSyncing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <CloudUpload className="w-4 h-4" />
      )}
      <span>{isSyncing ? 'Syncing tickets...' : `${pendingCount} offline ticket(s) queued`}</span>
      {!isSyncing && (
        <button
          type="button"
          onClick={syncNow}
          className="ml-2 px-2 py-0.5 bg-black text-amber-400 rounded-lg text-[10px] font-black uppercase hover:bg-slate-900 transition cursor-pointer"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}

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

  return (
    <>
      <OfflineSyncBanner />
      {children}
    </>
  );
}

export default function Providers({ children }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
