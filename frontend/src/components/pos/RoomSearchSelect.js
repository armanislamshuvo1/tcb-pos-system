'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ROOMS, ROOM_WINGS, isDormRoom } from '../../utils/rooms';
import { 
  BedDouble, 
  Search, 
  ChevronDown, 
  X, 
  Users, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function RoomSearchSelect({ 
  selectedRoomNumber, 
  onSelectRoom, 
  guestName = '', 
  onChangeGuestName 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWing, setSelectedWing] = useState('ALL');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRoom = ROOMS.find((r) => r.number === selectedRoomNumber);
  const isSelectedDorm = isDormRoom(selectedRoomNumber);

  // Filter rooms based on wing and search
  const filteredRooms = ROOMS.filter((room) => {
    if (selectedWing !== 'ALL' && room.wing !== selectedWing) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchNum = room.number.toLowerCase().includes(term);
      const matchType = room.type.toLowerCase().includes(term);
      return matchNum || matchType;
    }
    return true;
  });

  const handleSelect = (room) => {
    onSelectRoom(room.number);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectRoom('');
    if (onChangeGuestName) onChangeGuestName('');
  };

  const getWingBadgeColor = (wing) => {
    switch (wing) {
      case 'B': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'V': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'H': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'D': return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'S': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Trigger Box */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full px-3 py-2.5 bg-slate-800 border rounded-xl flex items-center justify-between cursor-pointer transition select-none ${
          isOpen 
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-slate-800/90' 
            : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <div className={`p-1.5 rounded-lg ${selectedRoom ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
            <BedDouble className="w-4 h-4" />
          </div>

          {selectedRoom ? (
            <div className="truncate text-left">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-amber-400 text-sm">{selectedRoom.number}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getWingBadgeColor(selectedRoom.wing)}`}>
                  {selectedRoom.type}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-xs sm:text-sm">Search or select room (B101–B109, V, H, D, S101)...</span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {selectedRoom && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              title="Clear room selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
        </div>
      </div>

      {/* Guest Name input if Dorm room (D105 or D106) is selected */}
      {isSelectedDorm && (
        <div className="p-2.5 bg-orange-950/30 border border-orange-500/40 rounded-xl space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-orange-300">
            <span className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Dormitory 6-Pax Bill Separation</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-orange-400/80 font-mono">Room {selectedRoomNumber}</span>
          </div>
          <input
            type="text"
            value={guestName}
            onChange={(e) => onChangeGuestName && onChangeGuestName(e.target.value)}
            placeholder="Enter Guest / Bed Name (e.g. Bed 2 - Sarah)..."
            className="w-full px-3 py-1.5 bg-slate-900 border border-orange-500/50 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="text-[10px] text-slate-400">
            Since this is a 6-pax dorm, individual guest tabs are kept separate by name.
          </div>
        </div>
      )}

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Search Input & Wing Pills */}
          <div className="p-2.5 bg-slate-850 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type room number (e.g. B104, H102, D105)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* Wing Quick Filters */}
            <div className="flex flex-wrap gap-1">
              {ROOM_WINGS.map((wing) => (
                <button
                  key={wing.id}
                  type="button"
                  onClick={() => setSelectedWing(wing.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    selectedWing === wing.id
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  {wing.id === 'ALL' ? 'All' : wing.id}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms Grid / List */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {filteredRooms.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No rooms matching &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = selectedRoomNumber === room.number;

                return (
                  <div
                    key={room.number}
                    onClick={() => handleSelect(room)}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/40 text-white'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono font-black text-amber-400 text-sm w-12">{room.number}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getWingBadgeColor(room.wing)}`}>
                        {room.type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {room.isDorm && (
                        <span className="text-[10px] text-orange-400 font-semibold bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-800/60">
                          6 Pax
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
