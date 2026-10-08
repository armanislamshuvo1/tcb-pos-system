'use client';

import React from 'react';
import { 
  FileText, 
  UserCheck, 
  BedDouble, 
  Users, 
  Package, 
  RotateCcw,
  Printer
} from 'lucide-react';

export default function TabNavigation({ 
  viewMode, 
  setViewMode, 
  allBillsCount = 0,
  customerBillsCount = 0,
  roomBillsCount = 0,
  staffBillsCount = 0,
  productTabsCount = 0,
  settledBillsCount = 0,
  onOpenBatchPrint
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          type="button"
          onClick={() => setViewMode('all')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
            viewMode === 'all'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Bills ({allBillsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('by_customer')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
            viewMode === 'by_customer'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Customer Bills ({customerBillsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('by_room')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
            viewMode === 'by_room'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>Room Bills ({roomBillsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('by_staff')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
            viewMode === 'by_staff'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Tabs ({staffBillsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('by_product')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
            viewMode === 'by_product'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Tabs ({productTabsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('recently_settled')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
            viewMode === 'recently_settled'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Recently Settled ({settledBillsCount})</span>
        </button>
      </div>

      {onOpenBatchPrint && (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenBatchPrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer shadow-sm shrink-0"
            title="Open printable customer billing statement"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Customer Statement</span>
          </button>
        </div>
      )}
    </div>
  );
}
