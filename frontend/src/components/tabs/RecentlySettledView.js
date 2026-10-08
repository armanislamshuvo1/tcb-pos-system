'use client';

import React from 'react';
import { 
  Search, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function RecentlySettledView({
  settledSearchTerm,
  setSettledSearchTerm,
  settledBills = [],
  settledLoading,
  expandedSettledBillIds = {},
  toggleSettledBillAccordion,
  onOpenRevertModal,
  currency
}) {
  return (
    <div className="space-y-4">
      {/* Search Input & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={settledSearchTerm}
            onChange={(e) => setSettledSearchTerm(e.target.value)}
            placeholder="Search settled bills by TXN #, customer, room, or staff..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Showing last <strong>{settledBills.length}</strong> settled transactions</span>
        </div>
      </div>

      {/* Settled Bills List */}
      {settledLoading ? (
        <div className="p-8 text-center text-slate-400">Loading recently settled bills...</div>
      ) : settledBills.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <RotateCcw className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
          <p className="font-semibold text-slate-400">No settled bills found</p>
          <p className="text-xs text-slate-500">Bills settled today or matching your search will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settledBills.map((bill) => {
            const settledDate = bill.settledAt ? new Date(bill.settledAt) : new Date(bill.updatedAt);
            const isExpanded = !!expandedSettledBillIds[bill._id];

            return (
              <div
                key={bill._id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-2xl p-4 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center space-x-3 flex-wrap gap-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-black text-amber-400">
                        {bill.txnNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-950/80 text-emerald-400 border-emerald-800">
                        SETTLED ({bill.paymentMethod})
                      </span>
                    </div>

                    {/* Customer / Room / Staff badges */}
                    {bill.customerName && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        Customer: {bill.customerName}
                      </span>
                    )}
                    {bill.roomNumber && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Room: {bill.roomNumber} {bill.guestName ? `(${bill.guestName})` : ''}
                      </span>
                    )}
                    {bill.staffNameSnapshot && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        Staff: {bill.staffNameSnapshot}
                      </span>
                    )}
                  </div>

                  {/* Amount & Revert Action */}
                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <div className="text-right font-mono">
                      <div className="text-base font-black text-white">
                        {formatCurrency(bill.grandTotalInCents, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {bill.items?.length || 0} items
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenRevertModal(bill)}
                      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-sm"
                      title="Revert settlement and return bill to unpaid tab"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Revert Settlement</span>
                    </button>
                  </div>
                </div>

                {/* Audit Details & Items accordion toggle */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span>Settled: <strong className="text-slate-300">{settledDate.toLocaleDateString()} {settledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    {bill.settledByCashierNameSnapshot && (
                      <span>By: <strong className="text-slate-300">{bill.settledByCashierNameSnapshot}</strong></span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSettledBillAccordion(bill._id)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Items' : 'View Items'}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>

                {/* Expanded Items */}
                {isExpanded && bill.items && bill.items.length > 0 && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    {bill.items.map((item, idx) => (
                      <div key={item._id || idx} className="flex justify-between items-center py-1 border-b border-slate-800/40 last:border-none">
                        <span className="text-slate-300 font-medium">
                          {item.quantity}x {item.productNameSnapshot}
                        </span>
                        <span className="font-mono text-slate-200">
                          {formatCurrency(item.finalLineTotalInCents, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
