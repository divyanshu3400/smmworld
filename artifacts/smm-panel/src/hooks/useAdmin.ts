import { useQuery } from '@tanstack/react-query'
import { checkAdminStatus } from '@/services/admin.service'
import { useAuth } from './useAuth'

export function useAdmin() {
  const { user } = useAuth()

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: checkAdminStatus,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return { isAdmin, isLoading }
}
