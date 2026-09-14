'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import PinLoginModal from './PinLoginModal';
import { 
  ShoppingBag, 
  Receipt, 
  Users, 
  FolderKanban, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  UserCircle, 
  ShieldCheck,
  KeyRound,
  LogOut
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { label: 'POS Terminal', href: '/', icon: ShoppingBag },
    { label: 'Staff Tabs', href: '/tabs', icon: Users },
    { label: 'Ledger', href: '/ledger', icon: Receipt },
    ...(role === 'admin' ? [
      { label: 'Admin Dashboard', href: '/admin', icon: FolderKanban },
      { label: 'Reports', href: '/reports', icon: BarChart3 }
    ] : [])
  ];

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Status */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black text-xl shadow-md">
                  T
                </div>
                <div>
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    TCB POS
                  </span>
                  <span className="text-xs text-slate-400 block -mt-1">& Tab Manager</span>
                </div>
              </Link>

              {/* Online / Offline Indicator */}
              <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-red-950/80 text-red-400 border border-red-800/60 animate-pulse'
              }`}>
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User & PIN Code Authentication Controls */}
            <div className="flex items-center space-x-3">
              {/* Cashier Identity Display */}
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-slate-400 font-medium">Logged In</div>
                <div className="text-sm font-semibold text-white flex items-center justify-end space-x-1">
                  <span>{user?.fullName || user?.employeeCode || 'User'}</span>
                  {role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  ) : (
                    <UserCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>

              {/* Role Indicator Badge */}
              <div className="px-2.5 py-1 text-xs font-bold rounded-md border border-slate-700 bg-slate-800 text-slate-200">
                <span className={role === 'admin' ? 'text-purple-400 uppercase' : 'text-amber-400 uppercase'}>
                  {role || 'User'}
                </span>
              </div>

              {/* PIN Code Switch Button */}
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                title="Switch User via PIN"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Switch</span>
              </button>

              {/* Lock Terminal / Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                title="Lock Terminal & Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Lock</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tactile Cashier PIN Code Numpad Modal */}
      <PinLoginModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
      />
    </>
  );
}
