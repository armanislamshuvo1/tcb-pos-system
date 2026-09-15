'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, UserCheck, X, ChevronDown, Check, UserX, UserPlus, Phone, Plus } from 'lucide-react';

export default function CustomerSearchSelect({
  customers = [],
  selectedCustomer = null,
  onSelectCustomer,
  onCreateCustomer,
  placeholder = 'Search or enter customer name...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync searchQuery when selectedCustomer changes from outside while closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedCustomer) {
        setSearchQuery(selectedCustomer.name + (selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''));
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedCustomer, isOpen]);

  // Filter customers based on query
  const filteredCustomers = useMemo(() => {
    const selectedDisplay = selectedCustomer 
      ? selectedCustomer.name + (selectedCustomer.phone ? ` (${selectedCustomer.phone})` : '')
      : '';
    const cleanQuery = (searchQuery === selectedDisplay ? '' : searchQuery).trim().toLowerCase();

    if (!cleanQuery) return customers;

    return customers.filter((cust) => {
      const nameMatch = cust.name?.toLowerCase().includes(cleanQuery);
      const phoneMatch = cust.phone?.toLowerCase().includes(cleanQuery);
      return nameMatch || phoneMatch;
    });
  }, [customers, searchQuery, selectedCustomer]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (selectedCustomer) {
          setSearchQuery(selectedCustomer.name + (selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''));
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
  }, [selectedCustomer]);

  const handleFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.select();
  };

  const handleSelect = (cust) => {
    onSelectCustomer(cust);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (cust) {
      setSearchQuery(cust.name + (cust.phone ? ` (${cust.phone})` : ''));
    } else {
      setSearchQuery('');
    }
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onSelectCustomer(null);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleQuickAdd = async (nameToUse) => {
    const name = (nameToUse || searchQuery).trim();
    if (!name) return;

    if (onCreateCustomer) {
      try {
        setIsSubmitting(true);
        const created = await onCreateCustomer({ name, phone: '' });
        if (created) {
          handleSelect(created);
          return;
        }
      } catch (err) {
        console.error('Failed to create customer:', err);
      } finally {
        setIsSubmitting(false);
      }
    }

    // Fallback: use as custom customer object without backend ID
    handleSelect({ name, isCustom: true });
  };

  const handleSaveModalCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    try {
      setIsSubmitting(true);
      if (onCreateCustomer) {
        const created = await onCreateCustomer({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim()
        });
        if (created) {
          handleSelect(created);
        } else {
          handleSelect({ name: newCustomerName.trim(), phone: newCustomerPhone.trim(), isCustom: true });
        }
      } else {
        handleSelect({ name: newCustomerName.trim(), phone: newCustomerPhone.trim(), isCustom: true });
      }
      setShowAddModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err) {
      console.error('Error saving customer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    const totalOptions = filteredCustomers.length + 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === 0) {
        handleSelect(null);
      } else if (highlightedIndex > 0 && highlightedIndex - 1 < filteredCustomers.length) {
        handleSelect(filteredCustomers[highlightedIndex - 1]);
      } else if (filteredCustomers.length === 1) {
        handleSelect(filteredCustomers[0]);
      } else if (searchQuery.trim()) {
        // Quick add the typed customer name on Enter
        handleQuickAdd(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (selectedCustomer) {
        setSearchQuery(selectedCustomer.name + (selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''));
      } else {
        setSearchQuery('');
      }
      inputRef.current?.blur();
    }
  };

  const cleanTypedQuery = searchQuery.trim();
  const exactMatch = filteredCustomers.some(
    (c) => c.name.toLowerCase() === cleanTypedQuery.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Search & Input Box */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {selectedCustomer ? (
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
          className={`w-full pl-9 pr-20 py-2 bg-slate-800 border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-inner ${
            selectedCustomer ? 'border-amber-500/40 text-amber-200' : 'border-slate-700'
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
          {/* Clear Button */}
          {(selectedCustomer || searchQuery) && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear Customer"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Add Button (+) */}
          <button
            type="button"
            onClick={() => {
              setNewCustomerName(searchQuery.trim());
              setShowAddModal(true);
            }}
            title="Add New Customer"
            className="p-1 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Chevron */}
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
          className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto overflow-x-hidden divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Option 0: Walk-in / No Customer */}
          <div
            data-item-index="0"
            onClick={() => handleSelect(null)}
            onMouseEnter={() => setHighlightedIndex(0)}
            className={`px-3 py-2 flex items-center justify-between cursor-pointer transition text-xs select-none ${
              highlightedIndex === 0
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            } ${!selectedCustomer ? 'bg-slate-800/60 font-semibold text-slate-300' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-slate-500" />
              <span>No Customer Attached (Walk-in / Cash / Card)</span>
            </div>
            {!selectedCustomer && <Check className="w-3.5 h-3.5 text-slate-400" />}
          </div>

          {/* Inline Quick Add button if user typed something not already existing */}
          {cleanTypedQuery && !exactMatch && (
            <div
              onClick={() => handleQuickAdd(cleanTypedQuery)}
              className="px-3 py-2 flex items-center justify-between cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition text-xs select-none group border-b border-slate-800"
            >
              <div className="flex items-center space-x-2 truncate">
                <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  Add &ldquo;<strong>{cleanTypedQuery}</strong>&rdquo; as customer
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                {isSubmitting ? 'Adding...' : '+ Add'}
              </span>
            </div>
          )}

          {/* Customer list */}
          {filteredCustomers.length === 0 && !cleanTypedQuery ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              No customers found. Type a name above or click + to add.
            </div>
          ) : (
            filteredCustomers.map((cust, idx) => {
              const optionIndex = idx + 1;
              const isSelected = selectedCustomer?._id === cust._id || (!cust._id && selectedCustomer?.name === cust.name);
              const isHighlighted = highlightedIndex === optionIndex;

              return (
                <div
                  key={cust._id || cust.name + idx}
                  data-item-index={optionIndex}
                  onClick={() => handleSelect(cust)}
                  onMouseEnter={() => setHighlightedIndex(optionIndex)}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer transition text-xs sm:text-sm select-none ${
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
                      {cust.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold">{cust.name}</span>
                      {cust.phone && (
                        <span className="ml-1.5 text-[11px] text-slate-400 font-mono">
                          {cust.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal to Add New Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. John Smith, Sarah"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="e.g. +60 12-345 6789"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCustomerName.trim()}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
