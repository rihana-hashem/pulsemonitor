import { QueryClient } from '@tanstack/react-query'
import { isApiError, type ApiError } from './ApiError'

// All requests go through apiClient, which only rejects with ApiError, so type
// `error` in useQuery/useMutation results accordingly.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

const maxRetries = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data counts as fresh for 30 s; live metrics will arrive over SignalR instead of polling.
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // 4xx means the request itself is wrong (not found, invalid, unauthorized): retrying won't help.
        if (isApiError(error) && error.status !== null && error.status < 500) return false
        return failureCount < maxRetries
      },
    },
    mutations: {
      // Writes are not retried automatically; a retried POST could create duplicates.
      retry: false,
    },
  },
})
