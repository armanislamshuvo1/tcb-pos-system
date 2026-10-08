'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { 
  useAllBillsQuery, 
  useCustomerTabsQuery, 
  useRoomTabsQuery, 
  useConsolidatedTabsQuery, 
  useProductTabsQuery, 
  useSettledBillsQuery, 
  useSettleTransactionsMutation 
} from '../../hooks/queries/useTabsQueries';
import { useAxiosSecure } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Users, 
  X, 
  RotateCcw
} from 'lucide-react';
import RevertSettlementModal from '../../components/RevertSettlementModal';
import TransactionDetailModal from '../../components/TransactionDetailModal';
import PrintableCustomerBillModal from '../../components/PrintableCustomerBillModal';

// Modular Sub-Components
import TabNavigation from '../../components/tabs/TabNavigation';
import AllBillsView from '../../components/tabs/AllBillsView';
import CustomerTabsView from '../../components/tabs/CustomerTabsView';
import StaffTabsView from '../../components/tabs/StaffTabsView';
import RoomTabsView from '../../components/tabs/RoomTabsView';
import ProductTabsView from '../../components/tabs/ProductTabsView';
import RecentlySettledView from '../../components/tabs/RecentlySettledView';
import StaffSettleModal from '../../components/tabs/StaffSettleModal';
import RoomSettleModal from '../../components/tabs/RoomSettleModal';
import CustomerSettleModal from '../../components/tabs/CustomerSettleModal';

export default function StaffTabsPage() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const settleMutation = useSettleTransactionsMutation();
  const { currency } = useAuth();
  
  // View state: 'all' | 'by_customer' | 'by_room' | 'by_staff' | 'by_product' | 'recently_settled'
  const [viewMode, setViewMode] = useState('all');

  // Search & Filter State
  const [allSearchTerm, setAllSearchTerm] = useState('');
  const [allBillTypeFilter, setAllBillTypeFilter] = useState('ALL');
  const [allSortBy, setAllSortBy] = useState('newest');
  const [expandedAllBillIds, setExpandedAllBillIds] = useState({});

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
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [expandedItemKeys, setExpandedItemKeys] = useState({});

  // Room Tabs State
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [expandedRoomKeys, setExpandedRoomKeys] = useState({});
  const [expandedRoomItemKeys, setExpandedRoomItemKeys] = useState({});

  // Product Tabs State
  const [productSearchTerm, setProductSearchTerm] = useState('');
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

  // Recently Settled Bills State
  const [settledSearchTerm, setSettledSearchTerm] = useState('');
  const [expandedSettledBillIds, setExpandedSettledBillIds] = useState({});
  const [revertModalTxn, setRevertModalTxn] = useState(null);
  const [showRevertModal, setShowRevertModal] = useState(false);

  // Transaction Detail Modal State
  const [selectedDetailTxn, setSelectedDetailTxn] = useState(null);
  const [detailTxnLoading, setDetailTxnLoading] = useState(false);

  // Printable Customer Bill Modal State
  const [printCustomerBillData, setPrintCustomerBillData] = useState(null);
  const [printCustomerBillLoading, setPrintCustomerBillLoading] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // Debounced search terms for smooth reactive queries
  const [debouncedAllSearch, setDebouncedAllSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [debouncedRoomSearch, setDebouncedRoomSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [debouncedSettledSearch, setDebouncedSettledSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAllSearch(allSearchTerm), 250);
    return () => clearTimeout(timer);
  }, [allSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCustomerSearch(customerSearchTerm), 250);
    return () => clearTimeout(timer);
  }, [customerSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRoomSearch(roomSearchTerm), 250);
    return () => clearTimeout(timer);
  }, [roomSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductSearch(productSearchTerm), 250);
    return () => clearTimeout(timer);
  }, [productSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSettledSearch(settledSearchTerm), 250);
    return () => clearTimeout(timer);
  }, [settledSearchTerm]);

  // Reactive TanStack Queries
  const { data: allBills = [], isLoading: allLoading } = useAllBillsQuery(debouncedAllSearch, allBillTypeFilter);
  const { data: customerTabs = [], isLoading: customerLoading } = useCustomerTabsQuery(debouncedCustomerSearch);
  const { data: tabs = [], isLoading: loading } = useConsolidatedTabsQuery();
  const { data: roomTabs = [], isLoading: roomLoading } = useRoomTabsQuery(debouncedRoomSearch);
  const { data: productTabs = [], isLoading: productLoading } = useProductTabsQuery(debouncedProductSearch);
  const { data: settledBills = [], isLoading: settledLoading } = useSettledBillsQuery(debouncedSettledSearch);

  const toggleAllBillAccordion = (billId) => {
    setExpandedAllBillIds((prev) => ({
      ...prev,
      [billId]: !prev[billId]
    }));
  };

  const toggleSettledBillAccordion = (billId) => {
    setExpandedSettledBillIds((prev) => ({
      ...prev,
      [billId]: !prev[billId]
    }));
  };

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

  const refreshAllTabsData = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
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

  // Open Transaction Details Modal
  const handleViewTxnDetails = async (txnOrId) => {
    if (!txnOrId) return;
    if (typeof txnOrId === 'object' && txnOrId._id) {
      setSelectedDetailTxn(txnOrId);
      return;
    }
    try {
      setDetailTxnLoading(true);
      const res = await axiosSecure.get(`/api/transactions/${txnOrId}`);
      if (res.data?.success) {
        setSelectedDetailTxn(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch transaction details'
      });
    } finally {
      setDetailTxnLoading(false);
    }
  };

  // Open Printable Customer Bill Statement Modal
  const handleOpenPrintCustomerBill = async (customerNameOrTab, selectedTxns = null) => {
    const customerName = typeof customerNameOrTab === 'string'
      ? customerNameOrTab
      : customerNameOrTab?.customerName;
    if (!customerName) return;

    if (Array.isArray(selectedTxns) && selectedTxns.length > 0) {
      setPrintCustomerBillData({
        customerName,
        transactions: selectedTxns,
        totalBalanceInCents: selectedTxns.reduce((acc, t) => acc + (t.grandTotalInCents || 0), 0),
        initialFilter: 'UNPAID'
      });
      return;
    }

    try {
      setPrintCustomerBillLoading(true);
      const res = await axiosSecure.get(`/api/tabs/customers/${encodeURIComponent(customerName)}/transactions?status=all`);
      if (res.data?.success) {
        const txns = res.data.data.transactions || [];
        setPrintCustomerBillData({
          customerName,
          transactions: txns,
          totalBalanceInCents: res.data.data.totalBalanceInCents || 0,
          initialFilter: 'UNPAID'
        });
      }
    } catch (err) {
      console.error('Error fetching customer transactions for print:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to prepare customer bill for printing'
      });
    } finally {
      setPrintCustomerBillLoading(false);
    }
  };

  const handleOpenPrintRoomBill = async (tab) => {
    try {
      setPrintCustomerBillLoading(true);
      const params = { guestName: tab.guestName };
      if (Array.isArray(tab.roomNumbers) && tab.roomNumbers.length > 0) {
        params.rooms = tab.roomNumbers.join(',');
      }
      const res = await axiosSecure.get(
        `/api/tabs/rooms/${encodeURIComponent(tab.roomNumber)}/transactions`,
        { params }
      );
      if (res.data?.success) {
        const txns = res.data.data.transactions || [];
        setPrintCustomerBillData({
          customerName: `${tab.guestName} (${tab.roomNumber})`,
          transactions: txns,
          totalBalanceInCents: res.data.data.totalBalanceInCents || tab.totalOwedInCents,
          initialFilter: 'UNPAID'
        });
      }
    } catch (err) {
      console.error('Error opening print modal for room bill:', err);
    } finally {
      setPrintCustomerBillLoading(false);
    }
  };

  const handleOpenSettleForBill = (bill) => {
    if (bill.tabType === 'CUSTOMER' || (!bill.tabType && bill.customerName)) {
      openCustomerSettleModal(bill.customerName);
    } else if (bill.tabType === 'ROOM' || bill.roomNumber) {
      openRoomSettleModal(bill.roomNumber, bill.guestName);
    } else if (bill.tabType === 'STAFF' || bill.staffMemberId) {
      openSettleModal(bill.staffMemberId, bill.staffNameSnapshot);
    } else {
      openCustomerSettleModal(bill.customerName || bill.txnNumber);
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
        const settledData = res.data.data;
        setFeedback({
          type: 'success',
          message: `Successfully settled ${settledData.settledCount} transaction(s) (${formatCurrency(settledData.totalSettledInCents, currency)}) via ${paymentMethod}`,
          lastSettledTxnIds: [...selectedTxnIds],
          lastSettledAmount: settledData.totalSettledInCents,
          lastPaymentMethod: paymentMethod
        });
        await refreshAllTabsData();
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
  const openRoomSettleModal = async (roomNumber, guestName, roomNumbers = null) => {
    try {
      setRoomSettleLoading(true);
      setSettleModalRoom({ roomNumber, guestName: guestName || '', roomNumbers });
      const params = {};
      if (guestName) params.guestName = guestName;
      if (Array.isArray(roomNumbers) && roomNumbers.length > 0) {
        params.rooms = roomNumbers.join(',');
      }
      const res = await axiosSecure.get(`/api/tabs/rooms/${encodeURIComponent(roomNumber)}/transactions`, { params });
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
        const settledData = res.data.data;
        setFeedback({
          type: 'success',
          message: `Successfully settled ${settledData.settledCount} transaction(s) (${formatCurrency(settledData.totalSettledInCents, currency)}) for Room ${settleModalRoom.roomNumber}${settleModalRoom.guestName ? ` (${settleModalRoom.guestName})` : ''} via ${roomPaymentMethod}`,
          lastSettledTxnIds: [...selectedRoomTxnIds],
          lastSettledAmount: settledData.totalSettledInCents,
          lastPaymentMethod: roomPaymentMethod
        });
        await refreshAllTabsData();
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
        const settledData = res.data.data;
        setFeedback({
          type: 'success',
          message: `Successfully settled ${settledData.settledCount} transaction(s) (${formatCurrency(settledData.totalSettledInCents, currency)}) for customer "${settleModalCustomer.customerName}" via ${customerPaymentMethod}`,
          lastSettledTxnIds: [...selectedCustomerTxnIds],
          lastSettledAmount: settledData.totalSettledInCents,
          lastPaymentMethod: customerPaymentMethod
        });
        await refreshAllTabsData();
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

  const customerBillsCount = useMemo(() => allBills.filter((b) => b.tabType === 'CUSTOMER' || (!b.tabType && b.customerName)).length, [allBills]);
  const roomBillsCount = useMemo(() => allBills.filter((b) => b.tabType === 'ROOM' || b.roomNumber).length, [allBills]);
  const staffBillsCount = useMemo(() => allBills.filter((b) => b.tabType === 'STAFF' || b.staffMemberId).length, [allBills]);

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
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <span>{feedback.message}</span>
              {feedback.lastSettledTxnIds && feedback.lastSettledTxnIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRevertModalTxn({
                      transactionIds: feedback.lastSettledTxnIds,
                      grandTotalInCents: feedback.lastSettledAmount,
                      paymentMethod: feedback.lastPaymentMethod
                    });
                    setShowRevertModal(true);
                  }}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-lg transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo / Revert Settlement</span>
                </button>
              )}
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Mode Switcher Navigation */}
        <TabNavigation
          viewMode={viewMode}
          setViewMode={setViewMode}
          allBillsCount={allBills.length}
          customerBillsCount={customerBillsCount}
          roomBillsCount={roomBillsCount}
          staffBillsCount={staffBillsCount}
          productTabsCount={productTabs.length}
          settledBillsCount={settledBills.length}
          onOpenBatchPrint={() => {
            const firstCustomer = customerTabs[0]?.customerName;
            if (firstCustomer) {
              handleOpenPrintCustomerBill(firstCustomer);
            }
          }}
        />

        {/* VIEW 0: ALL OPEN BILLS */}
        {viewMode === 'all' && (
          <AllBillsView
            allSearchTerm={allSearchTerm}
            setAllSearchTerm={setAllSearchTerm}
            allBillTypeFilter={allBillTypeFilter}
            setAllBillTypeFilter={setAllBillTypeFilter}
            allSortBy={allSortBy}
            setAllSortBy={setAllSortBy}
            allBills={allBills}
            allLoading={allLoading}
            expandedAllBillIds={expandedAllBillIds}
            toggleAllBillAccordion={toggleAllBillAccordion}
            onViewTxnDetails={handleViewTxnDetails}
            onOpenSettleForBill={handleOpenSettleForBill}
            currency={currency}
          />
        )}

        {/* VIEW 1: CONSOLIDATED CUSTOMER BILLS */}
        {viewMode === 'by_customer' && (
          <CustomerTabsView
            customerSearchTerm={customerSearchTerm}
            setCustomerSearchTerm={setCustomerSearchTerm}
            customerTabs={customerTabs}
            customerLoading={customerLoading}
            totalCustomerOwedCents={totalCustomerOwedCents}
            expandedCustomerKeys={expandedCustomerKeys}
            toggleCustomerAccordion={toggleCustomerAccordion}
            expandedCustomerItemKeys={expandedCustomerItemKeys}
            toggleCustomerItemHistory={toggleCustomerItemHistory}
            onOpenPrintCustomerBill={handleOpenPrintCustomerBill}
            onOpenCustomerSettleModal={openCustomerSettleModal}
            onViewTxnDetails={handleViewTxnDetails}
            currency={currency}
          />
        )}

        {/* VIEW 2: CONSOLIDATED STAFF TABS */}
        {viewMode === 'by_staff' && (
          <StaffTabsView
            tabs={tabs}
            loading={loading}
            expandedStaffId={expandedStaffId}
            toggleStaffAccordion={toggleStaffAccordion}
            expandedItemKeys={expandedItemKeys}
            toggleItemHistory={toggleItemHistory}
            onOpenSettleModal={openSettleModal}
            onViewTxnDetails={handleViewTxnDetails}
            currency={currency}
          />
        )}

        {/* VIEW 3: CONSOLIDATED ROOM BILLS */}
        {viewMode === 'by_room' && (
          <RoomTabsView
            roomSearchTerm={roomSearchTerm}
            setRoomSearchTerm={setRoomSearchTerm}
            selectedWing={selectedWing}
            setSelectedWing={setSelectedWing}
            roomTabs={roomTabs}
            roomLoading={roomLoading}
            expandedRoomKeys={expandedRoomKeys}
            toggleRoomAccordion={toggleRoomAccordion}
            expandedRoomItemKeys={expandedRoomItemKeys}
            toggleRoomItemHistory={toggleRoomItemHistory}
            onOpenRoomSettleModal={openRoomSettleModal}
            onOpenPrintRoomBill={handleOpenPrintRoomBill}
            onViewTxnDetails={handleViewTxnDetails}
            currency={currency}
          />
        )}

        {/* VIEW 4: SEARCH UNPAID BY PRODUCT */}
        {viewMode === 'by_product' && (
          <ProductTabsView
            productSearchTerm={productSearchTerm}
            setProductSearchTerm={setProductSearchTerm}
            productTabs={productTabs}
            productLoading={productLoading}
            expandedProductNames={expandedProductNames}
            toggleProductAccordion={toggleProductAccordion}
            expandedProductAuditKeys={expandedProductAuditKeys}
            toggleProductAudit={toggleProductAudit}
            onOpenCustomerSettleModal={openCustomerSettleModal}
            onOpenRoomSettleModal={openRoomSettleModal}
            onOpenSettleModal={openSettleModal}
            onViewTxnDetails={handleViewTxnDetails}
            currency={currency}
          />
        )}

        {/* VIEW 5: RECENTLY SETTLED BILLS (Mistake Recovery / Revert) */}
        {viewMode === 'recently_settled' && (
          <RecentlySettledView
            settledSearchTerm={settledSearchTerm}
            setSettledSearchTerm={setSettledSearchTerm}
            settledBills={settledBills}
            settledLoading={settledLoading}
            expandedSettledBillIds={expandedSettledBillIds}
            toggleSettledBillAccordion={toggleSettledBillAccordion}
            onOpenRevertModal={(bill) => {
              setRevertModalTxn(bill);
              setShowRevertModal(true);
            }}
            currency={currency}
          />
        )}

        {/* Staff Settle Modal */}
        <StaffSettleModal
          settleModalStaff={settleModalStaff}
          staffTransactions={staffTransactions}
          selectedTxnIds={selectedTxnIds}
          onToggleTxnSelect={handleToggleTxnSelect}
          onSelectAll={handleSelectAll}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          selectedTotalInCents={selectedTotalInCents}
          settleLoading={settleLoading}
          onExecuteSettlement={handleExecuteSettlement}
          onViewTxnDetails={handleViewTxnDetails}
          onClose={() => setSettleModalStaff(null)}
          currency={currency}
        />

        {/* Room Settle Modal */}
        <RoomSettleModal
          settleModalRoom={settleModalRoom}
          roomTransactions={roomTransactions}
          selectedRoomTxnIds={selectedRoomTxnIds}
          onToggleRoomTxnSelect={handleToggleRoomTxnSelect}
          onSelectAllRoomTxns={handleSelectAllRoomTxns}
          roomPaymentMethod={roomPaymentMethod}
          setRoomPaymentMethod={setRoomPaymentMethod}
          selectedRoomTotalInCents={selectedRoomTotalInCents}
          roomSettleLoading={roomSettleLoading}
          onExecuteRoomSettlement={handleExecuteRoomSettlement}
          onViewTxnDetails={handleViewTxnDetails}
          onClose={() => setSettleModalRoom(null)}
          currency={currency}
        />

        {/* Customer Settle Modal */}
        <CustomerSettleModal
          settleModalCustomer={settleModalCustomer}
          customerTransactions={customerTransactions}
          selectedCustomerTxnIds={selectedCustomerTxnIds}
          onToggleCustomerTxnSelect={handleToggleCustomerTxnSelect}
          onSelectAllCustomerTxns={handleSelectAllCustomerTxns}
          customerPaymentMethod={customerPaymentMethod}
          setCustomerPaymentMethod={setCustomerPaymentMethod}
          selectedCustomerTotalInCents={selectedCustomerTotalInCents}
          customerSettleLoading={customerSettleLoading}
          onExecuteCustomerSettlement={handleExecuteCustomerSettlement}
          onViewTxnDetails={handleViewTxnDetails}
          onOpenPrintCustomerBill={handleOpenPrintCustomerBill}
          onClose={() => setSettleModalCustomer(null)}
          currency={currency}
        />

        {/* Revert Settlement Confirmation Modal */}
        {showRevertModal && revertModalTxn && (
          <RevertSettlementModal
            isOpen={showRevertModal}
            txn={revertModalTxn}
            onClose={() => {
              setShowRevertModal(false);
              setRevertModalTxn(null);
            }}
            onRevertSuccess={async (revertData) => {
              await refreshAllTabsData();
              setFeedback({
                type: 'success',
                message: `Settlement reverted successfully for ${revertData.revertedCount} transaction(s). Reopened as Unpaid Tab.`
              });
              setShowRevertModal(false);
              setRevertModalTxn(null);
            }}
          />
        )}

        {/* Transaction Detail Modal */}
        {selectedDetailTxn && (
          <TransactionDetailModal
            txn={selectedDetailTxn}
            onClose={() => setSelectedDetailTxn(null)}
            onTxnUpdated={async (updatedTxn) => {
              setSelectedDetailTxn(updatedTxn);
              await refreshAllTabsData();
            }}
          />
        )}

        {/* Printable Customer Bill / Statement Modal */}
        {printCustomerBillData && (
          <PrintableCustomerBillModal
            isOpen={!!printCustomerBillData}
            onClose={() => setPrintCustomerBillData(null)}
            customerName={printCustomerBillData.customerName}
            transactions={printCustomerBillData.transactions}
            totalBalanceInCents={printCustomerBillData.totalBalanceInCents}
            initialFilter={printCustomerBillData.initialFilter || 'UNPAID'}
          />
        )}
      </main>
    </div>
  );
}
