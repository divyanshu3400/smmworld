import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/error-handler'
import type { ExchangeRate } from '@/lib/currency'

const CACHE_KEY = 'smmhub_exchange_rates'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

interface CachedRates {
  rates: Record<string, number>
  timestamp: number
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const parsed: CachedRates = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.rates
      }
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')

  if (error) {
    console.error('Failed to fetch exchange rates:', error)
    // Return hardcoded fallback rates
    return {
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.12,
      BRL: 4.97,
      PHP: 56.45,
      IDR: 15750.00,
      NGN: 1550.00,
      TRY: 32.50,
    }
  }

  const rates: Record<string, number> = { USD: 1 }
  data?.forEach((rate: ExchangeRate) => {
    rates[rate.target_currency] = rate.rate
  })

  // Cache the rates
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    rates,
    timestamp: Date.now(),
  }))

  return rates
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount

  const rates = await getExchangeRates()

  // Convert to USD first (base currency)
  const amountInUSD = fromCurrency === 'USD'
    ? amount
    : amount / (rates[fromCurrency] || 1)

  // Convert from USD to target currency
  if (toCurrency === 'USD') return amountInUSD
  return amountInUSD * (rates[toCurrency] || 1)
}

export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount

  // Convert to USD first (base currency)
  const amountInUSD = fromCurrency === 'USD'
    ? amount
    : amount / (rates[fromCurrency] || 1)

  // Convert from USD to target currency
  if (toCurrency === 'USD') return amountInUSD
  return amountInUSD * (rates[toCurrency] || 1)
}

export function clearExchangeRateCache() {
  localStorage.removeItem(CACHE_KEY)
}
