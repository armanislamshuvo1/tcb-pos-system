'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosSecure } from '../useApi';
import { queryKeys } from '../../lib/queryKeys';
import { offlineDb } from '../../utils/offlineDb';

/**
 * Fetch and cache Categories
 * staleTime: 5 minutes. Dual-layer caching with IndexedDB for offline resilience.
 */
export function useCategoriesQuery() {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: async () => {
      try {
        const res = await axiosSecure.get('/api/categories');
        if (res.data?.success && Array.isArray(res.data.data)) {
          // Asynchronously backup to IndexedDB
          offlineDb.categories.bulkPut(res.data.data).catch(() => {});
          return res.data.data;
        }
        return [];
      } catch (err) {
        // Fallback to IndexedDB when offline or network error occurs
        const cached = await offlineDb.categories.toArray().catch(() => []);
        if (cached && cached.length > 0) {
          return cached;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch and cache Products
 * staleTime: 5 minutes. Dual-layer caching with IndexedDB for offline resilience.
 */
export function useProductsQuery(activeOnly = true) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.catalog.products(activeOnly),
    queryFn: async () => {
      try {
        const res = await axiosSecure.get(`/api/products?activeOnly=${activeOnly}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          offlineDb.products.bulkPut(res.data.data).catch(() => {});
          return res.data.data;
        }
        return [];
      } catch (err) {
        const cached = await offlineDb.products.toArray().catch(() => []);
        if (cached && cached.length > 0) {
          return cached;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch and cache Staff members (for tabs, tickets, login chips)
 * staleTime: 5 minutes.
 */
export function useStaffQuery() {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.catalog.staff(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/staff');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch and cache Preset Discounts
 * staleTime: 5 minutes.
 */
export function usePresetDiscountsQuery() {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.catalog.presetDiscounts(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/discounts/presets');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch and cache Customers
 * staleTime: 3 minutes.
 */
export function useCustomersQuery() {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.catalog.customers(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/customers');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Create Customer Mutation with automated cache update
 */
export function useCreateCustomerMutation() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosSecure.post('/api/customers', payload);
      return res.data?.data;
    },
    onSuccess: (newCustomer) => {
      if (newCustomer) {
        queryClient.setQueryData(queryKeys.catalog.customers(), (old) => {
          if (!old || !Array.isArray(old)) return [newCustomer];
          const exists = old.some((c) => c._id === newCustomer._id);
          return exists ? old : [newCustomer, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.customers() });
    },
  });
}

/**
 * Checkout Transaction Mutation
 * Automatically invalidates tabs, ledger, and reports
 */
export function useCheckoutTransactionMutation() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, idempotencyKey, staffMembers = [] }) => {
      try {
        const response = await axiosSecure.post('/api/transactions', payload, {
          headers: { 'x-idempotency-key': idempotencyKey },
        });
        return response.data;
      } catch (error) {
        if (!navigator.onLine) {
          const clientTxnUuid = `OFFLINE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await offlineDb.offlineQueue.add({
            clientTxnUuid,
            payload,
            timestamp: new Date().toISOString(),
            status: 'PENDING_SYNC',
          });

          return {
            success: true,
            data: {
              txnNumber: `${clientTxnUuid} (Queued)`,
              status: payload.status,
              grandTotalInCents: payload.items.reduce(
                (acc, i) => acc + (i.unitPriceInCents * i.quantity),
                0
              ),
              staffNameSnapshot: staffMembers.find((s) => s._id === payload.staffMemberId)?.fullName,
              roomNumber: payload.roomNumber,
              guestName: payload.guestName,
            },
          };
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate operational caches so Tab & Ledger screens reflect changes immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.customers() });
    },
  });
}
