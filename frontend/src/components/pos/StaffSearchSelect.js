'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, UserCheck, X, ChevronDown, Check, UserX, UserPlus } from 'lucide-react';

export default function StaffSearchSelect({
  staffMembers = [],
  selectedStaff = null,
  onSelectStaff,
  placeholder = 'Search staff name or code...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync searchQuery when selectedStaff changes from outside while not open
  useEffect(() => {
    if (!isOpen) {
      if (selectedStaff) {
        setSearchQuery(`${selectedStaff.fullName} (${selectedStaff.employeeCode})`);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedStaff, isOpen]);

  // Filter staff members based on search query
  const filteredStaff = useMemo(() => {
    // If the query matches the currently selected staff's full display string and dropdown just opened, show all
    const selectedDisplay = selectedStaff ? `${selectedStaff.fullName} (${selectedStaff.employeeCode})` : '';
    const cleanQuery = (searchQuery === selectedDisplay ? '' : searchQuery).trim().toLowerCase();

    if (!cleanQuery) return staffMembers;

    return staffMembers.filter((staff) => {
      const nameMatch = staff.fullName?.toLowerCase().includes(cleanQuery);
      const codeMatch = staff.employeeCode?.toLowerCase().includes(cleanQuery);
      return nameMatch || codeMatch;
    });
  }, [staffMembers, searchQuery, selectedStaff]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (selectedStaff) {
          setSearchQuery(`${selectedStaff.fullName} (${selectedStaff.employeeCode})`);
        } else {
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedStaff]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item-index]');
      const activeEl = items[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(-1);
    // Auto-select text so user can immediately type over it to search
    inputRef.current?.select();
  };

  const handleSelect = (staff) => {
    onSelectStaff(staff);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (staff) {
      setSearchQuery(`${staff.fullName} (${staff.employeeCode})`);
    } else {
      setSearchQuery('');
    }
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onSelectStaff(null);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    // Total selectable options count = 1 (for Walk-in / Detach) + filteredStaff.length
    const totalOptions = filteredStaff.length + 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === 0) {
        // Option 0 is walk-in / detach
        handleSelect(null);
      } else if (highlightedIndex > 0 && highlightedIndex - 1 < filteredStaff.length) {
        handleSelect(filteredStaff[highlightedIndex - 1]);
      } else if (filteredStaff.length === 1) {
        // If user typed and only 1 match exists, pick it
        handleSelect(filteredStaff[0]);
      } else if (filteredStaff.length > 0) {
        // Default to first match if no explicit arrow movement
        handleSelect(filteredStaff[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (selectedStaff) {
        setSearchQuery(`${selectedStaff.fullName} (${selectedStaff.employeeCode})`);
      } else {
        setSearchQuery('');
      }
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {selectedStaff ? (
            <UserCheck className="w-4 h-4 text-amber-400" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-9 pr-16 py-2 bg-slate-800 border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-inner ${
            selectedStaff ? 'border-amber-500/40 text-amber-200' : 'border-slate-700'
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
          {/* Clear / Detach Button if something is typed or staff is selected */}
          {(selectedStaff || searchQuery) && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear / Detach Staff"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dropdown Toggle Chevron */}
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            tabIndex={-1}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto overflow-x-hidden divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Walk-in / Clear Option */}
          <div
            data-item-index="0"
            onClick={() => handleSelect(null)}
            onMouseEnter={() => setHighlightedIndex(0)}
            className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition text-xs select-none ${
              highlightedIndex === 0
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            } ${!selectedStaff ? 'bg-slate-800/60 font-semibold text-slate-300' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-slate-500" />
              <span>No Staff Attached (Walk-in / Cash / Card)</span>
            </div>
            {!selectedStaff && <Check className="w-3.5 h-3.5 text-slate-400" />}
          </div>

          {/* No staff match — offer "use as custom name" */}
          {filteredStaff.length === 0 ? (
            <div>
              {searchQuery.trim() && (
                <div
                  onClick={() => {
                    const customName = searchQuery.trim();
                    onSelectStaff({ fullName: customName, employeeCode: 'GUEST', isCustom: true });
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    setSearchQuery(`${customName} (GUEST)`);
                  }}
                  className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition text-xs select-none group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-300 shrink-0">
                      {searchQuery.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold text-slate-200 group-hover:text-white">
                        &quot;{searchQuery.trim()}&quot;
                      </span>
                      <span className="ml-1.5 text-[10px] text-blue-400/80 uppercase tracking-wider">
                        use as guest name
                      </span>
                    </div>
                  </div>
                  <UserPlus className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />
                </div>
              )}
              <div className="px-3 py-2 text-center text-[11px] text-slate-500 border-t border-slate-800/60">
                No matching staff found
              </div>
            </div>
          ) : (
            filteredStaff.map((staff, idx) => {
              const optionIndex = idx + 1;
              const isSelected = selectedStaff?._id === staff._id;
              const isHighlighted = highlightedIndex === optionIndex;

              return (
                <div
                  key={staff._id}
                  data-item-index={optionIndex}
                  onClick={() => handleSelect(staff)}
                  onMouseEnter={() => setHighlightedIndex(optionIndex)}
                  className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition text-xs sm:text-sm select-none ${
                    isHighlighted
                      ? 'bg-slate-800 text-white'
                      : isSelected
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {staff.fullName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold">{staff.fullName}</span>
                      {staff.role && (
                        <span className="ml-1.5 text-[10px] text-slate-400 uppercase tracking-wider">
                          ({staff.role})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-400">
                      {staff.employeeCode}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
