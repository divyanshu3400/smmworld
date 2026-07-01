// src/components/orders/ServiceSelector.tsx
import { Search, ListFilter as Filter, Loader as Loader2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import type { SMMService } from '@/services/smm-api.service'
import type { useOrderState } from '@/hooks/useOrderState'

type OrderState = ReturnType<typeof useOrderState>

export default function ServiceSelector(
    props: OrderState & { onSelect: (s: SMMService) => void; maxHeight?: string; selectedServiceId?: number }
) {
    const {
        search, setSearch, debouncedSearch,
        selectedCategory, setSelectedCategory,
        categories, categoriesLoading,
        services, servicesLoading,
        onSelect, maxHeight = 'max-h-96',
        selectedServiceId,
    } = props

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search services..."
                        className="pl-9 pr-8 h-9 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={categoriesLoading}>
                    <SelectTrigger className="w-full sm:flex-1 h-9 text-sm">
                        <Filter className="mr-2 h-3.5 w-3.5 shrink-0" />
                        {categoriesLoading ? (
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                            </span>
                        ) : (
                            <SelectValue placeholder="All Categories" />
                        )}
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!servicesLoading && selectedCategory !== 'all' && (
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">
                        {services.length} service{services.length !== 1 ? 's' : ''}
                        {debouncedSearch && ` matching "${debouncedSearch}"`}
                    </p>
                    {(debouncedSearch || selectedCategory !== 'all') && (
                        <button
                            onClick={() => { setSearch(''); setSelectedCategory('all') }}
                            className="text-xs text-emerald-500 hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {servicesLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : selectedCategory === 'all' ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Filter className="h-8 w-8 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Select a category to view services</p>
                </div>
            ) : services.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No services found</p>
                </div>
            ) : (
                <div className={`grid gap-3 sm:grid-cols-2 ${maxHeight} overflow-y-auto pr-2`}>
                    {services.map((service) => {
                        const isSelected = service.service === selectedServiceId
                        return (
                            <div
                                key={service.service}
                                className={`flex flex-col p-3 rounded-lg border transition-colors group cursor-pointer ${isSelected
                                    ? 'border-emerald-500 bg-emerald-500/5'
                                    : 'border-border hover:border-emerald-500/50'
                                    }`}
                                onClick={() => onSelect(service)}
                            >


                                <div className={`text-sm font-medium line-clamp-2 mb-2 transition-colors ${isSelected ? 'text-emerald-500' : 'group-hover:text-emerald-500'
                                    }`}>
                                    {service.name}
                                </div>

                                <div className="flex items-center justify-between text-xs mt-auto">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <span className="text-xs text-muted-foreground">ID: {service.service}</span>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                    </div>
                                    <span className="font-semibold text-emerald-500">₹{Number(service.rate).toFixed(4)}/1K</span>
                                    <span className="text-muted-foreground">
                                        {Number(service.min).toLocaleString()} – {Number(service.max).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}