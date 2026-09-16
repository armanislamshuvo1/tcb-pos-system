'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAxiosSecure } from '../hooks/useApi';
import { formatCurrency } from '../utils/currency';
import {
  AlertTriangle,
  X,
  KeyRound,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Delete,
  Ban,
  Receipt
} from 'lucide-react';

const PRESET_REASONS = [
  'Customer changed mind',
  'Duplicate / double charge',
  'Wrong item entered',
  'Payment failed / refunded',
  'Customer left without paying',
  'Cashier error / test ticket'
];

export default function VoidTransactionModal({ isOpen, txn, onClose, onVoidSuccess }) {
  const { user, currency } = useAuth();
  const axiosSecure = useAxiosSecure();

  const [reason, setReason] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setPinCode('');
      setErrorMsg('');
      setSuccessMsg('');
      setSubmitting(false);
    }
  }, [isOpen]);

  // Physical keyboard numpad & backspace listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept digits or backspace if user is typing in the reason input
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          onClose();
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
        if (reason.trim() && pinCode) {
          handleConfirmVoid();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinCode, reason]);

  if (!isOpen || !txn) return null;

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

  const handleConfirmVoid = async () => {
    if (!reason.trim()) {
      setErrorMsg('Please specify or select a cancellation reason');
      return;
    }

    if (!pinCode.trim()) {
      setErrorMsg('Please enter your PIN code to confirm');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await axiosSecure.post(`/api/transactions/${txn._id}/void`, {
        pinCode: pinCode.trim(),
        reason: reason.trim()
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Transaction voided successfully');
        setTimeout(() => {
          onVoidSuccess?.(res.data.data);
          onClose();
        }, 600);
      }
    } catch (err) {
      console.error('Error voiding transaction:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to void transaction. Check PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-red-950/20 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Void / Cancel Transaction</span>
              </h2>
              <div className="flex items-center space-x-2 text-xs font-mono text-red-400 font-bold">
                <span>{txn.txnNumber}</span>
                <span className="text-slate-500">•</span>
                <span className="text-white font-sans">{formatCurrency(txn.grandTotalInCents || 0, currency)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Warning Banner */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300 font-semibold block">Warning: Irreversible Action</strong>
              <span>
                Voiding this transaction will cancel the ticket and deduct the revenue/liability from system accounts. Your name will be recorded as the authorizing staff member.
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Reason Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Reason for Cancellation (Required)</span>
            </label>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setErrorMsg('');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition border ${
                    reason === preset
                      ? 'bg-amber-500 text-black border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Enter or customize the cancellation reason..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>

          {/* PIN Confirmation Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Authorizing Staff PIN ({user?.fullName || 'Current Cashier'})</span>
              </label>
              <span className="text-[10px] text-slate-400">Enter 4-6 digit PIN</span>
            </div>

            {/* PIN Display Dots */}
            <div className="flex justify-center space-x-3 py-2 bg-slate-850 rounded-xl border border-slate-800">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinCode.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-all ${
                      isFilled
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-800 border border-slate-700 text-slate-600'
                    }`}
                  >
                    {isFilled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadClick(digit.toString())}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black text-white text-base font-bold rounded-xl border border-slate-700 transition select-none cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 bg-slate-800/60 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl border border-slate-700/60 transition select-none cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleNumpadClick('0')}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black text-white text-base font-bold rounded-xl border border-slate-700 transition select-none cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-2.5 bg-slate-800/60 hover:bg-slate-750 text-slate-400 flex items-center justify-center rounded-xl border border-slate-700/60 transition select-none cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-850/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-700 disabled:opacity-50 cursor-pointer"
          >
            Keep Transaction
          </button>

          <button
            type="button"
            onClick={handleConfirmVoid}
            disabled={submitting || !reason.trim() || !pinCode}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center space-x-2"
          >
            <Ban className="w-4 h-4" />
            <span>{submitting ? 'Voiding...' : 'Confirm & Void Transaction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
