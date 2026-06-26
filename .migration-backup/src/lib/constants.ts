export const APP_NAME = 'SMMHub'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  WALLET: '/wallet',
  ORDERS: '/orders',
  SERVICES: '/services',
  SUPPORT: '/support',
  NOTIFICATIONS: '/notifications',
  REFERRAL: '/referral',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
} as const

export const QUERY_KEYS = {
  USER: ['user'],
  PROFILE: ['profile'],
  WALLET: ['wallet'],
  TRANSACTIONS: ['transactions'],
  NOTIFICATIONS: ['notifications'],
  UNREAD_COUNT: ['unread-count'],
  REFERRAL_CODE: ['referral-code'],
  REFERRAL_STATS: ['referral-stats'],
  SETTINGS: ['settings'],
  ANNOUNCEMENTS: ['announcements'],
  DASHBOARD_STATS: ['dashboard-stats'],
  RECENT_ACTIVITY: ['recent-activity'],
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
} as const

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
] as const

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
] as const

export const TRANSACTION_TYPES = {
  credit: { label: 'Credit', color: 'text-emerald-500' },
  debit: { label: 'Debit', color: 'text-red-500' },
  refund: { label: 'Refund', color: 'text-amber-500' },
  bonus: { label: 'Bonus', color: 'text-blue-500' },
  purchase: { label: 'Purchase', color: 'text-purple-500' },
} as const

export const NOTIFICATION_ICONS = {
  info: 'Info',
  warning: 'AlertTriangle',
  success: 'CheckCircle',
  error: 'XCircle',
  announcement: 'Megaphone',
} as const

export const STORAGE_KEYS = {
  THEME: 'smmhub-theme',
  SIDEBAR_COLLAPSED: 'smmhub-sidebar-collapsed',
} as const

export const STALE_TIME = {
  SHORT: 30 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
} as const
