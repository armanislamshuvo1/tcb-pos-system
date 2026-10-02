'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import {
  Printer,
  X,
  FileText,
  Receipt,
  User,
  CheckCircle,
  Clock,
  Sparkles,
  Building2,
  CheckSquare
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
  const [isPrinting, setIsPrinting] = useState(false);

  // Print layout format: 'statement' (A4) | '80mm' (Thermal receipt)
  const [printFormat, setPrintFormat] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_customer_bill_print_format') || 'statement';
    }
    return 'statement';
  });

  // Breakdown mode: 'consolidated' | 'detailed'
  const [breakdownMode, setBreakdownMode] = useState('consolidated');
  // Filter mode: 'UNPAID' | 'ALL'
  const [filterMode, setFilterMode] = useState(initialFilter);

  const handleFormatChange = (fmt) => {
    setPrintFormat(fmt);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_customer_bill_print_format', fmt);
    }
  };

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

  const companyName = company?.branding?.displayName || company?.name || 'PoS System';
  const companyAddress = company?.address || '';
  const companyPhone = company?.contactPhone || '';
  const companyEmail = company?.email || '';
  const printDateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const printTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Resolve current logged in staff name from AuthContext user object or fallback storage
  const loggedInStaffName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;
    if (user?.employeeCode) return `Staff (${user.employeeCode})`;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.fullName) return parsed.fullName;
          if (parsed?.name) return parsed.name;
          if (parsed?.employeeCode) return `Staff (${parsed.employeeCode})`;
        }
      } catch (e) {
        // ignore
      }
    }
    return 'Staff';
  }, [user]);

  // Standalone HTML template for A4 Single-Page Statement
  const getA4Html = () => {
    const itemsTableHtml =
      breakdownMode === 'consolidated'
        ? `
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 48%;">Product Description</th>
              <th class="text-center" style="width: 14%;">Qty</th>
              <th class="text-right" style="width: 18%;">Unit Price</th>
              <th class="text-right" style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${consolidatedItems
              .map(
                (item) => `
              <tr>
                <td class="font-bold">${item.productName}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right font-mono">${formatCurrency(item.unitPriceInCents, currency)}</td>
                <td class="text-right font-mono font-bold">${formatCurrency(item.totalLineAmountInCents, currency)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
        : `
        <div class="detailed-orders-wrap">
          ${filteredTransactions
            .map((txn) => {
              const dStr = new Date(txn.createdAt).toLocaleDateString();
              const tStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return `
              <div class="order-box">
                <div class="order-box-header">
                  <span><strong>${txn.txnNumber}</strong> &bull; <small>${dStr} ${tStr}</small></span>
                  <span class="font-mono font-bold">${formatCurrency(txn.grandTotalInCents, currency)}</span>
                </div>
                <table class="data-table" style="margin-bottom: 0;">
                  <tbody>
                    ${(txn.items || [])
                      .map(
                        (item) => `
                      <tr>
                        <td style="width: 50%;">${item.productNameSnapshot || 'Product'}</td>
                        <td class="text-center" style="width: 14%;">${item.quantity || 1}</td>
                        <td class="text-right font-mono" style="width: 18%;">${formatCurrency(item.unitPriceInCents || 0, currency)}</td>
                        <td class="text-right font-mono font-bold" style="width: 18%;">${formatCurrency(item.finalLineTotalInCents || 0, currency)}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `;
            })
            .join('')}
        </div>
      `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Customer Statement - ${customerName || 'Account'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 11px;
              line-height: 1.35;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .statement-page {
              width: 100%;
              max-width: 100%;
              page-break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .company-info h1 {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .company-info p {
              font-size: 10px;
              color: #475569;
              line-height: 1.3;
            }
            .statement-badge-box {
              text-align: right;
            }
            .statement-badge {
              display: inline-block;
              background: #0f172a;
              color: #ffffff;
              padding: 4px 10px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              border-radius: 4px;
              margin-bottom: 3px;
            }
            .statement-meta-text {
              font-size: 10px;
              color: #475569;
            }
            .meta-grid {
              display: flex;
              gap: 12px;
              margin-bottom: 10px;
            }
            .meta-card {
              flex: 1;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 10px;
            }
            .meta-card-title {
              font-size: 9.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
              margin-bottom: 5px;
            }
            .meta-card-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 10.5px;
            }
            .meta-card-row strong {
              color: #0f172a;
            }
            .balance-card {
              background: #fffbeb;
              border: 1.5px solid #f59e0b;
            }
            .balance-card .meta-card-title {
              color: #b45309;
              border-bottom-color: #fde68a;
            }
            .balance-amount {
              font-size: 16px;
              font-weight: 800;
              color: #b45309;
              font-family: monospace;
            }
            .section-heading {
              font-size: 10.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #334155;
              margin-bottom: 4px;
              display: flex;
              justify-content: space-between;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 10.5px;
            }
            .data-table th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              text-align: left;
              padding: 4px 6px;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              font-size: 9.5px;
              text-transform: uppercase;
            }
            .data-table td {
              padding: 4px 6px;
              border-bottom: 1px solid #f1f5f9;
              color: #1e293b;
            }
            .data-table tr:last-child td {
              border-bottom: 1px solid #cbd5e1;
            }
            .detailed-orders-wrap .order-box {
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              margin-bottom: 6px;
              overflow: hidden;
            }
            .detailed-orders-wrap .order-box-header {
              background: #f1f5f9;
              padding: 3px 6px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .font-bold { font-weight: 700; }
            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 10px;
            }
            .summary-box {
              width: 250px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 6px 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 10.5px;
            }
            .summary-row.grand-total {
              border-top: 1.5px solid #0f172a;
              padding-top: 4px;
              margin-top: 3px;
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
            }
            .signature-section {
              display: flex;
              gap: 20px;
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px dashed #cbd5e1;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .signature-box {
              flex: 1;
              font-size: 10px;
              color: #475569;
            }
            .signature-line {
              margin-top: 22px;
              border-top: 1px solid #0f172a;
              padding-top: 3px;
              font-weight: 600;
              color: #0f172a;
            }
            .footer-note {
              text-align: center;
              font-size: 9.5px;
              color: #64748b;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="statement-page">
            <!-- Header Row -->
            <div class="header-row">
              <div class="company-info">
                <h1>${companyName}</h1>
                ${companyAddress ? `<p>${companyAddress}</p>` : ''}
                ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}
                ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
              </div>
              <div class="statement-badge-box">
                <div class="statement-badge">Customer Account Statement</div>
                <div class="statement-meta-text">Date: <strong>${printDateStr} ${printTimeStr}</strong></div>
                <div class="statement-meta-text">Prepared By: <strong>${loggedInStaffName}</strong></div>
              </div>
            </div>

            <!-- Meta Cards -->
            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-card-title">Customer Details</div>
                <div class="meta-card-row">
                  <span>Customer Name:</span>
                  <strong>${customerName}</strong>
                </div>
                <div class="meta-card-row">
                  <span>Billing Scope:</span>
                  <strong>${filterMode === 'UNPAID' ? 'UNPAID ORDERS ONLY' : 'ALL ORDERS'}</strong>
                </div>
                <div class="meta-card-row">
                  <span>Orders Included:</span>
                  <strong>${filteredTransactions.length} transaction(s)</strong>
                </div>
              </div>

              <div class="meta-card balance-card">
                <div class="meta-card-title">Account Balance Summary</div>
                <div class="meta-card-row">
                  <span>Total Line Items:</span>
                  <strong>${totalItemsCount} items</strong>
                </div>
                <div class="meta-card-row" style="align-items: baseline; margin-top: 2px;">
                  <span>Balance Due:</span>
                  <span class="balance-amount">${formatCurrency(computedTotalDueInCents, currency)}</span>
                </div>
              </div>
            </div>

            <!-- Included Transactions Table -->
            <div class="section-heading">
              <span>Included Transactions (${filteredTransactions.length})</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 32%;">Transaction No.</th>
                  <th style="width: 36%;">Date & Time</th>
                  <th class="text-center" style="width: 14%;">Status</th>
                  <th class="text-right" style="width: 18%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions
                  .map((txn) => {
                    const dStr = new Date(txn.createdAt).toLocaleDateString();
                    const tStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return `
                    <tr>
                      <td class="font-mono font-bold">${txn.txnNumber}</td>
                      <td>${dStr} ${tStr}</td>
                      <td class="text-center"><span style="font-size: 9px; font-weight: 700; color: ${txn.status === 'UNPAID_TAB' ? '#b45309' : '#047857'};">${txn.status}</span></td>
                      <td class="text-right font-mono font-bold">${formatCurrency(txn.grandTotalInCents, currency)}</td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>

            <!-- Items Table -->
            <div class="section-heading" style="margin-top: 6px;">
              <span>Purchased Items (${breakdownMode === 'consolidated' ? 'Consolidated Breakdown' : 'Per-Order Breakdown'})</span>
              <span style="font-size: 9.5px; font-weight: normal; color: #64748b;">${totalItemsCount} total units</span>
            </div>
            ${itemsTableHtml}

            <!-- Grand Total Block -->
            <div class="summary-container">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Total Orders:</span>
                  <strong>${filteredTransactions.length}</strong>
                </div>
                <div class="summary-row">
                  <span>Total Units Sold:</span>
                  <strong>${totalItemsCount}</strong>
                </div>
                <div class="summary-row grand-total">
                  <span>TOTAL BALANCE DUE:</span>
                  <span class="font-mono">${formatCurrency(computedTotalDueInCents, currency)}</span>
                </div>
              </div>
            </div>

            <!-- Signatures Section -->
            <div class="signature-section">
              <div class="signature-box">
                <div>Customer Signature:</div>
                <div class="signature-line">${customerName}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">I confirm receipt and agree to settle the total balance due above.</div>
              </div>
              <div class="signature-box">
                <div>Authorized Cashier / Staff:</div>
                <div class="signature-line">${loggedInStaffName}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Statement printed on: ${printDateStr}</div>
              </div>
            </div>

            <div class="footer-note">
              Thank you for your business! &bull; Please keep this statement for your accounting records.
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Standalone HTML template for 80mm Thermal Receipt
  const get80mmHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Customer Bill - ${customerName || 'Statement'}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: monospace;
              font-size: 11px;
              line-height: 1.25;
              color: #000;
              background: #fff;
              padding: 4mm;
              width: 80mm;
              max-width: 80mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 4px 0; }
            .double-divider { border-bottom: 2px dashed #000; margin: 5px 0; }
            .flex-between { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div style="font-size: 15px; font-weight: bold;">${companyName}</div>
            ${companyAddress ? `<div style="font-size: 10px;">${companyAddress}</div>` : ''}
            ${companyPhone ? `<div style="font-size: 10px;">Tel: ${companyPhone}</div>` : ''}
            <div class="double-divider"></div>
            <div style="font-size: 12px; font-weight: bold; margin: 3px 0;">*** CUSTOMER STATEMENT / BILL ***</div>
            <div class="double-divider"></div>
          </div>

          <div style="font-size: 11px; margin: 4px 0;">
            <div class="flex-between"><span>Customer:</span><strong>${customerName}</strong></div>
            <div class="flex-between"><span>Date:</span><span>${printDateStr} ${printTimeStr}</span></div>
            <div class="flex-between"><span>Prepared By:</span><span>${loggedInStaffName}</span></div>
            <div class="flex-between"><span>Scope:</span><strong>${filterMode === 'UNPAID' ? 'UNPAID TAB ONLY' : 'ALL ORDERS'}</strong></div>
            <div class="divider"></div>
          </div>

          <div style="font-size: 10px; margin-bottom: 4px;">
            <div class="font-bold" style="text-transform: uppercase;">Orders Included (${filteredTransactions.length}):</div>
            ${filteredTransactions
              .map((txn) => {
                const dStr = new Date(txn.createdAt).toLocaleDateString();
                return `
                <div class="flex-between" style="margin: 1px 0;">
                  <span>${txn.txnNumber} (${dStr})</span>
                  <strong>${formatCurrency(txn.grandTotalInCents, currency)}</strong>
                </div>
              `;
              })
              .join('')}
            <div class="divider"></div>
          </div>

          <div style="font-size: 11px; margin-bottom: 4px;">
            ${
              breakdownMode === 'consolidated'
                ? `
              <div class="flex-between font-bold" style="border-bottom: 1px solid #000; padding-bottom: 2px;">
                <span style="width: 50%;">Item</span>
                <span style="width: 20%; text-align: center;">Qty</span>
                <span style="width: 30%; text-align: right;">Amount</span>
              </div>
              ${consolidatedItems
                .map(
                  (item) => `
                <div class="flex-between" style="margin: 2px 0;">
                  <span style="width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.productName}</span>
                  <span style="width: 20%; text-align: center;">${item.quantity}</span>
                  <span style="width: 30%; text-align: right; font-weight: bold;">${formatCurrency(item.totalLineAmountInCents, currency)}</span>
                </div>
              `
                )
                .join('')}
            `
                : `
              ${filteredTransactions
                .map(
                  (txn) => `
                <div style="margin-bottom: 4px;">
                  <div class="flex-between font-bold" style="background: #eee; padding: 2px;">
                    <span>${txn.txnNumber}</span>
                    <span>${formatCurrency(txn.grandTotalInCents, currency)}</span>
                  </div>
                  ${(txn.items || [])
                    .map(
                      (item) => `
                    <div class="flex-between" style="font-size: 10px; margin: 1px 0; padding-left: 4px;">
                      <span>${item.quantity}x ${item.productNameSnapshot}</span>
                      <span>${formatCurrency(item.finalLineTotalInCents, currency)}</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                )
                .join('')}
            `
            }
            <div class="divider"></div>
          </div>

          <div style="font-size: 11px; margin-bottom: 6px;">
            <div class="flex-between">
              <span>Total Items:</span>
              <strong>${totalItemsCount} items</strong>
            </div>
            <div class="flex-between font-bold" style="font-size: 14px; border-top: 2px solid #000; padding-top: 4px; margin-top: 3px;">
              <span>TOTAL DUE:</span>
              <span>${formatCurrency(computedTotalDueInCents, currency)}</span>
            </div>
          </div>

          <div style="font-size: 10px; margin-top: 10px; border-top: 1px dashed #888; padding-top: 6px;">
            <div style="margin-top: 10px;">Customer Signature: __________________</div>
            <div class="text-center" style="margin-top: 10px; font-size: 9px; color: #555;">
              <div>Thank you for your visit!</div>
              <div>Please keep this statement for records.</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Isolated Single-Page Iframe Print Handler
  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1000px';
    iframe.style.height = '1000px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const htmlContent = printFormat === 'statement' ? getA4Html() : get80mmHtml();

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Customer statement print failed:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          setIsPrinting(false);
        }, 800);
      }
    }, 250);
  };

  const handlePrintRef = useRef(handlePrint);
  useEffect(() => {
    handlePrintRef.current = handlePrint;
  });

  // Keyboard shortcut listeners: Escape to close, Ctrl+P to trigger clean single-page print
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && isOpen) {
        e.preventDefault();
        handlePrintRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Click outside backdrop handler */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Dialog Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 print:hidden">
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
                Customer: <strong className="text-amber-300">{customerName}</strong> &bull; {filteredTransactions.length} transaction(s)
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
          {/* Filter Scope */}
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

          {/* Paper Format: A4 vs 80mm */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Paper:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => handleFormatChange('statement')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  printFormat === 'statement'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Statement</span>
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('80mm')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  printFormat === '80mm'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </button>
            </div>
          </div>

          {/* Breakdown: Consolidated vs Per-order */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Items:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setBreakdownMode('consolidated')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  breakdownMode === 'consolidated'
                    ? 'bg-slate-700 text-white font-bold'
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
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Per Order
              </button>
            </div>
          </div>
        </div>

        {/* Paper format status pill */}
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {printFormat === 'statement' ? (
                <>Printing mode: <strong className="text-emerald-400">A4 Single Page Format (Guaranteed 1 Sheet)</strong></>
              ) : (
                <>Printing mode: <strong className="text-amber-400">80mm Continuous Thermal Roll</strong></>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {filteredTransactions.length} txn(s) &bull; {totalItemsCount} item(s)
          </span>
        </div>

        {/* Scrollable Receipt / Statement Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80 flex justify-center">
          {printFormat === 'statement' ? (
            /* A4 Statement Preview */
            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl w-full max-w-3xl text-xs space-y-5 border border-slate-300">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">{companyName}</h3>
                  {companyAddress && <p className="text-slate-600 text-[11px] mt-0.5">{companyAddress}</p>}
                  {companyPhone && <p className="text-slate-600 text-[11px]">Tel: {companyPhone}</p>}
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-wider">
                    Customer Statement
                  </span>
                  <p className="text-slate-600 text-[11px] mt-1">Date: <strong>{printDateStr} {printTimeStr}</strong></p>
                  <p className="text-slate-600 text-[11px]">Prepared By: <strong>{loggedInStaffName}</strong></p>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-1">
                    Customer Details
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Customer:</span>
                    <strong className="text-slate-900 font-bold">{customerName}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Scope:</span>
                    <span className="font-bold text-amber-700">{filterMode === 'UNPAID' ? 'UNPAID ORDERS ONLY' : 'ALL ORDERS'}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Included Orders:</span>
                    <strong>{filteredTransactions.length} transaction(s)</strong>
                  </div>
                </div>

                <div className="bg-amber-50/70 border-1.5 border-amber-400 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 border-b border-amber-200 pb-1 mb-1">
                    Balance Summary
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Total Items:</span>
                    <strong>{totalItemsCount} units</strong>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-slate-700 font-bold text-xs">Total Balance Due:</span>
                    <span className="text-lg font-black text-amber-600 font-mono">
                      {formatCurrency(computedTotalDueInCents, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Included Transactions */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex justify-between">
                  <span>Included Transactions</span>
                  <span className="text-slate-500 font-normal">{filteredTransactions.length} orders</span>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 text-[10px] uppercase">
                      <th className="py-1 px-2 text-left font-bold">Transaction No.</th>
                      <th className="py-1 px-2 text-left font-bold">Date & Time</th>
                      <th className="py-1 px-2 text-center font-bold">Status</th>
                      <th className="py-1 px-2 text-right font-bold">Order Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((txn) => {
                      const dStr = new Date(txn.createdAt).toLocaleDateString();
                      const tStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <tr key={txn._id} className="hover:bg-slate-50/60">
                          <td className="py-1.5 px-2 font-mono font-bold">{txn.txnNumber}</td>
                          <td className="py-1.5 px-2 text-slate-600">{dStr} {tStr}</td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              txn.status === 'UNPAID_TAB' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                            {formatCurrency(txn.grandTotalInCents, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Items Breakdown */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex justify-between">
                  <span>Items Summary ({breakdownMode === 'consolidated' ? 'Consolidated' : 'Per Order'})</span>
                  <span className="text-slate-500 font-normal">{totalItemsCount} units</span>
                </div>
                {breakdownMode === 'consolidated' ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 text-[10px] uppercase">
                        <th className="py-1 px-2 text-left font-bold">Product</th>
                        <th className="py-1 px-2 text-center font-bold">Qty</th>
                        <th className="py-1 px-2 text-right font-bold">Unit Price</th>
                        <th className="py-1 px-2 text-right font-bold">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consolidatedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-1 px-2 font-semibold text-slate-900">{item.productName}</td>
                          <td className="py-1 px-2 text-center font-mono">{item.quantity}</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-600">{formatCurrency(item.unitPriceInCents, currency)}</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatCurrency(item.totalLineAmountInCents, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="space-y-2">
                    {filteredTransactions.map((txn) => (
                      <div key={txn._id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-2 py-1 flex justify-between items-center text-[11px] font-bold">
                          <span>{txn.txnNumber}</span>
                          <span className="font-mono">{formatCurrency(txn.grandTotalInCents, currency)}</span>
                        </div>
                        <div className="p-2 space-y-1">
                          {(txn.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span>{item.quantity}x {item.productNameSnapshot}</span>
                              <span className="font-mono font-bold">{formatCurrency(item.finalLineTotalInCents, currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Block */}
              <div className="flex justify-end">
                <div className="w-64 bg-slate-50 border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Orders:</span>
                    <strong>{filteredTransactions.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Units:</span>
                    <strong>{totalItemsCount}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 font-black text-sm">
                    <span>BALANCE DUE:</span>
                    <span className="text-amber-600 font-mono">{formatCurrency(computedTotalDueInCents, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-slate-300 text-xs">
                <div>
                  <p className="text-slate-600">Customer Signature:</p>
                  <div className="mt-6 border-t border-slate-900 pt-1 font-bold text-slate-900">{customerName}</div>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">I acknowledge and agree to settle the balance shown above.</p>
                </div>
                <div>
                  <p className="text-slate-600">Authorized Staff:</p>
                  <div className="mt-6 border-t border-slate-900 pt-1 font-bold text-slate-900">{loggedInStaffName}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Printed: {printDateStr}</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-1">
                Thank you for your business! &bull; Please keep this statement for your financial records.
              </div>
            </div>
          ) : (
            /* 80mm Thermal Receipt Preview */
            <div className="bg-white text-black p-6 rounded-2xl shadow-xl font-mono text-xs space-y-4 w-full max-w-[340px]">
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
                  <span>Prepared By:</span>
                  <span>{loggedInStaffName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scope:</span>
                  <span className="font-bold">{filterMode === 'UNPAID' ? 'UNPAID TAB ONLY' : 'ALL ORDERS'}</span>
                </div>
              </div>

              {/* Included Transactions List */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
                <div className="font-bold text-gray-700 uppercase tracking-wide">Included Orders ({filteredTransactions.length})</div>
                {filteredTransactions.map((txn) => {
                  const dateStr = new Date(txn.createdAt).toLocaleDateString();
                  return (
                    <div key={txn._id} className="flex justify-between items-center py-0.5">
                      <div>
                        <span className="font-bold">{txn.txnNumber}</span>
                        <span className="text-[10px] text-gray-500 ml-1">({dateStr})</span>
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

              {/* Signature */}
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
          )}
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
              disabled={isPrinting}
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black flex items-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isPrinting
                  ? 'Preparing Print...'
                  : printFormat === 'statement'
                  ? 'Print A4 Statement (1 Sheet)'
                  : 'Print 80mm Receipt'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
