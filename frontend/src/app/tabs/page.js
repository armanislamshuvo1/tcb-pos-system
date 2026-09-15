'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAxiosSecure } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Calendar,
  Layers,
  FileText,
  X,
  Package,
  Search
} from 'lucide-react';

export default function StaffTabsPage() {
  const axiosSecure = useAxiosSecure();
  const { currency } = useAuth();
  
  // Dual-view state: 'by_staff' | 'by_product'
  const [viewMode, setViewMode] = useState('by_staff');

  // Staff Tabs State
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [expandedItemKeys, setExpandedItemKeys] = useState({});

  // Product Tabs State (Search unpaid items by product name)
  const [productTabs, setProductTabs] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [expandedProductNames, setExpandedProductNames] = useState({});
  const [expandedProductAuditKeys, setExpandedProductAuditKeys] = useState({});

  // Settle Modal State
  const [settleModalStaff, setSettleModalStaff] = useState(null);
  const [staffTransactions, setStaffTransactions] = useState([]);
  const [selectedTxnIds, setSelectedTxnIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [settleLoading, setSettleLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchConsolidatedTabs = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get('/api/tabs/consolidated');
      if (res.data?.success) {
        setTabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tabs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabsByProduct = async (search = '') => {
    try {
      setProductLoading(true);
      const params = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const res = await axiosSecure.get('/api/tabs/by-product', { params });
      if (res.data?.success) {
        setProductTabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load product tabs:', err);
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidatedTabs();
  }, [axiosSecure]);

  // Real-time debounced query for product search view
  useEffect(() => {
    if (viewMode === 'by_product') {
      const timer = setTimeout(() => {
        fetchTabsByProduct(productSearchTerm);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [productSearchTerm, viewMode, axiosSecure]);

  const toggleStaffAccordion = (staffId) => {
    setExpandedStaffId(expandedStaffId === staffId ? null : staffId);
  };

  const toggleItemHistory = (key) => {
    setExpandedItemKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleProductAccordion = (productName) => {
    setExpandedProductNames((prev) => ({
      ...prev,
      [productName]: prev[productName] === false ? true : false
    }));
  };

  const toggleProductAudit = (key) => {
    setExpandedProductAuditKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Open Settle Modal and fetch discrete transactions
  const openSettleModal = async (staffId, staffName) => {
    try {
      setSettleLoading(true);
      setSettleModalStaff({ id: staffId, name: staffName });
      const res = await axiosSecure.get(`/api/tabs/staff/${staffId}/transactions`);
      if (res.data?.success) {
        const txns = res.data.data.transactions;
        setStaffTransactions(txns);
        // By default, select all open transactions
        setSelectedTxnIds(txns.map((t) => t._id));
      }
    } catch (err) {
      console.error('Error fetching staff transactions:', err);
    } finally {
      setSettleLoading(false);
    }
  };

  const handleToggleTxnSelect = (txnId) => {
    setSelectedTxnIds((prev) => 
      prev.includes(txnId) ? prev.filter((id) => id !== txnId) : [...prev, txnId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTxnIds.length === staffTransactions.length) {
      setSelectedTxnIds([]);
    } else {
      setSelectedTxnIds(staffTransactions.map((t) => t._id));
    }
  };

  // Execute whole-transaction settlement
  const handleExecuteSettlement = async () => {
    if (selectedTxnIds.length === 0) return;

    setSettleLoading(true);
    setFeedback(null);

    try {
      const res = await axiosSecure.post('/api/tabs/settle-transactions', {
        transactionIds: selectedTxnIds,
        paymentMethod
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Successfully settled ${res.data.data.settledCount} transaction(s) (${formatCurrency(res.data.data.totalSettledInCents, currency)}) via ${paymentMethod}`
        });
        // Refresh both views
        await fetchConsolidatedTabs();
        if (viewMode === 'by_product') {
          await fetchTabsByProduct(productSearchTerm);
        }
        setSettleModalStaff(null);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Settlement failed'
      });
    } finally {
      setSettleLoading(false);
    }
  };

  const totalOutstandingCents = tabs.reduce((acc, tab) => acc + tab.totalOwedInCents, 0);

  const selectedTotalInCents = staffTransactions
    .filter((t) => selectedTxnIds.includes(t._id))
    .reduce((acc, t) => acc + t.grandTotalInCents, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
              <Users className="w-7 h-7 text-amber-400" />
              <span>Staff Tab Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Consolidated product views with nested audit timestamps & whole-transaction settlements.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
              <div className="text-xs text-slate-400 font-semibold">Total Outstanding Tabs</div>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                {formatCurrency(totalOutstandingCents, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/80 border border-red-800 text-red-300'
          }`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewMode('by_staff')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                viewMode === 'by_staff'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>By Staff Member ({tabs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('by_product');
                if (productTabs.length === 0) {
                  fetchTabsByProduct(productSearchTerm);
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                viewMode === 'by_product'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Search Unpaid by Product ({productTabs.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium px-2 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live unpaid ledger (status: <strong className="text-amber-400 font-mono">UNPAID_TAB</strong>)</span>
          </div>
        </div>

        {/* View 1: Consolidated Staff Accordion List */}
        {viewMode === 'by_staff' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Loading consolidated staff tabs...
              </div>
            ) : tabs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">All Staff Tabs Clear!</h3>
                <p className="text-sm text-slate-400 mt-1">There are no outstanding unpaid tabs at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tabs.map((tab) => {
                  const isExpanded = expandedStaffId === tab._id;

                  return (
                    <div
                      key={tab._id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm"
                    >
                      {/* Staff Row Header */}
                      <div
                        onClick={() => toggleStaffAccordion(tab._id)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-white">{tab.staffName}</h2>
                            <span className="text-xs text-slate-400">
                              {tab.consolidatedItems?.length || 0} distinct items consumed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-400 font-medium">Balance Due</div>
                            <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono">
                              {formatCurrency(tab.totalOwedInCents, currency)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSettleModal(tab._id, tab.staffName);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Settle Tab</span>
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content: Consolidated Items */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/60 space-y-3">
                          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-amber-400" />
                            <span>Consolidated Itemized Breakdown</span>
                          </div>

                          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                            {tab.consolidatedItems.map((item, index) => {
                              const itemKey = `${tab._id}_${item.productId || index}`;
                              const isHistoryOpen = expandedItemKeys[itemKey];

                              return (
                                <div key={itemKey} className="p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <button
                                        type="button"
                                        onClick={() => toggleItemHistory(itemKey)}
                                        className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 transition"
                                        title="Inspect occurrence timestamps"
                                      >
                                        {isHistoryOpen ? (
                                          <ChevronDown className="w-4 h-4 text-amber-400" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-slate-400" />
                                        )}
                                      </button>

                                      <div>
                                        <div className="text-sm font-bold text-white">{item.productName}</div>
                                        <div className="text-xs text-slate-400">
                                          {item.totalQuantity}x @ {formatCurrency(item.unitPriceInCents, currency)}
                                          {item.totalDiscountInCents > 0 && (
                                            <span className="text-emerald-400 ml-2">
                                              (Disc: -{formatCurrency(item.totalDiscountInCents, currency)})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right font-mono font-bold text-white text-sm">
                                      {formatCurrency(item.totalAmountInCents, currency)}
                                    </div>
                                  </div>

                                  {/* Nested Occurrence Timestamps (Audit Trail) */}
                                  {isHistoryOpen && (
                                    <div className="ml-8 mt-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                                      <div className="font-semibold text-[11px] text-amber-400/90 mb-1 flex items-center space-x-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Individual Occurrences & Timestamps:</span>
                                      </div>
                                      {item.history.map((hist, hIdx) => {
                                        const dateObj = new Date(hist.takenAt);
                                        const dateStr = dateObj.toLocaleDateString();
                                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                          <div
                                            key={hIdx}
                                            className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0"
                                          >
                                            <span className="flex items-center space-x-2">
                                              <span className="font-mono text-amber-400">{hist.txnNumber}</span>
                                              <span className="text-slate-400">•</span>
                                              <span>{dateStr} at {timeStr}</span>
                                              <span className="text-slate-400">({hist.quantity}x)</span>
                                            </span>
                                            <span className="text-slate-400">
                                              Cashier: <strong>{hist.cashierName}</strong>
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: Search Unpaid by Product View */}
        {viewMode === 'by_product' && (
          <div className="space-y-4">
            {/* Search Input Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                placeholder="Search unpaid products by name (e.g., Cappuccino, Cold Brew, Latte, Sandwich)..."
                className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
              />
              {productSearchTerm && (
                <button
                  type="button"
                  onClick={() => setProductSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metrics & Context Bar */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
              <div>
                Showing <strong className="text-white">{productTabs.length}</strong> unpaid product line{productTabs.length === 1 ? '' : 's'}
                {productSearchTerm && <span> matching &ldquo;<span className="text-amber-400 font-semibold">{productSearchTerm}</span>&rdquo;</span>}
              </div>
              <div className="flex items-center space-x-3">
                <span>
                  Total Unpaid Units: <strong className="text-amber-400 font-mono text-sm">{productTabs.reduce((acc, p) => acc + p.totalUnpaidQuantity, 0)}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Value: <strong className="text-emerald-400 font-mono text-sm">{formatCurrency(productTabs.reduce((acc, p) => acc + p.totalUnpaidAmountInCents, 0), currency)}</strong>
                </span>
              </div>
            </div>

            {/* Product List */}
            {productLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Searching unpaid products...
              </div>
            ) : productTabs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">
                  {productSearchTerm ? 'No Unpaid Products Match Your Search' : 'All Product Tabs Clear!'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {productSearchTerm
                    ? `No staff members currently owe unpaid tabs for items matching "${productSearchTerm}".`
                    : 'There are no open unpaid items on any staff tab at this time.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productTabs.map((prod) => {
                  const isExpanded = expandedProductNames[prod.productName] !== false; // Default expanded

                  return (
                    <div
                      key={prod.productName}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition"
                    >
                      {/* Product Header */}
                      <div
                        onClick={() => toggleProductAccordion(prod.productName)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h2 className="text-base sm:text-lg font-bold text-white">
                                {prod.productName}
                              </h2>
                              {prod.categoryName && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                                  {prod.categoryName}
                                </span>
                              )}
                              {prod.sku && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800">
                                  {prod.sku}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Taken by <strong className="text-slate-300">{prod.staffBreakdown?.length || 0}</strong> staff member{(prod.staffBreakdown?.length || 0) === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold mb-1">
                              {prod.totalUnpaidQuantity} {prod.totalUnpaidQuantity === 1 ? 'unit' : 'units'} unpaid
                            </div>
                            <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                              {formatCurrency(prod.totalUnpaidAmountInCents, currency)}
                            </div>
                          </div>

                          <div className="text-slate-400">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Staff Breakdown Accordion Content */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/60 space-y-3">
                          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
                            <Users className="w-4 h-4 text-amber-400" />
                            <span>Staff Breakdown for {prod.productName}</span>
                          </div>

                          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                            {prod.staffBreakdown.map((staff, idx) => {
                              const auditKey = `${prod.productName}_${staff.staffMemberId || idx}`;
                              const isAuditOpen = expandedProductAuditKeys[auditKey];

                              return (
                                <div key={auditKey} className="p-3.5 space-y-2.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/20">
                                        {staff.staffName?.[0]?.toUpperCase() || 'S'}
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-white flex items-center space-x-2">
                                          <span>{staff.staffName}</span>
                                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                                            {staff.quantity}x taken
                                          </span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          Subtotal: <strong className="text-slate-200">{formatCurrency(staff.totalAmountInCents, currency)}</strong>
                                          {staff.discountInCents > 0 && (
                                            <span className="text-emerald-400 ml-2">
                                              (Disc: -{formatCurrency(staff.discountInCents, currency)})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                                      <button
                                        type="button"
                                        onClick={() => toggleProductAudit(auditKey)}
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition border border-slate-700"
                                      >
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Audit Trail ({staff.occurrences?.length || 0})</span>
                                        {isAuditOpen ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronRight className="w-3.5 h-3.5 ml-1" />}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => openSettleModal(staff.staffMemberId, staff.staffName)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center space-x-1"
                                      >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>Settle Staff Tab</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Nested Discrete Occurrence Timestamps */}
                                  {isAuditOpen && staff.occurrences && (
                                    <div className="ml-0 sm:ml-12 p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
                                      <div className="font-semibold text-[11px] text-amber-400/90 mb-1 flex items-center space-x-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Discrete Taking Timestamps for {staff.staffName}:</span>
                                      </div>
                                      {staff.occurrences.map((occ, oIdx) => {
                                        const dateObj = new Date(occ.takenAt);
                                        const dateStr = dateObj.toLocaleDateString();
                                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                          <div
                                            key={oIdx}
                                            className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0"
                                          >
                                            <span className="flex items-center space-x-2">
                                              <span className="font-mono text-amber-400 font-semibold">{occ.txnNumber}</span>
                                              <span className="text-slate-400">•</span>
                                              <span>{dateStr} at {timeStr}</span>
                                              <span className="text-amber-300 font-bold font-mono">({occ.quantity}x)</span>
                                            </span>
                                            <span className="text-slate-400 text-[11px]">
                                              Cashier: <strong className="text-slate-200">{occ.cashierName}</strong>
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Discrete Transaction Settlement Modal */}
        {settleModalStaff && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Settle Transactions: {settleModalStaff.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select the discrete transactions to settle (whole transaction units).
                  </p>
                </div>
                <button
                  onClick={() => setSettleModalStaff(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transactions List with Checkboxes */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="font-bold text-amber-400 hover:underline"
                  >
                    {selectedTxnIds.length === staffTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span>{staffTransactions.length} open transactions</span>
                </div>

                {staffTransactions.map((txn) => {
                  const isSelected = selectedTxnIds.includes(txn._id);
                  const dateStr = new Date(txn.createdAt).toLocaleDateString();
                  const timeStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={txn._id}
                      onClick={() => handleToggleTxnSelect(txn._id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500/80 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container click
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                        />
                        <div>
                          <div className="font-mono font-bold text-amber-400 text-sm">{txn.txnNumber}</div>
                          <div className="text-xs text-slate-400">
                            {dateStr} {timeStr} • {txn.items?.length || 0} items
                          </div>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-sm">
                        {formatCurrency(txn.grandTotalInCents, currency)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400">Payment Method:</div>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'CARD', 'PAYROLL_DEDUCTION'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        paymentMethod === method
                          ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer / Settlement CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400">Selected ({selectedTxnIds.length} txns):</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(selectedTotalInCents, currency)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSettleModalStaff(null)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={settleLoading || selectedTxnIds.length === 0}
                    onClick={handleExecuteSettlement}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
                  >
                    {settleLoading ? 'Settling...' : `Settle Selected (${formatCurrency(selectedTotalInCents, currency)})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
