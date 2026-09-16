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
  const { loginWithPin, company } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const brandName = company?.branding?.displayName || 'PoS System';
  const brandLogo = company?.branding?.logoText || 'P';
  const brandLogoImg = company?.branding?.logoUrl || '/high-resolution-color-logo.png';

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-y-auto">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm md:max-w-3xl relative z-10 my-auto py-4">
        {/* Responsive Tablet Card (Single-column on mobile, 2-column on tablet/PC) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl backdrop-blur-xl md:grid md:grid-cols-2 md:gap-8 items-center max-h-[95vh] overflow-y-auto">
          {/* Left Column: Branding, Operator Input & Alerts */}
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
                <p className="text-xs text-slate-400">Terminal Authentication</p>
              </div>
            </div>

            {/* Operator Identifier Input */}
            <div className="pt-2">
              <label htmlFor="identifier-input" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Employee Code or Email</span>
                <span className="text-[10px] text-amber-400 font-mono">ADM-001 / ID</span>
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
                <span>Unlocked! Loading POS Terminal...</span>
              </div>
            )}

            {/* Instructions & Security Notice */}
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Secured Terminal Access</span>
              </div>
              <p>
                Enter your Employee Code (e.g. <strong className="text-slate-200">ADM-001</strong>) and 4–6 digit PIN code to unlock the POS register.
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
    </div>
  );
}
