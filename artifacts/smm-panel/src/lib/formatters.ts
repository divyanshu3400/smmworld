import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date: string | Date,
  formatStr: string = 'MMM d, yyyy'
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return 'Invalid date'
  return format(parsedDate, formatStr)
}

export function formatDateTime(
  date: string | Date,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return 'Invalid date'
  return format(parsedDate, formatStr)
}

export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return 'Invalid date'
  return formatDistanceToNow(parsedDate, { addSuffix: true })
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function formatNumber(
  num: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', options).format(num)
}

export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${formatNumber(value * 100, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getFullName(
  firstName: string | null,
  lastName: string | null,
  fallback: string = 'User'
): string {
  if (!firstName && !lastName) return fallback
  return [firstName, lastName].filter(Boolean).join(' ')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
