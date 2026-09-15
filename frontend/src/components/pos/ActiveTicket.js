'use client';

import React, { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
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
  AlertCircle,
  FileText,
  Receipt
} from 'lucide-react';
import StaffSearchSelect from './StaffSearchSelect';

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
    getTotals,
    notes,
    setNotes
  } = useCartStore();

  const { currency } = useAuth();

  const [selectedLineDiscountId, setSelectedLineDiscountId] = useState(null);
  const [manualDiscountType, setManualDiscountType] = useState('percentage'); // 'percentage' | 'fixed_cents'
  const [manualDiscountValue, setManualDiscountValue] = useState('10');
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null); // { status, paymentMethod }
  const [checkoutNotes, setCheckoutNotes] = useState('');
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
    const val = Number(manualDiscountValue);
    if (!isNaN(val) && val >= 0) {
      if (manualDiscountType === 'fixed_cents') {
        setLineDiscount(productId, 'fixed_cents', Math.round(val * 100));
      } else {
        setLineDiscount(productId, 'percentage', val);
      }
      setSelectedLineDiscountId(null);
    }
  };

  // Open the Checkout Confirmation Modal
  const initiateCheckout = (status, paymentMethod) => {
    if (items.length === 0) {
      setErrorMessage('Cart is empty. Add products before checking out.');
      return;
    }

    if (status === 'UNPAID_TAB' && !staffMember) {
      setErrorMessage('Please select a staff member to hold this ticket as an unpaid tab.');
      return;
    }

    setErrorMessage('');
    setCheckoutNotes(notes || '');
    setPendingCheckout({ status, paymentMethod });
  };

  // Final confirmation execution
  const confirmAndExecuteCheckout = async () => {
    if (!pendingCheckout) return;

    setErrorMessage('');
    setCheckoutLoading(true);

    try {
      const result = await onCheckout({
        status: pendingCheckout.status,
        paymentMethod: pendingCheckout.paymentMethod,
        staffMemberId: staffMember?._id || null,
        notes: checkoutNotes.trim()
      });

      if (result?.success) {
        setSuccessReceipt(result.data);
        clearCart();
        setPendingCheckout(null);
        setNotes('');
      } else {
        setErrorMessage(result?.message || 'Checkout failed');
        setPendingCheckout(null);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error processing transaction');
      setPendingCheckout(null);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header: Staff Assignment */}
      <div className="p-4 bg-slate-850 border-b border-slate-800 relative z-30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Staff Tab Assignment</span>
          </span>
          {staffMember && (
            <button
              type="button"
              onClick={() => setStaffMember(null)}
              className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
            >
              Detach Staff
            </button>
          )}
        </div>

        {/* Searchable Staff Selection */}
        <StaffSearchSelect
          staffMembers={staffMembers}
          selectedStaff={staffMember}
          onSelectStaff={setStaffMember}
          placeholder="Search staff name or code..."
        />

        {staffMember && (
          <div className="mt-2 text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center justify-between">
            <span>Tab active for: <strong>{staffMember.fullName}</strong> ({staffMember.employeeCode})</span>
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
            const unitPriceFormatted = formatCurrency(item.unitPriceInCents, currency);
            const lineTotalFormatted = formatCurrency(item.finalLineTotalInCents, currency);
            const hasDiscount = item.lineDiscountInCents > 0;

            return (
              <div key={item.productId} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-sm font-semibold text-white leading-snug">
                      {item.productNameSnapshot}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center flex-wrap gap-1.5">
                      <span>{unitPriceFormatted} ea</span>
                      {hasDiscount && (
                        <span className="text-emerald-400 font-medium">
                          (-{formatCurrency(item.lineDiscountInCents, currency)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{lineTotalFormatted}</span>
                  </div>
                </div>

                {/* Quantity Controls & Modifiers */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold text-sm text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Line discount button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedLineDiscountId === item.productId) {
                          setSelectedLineDiscountId(null);
                        } else {
                          setSelectedLineDiscountId(item.productId);
                          if (item.lineDiscountType === 'fixed_cents') {
                            setManualDiscountType('fixed_cents');
                            setManualDiscountValue((item.lineDiscountValue / 100).toString());
                          } else {
                            setManualDiscountType('percentage');
                            setManualDiscountValue(item.lineDiscountValue ? item.lineDiscountValue.toString() : '10');
                          }
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md border flex items-center space-x-1 transition cursor-pointer ${
                        hasDiscount
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>
                        {hasDiscount 
                          ? (item.lineDiscountType === 'fixed_cents' 
                              ? `-${formatCurrency(item.lineDiscountValue, currency)}` 
                              : `-${item.lineDiscountValue}%`)
                          : 'Disc'}
                      </span>
                    </button>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded-md transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Popover Manual Line Discount Editor with Amount / % Toggle */}
                {selectedLineDiscountId === item.productId && (
                  <div className="mt-2 p-3 bg-slate-800/95 rounded-xl border border-slate-700 space-y-2 animate-in fade-in duration-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Custom Item Discount</span>
                      {/* Discount Unit Switch */}
                      <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-0.5">
                        <button
                          type="button"
                          onClick={() => setManualDiscountType('percentage')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                            manualDiscountType === 'percentage'
                              ? 'bg-amber-500 text-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualDiscountType('fixed_cents')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                            manualDiscountType === 'fixed_cents'
                              ? 'bg-amber-500 text-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {currency?.symbol || 'RM'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step={manualDiscountType === 'fixed_cents' ? '0.01' : '1'}
                          min="0"
                          max={manualDiscountType === 'percentage' ? '100' : undefined}
                          value={manualDiscountValue}
                          onChange={(e) => setManualDiscountValue(e.target.value)}
                          placeholder={manualDiscountType === 'fixed_cents' ? 'e.g. 2.00' : 'e.g. 10'}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyManualLineDiscount(item.productId)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLineDiscount(item.productId, 'none', 0);
                          setSelectedLineDiscountId(null);
                        }}
                        className="text-xs text-slate-400 hover:text-red-400 px-1 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Quick Discounts</span>
            {globalDiscount?.value > 0 && (
              <button
                type="button"
                onClick={() => setGlobalDiscount('none', 0)}
                className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
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
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 active:scale-95 transition cursor-pointer"
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
          <span>{formatCurrency(totals.rawSubtotalInCents, currency)}</span>
        </div>
        {totals.totalDiscountInCents > 0 && (
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>Discounts Applied</span>
            <span>-{formatCurrency(totals.totalDiscountInCents, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-white font-extrabold text-lg pt-1 border-t border-slate-700/60">
          <span>TOTAL DUE</span>
          <span className="text-amber-400">{formatCurrency(totals.grandTotalInCents, currency)}</span>
        </div>
      </div>

      {/* Action Buttons Triggering Confirmation Modal */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-2">
        {/* Hold Tab Button (Full Width if Staff Attached) */}
        <button
          type="button"
          disabled={checkoutLoading || items.length === 0}
          onClick={() => initiateCheckout('UNPAID_TAB', 'TAB_DEFERRED')}
          className={`col-span-2 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer ${
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
          onClick={() => initiateCheckout('PAID', 'CASH')}
          className="py-3 px-4 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition cursor-pointer"
        >
          <DollarSign className="w-4 h-4" />
          <span>CASH</span>
        </button>

        {/* Immediate Card Checkout */}
        <button
          type="button"
          disabled={checkoutLoading || items.length === 0}
          onClick={() => initiateCheckout('PAID', 'CARD')}
          className="py-3 px-4 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>CARD</span>
        </button>
      </div>

      {/* Checkout Confirmation Modal with Cashier Notes */}
      {pendingCheckout && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm Transaction</h3>
                  <p className="text-xs text-slate-400">Review checkout details and add notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingCheckout(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment & Order Summary Card */}
            <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Settlement Action:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  pendingCheckout.status === 'UNPAID_TAB'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : pendingCheckout.paymentMethod === 'CASH'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {pendingCheckout.status === 'UNPAID_TAB'
                    ? `Staff Tab (${staffMember?.fullName || 'Assigned'})`
                    : `${pendingCheckout.paymentMethod} Payment`}
                </span>
              </div>

              {staffMember && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Attached Staff:</span>
                  <span className="font-semibold text-amber-300">{staffMember.fullName} ({staffMember.employeeCode})</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Line Items:</span>
                <span className="font-semibold text-white">{totals.itemCount} items</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-700/80 text-sm">
                <span className="font-bold text-white">Grand Total Due:</span>
                <span className="font-black text-amber-400 text-base">
                  {formatCurrency(totals.grandTotalInCents, currency)}
                </span>
              </div>
            </div>

            {/* Cashier Notes Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Cashier Notes / Order Instructions (Optional)</span>
              </label>
              <textarea
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Table 4, takeaway, extra hot, customer promo note..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => setPendingCheckout(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Cancel / Back
              </button>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={confirmAndExecuteCheckout}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {checkoutLoading ? 'Processing...' : `Confirm & Settle`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal / Receipt */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
              {successReceipt.notes && (
                <div className="flex justify-between text-left">
                  <span>Notes:</span>
                  <span className="font-medium text-amber-300/90 italic truncate max-w-[180px]">{successReceipt.notes}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-700">
                <span>Total:</span>
                <span>{formatCurrency(successReceipt.grandTotalInCents, currency)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition cursor-pointer"
            >
              New Ticket (Ready)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
