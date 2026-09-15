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
  Receipt, 
  BedDouble, 
  AlertTriangle,
  Users
} from 'lucide-react';
import CustomerSearchSelect from './CustomerSearchSelect';
import StaffSearchSelect from './StaffSearchSelect';
import RoomSearchSelect from './RoomSearchSelect';
import { isDormRoom } from '../../utils/rooms';

export default function ActiveTicket({ 
  customers = [], 
  onCreateCustomer, 
  staffMembers = [], 
  presetDiscounts = [], 
  onCheckout 
}) {
  const { 
    items, 
    customer,
    setCustomer,
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

  // Tab Assignment Mode: 'CUSTOMER' | 'ROOM' | 'STAFF'
  const [tabType, setTabType] = useState('CUSTOMER');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');

  // Discount States
  const [selectedLineDiscountId, setSelectedLineDiscountId] = useState(null);
  const [manualDiscountType, setManualDiscountType] = useState('percentage'); // 'percentage' | 'fixed_cents'
  const [manualDiscountValue, setManualDiscountValue] = useState('10');
  
  // Checkout States
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null); // { status, paymentMethod }
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Action / Validation Alert Modal State
  const [alertModal, setAlertModal] = useState(null); // { title, message, type }

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

  // Open the Checkout Confirmation Modal with Validation
  const initiateCheckout = (status, paymentMethod) => {
    if (items.length === 0) {
      setAlertModal({
        title: 'Active Ticket is Empty',
        message: 'Please add at least one product from the catalog before checking out.',
        type: 'warning'
      });
      return;
    }

    if (status === 'UNPAID_TAB') {
      if (tabType === 'CUSTOMER') {
        if (!customer || !customer.name?.trim()) {
          setAlertModal({
            title: 'Customer Name Required',
            message: 'Please search, select, or enter a customer name to hold this unpaid customer bill.',
            type: 'warning'
          });
          return;
        }
      } else if (tabType === 'ROOM') {
        if (!selectedRoomNumber) {
          setAlertModal({
            title: 'Room Number Required',
            message: 'Please select a Room Number (B101–B109, V101–V108, H101–H110, D101–D106, S101) to hold this customer bill.',
            type: 'warning'
          });
          return;
        }

        if (isDormRoom(selectedRoomNumber) && !guestName.trim()) {
          setAlertModal({
            title: 'Guest / Bed Name Required',
            message: `Room ${selectedRoomNumber} is a 6-pax shared dormitory. Please enter the guest or bed name to keep individual customer bills separated.`,
            type: 'warning'
          });
          return;
        }
      } else {
        if (!staffMember) {
          setAlertModal({
            title: 'Staff Member Required',
            message: 'Please search and select an employee or staff member to hold this unpaid staff tab.',
            type: 'warning'
          });
          return;
        }
      }
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
      const effectiveTabType = pendingCheckout.status === 'UNPAID_TAB'
        ? tabType 
        : (customer ? 'CUSTOMER' : (tabType === 'ROOM' ? 'ROOM' : (tabType === 'STAFF' ? 'STAFF' : 'NONE')));

      const payload = {
        status: pendingCheckout.status,
        paymentMethod: pendingCheckout.paymentMethod,
        tabType: effectiveTabType,
        customerId: (effectiveTabType === 'CUSTOMER' || pendingCheckout.status === 'PAID') && customer?._id ? customer._id : null,
        customerName: (effectiveTabType === 'CUSTOMER' || pendingCheckout.status === 'PAID') && customer?.name ? customer.name.trim() : undefined,
        staffMemberId: effectiveTabType === 'STAFF' ? (staffMember?._id || null) : null,
        roomNumber: effectiveTabType === 'ROOM' ? selectedRoomNumber : undefined,
        guestName: effectiveTabType === 'ROOM' && guestName.trim() ? guestName.trim() : undefined,
        notes: checkoutNotes.trim()
      };

      const result = await onCheckout(payload);

      if (result?.success) {
        setSuccessReceipt(result.data);
        clearCart();
        setPendingCheckout(null);
        setNotes('');
        setSelectedRoomNumber('');
        setGuestName('');
      } else {
        setAlertModal({
          title: 'Checkout Failed',
          message: result?.message || 'Transaction could not be completed.',
          type: 'error'
        });
        setPendingCheckout(null);
      }
    } catch (err) {
      setAlertModal({
        title: 'Transaction Error',
        message: err.response?.data?.message || err.message || 'Error processing transaction.',
        type: 'error'
      });
      setPendingCheckout(null);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header: Tab Assignment Switcher (Customer Bill vs. Room Bill vs. Staff Tab) */}
      <div className="p-3.5 bg-slate-850 border-b border-slate-800 relative z-30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tab / Bill Assignment
          </span>

          {/* Segmented Switcher */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setTabType('CUSTOMER')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                tabType === 'CUSTOMER'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => setTabType('ROOM')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                tabType === 'ROOM'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Room Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setTabType('STAFF')}
              className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                tabType === 'STAFF'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Staff Tab (Payroll)"
            >
              <span>Staff</span>
            </button>
          </div>
        </div>

        {/* Tab Type 1: Customer Bill Search / Input */}
        {tabType === 'CUSTOMER' && (
          <div className="space-y-1.5">
            <CustomerSearchSelect
              customers={customers}
              selectedCustomer={customer}
              onSelectCustomer={setCustomer}
              onCreateCustomer={onCreateCustomer}
              placeholder="Search or enter customer name..."
            />
            {customer && (
              <div className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border text-amber-400/90 bg-amber-500/10 border-amber-500/20 flex items-center justify-between">
                <span>
                  Customer: <strong>{customer.name}</strong>
                  {customer.phone && <span className="font-mono ml-1 text-slate-300">({customer.phone})</span>}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomer(null)}
                  className="text-red-400 hover:text-red-300 text-xs cursor-pointer ml-2"
                >
                  Detach
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Type 2: Staff Tab Search */}
        {tabType === 'STAFF' && (
          <div className="space-y-1.5">
            <StaffSearchSelect
              staffMembers={staffMembers}
              selectedStaff={staffMember}
              onSelectStaff={setStaffMember}
              placeholder="Search staff name or code..."
            />
            {staffMember && (
              <div className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                staffMember.isCustom
                  ? 'text-blue-300 bg-blue-500/10 border-blue-500/20'
                  : 'text-amber-400/90 bg-amber-500/10 border-amber-500/20'
              }`}>
                <span>
                  {staffMember.isCustom ? (
                    <>Guest name: <strong>{staffMember.fullName}</strong></>
                  ) : (
                    <>Tab active for: <strong>{staffMember.fullName}</strong> ({staffMember.employeeCode})</>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStaffMember(null)}
                  className="text-red-400 hover:text-red-300 text-xs cursor-pointer ml-2"
                >
                  Detach
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Type 2: Customer Room Bill Selector */}
        {tabType === 'ROOM' && (
          <div className="space-y-1.5">
            <RoomSearchSelect
              selectedRoomNumber={selectedRoomNumber}
              onSelectRoom={setSelectedRoomNumber}
              guestName={guestName}
              onChangeGuestName={setGuestName}
            />
            {selectedRoomNumber && (
              <div className="text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center justify-between">
                <span>
                  Bill for Room: <strong className="font-mono text-white">{selectedRoomNumber}</strong>
                  {guestName && <span> ({guestName})</span>}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoomNumber('');
                    setGuestName('');
                  }}
                  className="text-red-400 hover:text-red-300 text-xs cursor-pointer ml-2"
                >
                  Detach
                </button>
              </div>
            )}
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
        {/* Hold Tab Button (Dynamic to Customer, Room, or Staff) */}
        <button
          type="button"
          disabled={checkoutLoading || items.length === 0}
          onClick={() => initiateCheckout('UNPAID_TAB', 'TAB_DEFERRED')}
          className={`col-span-2 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer ${
            (tabType === 'CUSTOMER' && customer) || (tabType === 'STAFF' && staffMember) || (tabType === 'ROOM' && selectedRoomNumber)
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-[0.99]'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {tabType === 'CUSTOMER'
              ? (customer?.name
                  ? `HOLD AS CUSTOMER BILL (${customer.name})`
                  : 'HOLD AS CUSTOMER BILL')
              : tabType === 'ROOM'
              ? (selectedRoomNumber 
                  ? `HOLD AS ROOM BILL (${selectedRoomNumber}${guestName ? ` - ${guestName}` : ''})`
                  : 'HOLD AS ROOM BILL')
              : (staffMember
                  ? `HOLD AS STAFF TAB (${staffMember.fullName})`
                  : 'HOLD AS STAFF TAB')}
          </span>
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

      {/* Prominent High-Visibility Checkout Confirmation Modal */}
      {pendingCheckout && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Transaction & Settlement</h3>
                  <p className="text-xs text-slate-400">Review checkout details and enter cashier notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingCheckout(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settlement Target Card */}
            <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Settlement Action:</span>
                <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                  pendingCheckout.status === 'UNPAID_TAB'
                    ? (tabType === 'CUSTOMER'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : tabType === 'ROOM'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800')
                    : pendingCheckout.paymentMethod === 'CASH'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {pendingCheckout.status === 'UNPAID_TAB'
                    ? (tabType === 'CUSTOMER'
                        ? `Customer Bill (${customer?.name || 'Assigned'})`
                        : tabType === 'ROOM'
                        ? `Room Bill (${selectedRoomNumber}${guestName ? ` - ${guestName}` : ''})`
                        : `Staff Tab (${staffMember?.fullName || 'Assigned'})`)
                    : `${pendingCheckout.paymentMethod} Payment${customer?.name ? ` (${customer.name})` : ''}`}
                </span>
              </div>

              {customer?.name && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Attached Customer:</span>
                  <span className="font-semibold text-amber-300">
                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                  </span>
                </div>
              )}

              {pendingCheckout.status === 'UNPAID_TAB' && tabType === 'ROOM' && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Attached Room:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {selectedRoomNumber} {guestName ? `(${guestName})` : ''}
                  </span>
                </div>
              )}

              {pendingCheckout.status === 'UNPAID_TAB' && tabType === 'STAFF' && staffMember && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Attached Staff:</span>
                  <span className="font-semibold text-amber-300">{staffMember.fullName} ({staffMember.employeeCode})</span>
                </div>
              )}

              {/* Line Items Preview */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Order Summary ({totals.itemCount} items)
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {items.map((it) => (
                    <div key={it.productId} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[240px]">
                        {it.quantity}x {it.productNameSnapshot}
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {formatCurrency(it.finalLineTotalInCents, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-slate-750 text-sm">
                <span className="font-bold text-white">Grand Total Due:</span>
                <span className="font-black text-amber-400 text-lg font-mono">
                  {formatCurrency(totals.grandTotalInCents, currency)}
                </span>
              </div>
            </div>

            {/* Cashier Notes Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Cashier Notes / Order Instructions (Optional)</span>
              </label>
              <textarea
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Table 4, takeaway, extra hot, customer request note..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => setPendingCheckout(null)}
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Cancel / Modify Ticket
              </button>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={confirmAndExecuteCheckout}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {checkoutLoading ? 'Finalizing...' : `Confirm & Finalize`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Floating Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/60 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{alertModal.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{alertModal.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setAlertModal(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Success Modal / Receipt */}
      {successReceipt && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Transaction Finalized</h3>
              <p className="text-xs text-slate-400 mt-1">
                ID: <span className="text-amber-400 font-mono font-bold">{successReceipt.txnNumber}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-850 rounded-2xl text-xs space-y-2 text-slate-300 border border-slate-800">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${successReceipt.status === 'PAID' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {successReceipt.status === 'PAID' ? 'PAID' : 'UNPAID TAB'}
                </span>
              </div>

              {successReceipt.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-semibold text-amber-300">{successReceipt.customerName}</span>
                </div>
              )}

              {successReceipt.roomNumber && (
                <div className="flex justify-between">
                  <span>Room Bill:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {successReceipt.roomNumber} {successReceipt.guestName ? `(${successReceipt.guestName})` : ''}
                  </span>
                </div>
              )}

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

              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-750">
                <span>Total Settled:</span>
                <span className="font-mono text-amber-400">{formatCurrency(successReceipt.grandTotalInCents, currency)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              New Ticket (Ready)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
