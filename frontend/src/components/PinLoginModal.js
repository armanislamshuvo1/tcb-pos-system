'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAxiosSecure } from '../hooks/useApi';
import { 
  KeyRound, 
  Lock, 
  UserCheck, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Delete,
  ShieldCheck
} from 'lucide-react';

export default function PinLoginModal({ isOpen, onClose }) {
  const { user, loginWithPin } = useAuth();
  const axiosSecure = useAxiosSecure();

  const [employeeCode, setEmployeeCode] = useState(user?.employeeCode || '');
  const [pinCode, setPinCode] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load staff list for quick selection chips
  useEffect(() => {
    if (isOpen) {
      setEmployeeCode(user?.employeeCode || '');
      setPinCode('');
      setErrorMsg('');
      setSuccess(false);

      axiosSecure.get('/api/staff')
        .then((res) => {
          if (res.data?.success) {
            setActiveUsers(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, axiosSecure, user]);

  // Physical keyboard numpad listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pinCode.length < 6) {
          setPinCode((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPinCode((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleLogin();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinCode, employeeCode]);

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
    if (!employeeCode.trim()) {
      setErrorMsg('Please enter or select an Employee ID');
      return;
    }

    if (!pinCode) {
      setErrorMsg('Please enter your 4-digit PIN code');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const res = await loginWithPin(employeeCode, pinCode);

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.message || 'Incorrect PIN code');
      setPinCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm md:max-w-2xl w-full p-5 sm:p-6 md:p-7 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Switch Operator / Cashier PIN</h3>
              <p className="text-[11px] text-slate-400">Unlock terminal or switch active staff</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Body: Single column on mobile, 2-column on tablet/PC */}
        <div className="md:grid md:grid-cols-2 md:gap-6 items-start">
          {/* Left Column: Operator Selection & Credentials */}
          <div className="space-y-4 pb-4 md:pb-0 md:border-r md:border-slate-800 md:pr-6">
            {/* Quick User Selection Chips */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Select Operator</span>
                <span className="text-[10px] text-amber-400 font-mono">{activeUsers.length} staff</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 md:max-h-48 overflow-y-auto pr-1">
                {activeUsers.map((u) => {
                  const isSelected = employeeCode === u.employeeCode;
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => {
                        setEmployeeCode(u.employeeCode);
                        setPinCode('');
                        setErrorMsg('');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-500 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {u.fullName} <span className="opacity-75 font-mono">({u.employeeCode})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Employee ID Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Employee Code / Badge ID
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                placeholder="e.g. CSH-001 or ADM-001"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Error / Success Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Authenticated! Switching operator...</span>
              </div>
            )}
          </div>

          {/* Right Column: PIN Indicator, Numpad & Submit */}
          <div className="space-y-4 pt-2 md:pt-0">
            {/* PIN Dots Display */}
            <div className="text-center space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-center space-x-1.5">
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
                          ? 'bg-amber-400 scale-110 shadow-lg shadow-amber-400/40'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tactile 3x4 Retail Numpad */}
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

            {/* Unlock Action Button */}
            <button
              type="button"
              disabled={submitting || pinCode.length < 4}
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.99] text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40 transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Authenticating...' : 'Unlock Terminal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
