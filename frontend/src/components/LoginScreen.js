'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Delete,
  ShieldCheck,
  User
} from 'lucide-react';

export default function LoginScreen() {
  const { loginWithPin } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If typing inside the identifier text input, don't intercept digits as PIN
      if (document.activeElement?.id === 'identifier-input') {
        if (e.key === 'Enter') {
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
  }, [pinCode, identifier]);

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
      setErrorMsg('Please enter your PIN code (at least 4 digits)');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const res = await loginWithPin(identifier.trim(), pinCode.trim());

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.message || 'Incorrect ID/Email or PIN code');
      setPinCode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-black text-3xl shadow-xl shadow-amber-500/20">
            T
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              TCB POS & Tab Manager
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Terminal Authentication Required</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl backdrop-blur-xl">
          {/* Card Title */}
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Operator PIN Login</h2>
              <p className="text-[11px] text-slate-400">Enter your credentials to unlock terminal</p>
            </div>
          </div>

          {/* Identifier Input (Employee Code or Email) */}
          <div>
            <label htmlFor="identifier-input" className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Employee Code / Email</span>
              <span className="text-[10px] text-amber-400/80 font-mono">e.g. arman@tcbpos.com or ADM-001</span>
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
                placeholder="Enter Employee ID or Email..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-500 transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* PIN Indicator Dots */}
          <div className="text-center space-y-2 pt-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center space-x-1">
              <Lock className="w-3 h-3" />
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

          {/* Error / Success Feedback */}
          {errorMsg && (
            <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-center space-x-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Unlocked! Loading POS...</span>
            </div>
          )}

          {/* Tactile 3x4 Retail Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumpadClick(digit)}
                className="h-11 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded-xl border border-slate-700/80 shadow-sm transition flex items-center justify-center cursor-pointer select-none"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-11 bg-slate-800/60 hover:bg-slate-750 text-slate-400 font-bold text-xs rounded-xl border border-slate-700/60 active:scale-95 transition flex items-center justify-center uppercase cursor-pointer select-none"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              className="h-11 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded-xl border border-slate-700/80 shadow-sm transition flex items-center justify-center cursor-pointer select-none"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 bg-slate-800/60 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700/60 active:scale-95 transition flex items-center justify-center cursor-pointer select-none"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={submitting || !identifier.trim() || pinCode.length < 4}
            onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.99] text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40 transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed select-none"
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? 'Verifying PIN...' : 'Unlock Terminal'}</span>
          </button>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500">
          Terminal secured with encrypted token sessions. Contact system administrator for PIN assistance.
        </p>
      </div>
    </div>
  );
}
