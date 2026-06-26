export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  TRY: { symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
} as const

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES

export interface ExchangeRate {
  base_currency: string
  target_currency: string
  rate: number
  source: string
  updated_at: string
}

export function formatCurrencyByCode(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  locale: string = 'en-US'
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode]
  if (!currency) return `${amount.toFixed(2)} ${currencyCode}`

  if (currencyCode === 'IDR' || currencyCode === 'INR') {
    return `${currency.symbol}${amount.toLocaleString(locale)}`
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency.symbol}${amount.toFixed(2)}`
  }
}

export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode
}

export function getCurrencyName(currencyCode: CurrencyCode): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.name || currencyCode
}
