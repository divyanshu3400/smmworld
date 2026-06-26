import { QueryClient } from '@tanstack/react-query'
import { STALE_TIME } from './constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.MEDIUM,
      gcTime: STALE_TIME.LONG,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
