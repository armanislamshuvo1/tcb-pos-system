'use client';

import React, { useState } from 'react';
import { UserPlus, Search } from 'lucide-react';

export default function CustomersAdminTab({
  customers = [],
  onCreateCustomer
}) {
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [custSaving, setCustSaving] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!custName.trim()) return;
    setCustSaving(true);
    try {
      const success = await onCreateCustomer({
        name: custName,
        phone: custPhone,
        email: custEmail,
        notes: custNotes
      });
      if (success) {
        setCustName('');
        setCustPhone('');
        setCustEmail('');
        setCustNotes('');
      }
    } finally {
      setCustSaving(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!custSearch.trim()) return true;
    const term = custSearch.toLowerCase().trim();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Customer Form */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Register New Customer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add customer profiles to easily attach them to sales and maintain customer bills.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g. Michael Wong"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              placeholder="e.g. +60 12-345 6789"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="e.g. michael@example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Preferences (Optional)</label>
            <textarea
              rows={2}
              value={custNotes}
              onChange={(e) => setCustNotes(e.target.value)}
              placeholder="e.g. VIP regular, prefers oat milk..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={custSaving || !custName.trim()}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 disabled:opacity-50 cursor-pointer"
          >
            {custSaving ? 'Saving Customer...' : 'Save Customer'}
          </button>
        </form>
      </div>

      {/* Customers Directory List */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white">Registered Customers ({customers.length})</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {custSearch ? `No customers matching "${custSearch}"` : 'No customers registered yet. Add your first customer using the form on the left.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {filteredCustomers.map((cust) => (
              <div key={cust._id} className="p-3.5 flex items-center justify-between bg-slate-850 hover:bg-slate-800 transition">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    {cust.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-sm truncate">{cust.name}</div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      {cust.phone && <span className="font-mono">{cust.phone}</span>}
                      {cust.phone && cust.email && <span>•</span>}
                      {cust.email && <span className="truncate">{cust.email}</span>}
                    </div>
                    {cust.notes && (
                      <div className="text-[11px] text-amber-300/80 italic mt-0.5 truncate">
                        &ldquo;{cust.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0 ml-3">
                  Added {new Date(cust.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
