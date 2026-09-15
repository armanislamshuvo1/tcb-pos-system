'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import {
  X,
  Receipt,
  Calendar,
  User,
  Clock,
  CreditCard,
  Tag,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  Hash,
  UserCheck,
  ShoppingBag,
  Percent
} from 'lucide-react';

export default function TransactionDetailModal({ txn, onClose }) {
  const { currency } = useAuth();
  const printRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!txn) return null;

  const dateObj = new Date(txn.createdAt);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const settledDateObj = txn.settledAt ? new Date(txn.settledAt) : null;
  const formattedSettledDate = settledDateObj
    ? `${settledDateObj.toLocaleDateString()} ${settledDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'CARD':
        return 'Credit / Debit Card';
      case 'TAB_DEFERRED':
        return 'Tab Deferred (Unpaid)';
      case 'PAYROLL_DEDUCTION':
        return 'Payroll Deduction';
      case 'TRANSFER':
        return 'Bank Transfer / DuitNow';
      case 'OTHER':
        return 'Other';
      default:
        return method || 'Unknown';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine Customer / Room / Staff type
  const renderAssignmentInfo = () => {
    if (txn.customerName) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-blue-300">{txn.customerName}</span>
          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
            Customer Tab
          </span>
        </div>
      );
    }
    if (txn.roomNumber) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-amber-400">{txn.roomNumber}</span>
          {txn.guestName && (
            <span className="text-slate-300 text-xs">({txn.guestName})</span>
          )}
          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
            Room Bill
          </span>
        </div>
      );
    }
    if (txn.staffNameSnapshot) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-purple-300">{txn.staffNameSnapshot}</span>
          <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
            Staff Tab
          </span>
        </div>
      );
    }
    return <span className="text-slate-400 font-medium">Walk-in Customer</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Click outside backdrop handler */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div 
        ref={printRef}
        className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150 print:bg-white print:text-black print:border-none print:shadow-none print:max-h-none print:w-full print:m-0"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-850/80 sticky top-0 z-10 print:bg-white print:border-b-2 print:border-black">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center space-x-2 print:text-black">
                  <span>Transaction Details</span>
                </h2>
                <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-bold print:text-black">
                  <span>{txn.txnNumber}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                txn.status === 'PAID'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                  : txn.status === 'UNPAID_TAB'
                  ? 'bg-blue-950/80 text-blue-400 border-blue-700'
                  : 'bg-red-950/80 text-red-400 border-red-700'
              } print:border-black print:text-black print:bg-transparent`}
            >
              {txn.status === 'PAID' ? 'PAID' : txn.status === 'UNPAID_TAB' ? 'UNPAID TAB' : txn.status}
            </span>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition print:hidden"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-850/60 rounded-2xl border border-slate-800/80 text-xs print:bg-transparent print:border-slate-300">
            {/* Timestamp */}
            <div className="flex items-start space-x-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 font-medium">Date & Time</div>
                <div className="text-white font-semibold print:text-black">
                  {formattedDate} • {formattedTime}
                </div>
              </div>
            </div>

            {/* Cashier */}
            <div className="flex items-start space-x-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 font-medium">Audited Cashier</div>
                <div className="text-white font-semibold print:text-black">
                  {txn.cashierNameSnapshot || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Customer / Assignment */}
            <div className="flex items-start space-x-2.5">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 font-medium">Customer / Assignment</div>
                <div className="mt-0.5">{renderAssignmentInfo()}</div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start space-x-2.5">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 font-medium">Payment Method</div>
                <div className="text-white font-semibold print:text-black">
                  {getPaymentMethodLabel(txn.paymentMethod)}
                </div>
              </div>
            </div>

            {/* Settled Info (if applicable) */}
            {txn.settledAt && (
              <div className="flex items-start space-x-2.5 sm:col-span-2 pt-2 border-t border-slate-800/60 print:border-slate-200">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-slate-400">
                  <span>Settled on </span>
                  <span className="text-emerald-300 font-medium print:text-black">{formattedSettledDate}</span>
                  {txn.settledByCashierNameSnapshot && (
                    <span> by <strong className="text-white print:text-black">{txn.settledByCashierNameSnapshot}</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes (if any) */}
          {txn.notes && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-200">
              <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block">Notes</span>
                <p className="italic text-amber-100 print:text-black">{txn.notes}</p>
              </div>
            </div>
          )}

          {/* Purchased Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Line Items ({txn.items?.length || 0})</span>
              </span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-black">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-850 text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                    <th className="py-2.5 px-3 sm:px-4 font-semibold">Item</th>
                    <th className="py-2.5 px-2 text-center font-semibold">Qty</th>
                    <th className="py-2.5 px-2 text-right font-semibold">Price</th>
                    <th className="py-2.5 px-2 text-right font-semibold">Discount</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-black">
                  {txn.items && txn.items.length > 0 ? (
                    txn.items.map((item, idx) => {
                      const hasLineDiscount = item.lineDiscountInCents > 0;
                      return (
                        <tr key={item._id || idx} className="hover:bg-slate-850/40 print:hover:bg-transparent">
                          <td className="py-2.5 px-3 sm:px-4">
                            <div className="font-semibold text-white print:text-black">
                              {item.productNameSnapshot}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-2">
                              {item.skuSnapshot && <span>SKU: {item.skuSnapshot}</span>}
                              {item.categoryNameSnapshot && (
                                <span className="text-slate-500">• {item.categoryNameSnapshot}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-300 print:text-black">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-300 print:text-black">
                            {formatCurrency(item.unitPriceInCents, currency)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                            {hasLineDiscount ? (
                              <span className="text-amber-400 font-semibold print:text-black">
                                -{formatCurrency(item.lineDiscountInCents, currency)}
                                {item.lineDiscountType === 'percentage' && (
                                  <span className="text-[10px] text-amber-500/80 ml-0.5">
                                    ({item.lineDiscountValue}%)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-white print:text-black">
                            {formatCurrency(item.finalLineTotalInCents, currency)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        No items recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="p-4 bg-slate-850/80 rounded-2xl border border-slate-800 space-y-2 text-xs print:bg-transparent print:border-slate-300">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white print:text-black font-semibold">
                {formatCurrency(txn.subtotalInCents ?? 0, currency)}
              </span>
            </div>

            {txn.globalDiscountInCents > 0 && (
              <div className="flex justify-between text-amber-400 print:text-black font-medium">
                <span className="flex items-center space-x-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>
                    Global Discount
                    {txn.globalDiscountType === 'percentage'
                      ? ` (${txn.globalDiscountValue}%)`
                      : ''}
                    :
                  </span>
                </span>
                <span className="font-mono font-semibold">
                  -{formatCurrency(txn.globalDiscountInCents, currency)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-750 print:border-black flex justify-between items-center text-sm font-black">
              <span className="text-white print:text-black">Grand Total:</span>
              <span className="text-lg font-mono text-amber-400 print:text-black">
                {formatCurrency(txn.grandTotalInCents ?? 0, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-850/80 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
