export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface WalletTransactionFilter {
  type?: 'credit' | 'debit' | 'refund' | 'bonus' | 'purchase' | 'all'
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
}

export interface NotificationFilter {
  type?: 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'all'
  read?: boolean | 'all'
}

export interface DashboardStats {
  walletBalance: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  recentTransactions: number
  unreadNotifications: number
}

export interface ReferralStats {
  referralCode: string
  totalReferrals: number
  activeReferrals: number
  commissionEarned: number
}

export interface ChartDataPoint {
  date: string
  value: number
}

export interface OrderStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
}

export type SortDirection = 'asc' | 'desc'

export interface SortParams {
  field: string
  direction: SortDirection
}
