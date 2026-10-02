'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import {
  Printer,
  X,
  FileText,
  Receipt,
  UserCheck,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function PrintableCustomerBillModal({
  isOpen,
  onClose,
  customerName,
  transactions = [],
  totalBalanceInCents = 0,
  initialFilter = 'UNPAID'
}) {
  const { company, currency, user } = useAuth();
  const printRef = useRef(null);

  // Print layout format: '80mm' | 'statement'
  const [printFormat, setPrintFormat] = useState('80mm');
  // Breakdown mode: 'consolidated' | 'detailed'
  const [breakdownMode, setBreakdownMode] = useState('consolidated');
  // Filter mode: 'UNPAID' | 'ALL'
  const [filterMode, setFilterMode] = useState(initialFilter);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filterMode === 'UNPAID') {
      return transactions.filter((t) => t.status === 'UNPAID_TAB');
    }
    return transactions.filter((t) => t.status !== 'VOIDED');
  }, [transactions, filterMode]);

  // Aggregate items across all filtered transactions for consolidated view
  const consolidatedItems = useMemo(() => {
    const map = new Map();
    filteredTransactions.forEach((txn) => {
      (txn.items || []).forEach((item) => {
        const prodId = item.productId?.toString() || item.productNameSnapshot;
        if (!map.has(prodId)) {
          map.set(prodId, {
            productId: prodId,
            productName: item.productNameSnapshot || 'Product',
            unitPriceInCents: item.unitPriceInCents || 0,
            quantity: 0,
            totalLineAmountInCents: 0,
            totalDiscountInCents: 0
          });
        }
        const existing = map.get(prodId);
        existing.quantity += item.quantity || 1;
        existing.totalLineAmountInCents += item.finalLineTotalInCents || 0;
        existing.totalDiscountInCents += item.lineDiscountInCents || 0;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.totalLineAmountInCents - a.totalLineAmountInCents);
  }, [filteredTransactions]);

  const computedTotalDueInCents = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.grandTotalInCents || 0), 0);
  }, [filteredTransactions]);

  const totalItemsCount = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => acc + (t.items || []).reduce((iAcc, item) => iAcc + (item.quantity || 1), 0),
      0
    );
  }, [filteredTransactions]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = company?.branding?.displayName || company?.name || 'PoS System';
  const companyAddress = company?.address || '';
  const companyPhone = company?.contactPhone || '';
  const printDateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const printTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Click outside backdrop handler */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Scoped Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-customer-statement, #printable-customer-statement * {
            visibility: visible !important;
          }
          #printable-customer-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            width: ${printFormat === '80mm' ? '80mm' : '100%'} !important;
            max-width: ${printFormat === '80mm' ? '80mm' : '100%'} !important;
            font-size: ${printFormat === '80mm' ? '11px' : '13px'} !important;
          }
          @page {
            size: ${printFormat === '80mm' ? '80mm auto' : 'auto'};
            margin: ${printFormat === '80mm' ? '0' : '10mm'};
          }
        }
      `}} />

      {/* Main Dialog Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 print:hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Print Customer Bill Statement</span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer: <strong className="text-amber-300">{customerName}</strong> • {filteredTransactions.length} transaction(s)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Scope:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setFilterMode('UNPAID')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterMode === 'UNPAID'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Unpaid Orders ({transactions.filter((t) => t.status === 'UNPAID_TAB').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All Orders ({transactions.length})
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Layout:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  printFormat === '80mm'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('statement')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  printFormat === 'statement'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Page / A4
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Items:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setBreakdownMode('consolidated')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  breakdownMode === 'consolidated'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Consolidated
              </button>
              <button
                type="button"
                onClick={() => setBreakdownMode('detailed')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  breakdownMode === 'detailed'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Per Order
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60 flex justify-center">
          <div
            className={`bg-white text-black p-6 rounded-2xl shadow-xl font-mono text-xs space-y-4 transition-all ${
              printFormat === '80mm' ? 'w-full max-w-[340px]' : 'w-full max-w-2xl text-sm'
            }`}
          >
            {/* Header info */}
            <div className="text-center space-y-1">
              <div className="text-base font-black uppercase tracking-wider">{companyName}</div>
              {companyAddress && <div className="text-[11px] text-gray-600">{companyAddress}</div>}
              {companyPhone && <div className="text-[11px] text-gray-600">Tel: {companyPhone}</div>}
              <div className="text-[11px] font-black border-y-2 border-dashed border-gray-400 py-1 my-2 uppercase">
                *** CUSTOMER STATEMENT / BILL ***
              </div>
            </div>

            {/* Customer & Timestamp meta */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Print Date:</span>
                <span>{printDateStr} {printTimeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Printed By:</span>
                <span>{user?.name || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Scope:</span>
                <span className="font-bold">{filterMode === 'UNPAID' ? 'UNPAID TAB ONLY' : 'ALL ORDERS'}</span>
              </div>
            </div>

            {/* Included Transactions List */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
              <div className="font-bold text-gray-700 uppercase tracking-wide">Included Orders ({filteredTransactions.length})</div>
              {filteredTransactions.map((txn) => {
                const dateStr = new Date(txn.createdAt).toLocaleDateString();
                const timeStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={txn._id} className="flex justify-between items-center py-0.5">
                    <div>
                      <span className="font-bold">{txn.txnNumber}</span>
                      <span className="text-[10px] text-gray-500 ml-1.5">({dateStr} {timeStr})</span>
                    </div>
                    <span className="font-bold">{formatCurrency(txn.grandTotalInCents, currency)}</span>
                  </div>
                );
              })}
            </div>

            {/* Items Section */}
            {breakdownMode === 'consolidated' ? (
              <div className="space-y-2 border-b border-dashed border-gray-400 pb-3 text-[11px]">
                <div className="flex justify-between font-bold text-gray-700 pb-1 border-b border-gray-200">
                  <span className="w-1/2">Product</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Amount</span>
                </div>
                {consolidatedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="w-1/2 truncate font-medium">{item.productName}</span>
                    <span className="w-1/6 text-center">{item.quantity}</span>
                    <span className="w-1/3 text-right font-bold">
                      {formatCurrency(item.totalLineAmountInCents, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 border-b border-dashed border-gray-400 pb-3 text-[11px]">
                {filteredTransactions.map((txn) => (
                  <div key={txn._id} className="space-y-1">
                    <div className="font-bold text-gray-800 bg-gray-100 p-1 rounded flex justify-between">
                      <span>{txn.txnNumber}</span>
                      <span>{formatCurrency(txn.grandTotalInCents, currency)}</span>
                    </div>
                    {(txn.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between pl-1">
                        <span className="truncate">{item.quantity}x {item.productNameSnapshot}</span>
                        <span>{formatCurrency(item.finalLineTotalInCents, currency)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Totals Summary */}
            <div className="space-y-1.5 text-[11px] pt-1">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-bold">{totalItemsCount} items</span>
              </div>
              <div className="flex justify-between text-base font-black pt-1.5 border-t-2 border-gray-800">
                <span>TOTAL BALANCE DUE:</span>
                <span>{formatCurrency(computedTotalDueInCents, currency)}</span>
              </div>
            </div>

            {/* Signature & Acknowledgement */}
            <div className="pt-4 border-t border-dashed border-gray-400 text-center space-y-4 text-[10px] text-gray-600">
              <div className="space-y-1 text-left pt-2">
                <div>Customer Signature: _______________________</div>
                <div className="text-[9px] text-gray-500 italic">I acknowledge receipt and agree to settle the balance shown above.</div>
              </div>
              <div className="text-center pt-2">
                <div>Thank you for your business!</div>
                <div>Please keep this statement for your records.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            Balance Due: <strong className="text-amber-400 text-base">{formatCurrency(computedTotalDueInCents, currency)}</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black flex items-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {printFormat === '80mm' ? '80mm Receipt' : 'Statement'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pure Print Output: Rendered only by browser print dialog */}
      <div
        id="printable-customer-statement"
        className="hidden print:block text-black bg-white font-mono leading-tight"
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{companyName}</div>
          {companyAddress && <div style={{ fontSize: '10px' }}>{companyAddress}</div>}
          {companyPhone && <div style={{ fontSize: '10px' }}>Tel: {companyPhone}</div>}
          <div style={{ fontSize: '10px', marginTop: '4px' }}>================================</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px', margin: '4px 0' }}>*** CUSTOMER STATEMENT / BILL ***</div>
          <div style={{ fontSize: '10px' }}>================================</div>
        </div>

        <div style={{ fontSize: '11px', marginBottom: '6px' }}>
          <div><strong>Customer:</strong> {customerName}</div>
          <div><strong>Date:</strong> {printDateStr} {printTimeStr}</div>
          <div><strong>Cashier:</strong> {user?.name || 'Staff'}</div>
          <div><strong>Scope:</strong> {filterMode === 'UNPAID' ? 'UNPAID TAB ONLY' : 'ALL ORDERS'}</div>
          <div>--------------------------------</div>
        </div>

        {/* Discrete Transactions List */}
        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>
            Orders Included ({filteredTransactions.length}):
          </div>
          {filteredTransactions.map((txn) => {
            const dateStr = new Date(txn.createdAt).toLocaleDateString();
            return (
              <div key={txn._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{txn.txnNumber} ({dateStr})</span>
                <span style={{ fontWeight: 'bold' }}>{formatCurrency(txn.grandTotalInCents, currency)}</span>
              </div>
            );
          })}
          <div>--------------------------------</div>
        </div>

        {/* Items Section */}
        {breakdownMode === 'consolidated' ? (
          <div style={{ fontSize: '11px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '2px' }}>
              <span style={{ width: '50%' }}>Item</span>
              <span style={{ width: '20%', textAlign: 'center' }}>Qty</span>
              <span style={{ width: '30%', textAlign: 'right' }}>Amount</span>
            </div>
            {consolidatedItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span style={{ width: '50%' }}>{item.productName}</span>
                <span style={{ width: '20%', textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ width: '30%', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(item.totalLineAmountInCents, currency)}
                </span>
              </div>
            ))}
            <div>--------------------------------</div>
          </div>
        ) : (
          <div style={{ fontSize: '11px', marginBottom: '6px' }}>
            {filteredTransactions.map((txn) => (
              <div key={txn._id} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', background: '#eee', padding: '2px' }}>
                  <span>{txn.txnNumber}</span>
                  <span>{formatCurrency(txn.grandTotalInCents, currency)}</span>
                </div>
                {(txn.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '2px 0' }}>
                    <span>{item.quantity}x {item.productNameSnapshot}</span>
                    <span>{formatCurrency(item.finalLineTotalInCents, currency)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div>--------------------------------</div>
          </div>
        )}

        {/* Totals Section */}
        <div style={{ fontSize: '11px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Items:</span>
            <span>{totalItemsCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px', borderTop: '1px solid black', paddingTop: '4px' }}>
            <span>TOTAL BALANCE DUE:</span>
            <span>{formatCurrency(computedTotalDueInCents, currency)}</span>
          </div>
        </div>

        <div style={{ fontSize: '10px', marginTop: '12px', borderTop: '1px dashed #888', paddingTop: '8px' }}>
          <div style={{ marginTop: '12px' }}>Customer Signature: ____________________</div>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div>Thank you for your visit!</div>
            <div>Please keep this statement for records.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
