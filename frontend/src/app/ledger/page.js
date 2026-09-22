'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import TransactionDetailModal from '../../components/TransactionDetailModal';
import { useLedgerQuery } from '../../hooks/queries/useLedgerQueries';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  Eye,
  Ban
} from 'lucide-react';

export default function LedgerPage() {
  const { currency } = useAuth();

  const [selectedTxn, setSelectedTxn] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PAID', 'UNPAID_TAB'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: ledgerData, isLoading: loading, error, refetch } = useLedgerQuery({
    statusFilter,
    startDate,
    endDate,
    search,
    page,
    limit: 25,
  });

  const transactions = ledgerData?.transactions || [];
  const pagination = ledgerData?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 };
  const summary = ledgerData?.summary || { totalRevenueInCents: 0, totalUnpaidInCents: 0, totalDiscountInCents: 0 };
  const errorMsg = error?.response?.data?.message || (error ? 'Failed to fetch ledger transactions' : '');

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pt-14 sm:p-6 space-y-6">
        {/* Header & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
              <Receipt className="w-7 h-7 text-amber-400" />
              <span>Transaction Ledger</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Audit log of all processed checkouts, staff tabs, and historical settlements.
            </p>
          </div>

          {/* Quick Status Toggles */}
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap gap-y-1">
            <button
              onClick={() => { setStatusFilter('ALL'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'ALL' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => { setStatusFilter('PAID'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paid Only
            </button>
            <button
              onClick={() => { setStatusFilter('UNPAID_TAB'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'UNPAID_TAB' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unpaid Tabs Only
            </button>
            <button
              onClick={() => { setStatusFilter('VOIDED'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'VOIDED' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voided Only
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Settled Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(summary.totalRevenueInCents || 0, currency)}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Outstanding Tabs</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">
              {formatCurrency(summary.totalUnpaidInCents || 0, currency)}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Discounts Granted</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {formatCurrency(summary.totalDiscountInCents || 0, currency)}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Voided / Cancelled</span>
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {formatCurrency(summary.totalVoidedInCents || 0, currency)}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 text-sm">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TXN #, Cashier, Customer, Room, or Staff name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Date Range */}
          <div className="sm:col-span-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          <div className="sm:col-span-1 flex items-center">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase bg-slate-850">
                <th className="py-3 px-4 font-semibold">TXN Number</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Cashier</th>
                <th className="py-3 px-4 font-semibold">Customer / Assignment</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading ledger records...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-rose-400 space-y-3">
                    <div className="font-semibold">{errorMsg}</div>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => fetchLedger()}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => lockTerminal?.()}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition shadow-md"
                      >
                        Re-authenticate (PIN)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No transactions matched your filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const dateObj = new Date(txn.createdAt);
                  const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <tr
                      key={txn._id}
                      onClick={() => setSelectedTxn(txn)}
                      className="hover:bg-slate-800/60 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-xs">
                        <div className="flex items-center space-x-1.5 group-hover:text-amber-300">
                          <span className="underline decoration-amber-500/30 underline-offset-2 group-hover:decoration-amber-400">
                            {txn.txnNumber}
                          </span>
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 shrink-0" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          txn.status === 'PAID'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : txn.status === 'UNPAID_TAB'
                            ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800'
                        }`}>
                          {txn.status}
                        </span>
                        {txn.status === 'VOIDED' && (
                          <div className="mt-1 flex flex-col space-y-0.5">
                            <span className="text-[11px] text-rose-300 font-semibold truncate max-w-[180px]" title={txn.voidReason}>
                              &ldquo;{txn.voidReason || 'No reason specified'}&rdquo;
                            </span>
                            <span className="text-[10px] text-slate-400">
                              By: <strong className="text-slate-300">{txn.voidedByStaffName || 'Staff'}</strong>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-white font-medium">
                        {txn.cashierNameSnapshot}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {txn.customerName ? (
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-blue-300 font-semibold">{txn.customerName}</span>
                            <span className="text-[10px] text-blue-400/80 border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 rounded-md font-medium">
                              Customer
                            </span>
                          </div>
                        ) : txn.roomNumber ? (
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-amber-400 font-mono font-bold">{txn.roomNumber}</span>
                            {txn.guestName && <span className="text-slate-400 text-[11px]">({txn.guestName})</span>}
                            <span className="text-[10px] text-amber-400/80 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-medium">
                              Room
                            </span>
                          </div>
                        ) : txn.staffNameSnapshot ? (
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-purple-300 font-semibold">{txn.staffNameSnapshot}</span>
                            <span className="text-[10px] text-purple-400/80 border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 rounded-md font-medium">
                              Staff
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Walk-in</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {txn.items?.length || 0} items
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-right">
                        <span className={txn.status === 'VOIDED' ? 'line-through text-rose-400 font-medium' : 'text-white'}>
                          {formatCurrency(txn.grandTotalInCents, currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-850">
              <div>
                Showing page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalCount} total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTxn && (
          <TransactionDetailModal
            txn={selectedTxn}
            onClose={() => setSelectedTxn(null)}
            onTxnUpdated={(updated) => {
              setSelectedTxn(updated);
              refetch();
            }}
          />
        )}
      </main>
    </div>
  );
}
