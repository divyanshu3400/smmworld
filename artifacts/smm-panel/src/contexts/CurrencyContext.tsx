import { createContext, useContext, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { getWallet } from '@/services/wallet.service'
import { getExchangeRates } from '@/services/exchange-rate.service'
import { formatCurrencyByCode, type CurrencyCode } from '@/lib/currency'

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  BRL: 4.97,
  PHP: 56.45,
  IDR: 15750,
  NGN: 1550,
  TRY: 32.5,
}

interface CurrencyContextValue {
  currency: CurrencyCode
  rates: Record<string, number>
  formatPrice: (usdAmount: number, decimals?: number) => string
  convertFromUSD: (usdAmount: number) => number
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'USD',
  rates: FALLBACK_RATES,
  formatPrice: (v) => `$${v.toFixed(2)}`,
  convertFromUSD: (v) => v,
  isLoading: false,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  // Fetch the wallet — its locked `currency` field is the single source of truth.
  // Uses the same query key as the wallet page so the navbar and wallet page
  // share the same React Query cache entry. After a top-up, invalidating
  // ['wallet'] updates both views simultaneously.
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  })

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: getExchangeRates,
    staleTime: 60 * 60 * 1000,
    placeholderData: FALLBACK_RATES,
  })

  const currency: CurrencyCode = useMemo(() => {
    if (wallet?.currency) {
      return wallet.currency as CurrencyCode
    }
    return 'USD'
  }, [wallet?.currency])

  useEffect(() => {
    if (currency && currency !== 'USD') {
      localStorage.setItem('smmhub_preferred_currency', currency)
    }
  }, [currency])

  const effectiveRates = rates || FALLBACK_RATES

  const convertFromUSD = (usdAmount: number): number => {
    if (currency === 'USD') return usdAmount
    return usdAmount * (effectiveRates[currency] || 1)
  }

  const formatPrice = (usdAmount: number, decimals?: number): string => {
    const converted = convertFromUSD(usdAmount)
    if (decimals !== undefined) {
      const { symbol } = { symbol: getSymbol(currency) }
      return `${symbol}${converted.toFixed(decimals)}`
    }
    return formatCurrencyByCode(converted, currency)
  }

  const value: CurrencyContextValue = {
    currency,
    rates: effectiveRates,
    formatPrice,
    convertFromUSD,
    isLoading: ratesLoading,
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

function getSymbol(currency: CurrencyCode): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹',
    BRL: 'R$', PHP: '₱', IDR: 'Rp', NGN: '₦', TRY: '₺',
  }
  return symbols[currency] || currency
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
