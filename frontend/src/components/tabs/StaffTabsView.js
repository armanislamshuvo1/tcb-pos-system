'use client';

import React from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  DollarSign, 
  Layers, 
  Clock, 
  Eye 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function StaffTabsView({
  tabs = [],
  loading,
  expandedStaffId,
  toggleStaffAccordion,
  expandedItemKeys = {},
  toggleItemHistory,
  onOpenSettleModal,
  onViewTxnDetails,
  currency
}) {
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Loading consolidated staff tabs...
        </div>
      ) : tabs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">All Staff Tabs Clear!</h3>
          <p className="text-sm text-slate-400 mt-1">There are no outstanding unpaid tabs at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tabs.map((tab) => {
            const isExpanded = expandedStaffId === tab._id;

            return (
              <div
                key={tab._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm"
              >
                {/* Staff Row Header */}
                <div
                  onClick={() => toggleStaffAccordion(tab._id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">{tab.staffName}</h2>
                      <span className="text-xs text-slate-400">
                        {tab.consolidatedItems?.length || 0} distinct items consumed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Balance Due</div>
                      <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono">
                        {formatCurrency(tab.totalOwedInCents, currency)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettleModal(tab._id, tab.staffName);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Settle Tab</span>
                    </button>
                  </div>
                </div>

                {/* Accordion Content: Consolidated Items */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/60 space-y-3">
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Consolidated Itemized Breakdown</span>
                    </div>

                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                      {tab.consolidatedItems.map((item, index) => {
                        const itemKey = `${tab._id}_${item.productId || index}`;
                        const isHistoryOpen = expandedItemKeys[itemKey];

                        return (
                          <div key={itemKey} className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => toggleItemHistory(itemKey)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 transition cursor-pointer"
                                  title="Inspect occurrence timestamps"
                                >
                                  {isHistoryOpen ? (
                                    <ChevronDown className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>

                                <div>
                                  <div className="text-sm font-bold text-white">{item.productName}</div>
                                  <div className="text-xs text-slate-400">
                                    {item.totalQuantity}x @ {formatCurrency(item.unitPriceInCents, currency)}
                                    {item.totalDiscountInCents > 0 && (
                                      <span className="text-emerald-400 ml-2">
                                        (Disc: -{formatCurrency(item.totalDiscountInCents, currency)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right font-mono font-bold text-white text-sm">
                                {formatCurrency(item.totalAmountInCents, currency)}
                              </div>
                            </div>

                            {/* Nested Occurrence Timestamps (Audit Trail) */}
                            {isHistoryOpen && (
                              <div className="ml-8 mt-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                                <div className="font-semibold text-[11px] text-amber-400/90 mb-1 flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Individual Occurrences & Timestamps:</span>
                                </div>
                                {item.history.map((hist, hIdx) => {
                                  const dateObj = new Date(hist.takenAt);
                                  const dateStr = dateObj.toLocaleDateString();
                                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                  return (
                                    <div
                                      key={hIdx}
                                      onClick={() => onViewTxnDetails(hist.transactionId)}
                                      className="flex items-center justify-between py-1.5 px-2 rounded-lg border-b border-slate-800/60 last:border-0 hover:bg-slate-900 hover:text-white cursor-pointer transition select-none group"
                                      title="Click to view full transaction details"
                                    >
                                      <span className="flex items-center space-x-2">
                                        <span className="font-mono text-amber-400 font-bold group-hover:underline flex items-center space-x-1">
                                          <span>{hist.txnNumber}</span>
                                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span>{dateStr} at {timeStr}</span>
                                        <span className="text-slate-400">({hist.quantity}x)</span>
                                      </span>
                                      <span className="text-slate-400 text-[11px]">
                                        Cashier: <strong>{hist.cashierName}</strong>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
