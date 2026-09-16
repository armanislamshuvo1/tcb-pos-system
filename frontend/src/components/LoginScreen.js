'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { publicApi } from '../utils/apiConfig';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Delete,
  ShieldCheck,
  User,
  Building2,
  HardDrive,
  KeyRound,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithPin, company: authCompany } = useAuth();

  // Terminal Device State
  const [deviceId, setDeviceId] = useState('');
  const [terminalLoading, setTerminalLoading] = useState(true);
  const [terminalInfo, setTerminalInfo] = useState(null); // { isBound, terminalName, company }

  // Pair / Bind Terminal Form State (Unpaired view)
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [bindCompanyId, setBindCompanyId] = useState('');
  const [bindTerminalName, setBindTerminalName] = useState('Counter 1');
  const [bindAdminId, setBindAdminId] = useState('');
  const [bindAdminPin, setBindAdminPin] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
  const [bindError, setBindError] = useState('');

  // Unbind / Reassign Modal State (System Admin lock)
  const [showUnbindModal, setShowUnbindModal] = useState(false);
  const [unbindAdminId, setUnbindAdminId] = useState('');
  const [unbindAdminPin, setUnbindAdminPin] = useState('');
  const [unbindLoading, setUnbindLoading] = useState(false);
  const [unbindError, setUnbindError] = useState('');

  // Regular PIN Unlock State
  const [identifier, setIdentifier] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize or restore persistent Device ID
  useEffect(() => {
    let currentDevId = localStorage.getItem('pos_device_id');
    if (!currentDevId) {
      currentDevId = 'DEV_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
      localStorage.setItem('pos_device_id', currentDevId);
    }
    setDeviceId(currentDevId);
    checkTerminalBinding(currentDevId);
  }, []);

  const checkTerminalBinding = async (devId) => {
    try {
      setTerminalLoading(true);
      const res = await publicApi.get(`/api/terminal/status?deviceId=${devId}`);
      if (res.data?.success) {
        setTerminalInfo(res.data.data);
        if (!res.data.data.isBound) {
          loadPublicCompanies();
        }
      }
    } catch (err) {
      console.error('Failed to load terminal status:', err);
    } finally {
      setTerminalLoading(false);
    }
  };

  const loadPublicCompanies = async () => {
    try {
      const res = await publicApi.get('/api/terminal/public-companies');
      if (res.data?.success) {
        setAvailableCompanies(res.data.data);
        if (res.data.data.length > 0 && !bindCompanyId) {
          setBindCompanyId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load public companies:', err);
    }
  };

  // Bind / Pair Terminal Handler
  const handleBindTerminal = async (e) => {
    e.preventDefault();
    setBindError('');
    if (!bindCompanyId) {
      setBindError('Please select a company');
      return;
    }
    if (!bindAdminId.trim() || !bindAdminPin.trim()) {
      setBindError('Admin Employee Code or Email and PIN are required to authorize this terminal');
      return;
    }

    setBindLoading(true);
    try {
      const res = await publicApi.post('/api/terminal/bind', {
        deviceId,
        companyId: bindCompanyId,
        terminalName: bindTerminalName.trim(),
        adminIdentifier: bindAdminId.trim(),
        adminPin: bindAdminPin.trim()
      });

      if (res.data?.success) {
        setBindAdminPin('');
        await checkTerminalBinding(deviceId);
      }
    } catch (err) {
      setBindError(err.response?.data?.message || 'Failed to bind terminal to company');
    } finally {
      setBindLoading(false);
    }
  };

  // Unbind / Reassign Terminal Handler (Requires System Admin Authorization)
  const handleUnbindTerminal = async (e) => {
    e.preventDefault();
    setUnbindError('');
    if (!unbindAdminId.trim() || !unbindAdminPin.trim()) {
      setUnbindError('System Admin Employee Code or Email and PIN are required');
      return;
    }

    setUnbindLoading(true);
    try {
      const res = await publicApi.post('/api/terminal/unbind', {
        deviceId,
        systemAdminIdentifier: unbindAdminId.trim(),
        systemAdminPin: unbindAdminPin.trim()
      });

      if (res.data?.success) {
        setShowUnbindModal(false);
        setUnbindAdminPin('');
        setUnbindAdminId('');
        await checkTerminalBinding(deviceId);
      }
    } catch (err) {
      setUnbindError(err.response?.data?.message || 'Failed to unbind terminal. System Admin credentials required.');
    } finally {
      setUnbindLoading(false);
    }
  };

  // Physical keyboard listener for PIN input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If typing inside any text input or modal, don't intercept as PIN
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        showUnbindModal ||
        !terminalInfo?.isBound
      ) {
        if (e.key === 'Enter' && document.activeElement?.id === 'identifier-input') {
          handleLogin();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        if (pinCode.length < 6) {
          setPinCode((prev) => prev + e.key);
          setErrorMsg('');
        }
      } else if (e.key === 'Backspace') {
        setPinCode((prev) => prev.slice(0, -1));
        setErrorMsg('');
      } else if (e.key === 'Enter') {
        handleLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinCode, identifier, showUnbindModal, terminalInfo]);

  const handleNumpadClick = (digit) => {
    if (pinCode.length < 6) {
      setPinCode((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPinCode('');
    setErrorMsg('');
  };

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Employee Code or Email');
      return;
    }

    if (!pinCode || pinCode.length < 4) {
      setErrorMsg('Please enter your 4-digit PIN code');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    // Pass deviceId so backend strictly validates company binding (zero crossover)
    const res = await loginWithPin(identifier.trim(), pinCode.trim(), deviceId);

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      // Route non-admins (cashier, staff) to POS Terminal
      if (res.user?.role === 'cashier' || res.user?.role === 'staff') {
        router.replace('/');
      }
    } else {
      setErrorMsg(res.message || 'Incorrect ID/Email or PIN code');
      setPinCode('');
    }
  };

  // Resolve current company branding
  const activeCompany = terminalInfo?.company || authCompany;
  const brandName = activeCompany?.branding?.displayName || activeCompany?.name || 'PoS System';
  const brandLogo = activeCompany?.branding?.logoText || 'P';
  const brandLogoImg = activeCompany?.branding?.logoUrl || '/high-resolution-color-logo.png';
  const terminalName = terminalInfo?.terminalName || 'Main Register';

  if (terminalLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 text-sm font-medium tracking-wide">Initializing Terminal Device...</div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: UNBOUND TERMINAL (Pair Device to Company)
  // =========================================================================
  if (!terminalInfo?.isBound) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardDrive className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white">Pair POS Terminal Device</h1>
            <p className="text-xs text-slate-400">
              This terminal is currently unassigned. Pair it with a B2B Company to lock it for cashier operations.
            </p>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Device Hardware ID:</span>
            <span className="font-mono font-bold text-amber-400">{deviceId}</span>
          </div>

          {bindError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{bindError}</span>
            </div>
          )}

          <form onSubmit={handleBindTerminal} className="space-y-3.5 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Company / Branch *</label>
              <select
                value={bindCompanyId}
                onChange={(e) => setBindCompanyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {availableCompanies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Terminal Label / Name *</label>
              <input
                type="text"
                required
                value={bindTerminalName}
                onChange={(e) => setBindTerminalName(e.target.value)}
                placeholder="e.g. Counter 1, Front Bar"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Authorization</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter Company Admin or System Admin credentials to verify and bind this device.
              </p>

              <div>
                <input
                  type="text"
                  required
                  value={bindAdminId}
                  onChange={(e) => setBindAdminId(e.target.value)}
                  placeholder="Admin Employee Code or Email..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={bindAdminPin}
                  onChange={(e) => setBindAdminPin(e.target.value)}
                  placeholder="Admin 4-Digit PIN Code..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={bindLoading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {bindLoading ? 'Pairing Device...' : 'Authorize & Bind Terminal to Company'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: BOUND TERMINAL (Zero-Crossover Cashier Fast PIN Login)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-y-auto">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm md:max-w-3xl relative z-10 my-auto py-4">
        {/* Responsive Tablet Card (Single-column on mobile, 2-column on tablet/PC) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl backdrop-blur-xl md:grid md:grid-cols-2 md:gap-8 items-center max-h-[95vh] overflow-y-auto">
          {/* Left Column: Company Branding, Terminal Status & Operator Input */}
          <div className="space-y-4 pb-4 md:pb-0 md:border-r md:border-slate-800 md:pr-8">
            {/* Brand Header */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-xl shadow-amber-500/10 flex items-center justify-center shrink-0">
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
                <div style={{ display: 'none' }} className="w-full h-full bg-amber-500 items-center justify-center font-black text-black text-2xl uppercase">
                  {brandLogo}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {brandName}
                </h1>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {terminalName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">[{activeCompany?.code}]</span>
                </div>
              </div>
            </div>

            {/* Operator Identifier Input */}
            <div className="pt-2">
              <label htmlFor="identifier-input" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Employee Code or Email</span>
                <span className="text-[10px] text-amber-400 font-mono">CS / ID</span>
              </label>
              <div className="relative">
                <input
                  id="identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter Employee Code or Email..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-500 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Error / Success Feedback */}
            {errorMsg && (
              <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-center space-x-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Unlocked! Opening POS Terminal...</span>
              </div>
            )}

            {/* Terminal Security Badge & Device Unbind CTA */}
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal Locked to {activeCompany?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnbindModal(true)}
                  className="text-[10px] text-slate-400 hover:text-amber-400 transition underline cursor-pointer"
                  title="Requires System Admin Authorization"
                >
                  Switch Company
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                This physical register is paired to <strong>{activeCompany?.name}</strong>. Only staff registered under this company can unlock.
              </p>
            </div>
          </div>

          {/* Right Column: PIN Indicator, Numpad & Unlock CTA */}
          <div className="space-y-4 pt-4 md:pt-0">
            {/* PIN Indicator Dots */}
            <div className="text-center space-y-1.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Enter 4 to 6-Digit PIN</span>
              </div>
              <div className="flex items-center justify-center space-x-2.5 py-1.5">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const hasDigit = pinCode.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        hasDigit
                          ? 'bg-amber-400 scale-125 shadow-md shadow-amber-400/50'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tactile 3x4 Retail Numpad (Touch-Optimized for Tablet) */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadClick(digit)}
                  className="h-11 sm:h-12 bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold text-lg rounded-xl border border-slate-700 shadow-sm transition flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-11 sm:h-12 bg-slate-800/60 hover:bg-slate-750 text-slate-400 font-bold text-xs rounded-xl border border-slate-700/60 active:scale-95 transition flex items-center justify-center uppercase cursor-pointer select-none"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleNumpadClick('0')}
                className="h-11 sm:h-12 bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold text-lg rounded-xl border border-slate-700 shadow-sm transition flex items-center justify-center cursor-pointer select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 sm:h-12 bg-slate-800/60 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700/60 active:scale-95 transition flex items-center justify-center cursor-pointer select-none"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={submitting || !identifier.trim() || pinCode.length < 4}
              onClick={handleLogin}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.99] text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40 transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Verifying PIN...' : 'Unlock Terminal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: UNBIND TERMINAL (Requires System Admin Auth)                       */}
      {/* ========================================================================= */}
      {showUnbindModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">System Admin Authorization</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnbindModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Only a <strong>System Admin</strong> can unbind this terminal to pair it with another B2B company.
            </p>

            {unbindError && (
              <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{unbindError}</span>
              </div>
            )}

            <form onSubmit={handleUnbindTerminal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">System Admin Code or Email *</label>
                <input
                  type="text"
                  required
                  value={unbindAdminId}
                  onChange={(e) => setUnbindAdminId(e.target.value)}
                  placeholder="ADM-001 or arman@tcbpos.com"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">System Admin PIN Code *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={unbindAdminPin}
                  onChange={(e) => setUnbindAdminPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUnbindModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unbindLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {unbindLoading ? 'Unbinding...' : 'Authorize & Unbind Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
