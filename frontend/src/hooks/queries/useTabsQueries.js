'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosSecure } from '../useApi';
import { queryKeys } from '../../lib/queryKeys';

/**
 * All Unpaid / Hold Bills Query
 */
export function useAllBillsQuery(search = '', billType = 'ALL', options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.allBills(search, billType),
    queryFn: async () => {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      if (billType && billType !== 'ALL') params.billType = billType;
      const res = await axiosSecure.get('/api/tabs/all', { params });
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Customer Tabs Query
 */
export function useCustomerTabsQuery(search = '', options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.customers(search),
    queryFn: async () => {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosSecure.get('/api/tabs/customers', { params });
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Room Tabs Query
 */
export function useRoomTabsQuery(search = '', options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.rooms(search),
    queryFn: async () => {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosSecure.get('/api/tabs/rooms', { params });
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Consolidated Staff Tabs Query
 */
export function useConsolidatedTabsQuery(options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.consolidated(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/tabs/consolidated');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Product Tabs Query (Items by product)
 */
export function useProductTabsQuery(search = '', options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.byProduct(search),
    queryFn: async () => {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosSecure.get('/api/tabs/by-product', { params });
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Recently Settled Bills Query
 */
export function useSettledBillsQuery(search = '', limit = 50, options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.settled(search, limit),
    queryFn: async () => {
      const params = { limit };
      if (search && search.trim()) params.search = search.trim();
      const res = await axiosSecure.get('/api/tabs/settled', { params });
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Discrete Staff Transactions for Settlement Modal
 */
export function useStaffTransactionsQuery(staffId, options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.staffTransactions(staffId),
    queryFn: async () => {
      if (!staffId) return [];
      const res = await axiosSecure.get(`/api/tabs/staff/${staffId}/transactions`);
      return res.data?.success ? res.data.data : [];
    },
    enabled: Boolean(staffId),
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Discrete Room Transactions for Settlement Modal
 */
export function useRoomTransactionsQuery(roomNumber, options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.roomTransactions(roomNumber),
    queryFn: async () => {
      if (!roomNumber) return [];
      const res = await axiosSecure.get(`/api/tabs/rooms/${roomNumber}/transactions`);
      return res.data?.success ? res.data.data : [];
    },
    enabled: Boolean(roomNumber),
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Discrete Customer Transactions for Settlement Modal
 */
export function useCustomerTransactionsQuery(customerName, options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.tabs.customerTransactions(customerName),
    queryFn: async () => {
      if (!customerName) return [];
      const res = await axiosSecure.get(`/api/tabs/customers/${encodeURIComponent(customerName)}/transactions`);
      return res.data?.success ? res.data.data : [];
    },
    enabled: Boolean(customerName),
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Settlement Mutation
 * Invalidates all tabs, ledger, and reports
 */
export function useSettleTransactionsMutation() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionIds, paymentMethod }) => {
      const res = await axiosSecure.post('/api/tabs/settle-transactions', {
        transactionIds,
        paymentMethod,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Revert Settlement Mutation
 * Invalidates all tabs, ledger, and reports
 */
export function useRevertSettlementMutation() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionIds, pinCode, reason }) => {
      const res = await axiosSecure.post('/api/tabs/revert-settlement', {
        transactionIds,
        pinCode,
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
