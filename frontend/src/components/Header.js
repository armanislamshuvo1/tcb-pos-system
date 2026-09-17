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
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  Crown
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, role, logout, company } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const brandName = company?.branding?.displayName || 'PoS System';
  const brandLogo = company?.branding?.logoText || 'P';
  const brandLogoImg = company?.branding?.logoUrl || '/high-resolution-color-logo.png';
  const isSystemAdmin = role === 'system_admin';
  const isAdmin = role === 'admin' || isSystemAdmin;

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

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const navItems = [
    { label: 'POS Terminal', href: '/', icon: ShoppingBag, desc: 'Point-of-Sale checkout & active ticket' },
    { label: 'Tabs & Room Bills', href: '/tabs', icon: Users, desc: 'Consolidated staff tabs & room bills' },
    { label: 'Ledger', href: '/ledger', icon: Receipt, desc: 'Transaction history & audit trail' },
    ...(isAdmin ? [
      { label: 'Admin Dashboard', href: '/admin', icon: FolderKanban, desc: 'Catalog, staff, currency & discounts' },
      { label: 'Reports', href: '/reports', icon: BarChart3, desc: 'Sales & consumption analytics' }
    ] : []),
    ...(isSystemAdmin ? [
      { label: 'B2B Companies', href: '/admin?tab=companies', icon: Building2, desc: 'Multi-tenant branding & companies' }
    ] : [])
  ];

  return (
    <>
      {/* Floating Menu Trigger Button (Replaces top navbar to allow full-screen layout) */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-2.5 left-2.5 z-40 flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-850 border border-slate-700/90 text-slate-200 hover:text-white shadow-xl backdrop-blur-md active:scale-95 transition cursor-pointer group"
        title="Open Navigation Menu"
      >
        <Menu className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold hidden sm:inline">Menu</span>
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      </button>

      {/* Slide-out Navigation Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 sm:w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Top Bar of Drawer */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/80 flex items-center justify-center shadow-md shrink-0">
                  <img
                    src={brandLogoImg}
                    alt={brandName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-full h-full bg-amber-500 items-center justify-center font-bold text-black text-sm uppercase">
                    {brandLogo}
                  </div>
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    {brandName}
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">Navigation Menu</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Staff Info Card */}
            <div className="p-3.5 mx-3 mt-3 bg-slate-850 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Active Operator
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${
                  isSystemAdmin 
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' 
                    : role === 'admin' 
                    ? 'border-purple-500/40 bg-purple-500/15 text-purple-300' 
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}>
                  {isSystemAdmin ? 'SYS ADMIN' : role === 'admin' ? 'ADMIN' : (role || 'USER')}
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate flex items-center space-x-1">
                    <span>{user?.fullName || user?.employeeCode || 'User'}</span>
                    {isSystemAdmin ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : (
                      <UserCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {user?.employeeCode || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
                System Sections
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                      <div className="text-left">
                        <div>{item.label}</div>
                        {item.desc && (
                          <div className={`text-[10px] font-normal ${isActive ? 'text-black/80' : 'text-slate-500'}`}>
                            {item.desc}
                          </div>
                        )}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-black shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 ml-2" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsPinModalOpen(true);
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Switch</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
                <span>System Status</span>
                <span className={`font-semibold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Tactile Cashier PIN Code Numpad Modal */}
      <PinLoginModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
      />
    </>
  );
}
