'use client';

import React from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Printer, 
  DollarSign, 
  Clock, 
  Eye 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function CustomerTabsView({
  customerSearchTerm,
  setCustomerSearchTerm,
  customerTabs = [],
  customerLoading,
  totalCustomerOwedCents = 0,
  expandedCustomerKeys = {},
  toggleCustomerAccordion,
  expandedCustomerItemKeys = {},
  toggleCustomerItemHistory,
  onOpenPrintCustomerBill,
  onOpenCustomerSettleModal,
  onViewTxnDetails,
  currency
}) {
  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            placeholder="Search by customer name or product..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
          />
          {customerSearchTerm && (
            <button
              type="button"
              onClick={() => setCustomerSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Context Summary Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
          <div>
            Showing <strong className="text-white">{customerTabs.length}</strong> active customer bill{customerTabs.length === 1 ? '' : 's'}
            {customerSearchTerm && <span> matching &ldquo;<span className="text-amber-400 font-semibold">{customerSearchTerm}</span>&rdquo;</span>}
          </div>
          <div className="flex items-center space-x-3">
            <span>
              Total Customer Balance Due: <strong className="text-amber-400 font-mono text-sm">{formatCurrency(totalCustomerOwedCents, currency)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Customer List Content */}
      {customerLoading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Loading customer bills...
        </div>
      ) : customerTabs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">All Customer Bills Clear!</h3>
          <p className="text-sm text-slate-400 mt-1">
            {customerSearchTerm
              ? `No open customer bills match "${customerSearchTerm}".`
              : 'There are no outstanding unpaid customer bills at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {customerTabs.map((tab) => {
            const customerKey = tab.customerId || tab.customerName;
            const isExpanded = !!expandedCustomerKeys[customerKey];

            return (
              <div
                key={customerKey}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:border-slate-750"
              >
                {/* Customer Row Header */}
                <div
                  onClick={() => toggleCustomerAccordion(customerKey)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border bg-blue-500/10 text-blue-400 border-blue-500/30">
                          Customer
                        </span>
                        <h2 className="text-base sm:text-lg font-extrabold text-white">
                          {tab.customerName || 'Unnamed Customer'}
                        </h2>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                        <span>{tab.itemCount || 0} total items</span>
                        <span>•</span>
                        <span>{tab.consolidatedItems?.length || 0} distinct products</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Balance Due</div>
                      <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                        {formatCurrency(tab.totalOwedInCents, currency)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrintCustomerBill(tab);
                      }}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-400 active:scale-95 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-amber-500/30 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                      title="Print all bills / customer statement"
                    >
                      <Printer className="w-4 h-4" />
                      <span className="hidden sm:inline">Print Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCustomerSettleModal(tab.customerName);
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Settle Bill</span>
                    </button>
                  </div>
                </div>

                {/* Accordion Content: Consolidated Items */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-5 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-3 pl-2">Product</th>
                            <th className="pb-3 px-3">Unit Price</th>
                            <th className="pb-3 px-3 text-center">Qty</th>
                            <th className="pb-3 px-3 text-right">Discounts</th>
                            <th className="pb-3 px-3 text-right">Subtotal</th>
                            <th className="pb-3 pr-2 text-right">Audit History</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {tab.consolidatedItems?.map((item) => {
                            const itemHistoryKey = `${customerKey}_${item.productId}`;
                            const showHistory = !!expandedCustomerItemKeys[itemHistoryKey];

                            return (
                              <React.Fragment key={item.productId}>
                                <tr className="hover:bg-slate-850/50 transition">
                                  <td className="py-3 pl-2 font-medium text-white">
                                    <div>{item.productName}</div>
                                    {item.categoryName && (
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        {item.categoryName}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-xs">
                                    {formatCurrency(item.unitPriceInCents, currency)}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 font-bold text-white text-xs border border-slate-700">
                                      {item.totalQuantity}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right text-xs">
                                    {item.totalDiscountInCents > 0 ? (
                                      <span className="text-emerald-400 font-medium">
                                        -{formatCurrency(item.totalDiscountInCents, currency)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                    {formatCurrency(item.totalAmountInCents, currency)}
                                  </td>
                                  <td className="py-3 pr-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => toggleCustomerItemHistory(itemHistoryKey)}
                                      className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 transition cursor-pointer"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{item.history?.length || 0} order{item.history?.length === 1 ? '' : 's'}</span>
                                      {showHistory ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>
                                </tr>

                                {/* Nested Audit History */}
                                {showHistory && item.history && (
                                  <tr>
                                    <td colSpan={6} className="bg-slate-900/90 p-3 rounded-xl">
                                      <div className="space-y-2 text-xs">
                                        <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                          Order Occurrence Log
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                          {item.history.map((occ, oIdx) => (
                                            <div
                                              key={occ.transactionId + '_' + oIdx}
                                              onClick={() => onViewTxnDetails(occ.transactionId)}
                                              className="p-2.5 bg-slate-850 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 space-y-1 cursor-pointer transition select-none group"
                                              title="Click to view full transaction details"
                                            >
                                              <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-amber-400 text-[11px] group-hover:text-amber-300 flex items-center space-x-1">
                                                  <span>{occ.txnNumber}</span>
                                                  <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                  Qty: <strong className="text-white">{occ.quantity}</strong>
                                                </span>
                                              </div>
                                              <div className="text-[10px] text-slate-400">
                                                {new Date(occ.takenAt).toLocaleDateString()} {new Date(occ.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                              <div className="text-[10px] text-slate-500 flex justify-between items-center">
                                                <span>Cashier: <span className="text-slate-300">{occ.cashierName || 'POS Staff'}</span></span>
                                                <span className="text-[9px] text-amber-400/80 font-medium group-hover:underline">View Details &rarr;</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
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
