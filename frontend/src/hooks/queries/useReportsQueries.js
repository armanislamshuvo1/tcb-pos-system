'use client';

import { useQuery } from '@tanstack/react-query';
import { useAxiosSecure } from '../useApi';
import { queryKeys } from '../../lib/queryKeys';

/**
 * Reports Query: Fetches sales summary, staff consumption, and product sales concurrently
 */
export function useReportsQuery({ startDate = '', endDate = '' } = {}) {
  const axiosSecure = useAxiosSecure();
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return useQuery({
    queryKey: queryKeys.reports.summary(params),
    queryFn: async () => {
      const [salesRes, staffRes, prodRes] = await Promise.all([
        axiosSecure.get('/api/reports/sales-summary', { params }),
        axiosSecure.get('/api/reports/staff-consumption', { params }),
        axiosSecure.get('/api/reports/products', { params }),
      ]);

      return {
        salesSummary: salesRes.data?.success ? salesRes.data.data.summary : null,
        paymentBreakdown: salesRes.data?.success ? salesRes.data.data.paymentBreakdown : [],
        staffReports: staffRes.data?.success ? staffRes.data.data : [],
        productReports: prodRes.data?.success ? prodRes.data.data : [],
      };
    },
    staleTime: 60 * 1000,
  });
}
