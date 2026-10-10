'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Tag, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useCartStore } from '../../store/useCartStore';

export default function CustomItemModal({
  isOpen,
  onClose,
  initialName = '',
  currency
}) {
  const { addCustomItem } = useCartStore();

  const [name, setName] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percentage' | 'fixed_cents'
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState('');

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setPriceDollars('');
      setQuantity(1);
      setDiscountType('none');
      setDiscountValue('');
      setError('');
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const symbol = currency?.symbol || 'RM';
  const parsedPrice = parseFloat(priceDollars) || 0;
  const parsedPriceCents = Math.round(parsedPrice * 100);
  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

  // Calculate live preview
  let lineDiscountInCents = 0;
  if (discountType === 'percentage' && parseFloat(discountValue) > 0) {
    lineDiscountInCents = Math.round(((parsedPriceCents * parsedQty) * parseFloat(discountValue)) / 100);
  } else if (discountType === 'fixed_cents' && parseFloat(discountValue) > 0) {
    const perUnitDisc = Math.min(parsedPriceCents, Math.round(parseFloat(discountValue) * 100));
    lineDiscountInCents = perUnitDisc * parsedQty;
  }
  const rawSubtotalCents = parsedPriceCents * parsedQty;
  lineDiscountInCents = Math.min(rawSubtotalCents, Math.max(0, lineDiscountInCents));
  const finalLineTotalCents = rawSubtotalCents - lineDiscountInCents;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product or item name.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid price.');
      return;
    }

    let finalDiscountVal = 0;
    if (discountType === 'percentage') {
      finalDiscountVal = Math.min(100, Math.max(0, parseFloat(discountValue) || 0));
    } else if (discountType === 'fixed_cents') {
      finalDiscountVal = Math.max(0, Math.round((parseFloat(discountValue) || 0) * 100));
    }

    addCustomItem({
      name: name.trim(),
      priceInCents: parsedPriceCents,
      quantity: parsedQty,
      lineDiscountType: discountType,
      lineDiscountValue: finalDiscountVal
    });

    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-slate-900 border border-slate-750 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Add Custom Item</h3>
              <p className="text-[11px] text-slate-400">One-time product added directly to active ticket</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Item Name *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Special Dish, Delivery Charge, Repair"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Price & Quantity Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Unit Price ({symbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                  {symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-11 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Quantity
              </label>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer active:scale-95 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="flex-1 w-full text-center bg-transparent font-bold text-sm text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Custom Item Discount (Optional)</span>
              </span>
              {discountType !== 'none' && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('none');
                    setDiscountValue('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-red-400 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Discount Type</label>
                <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('none');
                      setDiscountValue('');
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      discountType === 'none' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('percentage');
                      if (!discountValue) setDiscountValue('10');
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      discountType === 'percentage' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    % Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed_cents');
                      if (!discountValue) setDiscountValue('2.00');
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      discountType === 'fixed_cents' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {symbol} Off
                  </button>
                </div>
              </div>

              {discountType !== 'none' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {discountType === 'percentage' ? 'Percentage (% Off)' : `Amount Off (${symbol})`}
                  </label>
                  <input
                    type="number"
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '2.00'}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Calculated Price Preview */}
          {parsedPriceCents > 0 && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">
                Total for {parsedQty} {parsedQty === 1 ? 'item' : 'items'}:
              </span>
              <div className="flex items-center space-x-2">
                {lineDiscountInCents > 0 && (
                  <span className="text-slate-500 line-through text-[11px] tabular-nums font-mono">
                    {formatCurrency(rawSubtotalCents, currency)}
                  </span>
                )}
                <span className="text-amber-400 font-black text-sm tabular-nums font-mono">
                  {formatCurrency(finalLineTotalCents, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || parsedPrice < 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
