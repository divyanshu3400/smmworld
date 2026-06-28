import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  getExchangeRates,
  convertCurrencySync,
} from '@/services/exchange-rate.service'
import {
  formatCurrencyByCode,
  type CurrencyCode,
} from '@/lib/currency'

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  rates: Record<string, number>
  loading: boolean
  formatPrice: (amountInUSD: number, decimals?: number) => string
  formatWalletAmount: (amount: number) => string
  convertFromUSD: (amountInUSD: number) => number
  convertToUSD: (amount: number) => number
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

const STORAGE_KEY = 'smmhub_currency'

function getInitialCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD'
  const stored = localStorage.getItem(STORAGE_KEY)
  const validCodes: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'BRL', 'PHP', 'IDR', 'NGN', 'TRY']
  if (stored && validCodes.includes(stored as CurrencyCode)) {
    return stored as CurrencyCode
  }
  return 'USD'
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getInitialCurrency)
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadRates = async () => {
      try {
        const fetchedRates = await getExchangeRates()
        if (mounted) {
          setRates(fetchedRates)
        }
      } catch (err) {
        console.error('Failed to load exchange rates:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadRates()
  }, [])

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    localStorage.setItem(STORAGE_KEY, c)
  }, [])

  const convertFromUSD = useCallback(
    (amountInUSD: number): number => {
      return convertCurrencySync(amountInUSD, 'USD', currency, rates)
    },
    [currency, rates]
  )

  const convertToUSD = useCallback(
    (amount: number): number => {
      return convertCurrencySync(amount, currency, 'USD', rates)
    },
    [currency, rates]
  )

  const formatPrice = useCallback(
    (amountInUSD: number, decimals = 2): string => {
      const converted = convertCurrencySync(amountInUSD, 'USD', currency, rates)
      const formatted = formatCurrencyByCode(converted, currency)
      if (decimals !== 2) {
        const symbol = currency === 'IDR' || currency === 'INR' ? '' : ''
        return `${symbol}${converted.toFixed(decimals)} ${currency}`
      }
      return formatted
    },
    [currency, rates]
  )

  const formatWalletAmount = useCallback(
    (amount: number): string => {
      return formatCurrencyByCode(amount, currency)
    },
    [currency]
  )

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        loading,
        formatPrice,
        formatWalletAmount,
        convertFromUSD,
        convertToUSD,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
