'use client';

import React from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function PrintableReceipt({ transaction, company, currency, onClose }) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = transaction.createdAt 
    ? new Date(transaction.createdAt).toLocaleString()
    : new Date().toLocaleString();

  const companyName = company?.branding?.displayName || company?.name || 'PoS System';
  const companyAddress = company?.address || '';
  const companyPhone = company?.contactPhone || '';

  return (
    <>
      {/* On-screen Modal Dialog */}
      <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 print:hidden animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Receipt Ready</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thermal Receipt Preview Card */}
          <div className="flex-1 overflow-y-auto bg-white text-black p-5 rounded-2xl font-mono text-xs shadow-inner space-y-3">
            <div className="text-center space-y-0.5">
              <div className="text-base font-black tracking-wider uppercase">{companyName}</div>
              {companyAddress && <div className="text-[11px] text-gray-600">{companyAddress}</div>}
              {companyPhone && <div className="text-[11px] text-gray-600">Tel: {companyPhone}</div>}
              <div className="text-[11px] text-gray-500 pt-1">*** POINT OF SALE RECEIPT ***</div>
            </div>

            <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>TXN:</span>
                <span className="font-bold">{transaction.txnNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{transaction.cashierNameSnapshot || 'Staff'}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold">{transaction.customerName}</span>
                </div>
              )}
              {transaction.roomNumber && (
                <div className="flex justify-between">
                  <span>Room Bill:</span>
                  <span className="font-bold">{transaction.roomNumber} {transaction.guestName ? `(${transaction.guestName})` : ''}</span>
                </div>
              )}
              {transaction.staffNameSnapshot && (
                <div className="flex justify-between">
                  <span>Staff Tab:</span>
                  <span className="font-bold">{transaction.staffNameSnapshot}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="border-t border-b border-dashed border-gray-400 py-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold text-gray-700 pb-1 border-b border-gray-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>

              {(transaction.items || []).map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="w-1/2 truncate font-medium">{item.productNameSnapshot}</span>
                    <span className="w-1/6 text-center">{item.quantity}</span>
                    <span className="w-1/3 text-right font-bold">
                      {formatCurrency(item.finalLineTotalInCents, currency)}
                    </span>
                  </div>
                  {item.lineDiscountInCents > 0 && (
                    <div className="flex justify-between text-[10px] text-red-600 pl-2">
                      <span>Discount ({item.lineDiscountType === 'percentage' ? `${item.lineDiscountValue}%` : 'Promo'})</span>
                      <span>-{formatCurrency(item.lineDiscountInCents, currency)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotalInCents, currency)}</span>
              </div>

              {(transaction.totalDiscountInCents > 0 || transaction.globalDiscountInCents > 0) && (
                <div className="flex justify-between text-red-600">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(transaction.totalDiscountInCents || transaction.globalDiscountInCents, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(transaction.grandTotalInCents, currency)}</span>
              </div>

              <div className="flex justify-between pt-1 font-bold">
                <span>Payment Method:</span>
                <span className="uppercase">{transaction.paymentMethod?.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold">{transaction.status}</span>
              </div>
            </div>

            {transaction.notes && (
              <div className="border-t border-dashed border-gray-300 pt-1.5 text-[10px] text-gray-600 italic">
                Note: {transaction.notes}
              </div>
            )}

            <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[10px] text-gray-500 space-y-0.5">
              <div>Thank you for your visit!</div>
              <div>Please keep this receipt for records.</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              Close & Continue
            </button>
          </div>
        </div>
      </div>

      {/* Pure Print Output: Rendered only by browser print dialog */}
      <div id="printable-receipt" className="hidden print:block text-black bg-white font-mono text-[12px] p-2 leading-tight w-[80mm] max-w-[80mm]">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 4mm;
              margin: 0;
              background: white;
              color: black;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}} />

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{companyName}</div>
          {companyAddress && <div style={{ fontSize: '10px' }}>{companyAddress}</div>}
          {companyPhone && <div style={{ fontSize: '10px' }}>Tel: {companyPhone}</div>}
          <div style={{ fontSize: '10px', marginTop: '4px' }}>================================</div>
        </div>

        <div style={{ fontSize: '11px', marginBottom: '6px' }}>
          <div>TXN: {transaction.txnNumber}</div>
          <div>Date: {formattedDate}</div>
          <div>Cashier: {transaction.cashierNameSnapshot || 'Staff'}</div>
          {transaction.customerName && <div>Customer: {transaction.customerName}</div>}
          {transaction.roomNumber && <div>Room: {transaction.roomNumber} {transaction.guestName ? `(${transaction.guestName})` : ''}</div>}
          {transaction.staffNameSnapshot && <div>Staff Tab: {transaction.staffNameSnapshot}</div>}
          <div>--------------------------------</div>
        </div>

        <div style={{ fontSize: '11px', marginBottom: '6px' }}>
          {(transaction.items || []).map((item, idx) => (
            <div key={idx} style={{ marginBottom: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.quantity}x {item.productNameSnapshot}</span>
                <span style={{ fontWeight: 'bold' }}>{formatCurrency(item.finalLineTotalInCents, currency)}</span>
              </div>
              {item.lineDiscountInCents > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span>  * Disc:</span>
                  <span>-{formatCurrency(item.lineDiscountInCents, currency)}</span>
                </div>
              )}
            </div>
          ))}
          <div>--------------------------------</div>
        </div>

        <div style={{ fontSize: '11px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(transaction.subtotalInCents, currency)}</span>
          </div>
          {(transaction.totalDiscountInCents > 0 || transaction.globalDiscountInCents > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Discount:</span>
              <span>-{formatCurrency(transaction.totalDiscountInCents || transaction.globalDiscountInCents, currency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '3px' }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(transaction.grandTotalInCents, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span>Payment:</span>
            <span>{transaction.paymentMethod?.replace('_', ' ')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Status:</span>
            <span>{transaction.status}</span>
          </div>
        </div>

        {transaction.notes && (
          <div style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '6px' }}>
            Note: {transaction.notes}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px' }}>
          <div>================================</div>
          <div>Thank you for your visit!</div>
        </div>
      </div>
    </>
  );
}
