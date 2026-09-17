'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  BedDouble,
  UserCheck,
  Building
} from 'lucide-react';
import { ROOM_WINGS, isDormRoom, getRoomByNumber } from '../../utils/rooms';

export default function StaffTabsPage() {
  const axiosSecure = useAxiosSecure();
  const { currency } = useAuth();
  
  // Tri-view state: 'by_customer' | 'by_room' | 'by_staff' | 'by_product'
  const [viewMode, setViewMode] = useState('by_customer');

  // Customer Tabs State (Customer bills)
  const [customerTabs, setCustomerTabs] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [expandedCustomerKeys, setExpandedCustomerKeys] = useState({});
  const [expandedCustomerItemKeys, setExpandedCustomerItemKeys] = useState({});

  // Customer Settle Modal State
  const [settleModalCustomer, setSettleModalCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [selectedCustomerTxnIds, setSelectedCustomerTxnIds] = useState([]);
  const [customerPaymentMethod, setCustomerPaymentMethod] = useState('CASH');
  const [customerSettleLoading, setCustomerSettleLoading] = useState(false);

  // Staff Tabs State
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [expandedItemKeys, setExpandedItemKeys] = useState({});

  // Room Tabs State (Customer room bills)
  const [roomTabs, setRoomTabs] = useState([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [expandedRoomKeys, setExpandedRoomKeys] = useState({});
  const [expandedRoomItemKeys, setExpandedRoomItemKeys] = useState({});

  // Product Tabs State (Search unpaid items by product name)
  const [productTabs, setProductTabs] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [expandedProductNames, setExpandedProductNames] = useState({});
  const [expandedProductAuditKeys, setExpandedProductAuditKeys] = useState({});

  // Staff Settle Modal State
  const [settleModalStaff, setSettleModalStaff] = useState(null);
  const [staffTransactions, setStaffTransactions] = useState([]);
  const [selectedTxnIds, setSelectedTxnIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [settleLoading, setSettleLoading] = useState(false);

  // Room Settle Modal State
  const [settleModalRoom, setSettleModalRoom] = useState(null);
  const [roomTransactions, setRoomTransactions] = useState([]);
  const [selectedRoomTxnIds, setSelectedRoomTxnIds] = useState([]);
  const [roomPaymentMethod, setRoomPaymentMethod] = useState('CASH');
  const [roomSettleLoading, setRoomSettleLoading] = useState(false);

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

  const fetchRoomTabs = async (search = '') => {
    try {
      setRoomLoading(true);
      const params = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const res = await axiosSecure.get('/api/tabs/rooms', { params });
      if (res.data?.success) {
        setRoomTabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load room tabs:', err);
    } finally {
      setRoomLoading(false);
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

  const fetchCustomerTabs = async (search = '') => {
    try {
      setCustomerLoading(true);
      const params = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const res = await axiosSecure.get('/api/tabs/customers', { params });
      if (res.data?.success) {
        setCustomerTabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customer tabs:', err);
    } finally {
      setCustomerLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerTabs();
    fetchConsolidatedTabs();
    fetchRoomTabs();
  }, [axiosSecure]);

  // Real-time debounced query for customer search view
  useEffect(() => {
    if (viewMode === 'by_customer') {
      const timer = setTimeout(() => {
        fetchCustomerTabs(customerSearchTerm);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [customerSearchTerm, viewMode, axiosSecure]);

  // Real-time debounced query for room search view
  useEffect(() => {
    if (viewMode === 'by_room') {
      const timer = setTimeout(() => {
        fetchRoomTabs(roomSearchTerm);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [roomSearchTerm, viewMode, axiosSecure]);

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

  const toggleRoomAccordion = (key) => {
    setExpandedRoomKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleRoomItemHistory = (key) => {
    setExpandedRoomItemKeys((prev) => ({
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

  // Open Staff Settle Modal and fetch discrete transactions
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

  // Execute whole-transaction settlement for Staff
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
        await fetchConsolidatedTabs();
        await fetchRoomTabs(roomSearchTerm);
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

  // Open Room Settle Modal and fetch discrete transactions
  const openRoomSettleModal = async (roomNumber, guestName) => {
    try {
      setRoomSettleLoading(true);
      setSettleModalRoom({ roomNumber, guestName: guestName || '' });
      const params = {};
      if (guestName) params.guestName = guestName;
      const res = await axiosSecure.get(`/api/tabs/rooms/${roomNumber}/transactions`, { params });
      if (res.data?.success) {
        const txns = res.data.data.transactions;
        setRoomTransactions(txns);
        setSelectedRoomTxnIds(txns.map((t) => t._id));
      }
    } catch (err) {
      console.error('Error fetching room transactions:', err);
    } finally {
      setRoomSettleLoading(false);
    }
  };

  const handleToggleRoomTxnSelect = (txnId) => {
    setSelectedRoomTxnIds((prev) =>
      prev.includes(txnId) ? prev.filter((id) => id !== txnId) : [...prev, txnId]
    );
  };

  const handleSelectAllRoomTxns = () => {
    if (selectedRoomTxnIds.length === roomTransactions.length) {
      setSelectedRoomTxnIds([]);
    } else {
      setSelectedRoomTxnIds(roomTransactions.map((t) => t._id));
    }
  };

  // Execute whole-transaction settlement for Room
  const handleExecuteRoomSettlement = async () => {
    if (selectedRoomTxnIds.length === 0) return;

    setRoomSettleLoading(true);
    setFeedback(null);

    try {
      const res = await axiosSecure.post('/api/tabs/settle-transactions', {
        transactionIds: selectedRoomTxnIds,
        paymentMethod: roomPaymentMethod
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Successfully settled ${res.data.data.settledCount} transaction(s) (${formatCurrency(res.data.data.totalSettledInCents, currency)}) for Room ${settleModalRoom.roomNumber}${settleModalRoom.guestName ? ` (${settleModalRoom.guestName})` : ''} via ${roomPaymentMethod}`
        });
        await fetchRoomTabs(roomSearchTerm);
        await fetchConsolidatedTabs();
        if (viewMode === 'by_product') {
          await fetchTabsByProduct(productSearchTerm);
        }
        setSettleModalRoom(null);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Room bill settlement failed'
      });
    } finally {
      setRoomSettleLoading(false);
    }
  };

  // Open Customer Settle Modal and fetch discrete transactions
  const openCustomerSettleModal = async (customerName) => {
    try {
      setCustomerSettleLoading(true);
      setSettleModalCustomer({ customerName });
      const res = await axiosSecure.get(`/api/tabs/customers/${encodeURIComponent(customerName)}/transactions`);
      if (res.data?.success) {
        const txns = res.data.data.transactions;
        setCustomerTransactions(txns);
        setSelectedCustomerTxnIds(txns.map((t) => t._id));
      }
    } catch (err) {
      console.error('Error fetching customer transactions:', err);
    } finally {
      setCustomerSettleLoading(false);
    }
  };

  const handleToggleCustomerTxnSelect = (txnId) => {
    setSelectedCustomerTxnIds((prev) =>
      prev.includes(txnId) ? prev.filter((id) => id !== txnId) : [...prev, txnId]
    );
  };

  const handleSelectAllCustomerTxns = () => {
    if (selectedCustomerTxnIds.length === customerTransactions.length) {
      setSelectedCustomerTxnIds([]);
    } else {
      setSelectedCustomerTxnIds(customerTransactions.map((t) => t._id));
    }
  };

  // Execute whole-transaction settlement for Customer
  const handleExecuteCustomerSettlement = async () => {
    if (selectedCustomerTxnIds.length === 0) return;

    setCustomerSettleLoading(true);
    setFeedback(null);

    try {
      const res = await axiosSecure.post('/api/tabs/settle-transactions', {
        transactionIds: selectedCustomerTxnIds,
        paymentMethod: customerPaymentMethod
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Successfully settled ${res.data.data.settledCount} transaction(s) (${formatCurrency(res.data.data.totalSettledInCents, currency)}) for customer "${settleModalCustomer.customerName}" via ${customerPaymentMethod}`
        });
        await fetchCustomerTabs(customerSearchTerm);
        await fetchConsolidatedTabs();
        await fetchRoomTabs(roomSearchTerm);
        if (viewMode === 'by_product') {
          await fetchTabsByProduct(productSearchTerm);
        }
        setSettleModalCustomer(null);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Customer bill settlement failed'
      });
    } finally {
      setCustomerSettleLoading(false);
    }
  };

  const toggleCustomerAccordion = (key) => {
    setExpandedCustomerKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleCustomerItemHistory = (key) => {
    setExpandedCustomerItemKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalCustomerOwedCents = customerTabs.reduce((acc, tab) => acc + tab.totalOwedInCents, 0);
  const totalStaffOwedCents = tabs.reduce((acc, tab) => acc + tab.totalOwedInCents, 0);
  const totalRoomOwedCents = roomTabs.reduce((acc, tab) => acc + tab.totalOwedInCents, 0);
  const totalOutstandingCents = totalCustomerOwedCents + totalStaffOwedCents + totalRoomOwedCents;

  const selectedCustomerTotalInCents = customerTransactions
    .filter((t) => selectedCustomerTxnIds.includes(t._id))
    .reduce((acc, t) => acc + t.grandTotalInCents, 0);

  const selectedTotalInCents = staffTransactions
    .filter((t) => selectedTxnIds.includes(t._id))
    .reduce((acc, t) => acc + t.grandTotalInCents, 0);

  const selectedRoomTotalInCents = roomTransactions
    .filter((t) => selectedRoomTxnIds.includes(t._id))
    .reduce((acc, t) => acc + t.grandTotalInCents, 0);

  // Filtered room tabs based on Wing filter
  const filteredRoomTabs = useMemo(() => {
    return roomTabs.filter((tab) => {
      if (selectedWing === 'ALL') return true;
      const wing = tab.roomNumber ? tab.roomNumber.charAt(0).toUpperCase() : '';
      return wing === selectedWing;
    });
  }, [roomTabs, selectedWing]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pt-14 sm:p-6 space-y-6">
        {/* Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
              <Users className="w-7 h-7 text-amber-400" />
              <span>Tabs & Customer Room Bills</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Consolidated customer room bills & staff tabs with nested audit timestamps & whole-transaction settlements.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Customer Bills</div>
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {formatCurrency(totalCustomerOwedCents, currency)}
              </div>
            </div>

            <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Room Bills</div>
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {formatCurrency(totalRoomOwedCents, currency)}
              </div>
            </div>

            <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Staff Tabs</div>
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {formatCurrency(totalStaffOwedCents, currency)}
              </div>
            </div>

            <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-right">
              <div className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">Total Outstanding</div>
              <div className="text-lg font-black text-amber-400 font-mono">
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
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setViewMode('by_customer');
                if (customerTabs.length === 0) {
                  fetchCustomerTabs(customerSearchTerm);
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
                viewMode === 'by_customer'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>By Customer Bill ({customerTabs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('by_room');
                if (roomTabs.length === 0) {
                  fetchRoomTabs(roomSearchTerm);
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
                viewMode === 'by_room'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>By Room Bill ({roomTabs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('by_staff')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
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
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
                viewMode === 'by_product'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Search Unpaid by Product ({productTabs.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium px-2 flex items-center space-x-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live unpaid ledger (status: <strong className="text-amber-400 font-mono">UNPAID_TAB</strong>)</span>
          </div>
        </div>

        {/* View 0: Consolidated Customer Bills */}
        {viewMode === 'by_customer' && (
          <div className="space-y-4">
            {/* Search Input Box */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  placeholder="Search by customer name or product..."
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
                />
                {customerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Context Summary Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
                <div>
                  Showing <strong className="text-white">{customerTabs.length}</strong> active customer bill{customerTabs.length === 1 ? '' : 's'}
                  {customerSearchTerm && <span> matching &ldquo;<span className="text-amber-400 font-semibold">{customerSearchTerm}</span>&rdquo;</span>}
                </div>
                <div className="flex items-center space-x-3">
                  <span>
                    Total Customer Balance Due: <strong className="text-amber-400 font-mono text-sm">{formatCurrency(totalCustomerOwedCents, currency)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Customer List Content */}
            {customerLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Loading customer bills...
              </div>
            ) : customerTabs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">All Customer Bills Clear!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {customerSearchTerm
                    ? `No open customer bills match "${customerSearchTerm}".`
                    : 'There are no outstanding unpaid customer bills at this time.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerTabs.map((tab) => {
                  const customerKey = tab.customerId || tab.customerName;
                  const isExpanded = !!expandedCustomerKeys[customerKey];

                  return (
                    <div
                      key={customerKey}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:border-slate-750"
                    >
                      {/* Customer Row Header */}
                      <div
                        onClick={() => toggleCustomerAccordion(customerKey)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border bg-blue-500/10 text-blue-400 border-blue-500/30">
                                Customer
                              </span>
                              <h2 className="text-base sm:text-lg font-extrabold text-white">
                                {tab.customerName || 'Unnamed Customer'}
                              </h2>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                              <span>{tab.itemCount || 0} total items</span>
                              <span>•</span>
                              <span>{tab.consolidatedItems?.length || 0} distinct products</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-400 font-medium">Balance Due</div>
                            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                              {formatCurrency(tab.totalOwedInCents, currency)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomerSettleModal(tab.customerName);
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Settle Bill</span>
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content: Consolidated Items */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-5 space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                                  <th className="pb-3 pl-2">Product</th>
                                  <th className="pb-3 px-3">Unit Price</th>
                                  <th className="pb-3 px-3 text-center">Qty</th>
                                  <th className="pb-3 px-3 text-right">Discounts</th>
                                  <th className="pb-3 px-3 text-right">Subtotal</th>
                                  <th className="pb-3 pr-2 text-right">Audit History</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {tab.consolidatedItems?.map((item) => {
                                  const itemHistoryKey = `${customerKey}_${item.productId}`;
                                  const showHistory = !!expandedCustomerItemKeys[itemHistoryKey];

                                  return (
                                    <React.Fragment key={item.productId}>
                                      <tr className="hover:bg-slate-850/50 transition">
                                        <td className="py-3 pl-2 font-medium text-white">
                                          <div>{item.productName}</div>
                                          {item.categoryName && (
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                              {item.categoryName}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-xs">
                                          {formatCurrency(item.unitPriceInCents, currency)}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 font-bold text-white text-xs border border-slate-700">
                                            {item.totalQuantity}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-xs">
                                          {item.totalDiscountInCents > 0 ? (
                                            <span className="text-emerald-400 font-medium">
                                              -{formatCurrency(item.totalDiscountInCents, currency)}
                                            </span>
                                          ) : (
                                            <span className="text-slate-600">—</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                          {formatCurrency(item.totalAmountInCents, currency)}
                                        </td>
                                        <td className="py-3 pr-2 text-right">
                                          <button
                                            type="button"
                                            onClick={() => toggleCustomerItemHistory(itemHistoryKey)}
                                            className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 transition"
                                          >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{item.history?.length || 0} order{item.history?.length === 1 ? '' : 's'}</span>
                                            {showHistory ? (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>

                                      {/* Nested Audit History */}
                                      {showHistory && item.history && (
                                        <tr>
                                          <td colSpan={6} className="bg-slate-900/90 p-3 rounded-xl">
                                            <div className="space-y-2 text-xs">
                                              <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                                Order Occurrence Log
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {item.history.map((occ, oIdx) => (
                                                  <div
                                                    key={occ.transactionId + '_' + oIdx}
                                                    className="p-2.5 bg-slate-850 rounded-xl border border-slate-800 space-y-1"
                                                  >
                                                    <div className="flex justify-between items-center">
                                                      <span className="font-mono font-bold text-amber-400 text-[11px]">
                                                        {occ.txnNumber}
                                                      </span>
                                                      <span className="text-[10px] text-slate-400">
                                                        Qty: <strong className="text-white">{occ.quantity}</strong>
                                                      </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                      {new Date(occ.takenAt).toLocaleDateString()} {new Date(occ.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                      Cashier: <span className="text-slate-300">{occ.cashierName || 'POS Staff'}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
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

        {/* View 2: Consolidated Customer Room Bills */}
        {viewMode === 'by_room' && (
          <div className="space-y-4">
            {/* Search Input Box & Wing Filters */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={roomSearchTerm}
                  onChange={(e) => setRoomSearchTerm(e.target.value)}
                  placeholder="Search by room number (e.g., B104, D105, V101, H102), guest name, or product..."
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner transition"
                />
                {roomSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setRoomSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Wing Filter Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-slate-400 shrink-0">Filter Wing:</span>
                {ROOM_WINGS.map((wing) => {
                  const isActive = selectedWing === wing.id;
                  return (
                    <button
                      key={wing.id}
                      type="button"
                      onClick={() => setSelectedWing(wing.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                        isActive
                          ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {wing.label}
                    </button>
                  );
                })}
              </div>

              {/* Context Summary Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
                <div>
                  Showing <strong className="text-white">{filteredRoomTabs.length}</strong> active room tab{filteredRoomTabs.length === 1 ? '' : 's'}
                  {roomSearchTerm && <span> matching &ldquo;<span className="text-amber-400 font-semibold">{roomSearchTerm}</span>&rdquo;</span>}
                </div>
                <div className="flex items-center space-x-3">
                  <span>
                    Total Room Balance Due: <strong className="text-amber-400 font-mono text-sm">{formatCurrency(filteredRoomTabs.reduce((acc, r) => acc + r.totalOwedInCents, 0), currency)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Room List Content */}
            {roomLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Loading customer room bills...
              </div>
            ) : filteredRoomTabs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">All Customer Room Bills Clear!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {roomSearchTerm
                    ? `No open customer bills match "${roomSearchTerm}".`
                    : 'There are no outstanding customer room tabs in this wing at this time.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRoomTabs.map((tab) => {
                  const roomKey = `${tab.roomNumber}_${tab.guestName || ''}`;
                  const isExpanded = !!expandedRoomKeys[roomKey];
                  const dorm = isDormRoom(tab.roomNumber);
                  const roomMeta = getRoomByNumber(tab.roomNumber);
                  const wingChar = tab.roomNumber ? tab.roomNumber.charAt(0).toUpperCase() : 'OTHER';

                  const wingColors = {
                    B: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    V: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    H: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    D: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                    S: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  };
                  const badgeStyle = wingColors[wingChar] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <div
                      key={roomKey}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:border-slate-750"
                    >
                      {/* Room Row Header */}
                      <div
                        onClick={() => toggleRoomAccordion(roomKey)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${badgeStyle}`}>
                                {tab.roomNumber}
                              </span>
                              <h2 className="text-base sm:text-lg font-extrabold text-white">
                                {roomMeta?.type || 'Room'} {tab.roomNumber}
                              </h2>
                              {dorm && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                  Dorm (6 Pax)
                                </span>
                              )}
                              {tab.guestName && (
                                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700 flex items-center space-x-1">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Guest: {tab.guestName}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block mt-1">
                              {tab.consolidatedItems?.length || 0} distinct item{tab.consolidatedItems?.length === 1 ? '' : 's'} consumed ({tab.itemCount} units)
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
                              openRoomSettleModal(tab.roomNumber, tab.guestName);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Settle Room Bill</span>
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content: Consolidated Items */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/60 space-y-3">
                          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-amber-400" />
                            <span>Consolidated Room Consumption</span>
                          </div>

                          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90">
                            {tab.consolidatedItems.map((item, index) => {
                              const auditKey = `${roomKey}_${item.productId || index}`;
                              const isAuditOpen = !!expandedRoomItemKeys[auditKey];

                              return (
                                <div key={index} className="p-3.5 sm:p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-bold text-sm text-white flex items-center space-x-2">
                                        <span>{item.productName}</span>
                                        {item.categoryName && (
                                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                            {item.categoryName}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                                        Unit: {formatCurrency(item.unitPriceInCents, currency)}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                      <div className="text-right">
                                        <div className="text-xs text-slate-400 font-bold font-mono">
                                          Qty: <span className="text-white text-sm">{item.totalQuantity}</span>
                                        </div>
                                        <div className="text-sm font-extrabold text-amber-400 font-mono">
                                          {formatCurrency(item.totalAmountInCents, currency)}
                                        </div>
                                      </div>

                                      {/* Occurrence Audit Toggle */}
                                      {item.history && item.history.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => toggleRoomItemHistory(auditKey)}
                                          className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border ${
                                            isAuditOpen 
                                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                          }`}
                                          title="View discrete occurrences and audit timestamps"
                                        >
                                          <Clock className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Audit ({item.history.length})</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Nested Occurrence Timestamps */}
                                  {isAuditOpen && item.history && (
                                    <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                                      <div className="font-semibold text-[11px] text-amber-400/90 mb-1 flex items-center space-x-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Discrete Taking History & Audited Timestamps:</span>
                                      </div>
                                      {item.history.map((occ, oIdx) => {
                                        const dateObj = new Date(occ.takenAt);
                                        const dateStr = dateObj.toLocaleDateString();
                                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                          <div
                                            key={oIdx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-slate-850 last:border-0 gap-1"
                                          >
                                            <div className="flex items-center space-x-2 flex-wrap">
                                              <span className="font-mono text-amber-400 font-bold">{occ.txnNumber}</span>
                                              <span className="text-slate-500">•</span>
                                              <span>{dateStr} at {timeStr}</span>
                                              <span className="text-emerald-400 font-bold font-mono">({occ.quantity}x)</span>
                                              {occ.notes && (
                                                <span className="text-[11px] text-slate-400 italic">
                                                  &ldquo;{occ.notes}&rdquo;
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-slate-400 text-[11px]">
                                              Cashier: <strong className="text-slate-200">{occ.cashierName || 'Operator'}</strong>
                                            </div>
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

        {/* View 3: Search Unpaid by Product View */}
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

        {/* Discrete Room Transaction Settlement Modal */}
        {settleModalRoom && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <BedDouble className="w-5 h-5 text-amber-400" />
                    <span>Settle Room Bill — Room {settleModalRoom.roomNumber}{settleModalRoom.guestName ? ` (${settleModalRoom.guestName})` : ''}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select discrete guest checkouts to settle with cash, card, or front-desk transfer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettleModalRoom(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transactions List with Checkboxes */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={handleSelectAllRoomTxns}
                    className="font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    {selectedRoomTxnIds.length === roomTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span>{roomTransactions.length} open transaction(s)</span>
                </div>

                {roomTransactions.map((txn) => {
                  const isSelected = selectedRoomTxnIds.includes(txn._id);
                  const dateStr = new Date(txn.createdAt).toLocaleDateString();
                  const timeStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={txn._id}
                      onClick={() => handleToggleRoomTxnSelect(txn._id)}
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
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 pointer-events-none"
                        />
                        <div>
                          <div className="font-mono font-bold text-amber-400 text-sm">{txn.txnNumber}</div>
                          <div className="text-xs text-slate-400">
                            {dateStr} {timeStr} • {txn.items?.length || 0} items
                            {txn.notes && <span className="ml-1 text-slate-500 italic">• &ldquo;{txn.notes}&rdquo;</span>}
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
              <div className="space-y-2 pt-2 border-t border-slate-800 shrink-0">
                <div className="text-xs font-semibold text-slate-400">Settlement Payment Method:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['CASH', 'CARD', 'TRANSFER', 'OTHER'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRoomPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        roomPaymentMethod === method
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
                <div>
                  <div className="text-xs text-slate-400">Selected ({selectedRoomTxnIds.length} txns):</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(selectedRoomTotalInCents, currency)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSettleModalRoom(null)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={roomSettleLoading || selectedRoomTxnIds.length === 0}
                    onClick={handleExecuteRoomSettlement}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition cursor-pointer"
                  >
                    {roomSettleLoading ? 'Settling...' : `Settle Room Bill (${formatCurrency(selectedRoomTotalInCents, currency)})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discrete Customer Transaction Settlement Modal */}
        {settleModalCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    <span>Settle Customer Bill — {settleModalCustomer.customerName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select discrete orders to settle with cash, card, or transfer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettleModalCustomer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transactions List with Checkboxes */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={handleSelectAllCustomerTxns}
                    className="font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    {selectedCustomerTxnIds.length === customerTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span>{customerTransactions.length} open transaction(s)</span>
                </div>

                {customerTransactions.map((txn) => {
                  const isSelected = selectedCustomerTxnIds.includes(txn._id);
                  const dateStr = new Date(txn.createdAt).toLocaleDateString();
                  const timeStr = new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={txn._id}
                      onClick={() => handleToggleCustomerTxnSelect(txn._id)}
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
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 pointer-events-none"
                        />
                        <div>
                          <div className="font-mono font-bold text-amber-400 text-sm">{txn.txnNumber}</div>
                          <div className="text-xs text-slate-400">
                            {dateStr} {timeStr} • {txn.items?.length || 0} items
                            {txn.notes && <span className="ml-1 text-slate-500 italic">• &ldquo;{txn.notes}&rdquo;</span>}
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
              <div className="space-y-2 pt-2 border-t border-slate-800 shrink-0">
                <div className="text-xs font-semibold text-slate-400">Settlement Payment Method:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['CASH', 'CARD', 'TRANSFER', 'OTHER'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCustomerPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        customerPaymentMethod === method
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
                <div>
                  <div className="text-xs text-slate-400">Selected ({selectedCustomerTxnIds.length} txns):</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(selectedCustomerTotalInCents, currency)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSettleModalCustomer(null)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={customerSettleLoading || selectedCustomerTxnIds.length === 0}
                    onClick={handleExecuteCustomerSettlement}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition cursor-pointer"
                  >
                    {customerSettleLoading ? 'Settling...' : `Settle Customer Bill (${formatCurrency(selectedCustomerTotalInCents, currency)})`}
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
