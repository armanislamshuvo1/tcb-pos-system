'use client';

import React, { useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  UserCheck, 
  BedDouble, 
  Users, 
  CheckCircle, 
  DollarSign, 
  Eye 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function AllBillsView({
  allSearchTerm,
  setAllSearchTerm,
  allBillTypeFilter,
  setAllBillTypeFilter,
  allSortBy,
  setAllSortBy,
  allBills = [],
  allLoading,
  expandedAllBillIds = {},
  toggleAllBillAccordion,
  onViewTxnDetails,
  onOpenSettleForBill,
  currency
}) {
  // Sort and filter bills
  const sortedAllBills = useMemo(() => {
    const list = [...allBills];
    if (allSortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (allSortBy === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (allSortBy === 'amount_desc') {
      return list.sort((a, b) => b.grandTotalInCents - a.grandTotalInCents);
    }
    if (allSortBy === 'amount_asc') {
      return list.sort((a, b) => a.grandTotalInCents - b.grandTotalInCents);
    }
    return list;
  }, [allBills, allSortBy]);

  const customerBillsCount = useMemo(
    () => allBills.filter((b) => b.tabType === 'CUSTOMER' || (!b.tabType && b.customerName)).length,
    [allBills]
  );
  const roomBillsCount = useMemo(
    () => allBills.filter((b) => b.tabType === 'ROOM' || b.roomNumber).length,
    [allBills]
  );
  const staffBillsCount = useMemo(
    () => allBills.filter((b) => b.tabType === 'STAFF' || b.staffMemberId).length,
    [allBills]
  );
  const allBillsTotalDueCents = useMemo(
    () => sortedAllBills.reduce((acc, b) => acc + (b.grandTotalInCents || 0), 0),
    [sortedAllBills]
  );

  return (
    <div className="space-y-4">
      {/* Controls: Search, Filter Chips, Sort Dropdown */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={allSearchTerm}
              onChange={(e) => setAllSearchTerm(e.target.value)}
              placeholder="Search by transaction #, customer, room number, guest, staff, or product..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
            />
            {allSearchTerm && (
              <button
                type="button"
                onClick={() => setAllSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <select
                value={allSortBy}
                onChange={(e) => setAllSortBy(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 pr-9 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="newest">Newest Held First</option>
                <option value="oldest">Oldest Held First</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Tabs / Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setAllBillTypeFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                allBillTypeFilter === 'ALL'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              <span>All Open Bills</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-mono font-bold">
                {allBills.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAllBillTypeFilter('CUSTOMER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                allBillTypeFilter === 'CUSTOMER'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer Bills</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-mono font-bold">
                {customerBillsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAllBillTypeFilter('ROOM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                allBillTypeFilter === 'ROOM'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Room Bills</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-mono font-bold">
                {roomBillsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAllBillTypeFilter('STAFF')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                allBillTypeFilter === 'STAFF'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Tabs</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-mono font-bold">
                {staffBillsCount}
              </span>
            </button>
          </div>

          {/* Metrics & Total Due */}
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{sortedAllBills.length}</strong> bill{sortedAllBills.length === 1 ? '' : 's'}
            </span>
            <span>•</span>
            <span>
              Total Balance Due: <strong className="text-amber-400 font-mono text-sm">{formatCurrency(allBillsTotalDueCents, currency)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bills List */}
      {allLoading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Loading all unpaid bills...
        </div>
      ) : sortedAllBills.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">All Bills Clear!</h3>
          <p className="text-sm text-slate-400 mt-1">
            {allSearchTerm
              ? `No unpaid bills match your search "${allSearchTerm}".`
              : 'There are no outstanding unpaid or hold bills at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAllBills.map((bill) => {
            const isExpanded = !!expandedAllBillIds[bill._id];
            const isCustomer = bill.tabType === 'CUSTOMER' || (!bill.tabType && bill.customerName);
            const isRoom = bill.tabType === 'ROOM' || bill.roomNumber;
            const isStaff = bill.tabType === 'STAFF' || bill.staffMemberId;

            const holderTitle = isCustomer 
              ? (bill.customerName || 'Unnamed Customer')
              : isRoom 
              ? `Room ${bill.roomNumber}${bill.guestName ? ` - ${bill.guestName}` : ''}`
              : (bill.staffNameSnapshot || 'Staff Tab');

            const dateObj = new Date(bill.createdAt);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={bill._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:border-slate-750"
              >
                {/* Row Header */}
                <div
                  onClick={() => toggleAllBillAccordion(bill._id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {isCustomer && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border bg-blue-500/10 text-blue-400 border-blue-500/30 flex items-center space-x-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Customer Bill</span>
                          </span>
                        )}
                        {isRoom && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border bg-orange-500/10 text-orange-400 border-orange-500/30 flex items-center space-x-1">
                            <BedDouble className="w-3 h-3" />
                            <span>Room Bill</span>
                          </span>
                        )}
                        {isStaff && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border bg-purple-500/10 text-purple-400 border-purple-500/30 flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>Staff Tab</span>
                          </span>
                        )}
                        <h2 className="text-base sm:text-lg font-extrabold text-white">
                          {holderTitle}
                        </h2>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTxnDetails(bill);
                          }}
                          className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition flex items-center space-x-1 cursor-pointer"
                          title="Click to audit and view full transaction details"
                        >
                          <span>{bill.txnNumber}</span>
                          <Eye className="w-3 h-3 text-amber-400" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3 flex-wrap gap-y-1">
                        <span>Held on {dateStr} at {timeStr}</span>
                        <span>•</span>
                        <span>Cashier: <strong className="text-slate-300">{bill.cashierNameSnapshot}</strong></span>
                        <span>•</span>
                        <span>{bill.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || bill.items?.length || 0} items on hold</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Balance Due</div>
                      <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                        {formatCurrency(bill.grandTotalInCents, currency)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTxnDetails(bill);
                      }}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-400 active:scale-95 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-amber-500/30 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                      title="Audit transaction and view full ticket details"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Audit Txn</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettleForBill(bill);
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Settle Bill</span>
                    </button>
                  </div>
                </div>

                {/* Accordion Content: Items list */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-5 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-3 pl-2">Product</th>
                            <th className="pb-3 px-3">Unit Price</th>
                            <th className="pb-3 px-3 text-center">Qty on Hold</th>
                            <th className="pb-3 px-3 text-right">Discounts</th>
                            <th className="pb-3 px-3 text-right">Subtotal</th>
                            <th className="pb-3 pr-2 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {bill.items?.map((item, idx) => (
                            <tr key={item._id || idx} className="hover:bg-slate-850/50 transition">
                              <td className="py-3 pl-2 font-medium text-white">
                                <div className="font-bold">{item.productNameSnapshot}</div>
                                {item.skuSnapshot && (
                                  <div className="text-xs text-slate-500 font-mono">{item.skuSnapshot}</div>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-400 text-xs sm:text-sm">
                                {formatCurrency(item.unitPriceInCents, currency)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono font-bold text-xs border border-amber-500/20">
                                  {item.quantity} on hold
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right text-xs sm:text-sm font-mono text-emerald-400">
                                {item.lineDiscountInCents > 0 ? `-${formatCurrency(item.lineDiscountInCents, currency)}` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-white font-mono text-xs sm:text-sm">
                                {formatCurrency(item.finalLineTotalInCents, currency)}
                              </td>
                              <td className="py-3 pr-2 text-right text-xs text-slate-400 font-mono">
                                {new Date(item.takenAt || bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {bill.notes && (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center space-x-2">
                        <span className="text-amber-400 font-bold">Notes:</span>
                        <span>{bill.notes}</span>
                      </div>
                    )}

                    {/* Audit & Transaction Action Footer Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-slate-400 flex items-center space-x-3 flex-wrap">
                        <span>Cashier: <strong className="text-white">{bill.cashierNameSnapshot}</strong></span>
                        <span>•</span>
                        <span>Timestamp: <strong className="text-slate-300">{dateStr} at {timeStr}</strong></span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          Status: {bill.status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewTxnDetails(bill)}
                        className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-sm"
                        title="Audit full transaction, print ticket, inspect discounts and line items"
                      >
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Audit & View Details</span>
                      </button>
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
