import { useQuery } from '@tanstack/react-query'
import { apiUrl } from '@/lib/api'

export interface PublicStats {
  totalOrders: number
  totalCustomers: number
  ordersToday: number
  completedOrders: number
}

async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch(apiUrl('/api/public/stats'))
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  })
}
