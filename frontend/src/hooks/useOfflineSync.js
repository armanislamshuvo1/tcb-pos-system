'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDb } from '../utils/offlineDb';
import { useAxiosSecure } from './useApi';

export function useOfflineSync() {
  const axiosSecure = useAxiosSecure();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const checkPendingCount = useCallback(async () => {
    try {
      const count = await offlineDb.offlineQueue
        .where('status')
        .equals('PENDING_SYNC')
        .count();
      setPendingCount(count);
    } catch (err) {
      console.warn('Failed to check offline queue count:', err);
    }
  }, []);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      const pendingTickets = await offlineDb.offlineQueue
        .where('status')
        .equals('PENDING_SYNC')
        .toArray();

      if (pendingTickets.length === 0) {
        setPendingCount(0);
        setIsSyncing(false);
        return;
      }

      let syncedCount = 0;
      let errorCount = 0;

      for (const ticket of pendingTickets) {
        try {
          const res = await axiosSecure.post('/api/transactions', ticket.payload, {
            headers: {
              'x-idempotency-key': ticket.clientTxnUuid
            }
          });

          if (res.data?.success) {
            // Update status or remove
            await offlineDb.offlineQueue.update(ticket.id, {
              status: 'SYNCED',
              syncedAt: new Date().toISOString(),
              serverTxnNumber: res.data.data?.txnNumber
            });
            syncedCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Failed to sync offline ticket ${ticket.clientTxnUuid}:`, err);
          errorCount++;
        }
      }

      await checkPendingCount();

      setLastSyncResult({
        time: new Date().toISOString(),
        syncedCount,
        errorCount
      });
    } catch (err) {
      console.error('Offline queue synchronization error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [axiosSecure, checkPendingCount, isSyncing]);

  useEffect(() => {
    checkPendingCount();

    const handleOnline = () => {
      syncQueue();
    };

    window.addEventListener('online', handleOnline);
    const interval = setInterval(checkPendingCount, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [checkPendingCount, syncQueue]);

  return {
    pendingCount,
    isSyncing,
    lastSyncResult,
    syncNow: syncQueue
  };
}
