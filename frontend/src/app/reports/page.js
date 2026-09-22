'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import { useReportsQuery } from '../../hooks/queries/useReportsQueries';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  Calendar, 
  Tag, 
  ArrowUpRight 
} from 'lucide-react';

export default function ReportsPage() {
  const { currency } = useAuth();

  // Timeframe filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ startDate: '', endDate: '' });

  const { data: reportData, isLoading: loading } = useReportsQuery(appliedFilters);

  const salesSummary = reportData?.salesSummary || null;
  const paymentBreakdown = reportData?.paymentBreakdown || [];
  const staffReports = reportData?.staffReports || [];
  const productReports = reportData?.productReports || [];

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setAppliedFilters({ startDate, endDate });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pt-14 sm:p-6 space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
              <BarChart3 className="w-7 h-7 text-amber-400" />
              <span>Sales & Staff Consumption Reports</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Financial metrics, staff tab liabilities, and product volume analysis.
            </p>
          </div>

          {/* Timeframe Filter Form */}
          <form onSubmit={handleApplyFilter} className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* 4 Top KPI Cards */}
        {salesSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Net Settled Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(salesSummary.netPaidRevenueInCents, currency)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                From {salesSummary.paidTransactions} paid checkouts
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Outstanding Tab Debt</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400 font-mono">
                {formatCurrency(salesSummary.outstandingTabLiabilityInCents, currency)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Across {salesSummary.unpaidTransactions} open staff tabs
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Total Discounts Given</span>
                <Tag className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(salesSummary.totalDiscountInCents, currency)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Line items & preset buttons</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Gross Volume</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {formatCurrency(salesSummary.grossSubtotalInCents, currency)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {salesSummary.totalTransactions} total transactions
              </span>
            </div>
          </div>
        )}

        {/* Two-Column Section: Staff Tab Liabilities & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Staff Consumption & Tab Liabilities */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Staff Consumption & Outstanding Balances</span>
            </h2>

            {staffReports.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No staff consumption logged.</div>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                {staffReports.map((s) => (
                  <div key={s._id} className="p-3.5 flex items-center justify-between bg-slate-850 hover:bg-slate-800 transition">
                    <div>
                      <div className="font-bold text-white text-sm">{s.staffName}</div>
                      <div className="text-xs text-slate-400">
                        {s.totalTransactions} orders • Paid: {formatCurrency(s.totalPaidInCents, currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Unpaid Balance</div>
                      <div className={`font-mono font-bold text-sm ${s.totalUnpaidInCents > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(s.totalUnpaidInCents, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Products */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Top Moving Products</span>
            </h2>

            {productReports.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No product sales logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                {productReports.map((p) => (
                  <div key={p._id} className="p-3.5 flex items-center justify-between bg-slate-850 hover:bg-slate-800 transition">
                    <div>
                      <div className="font-bold text-white text-sm">{p.productName}</div>
                      <div className="text-xs text-slate-400">
                        SKU: <span className="font-mono">{p.sku}</span> • {p.categoryName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-sm">
                        {formatCurrency(p.totalNetInCents, currency)}
                      </div>
                      <div className="text-xs text-emerald-400 font-semibold">
                        {p.totalQuantitySold} units sold
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
