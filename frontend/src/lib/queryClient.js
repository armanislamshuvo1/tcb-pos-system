import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Master/Catalog data defaults to 1 minute, with specific queries overriding to 5m
        staleTime: 60 * 1000,
        // Inactive queries remain in memory for 15 minutes
        gcTime: 15 * 60 * 1000,
        // Prevent background refetches when clicking or scanning barcodes across windows
        refetchOnWindowFocus: false,
        // Do not auto-refetch on reconnect if data is still fresh
        refetchOnReconnect: 'always',
        // Max 1 retry for queries on network failure
        retry: 1,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient = null;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
