'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosSecure } from '../useApi';
import { queryKeys } from '../../lib/queryKeys';

/**
 * Transaction Ledger Query with filters & pagination
 */
export function useLedgerQuery(filters = {}) {
  const axiosSecure = useAxiosSecure();
  const { statusFilter = 'ALL', page = 1, limit = 25, startDate, endDate, search } = filters;

  const params = {
    status: statusFilter,
    page,
    limit,
  };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (search && search.trim()) params.search = search.trim();

  return useQuery({
    queryKey: queryKeys.ledger.list(params),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/transactions/ledger', { params });
      if (res.data?.success) {
        return res.data.data;
      }
      return {
        transactions: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0 },
        summary: { totalRevenueInCents: 0, totalUnpaidInCents: 0, totalDiscountInCents: 0 },
      };
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Void / Cancel Transaction Mutation
 */
export function useVoidTransactionMutation() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ txnId, pinCode, reason }) => {
      const res = await axiosSecure.post(`/api/transactions/${txnId}/void`, {
        pinCode: pinCode.trim(),
        reason: reason.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tabs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
