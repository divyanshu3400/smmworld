// src/hooks/useOrderState.ts
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getServices, getCategories, type SMMService } from '@/services/smm-api.service'
import { detectPlatformFromCategory } from '@/lib/platformDetector'

export function useOrderState() {
    const [selectedService, setSelectedService] = useState<SMMService | null>(null)
    const [orderLink, setOrderLink] = useState('')
    const [orderQuantity, setOrderQuantity] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['smm-categories'],
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000,
    })

    const platform = detectPlatformFromCategory(
        selectedCategory === 'all' ? undefined : selectedCategory
    )

    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: ['smm-services', selectedCategory, debouncedSearch, platform],
        queryFn: () =>
            getServices({
                category: selectedCategory === 'all' ? undefined : selectedCategory,
                search: debouncedSearch || undefined,
                platform,
            }),
        enabled: selectedCategory !== 'all' && selectedCategory !== '',
        staleTime: 5 * 60 * 1000,
    })

    const calculatePrice = (): number => {
        if (!selectedService || !orderQuantity) return 0
        const qty = Number(orderQuantity)
        const rate = Number(selectedService.rate)
        return Number(((rate * qty) / 1000).toFixed(4))
    }

    const selectService = (service: SMMService, prefillLink = '') => {
        setSelectedService(service)
        setOrderQuantity(service.min)
        if (prefillLink) setOrderLink(prefillLink)
    }

    const reset = () => {
        setSelectedService(null)
        setOrderLink('')
        setOrderQuantity('')
    }

    return {
        selectedService, selectService, reset,
        orderLink, setOrderLink,
        orderQuantity, setOrderQuantity,
        selectedCategory, setSelectedCategory,
        search, setSearch, debouncedSearch,
        categories, categoriesLoading,
        services, servicesLoading,
        platform,
        calculatePrice,
    }
}