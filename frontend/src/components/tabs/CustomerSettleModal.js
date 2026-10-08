'use client';

import React from 'react';
import { X, UserCheck, Eye, Printer, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function CustomerSettleModal({
  settleModalCustomer,
  customerTransactions,
  selectedCustomerTxnIds,
  onToggleCustomerTxnSelect,
  onSelectAllCustomerTxns,
  customerPaymentMethod,
  setCustomerPaymentMethod,
  selectedCustomerTotalInCents,
  customerSettleLoading,
  onExecuteCustomerSettlement,
  onViewTxnDetails,
  onOpenPrintCustomerBill,
  onClose,
  currency
}) {
  if (!settleModalCustomer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>Settle Customer Bill — {settleModalCustomer.customerName}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select discrete orders to settle with cash, card, or transfer.
            </p>
          </div>
          <button
            type="button"
            disabled={customerSettleLoading}
            onClick={() => !customerSettleLoading && onClose()}
            className={`p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition ${
              customerSettleLoading ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transactions List with Checkboxes */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs text-slate-400">
            <button
              type="button"
              onClick={onSelectAllCustomerTxns}
              className="font-bold text-amber-400 hover:underline cursor-pointer"
            >
              {selectedCustomerTxnIds.length === customerTransactions.length ? 'Deselect All' : 'Select All'}
            </button>
            <span>{customerTransactions.length} open transaction(s)</span>
          </div>

          {customerTransactions.map((txn) => {
            const isSelected = selectedCustomerTxnIds.includes(txn._id);
            const dateStr = new Date(txn.createdAt).toLocaleDateString();
            const timeStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={txn._id}
                onClick={() => onToggleCustomerTxnSelect(txn._id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none group ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 pointer-events-none"
                  />
                  <div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTxnDetails(txn);
                      }}
                      className="font-mono font-bold text-amber-400 text-sm hover:underline hover:text-amber-300 inline-flex items-center space-x-1 cursor-pointer"
                      title="Click to view full transaction details"
                    >
                      <span>{txn.txnNumber}</span>
                      <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-slate-400">
                      {dateStr} {timeStr} • {txn.items?.length || 0} items
                      {txn.notes && <span className="ml-1 text-slate-500 italic">• &ldquo;{txn.notes}&rdquo;</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="font-mono font-bold text-sm">
                    {formatCurrency(txn.grandTotalInCents, currency)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTxnDetails(txn);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer"
                    title="View Transaction Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-800 shrink-0">
          <div className="text-xs font-semibold text-slate-400">Settlement Payment Method:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['CASH', 'CARD', 'TRANSFER', 'OTHER'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setCustomerPaymentMethod(method)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                  customerPaymentMethod === method
                    ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {method.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer / Settlement CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <div>
            <div className="text-xs text-slate-400">Selected ({selectedCustomerTxnIds.length} txns):</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {formatCurrency(selectedCustomerTotalInCents, currency)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={customerSettleLoading}
              onClick={() => {
                const selectedTxns = customerTransactions.filter((t) => selectedCustomerTxnIds.includes(t._id));
                onOpenPrintCustomerBill(
                  settleModalCustomer.customerName,
                  selectedTxns.length > 0 ? selectedTxns : customerTransactions
                );
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 transition flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title="Print bill statement for selected or all open transactions"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>

            <button
              type="button"
              disabled={customerSettleLoading}
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={customerSettleLoading || selectedCustomerTxnIds.length === 0}
              onClick={onExecuteCustomerSettlement}
              className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition flex items-center space-x-2 ${
                customerSettleLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
              }`}
            >
              {customerSettleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Processing Settlement...</span>
                </>
              ) : (
                <span>Settle Customer Bill ({formatCurrency(selectedCustomerTotalInCents, currency)})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
