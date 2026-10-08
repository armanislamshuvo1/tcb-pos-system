'use client';

import React from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Package, 
  Layers, 
  Clock, 
  UserCheck, 
  BedDouble, 
  Users, 
  DollarSign, 
  Eye 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function ProductTabsView({
  productSearchTerm,
  setProductSearchTerm,
  productTabs = [],
  productLoading,
  expandedProductNames = {},
  toggleProductAccordion,
  expandedProductAuditKeys = {},
  toggleProductAudit,
  onOpenCustomerSettleModal,
  onOpenRoomSettleModal,
  onOpenSettleModal,
  onViewTxnDetails,
  currency
}) {
  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={productSearchTerm}
          onChange={(e) => setProductSearchTerm(e.target.value)}
          placeholder="Search unpaid products by name (e.g., Cappuccino, Cold Brew, Latte, Sandwich)..."
          className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
        />
        {productSearchTerm && (
          <button
            type="button"
            onClick={() => setProductSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Metrics & Context Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <div>
          Showing <strong className="text-white">{productTabs.length}</strong> unpaid product line{productTabs.length === 1 ? '' : 's'}
          {productSearchTerm && <span> matching &ldquo;<span className="text-amber-400 font-semibold">{productSearchTerm}</span>&rdquo;</span>}
        </div>
        <div className="flex items-center space-x-3">
          <span>
            Total Unpaid Units: <strong className="text-amber-400 font-mono text-sm">{productTabs.reduce((acc, p) => acc + p.totalUnpaidQuantity, 0)}</strong>
          </span>
          <span>•</span>
          <span>
            Total Value: <strong className="text-emerald-400 font-mono text-sm">{formatCurrency(productTabs.reduce((acc, p) => acc + p.totalUnpaidAmountInCents, 0), currency)}</strong>
          </span>
        </div>
      </div>

      {/* Product List */}
      {productLoading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Searching unpaid products...
        </div>
      ) : productTabs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">
            {productSearchTerm ? 'No Unpaid Products Match Your Search' : 'All Product Tabs Clear!'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {productSearchTerm
              ? `No unpaid bills currently contain items matching "${productSearchTerm}".`
              : 'There are no open unpaid or hold items on any bill at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {productTabs.map((prod) => {
            const isExpanded = expandedProductNames[prod.productName] !== false; // Default expanded
            const holders = prod.holdersBreakdown || prod.staffBreakdown || [];

            return (
              <div
                key={prod.productName}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition"
              >
                {/* Product Header */}
                <div
                  onClick={() => toggleProductAccordion(prod.productName)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h2 className="text-base sm:text-lg font-bold text-white">
                          {prod.productName}
                        </h2>
                        {prod.categoryName && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                            {prod.categoryName}
                          </span>
                        )}
                        {prod.sku && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800">
                            {prod.sku}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Held across <strong className="text-slate-300">{holders.length}</strong> open bill{holders.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold mb-1">
                        {prod.totalUnpaidQuantity} {prod.totalUnpaidQuantity === 1 ? 'unit' : 'units'} on hold
                      </div>
                      <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                        {formatCurrency(prod.totalUnpaidAmountInCents, currency)}
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Holder Breakdown Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/60 space-y-3">
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Held Bills & Quantities for {prod.productName}</span>
                    </div>

                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                      {holders.map((holder, idx) => {
                        const isCustomer = holder.tabType === 'CUSTOMER' || (!holder.tabType && holder.customerName);
                        const isRoom = holder.tabType === 'ROOM' || holder.roomNumber;
                        const isStaff = holder.tabType === 'STAFF' || holder.staffMemberId;

                        const holderKey = isCustomer 
                          ? (holder.customerId || holder.customerName || idx)
                          : isRoom
                          ? `${holder.roomNumber}_${holder.guestName || idx}`
                          : (holder.staffMemberId || idx);

                        const auditKey = `${prod.productName}_${holderKey}`;
                        const isAuditOpen = expandedProductAuditKeys[auditKey];

                        const displayName = isCustomer
                          ? (holder.customerName || 'Unnamed Customer')
                          : isRoom
                          ? `Room ${holder.roomNumber}${holder.guestName ? ` • ${holder.guestName}` : ''}`
                          : (holder.staffName || 'Staff Member');

                        return (
                          <div key={auditKey} className="p-3.5 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm border ${
                                  isCustomer 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : isRoom
                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                  {isCustomer ? <UserCheck className="w-4 h-4" /> : isRoom ? <BedDouble className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span>{displayName}</span>
                                    {isCustomer && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                        Customer Bill
                                      </span>
                                    )}
                                    {isRoom && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                        Room Bill
                                      </span>
                                    )}
                                    {isStaff && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                        Staff Tab
                                      </span>
                                    )}
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                                      {holder.quantity} on hold
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    Subtotal: <strong className="text-slate-200 font-mono">{formatCurrency(holder.totalAmountInCents, currency)}</strong>
                                    {holder.discountInCents > 0 && (
                                      <span className="text-emerald-400 ml-2 font-mono">
                                        (Disc: -{formatCurrency(holder.discountInCents, currency)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => toggleProductAudit(auditKey)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition border border-slate-700 cursor-pointer"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Audit Trail ({holder.occurrences?.length || 0})</span>
                                  {isAuditOpen ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronRight className="w-3.5 h-3.5 ml-1" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isCustomer) {
                                      onOpenCustomerSettleModal(holder.customerName);
                                    } else if (isRoom) {
                                      onOpenRoomSettleModal(holder.roomNumber, holder.guestName);
                                    } else {
                                      onOpenSettleModal(holder.staffMemberId, holder.staffName);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center space-x-1 cursor-pointer"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>
                                    {isCustomer ? 'Settle Customer Bill' : isRoom ? 'Settle Room Bill' : 'Settle Staff Tab'}
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Nested Discrete Occurrence Timestamps */}
                            {isAuditOpen && holder.occurrences && (
                              <div className="ml-0 sm:ml-12 p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
                                <div className="font-semibold text-[11px] text-amber-400/90 mb-1 flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Discrete Taking Timestamps for {displayName}:</span>
                                </div>
                                {holder.occurrences.map((occ, oIdx) => {
                                  const dateObj = new Date(occ.takenAt);
                                  const dateStr = dateObj.toLocaleDateString();
                                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                  return (
                                    <div
                                      key={oIdx}
                                      onClick={() => onViewTxnDetails(occ.transactionId || occ.txnNumber)}
                                      className="flex items-center justify-between py-1.5 px-2 rounded-lg border-b border-slate-800/60 last:border-0 hover:bg-slate-900 cursor-pointer transition select-none group"
                                      title="Click to view full transaction details"
                                    >
                                      <span className="flex items-center space-x-2">
                                        <span className="font-mono text-amber-400 font-bold group-hover:underline flex items-center space-x-1">
                                          <span>{occ.txnNumber}</span>
                                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span>{dateStr} at {timeStr}</span>
                                        <span className="text-amber-300 font-bold font-mono">({occ.quantity}x on hold)</span>
                                      </span>
                                      <span className="text-slate-400 text-[11px]">
                                        Cashier: <strong className="text-slate-200">{occ.cashierName}</strong>
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
