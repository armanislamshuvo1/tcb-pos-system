'use client';

import React, { useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Printer, 
  DollarSign, 
  Layers, 
  Clock, 
  UserCheck, 
  Eye 
} from 'lucide-react';
import { ROOM_WINGS, isDormRoom, getRoomByNumber } from '../../utils/rooms';
import { formatCurrency } from '../../utils/currency';

export default function RoomTabsView({
  roomSearchTerm,
  setRoomSearchTerm,
  selectedWing,
  setSelectedWing,
  roomTabs = [],
  roomLoading,
  expandedRoomKeys = {},
  toggleRoomAccordion,
  expandedRoomItemKeys = {},
  toggleRoomItemHistory,
  onOpenRoomSettleModal,
  onOpenPrintRoomBill,
  onViewTxnDetails,
  currency
}) {
  // Filtered room tabs based on Wing filter
  const filteredRoomTabs = useMemo(() => {
    return roomTabs.filter((tab) => {
      if (selectedWing === 'ALL') return true;
      const wing = tab.roomNumber ? tab.roomNumber.charAt(0).toUpperCase() : '';
      return wing === selectedWing;
    });
  }, [roomTabs, selectedWing]);

  return (
    <div className="space-y-4">
      {/* Search Input Box & Wing Filters */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={roomSearchTerm}
            onChange={(e) => setRoomSearchTerm(e.target.value)}
            placeholder="Search by room number (e.g., B104, D105, V101, H102), guest name, or product..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
          />
          {roomSearchTerm && (
            <button
              type="button"
              onClick={() => setRoomSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Wing Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Filter Wing:</span>
          {ROOM_WINGS.map((wing) => {
            const isActive = selectedWing === wing.id;
            return (
              <button
                key={wing.id}
                type="button"
                onClick={() => setSelectedWing(wing.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {wing.label}
              </button>
            );
          })}
        </div>

        {/* Context Summary Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
          <div>
            Showing <strong className="text-white">{filteredRoomTabs.length}</strong> active room tab{filteredRoomTabs.length === 1 ? '' : 's'}
            {roomSearchTerm && <span> matching &ldquo;<span className="text-amber-400 font-semibold">{roomSearchTerm}</span>&rdquo;</span>}
          </div>
          <div className="flex items-center space-x-3">
            <span>
              Total Room Balance Due: <strong className="text-amber-400 font-mono text-sm">{formatCurrency(filteredRoomTabs.reduce((acc, r) => acc + r.totalOwedInCents, 0), currency)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Room List Content */}
      {roomLoading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Loading customer room bills...
        </div>
      ) : filteredRoomTabs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">All Customer Room Bills Clear!</h3>
          <p className="text-sm text-slate-400 mt-1">
            {roomSearchTerm
              ? `No open customer bills match "${roomSearchTerm}".`
              : 'There are no outstanding customer room tabs in this wing at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoomTabs.map((tab) => {
            const roomKey = `${tab.roomNumber}_${tab.normalizedGuestName || tab.guestName || ''}`;
            const isExpanded = !!expandedRoomKeys[roomKey];
            const dorm = tab.isCombinedDorm || isDormRoom(tab.roomNumber);
            const roomMeta = getRoomByNumber(tab.roomNumber);
            const wingChar = tab.roomNumber ? tab.roomNumber.charAt(0).toUpperCase() : 'OTHER';

            const wingColors = {
              B: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              V: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
              H: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              D: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
              S: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            };
            const badgeStyle = wingColors[wingChar] || 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={roomKey}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:border-slate-750"
              >
                {/* Room Row Header */}
                <div
                  onClick={() => toggleRoomAccordion(roomKey)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${badgeStyle}`}>
                          {tab.roomNumber}
                        </span>
                        <h2 className="text-base sm:text-lg font-extrabold text-white">
                          {tab.isCombinedDorm
                            ? `Dorm (${tab.roomNumber})`
                            : `${roomMeta?.type || 'Room'} ${tab.roomNumber}`}
                        </h2>
                        {dorm && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                            {tab.isCombinedDorm && tab.roomNumbers?.length > 1
                              ? 'Combined Dorm (D105 & D106)'
                              : 'Dorm (6 Pax)'}
                          </span>
                        )}
                        {tab.guestName && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700 flex items-center space-x-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Guest: {tab.guestName}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">
                        {tab.consolidatedItems?.length || 0} distinct item{tab.consolidatedItems?.length === 1 ? '' : 's'} consumed ({tab.itemCount} units)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Balance Due</div>
                      <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono">
                        {formatCurrency(tab.totalOwedInCents, currency)}
                      </div>
                    </div>

                    {tab.guestName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPrintRoomBill(tab);
                        }}
                        className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-400 active:scale-95 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-amber-500/30 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                        title="Print consolidated room bill statement"
                      >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Print Bill</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRoomSettleModal(tab.roomNumber, tab.guestName, tab.roomNumbers);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Settle Room Bill</span>
                    </button>
                  </div>
                </div>

                {/* Accordion Content: Consolidated Items */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/60 space-y-3">
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Consolidated Room Consumption</span>
                    </div>

                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                      {tab.consolidatedItems.map((item, index) => {
                        const auditKey = `${roomKey}_${item.productId || index}`;
                        const isAuditOpen = !!expandedRoomItemKeys[auditKey];

                        return (
                          <div key={index} className="p-3.5 sm:p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-sm text-white flex items-center space-x-2">
                                  <span>{item.productName}</span>
                                  {item.categoryName && (
                                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                      {item.categoryName}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">
                                  Unit: {formatCurrency(item.unitPriceInCents, currency)}
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-xs text-slate-400 font-bold font-mono">
                                    Qty: <span className="text-white text-sm">{item.totalQuantity}</span>
                                  </div>
                                  <div className="text-sm font-extrabold text-amber-400 font-mono">
                                    {formatCurrency(item.totalAmountInCents, currency)}
                                  </div>
                                </div>

                                {/* Occurrence Audit Toggle */}
                                {item.history && item.history.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleRoomItemHistory(auditKey)}
                                    className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border cursor-pointer ${
                                      isAuditOpen 
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                    }`}
                                    title="View discrete occurrences and audit timestamps"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Audit ({item.history.length})</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Nested Occurrence Timestamps */}
                            {isAuditOpen && item.history && (
                              <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                                <div className="font-semibold text-[11px] text-amber-400/90 mb-1 flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Discrete Taking History & Audited Timestamps:</span>
                                </div>
                                {item.history.map((occ, oIdx) => {
                                  const dateObj = new Date(occ.takenAt);
                                  const dateStr = dateObj.toLocaleDateString();
                                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                  return (
                                     <div
                                      key={oIdx}
                                      onClick={() => onViewTxnDetails(occ.transactionId)}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-2 rounded-lg border-b border-slate-850 last:border-0 gap-1 hover:bg-slate-900 cursor-pointer transition select-none group"
                                      title="Click to view full transaction details"
                                    >
                                      <div className="flex items-center space-x-2 flex-wrap">
                                        <span className="font-mono text-amber-400 font-bold group-hover:underline flex items-center space-x-1">
                                          <span>{occ.txnNumber}</span>
                                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                        {occ.roomNumber && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                                            Room {occ.roomNumber}
                                          </span>
                                        )}
                                        <span className="text-slate-500">•</span>
                                        <span>{dateStr} at {timeStr}</span>
                                        <span className="text-emerald-400 font-bold font-mono">({occ.quantity}x)</span>
                                        {occ.notes && (
                                          <span className="text-[11px] text-slate-400 italic">
                                            &ldquo;{occ.notes}&rdquo;
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-slate-400 text-[11px]">
                                        Cashier: <strong className="text-slate-200">{occ.cashierName || 'Operator'}</strong>
                                      </div>
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
