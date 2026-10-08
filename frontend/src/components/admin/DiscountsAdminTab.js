'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function DiscountsAdminTab({
  products = [],
  discounts = [],
  currency,
  onCreateDiscount,
  onDeleteDiscount
}) {
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discTarget, setDiscTarget] = useState('line_item');
  const [discProductId, setDiscProductId] = useState(products[0]?._id || '');
  const [discValue, setDiscValue] = useState('10');
  const [discIsPreset, setDiscIsPreset] = useState(true);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const success = await onCreateDiscount({
      name: discName,
      type: discType,
      target: discTarget,
      productId: discTarget === 'specific_product' ? (discProductId || products[0]?._id) : undefined,
      value: discValue,
      isPreset: discIsPreset
    });
    if (success) {
      setDiscName('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Preset Discount Form */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Configure 1-Click Discount</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Preset buttons appear on the cashier active ticket for 1-tap discounts.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Discount Label *</label>
            <input
              type="text"
              required
              value={discName}
              onChange={(e) => setDiscName(e.target.value)}
              placeholder="e.g. 15% VIP Special"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
              <select
                value={discType}
                onChange={(e) => setDiscType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_cents">Fixed Amount ({currency?.symbol || 'RM'})</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Scope</label>
              <select
                value={discTarget}
                onChange={(e) => setDiscTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="line_item">Any Selected Line Item</option>
                <option value="specific_product">Specific Product</option>
                <option value="global_ticket">Total Ticket (Global)</option>
              </select>
            </div>
          </div>

          {/* If Specific Product selected, show product picker */}
          {discTarget === 'specific_product' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Choose Target Product *
              </label>
              <select
                value={discProductId || products[0]?._id}
                onChange={(e) => setDiscProductId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
              >
                {products.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name} ({formatCurrency(prod.priceInCents, currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Discount Value ({discType === 'percentage' ? '%' : (currency?.symbol || 'RM')})
            </label>
            <input
              type="number"
              step={discType === 'fixed_cents' ? '0.01' : '1'}
              required
              value={discValue}
              onChange={(e) => setDiscValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition shadow-md mt-2 cursor-pointer"
          >
            Create Discount Button
          </button>
        </form>
      </div>

      {/* Preset Discounts List with Delete */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white mb-4">Configured Cashier Buttons ({discounts.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {discounts.map((d) => (
            <div key={d._id} className="p-4 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">{d.name}</div>
                <div className="text-xs text-slate-400">
                  {d.target === 'specific_product'
                    ? `Only on: ${d.productNameSnapshot || 'Specific item'}`
                    : d.target === 'line_item'
                    ? 'Any Selected Line Item'
                    : 'Global Ticket Scope'}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-amber-400 text-base">
                  {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value, currency)}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteDiscount(d._id, d.name)}
                  className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                  title="Delete Discount Button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
