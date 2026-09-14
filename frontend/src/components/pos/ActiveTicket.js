'use client';

import React, { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { 
  Trash2, 
  Minus, 
  Plus, 
  Tag, 
  UserCheck, 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';

export default function ActiveTicket({ staffMembers, presetDiscounts, onCheckout }) {
  const { 
    items, 
    staffMember, 
    setStaffMember, 
    updateQuantity, 
    removeItem, 
    setLineDiscount, 
    setGlobalDiscount, 
    globalDiscount,
    clearCart, 
    getTotals 
  } = useCartStore();

  const [selectedLineDiscountId, setSelectedLineDiscountId] = useState(null);
  const [lineDiscountPercent, setLineDiscountPercent] = useState('10');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const totals = getTotals();

  const handleApplyPreset = (preset) => {
    if (preset.target === 'global_ticket') {
      setGlobalDiscount(preset.type, preset.value);
    } else if (preset.target === 'specific_product' && preset.productId) {
      const matchedItem = items.find((i) => i.productId === preset.productId);
      if (matchedItem) {
        setLineDiscount(matchedItem.productId, preset.type, preset.value);
        setErrorMessage('');
      } else {
        setErrorMessage(`"${preset.name}" only applies to ${preset.productNameSnapshot || 'a specific product'}, which is not currently in your ticket.`);
      }
    } else if (preset.target === 'line_item') {
      if (items.length > 0) {
        const targetId = selectedLineDiscountId || items[items.length - 1].productId;
        setLineDiscount(targetId, preset.type, preset.value);
      }
    }
  };

  const handleApplyManualLineDiscount = (productId) => {
    const val = Number(lineDiscountPercent);
    if (!isNaN(val) && val >= 0) {
      setLineDiscount(productId, 'percentage', val);
      setSelectedLineDiscountId(null);
    }
  };

  const executeCheckout = async (status, paymentMethod) => {
    if (items.length === 0) {
      setErrorMessage('Cart is empty. Add products before checking out.');
      return;
    }

    if (status === 'UNPAID_TAB' && !staffMember) {
      setErrorMessage('Please select a staff member to hold this ticket as an unpaid tab.');
      return;
    }

    setErrorMessage('');
    setCheckoutLoading(true);

    try {
      const result = await onCheckout({
        status,
        paymentMethod,
        staffMemberId: staffMember?._id || null
      });

      if (result?.success) {
        setSuccessReceipt(result.data);
        clearCart();
      } else {
        setErrorMessage(result?.message || 'Checkout failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error processing transaction');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header: Staff Assignment */}
      <div className="p-4 bg-slate-850 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Staff Tab Assignment</span>
          </span>
          {staffMember && (
            <button
              onClick={() => setStaffMember(null)}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Detach Staff
            </button>
          )}
        </div>

        {/* Staff Dropdown */}
        <select
          value={staffMember?._id || ''}
          onChange={(e) => {
            const found = staffMembers.find((s) => s._id === e.target.value);
            setStaffMember(found || null);
          }}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
        >
          <option value="">-- No Staff Attached (Cash/Card Walk-in) --</option>
          {staffMembers.map((staff) => (
            <option key={staff._id} value={staff._id}>
              {staff.fullName} ({staff.employeeCode})
            </option>
          ))}
        </select>

        {staffMember && (
          <div className="mt-2 text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Tab active for: <strong>{staffMember.fullName}</strong>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-2 py-12">
            <Tag className="w-8 h-8 text-slate-600" />
            <span>Active ticket is empty</span>
            <span className="text-xs text-slate-600">Select items from the catalog to build cart</span>
          </div>
        ) : (
          items.map((item) => {
            const unitPrice = (item.unitPriceInCents / 100).toFixed(2);
            const lineTotal = (item.finalLineTotalInCents / 100).toFixed(2);
            const hasDiscount = item.lineDiscountInCents > 0;

            return (
              <div key={item.productId} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-sm font-semibold text-white leading-snug">
                      {item.productNameSnapshot}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      ${unitPrice} ea
                      {hasDiscount && (
                        <span className="text-emerald-400 font-medium ml-2">
                          (-${(item.lineDiscountInCents / 100).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white">${lineTotal}</span>
                  </div>
                </div>

                {/* Quantity Controls & Modifiers */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold text-sm text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Line discount button */}
                    <button
                      type="button"
                      onClick={() => setSelectedLineDiscountId(
                        selectedLineDiscountId === item.productId ? null : item.productId
                      )}
                      className={`text-xs px-2 py-1 rounded-md border flex items-center space-x-1 transition ${
                        hasDiscount
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>{hasDiscount ? `${item.lineDiscountValue}%` : 'Disc'}</span>
                    </button>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Popover Manual Line Discount Editor */}
                {selectedLineDiscountId === item.productId && (
                  <div className="mt-2 p-2.5 bg-slate-800 rounded-xl border border-slate-700 flex items-center space-x-2">
                    <span className="text-xs text-slate-300">Discount %:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={lineDiscountPercent}
                      onChange={(e) => setLineDiscountPercent(e.target.value)}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyManualLineDiscount(item.productId)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded transition"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLineDiscount(item.productId, 'none', 0);
                        setSelectedLineDiscountId(null);
                      }}
                      className="text-xs text-slate-400 hover:text-red-400 px-1"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preset 1-Click Discounts */}
      {presetDiscounts && presetDiscounts.length > 0 && items.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-850 border-t border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
            <span>1-Click Preset Discounts</span>
            {globalDiscount.type !== 'none' && (
              <button
                onClick={() => setGlobalDiscount('none', 0)}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Clear Global
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presetDiscounts.map((preset) => (
              <button
                key={preset._id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 active:scale-95 transition"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="px-4 py-2 bg-red-950/80 border-t border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Financial Totals */}
      <div className="p-4 bg-slate-850 border-t border-slate-800 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal ({totals.itemCount} items)</span>
          <span>${(totals.rawSubtotalInCents / 100).toFixed(2)}</span>
        </div>
        {totals.totalDiscountInCents > 0 && (
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>Discounts Applied</span>
            <span>-${(totals.totalDiscountInCents / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-white font-extrabold text-lg pt-1 border-t border-slate-700/60">
          <span>TOTAL DUE</span>
          <span className="text-amber-400">${(totals.grandTotalInCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-2">
        {/* Hold Tab Button (Full Width if Staff Attached) */}
        <button
          type="button"
          disabled={checkoutLoading || items.length === 0}
          onClick={() => executeCheckout('UNPAID_TAB', 'TAB_DEFERRED')}
          className={`col-span-2 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
            staffMember
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>HOLD AS STAFF TAB</span>
        </button>

        {/* Immediate Cash Checkout */}
        <button
          type="button"
          disabled={checkoutLoading || items.length === 0}
          onClick={() => executeCheckout('PAID', 'CASH')}
          className="py-3 px-4 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
        >
          <DollarSign className="w-4 h-4" />
          <span>CASH</span>
        </button>

        {/* Immediate Card Checkout */}
        <button
          type="button"
          disabled={checkoutLoading || items.length === 0}
          onClick={() => executeCheckout('PAID', 'CARD')}
          className="py-3 px-4 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
        >
          <CreditCard className="w-4 h-4" />
          <span>CARD</span>
        </button>
      </div>

      {/* Success Modal / Receipt */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Transaction Finalized</h3>
              <p className="text-xs text-slate-400 mt-1">
                ID: <span className="text-amber-400 font-mono font-bold">{successReceipt.txnNumber}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${successReceipt.status === 'PAID' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {successReceipt.status === 'PAID' ? 'PAID' : 'UNPAID TAB'}
                </span>
              </div>
              {successReceipt.staffNameSnapshot && (
                <div className="flex justify-between">
                  <span>Staff Member:</span>
                  <span className="font-semibold text-white">{successReceipt.staffNameSnapshot}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-700">
                <span>Total:</span>
                <span>${(successReceipt.grandTotalInCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition"
            >
              New Ticket (Ready)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
