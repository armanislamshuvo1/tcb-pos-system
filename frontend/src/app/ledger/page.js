'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { useAxiosSecure } from '../../hooks/useApi';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export default function LedgerPage() {
  const axiosSecure = useAxiosSecure();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenueInCents: 0,
    totalUnpaidInCents: 0,
    totalDiscountInCents: 0
  });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PAID', 'UNPAID_TAB'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter,
        page,
        limit: 25
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search.trim()) params.search = search.trim();

      const res = await axiosSecure.get('/api/transactions/ledger', { params });
      if (res.data?.success) {
        setTransactions(res.data.data.transactions);
        setPagination(res.data.data.pagination);
        setSummary(res.data.data.summary);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, statusFilter, startDate, endDate, search, page]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
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
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
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
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Settled Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${(summary.totalRevenueInCents / 100).toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Outstanding Tab Liabilities</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">
              ${(summary.totalUnpaidInCents / 100).toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Discounts Granted</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              ${(summary.totalDiscountInCents / 100).toFixed(2)}
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
              placeholder="Search TXN #, Cashier, or Staff name..."
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
                <th className="py-3 px-4 font-semibold">Staff Assignment</th>
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
                    <tr key={txn._id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-xs">
                        {txn.txnNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          txn.status === 'PAID'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : 'bg-blue-950/80 text-blue-400 border-blue-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-white font-medium">
                        {txn.cashierNameSnapshot}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {txn.staffNameSnapshot ? (
                          <span className="text-amber-300 font-semibold">{txn.staffNameSnapshot}</span>
                        ) : (
                          <span className="text-slate-500">Walk-in</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {txn.items?.length || 0} items
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-right">
                        ${(txn.grandTotalInCents / 100).toFixed(2)}
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
      </main>
    </div>
  );
}
