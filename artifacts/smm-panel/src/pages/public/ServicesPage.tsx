import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ListFilter as Filter, Drama as Instagram, Notebook as Facebook, Route as Youtube, Music2, Battery as Twitter, Send, Music, Link as Linkedin, Package, Clock, Star, TrendingUp, Sparkles, X } from 'lucide-react'
import { getServices, categorizeServices, type SMMService } from '@/services/smm-api.service'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from 'react-router-dom'
import { useCurrency } from '@/contexts/CurrencyContext'
import PageHero from '@/components/landing/PageHero'
import CTASection from '@/components/landing/CTASection'

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  twitter: Twitter,
  telegram: Send,
  spotify: Music,
  linkedin: Linkedin,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function ServicesPage() {
  const [services, setServices] = useState<SMMService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [selectedService, setSelectedService] = useState<SMMService | null>(null)
  const itemsPerPage = 24

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const data = await getServices()
        setServices(data)
        setError(null)
      } catch (err) {
        setError('Failed to load services. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const { formatPrice } = useCurrency()
  const categorizedServices = useMemo(() => categorizeServices(services), [services])

  const categories = useMemo(() => {
    const cats = Array.from(categorizedServices.keys())
    return ['all', ...cats]
  }, [categorizedServices])

  const filteredServices = useMemo(() => {
    let filtered = services
    if (selectedCategory !== 'all') {
      filtered = categorizedServices.get(selectedCategory) || []
    }
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.service.toString().includes(q))
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return parseFloat(a.rate) - parseFloat(b.rate)
      if (sortBy === 'price-desc') return parseFloat(b.rate) - parseFloat(a.rate)
      return a.name.localeCompare(b.name)
    })
  }, [services, selectedCategory, search, sortBy, categorizedServices])

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredServices.slice(start, start + itemsPerPage)
  }, [filteredServices, currentPage])

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        badge="Services"
        title="Browse our service catalog"
        subtitle="Over 1,000+ services for every major social media platform. Find exactly what you need to grow."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
      />

      {/* Stats Bar */}
      <section className="py-8 px-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Services', value: services.length || 1000, suffix: '+', icon: Package },
            { label: 'Platforms', value: categories.length - 1 || 8, suffix: '+', icon: Sparkles },
            { label: 'Min Price', value: 0.001, prefix: '$', icon: TrendingUp, isPrice: true },
            { label: 'Avg Delivery', value: 2, suffix: ' min', icon: Clock },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="rounded-2xl bg-card border border-border p-5 text-center"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                {stat.isPrice ? formatPrice(stat.value, 3) : `${stat.prefix || ''}${stat.value}${stat.suffix || ''}`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="py-6 px-6 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-11 h-12 bg-card rounded-full"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-card rounded-full">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {categories.map(cat => {
            const Icon = cat === 'all' ? Package : platformIcons[cat] || Package
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat === 'all' ? 'All Platforms' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            )
          })}
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-8 px-6 mx-auto max-w-7xl">
        {error && (
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedServices.length > 0 ? (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredServices.length)} of {filteredServices.length} services
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedServices.map(service => {
                const rate = parseFloat(service.rate)
                const min = parseInt(service.min)
                const max = parseInt(service.max)
                const isFavorite = favorites.has(service.service)

                return (
                  <motion.div key={service.service} variants={item}>
                    <div
                      onClick={() => setSelectedService(service)}
                      className="group rounded-2xl bg-card border border-border p-5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                          ID: {service.service}
                        </Badge>
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavorite(service.service) }}
                          className="text-muted-foreground hover:text-amber-400 transition-colors"
                          aria-label="Add to favorites"
                        >
                          <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                      <h3 className="font-medium text-foreground mb-3 line-clamp-2 group-hover:text-emerald-500 transition-colors min-h-[2.5rem]">
                        {service.name}
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-foreground">{rate} INR</div>
                          <div className="text-xs text-muted-foreground">per 1000</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Min: {min.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Max: {max.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        <span>~2 min delivery</span>
                      </div>
                      <Link
                        to="/signup"
                        onClick={e => e.stopPropagation()}
                        className="block w-full text-center py-2 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium text-sm hover:bg-emerald-500/20 transition-colors"
                      >
                        Order Now
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number
                    if (totalPages <= 5) page = i + 1
                    else if (currentPage <= 3) page = i + 1
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                    else page = currentPage - 2 + i

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        className={currentPage === page ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            <Button
              variant="link"
              className="mt-4 text-emerald-500"
              onClick={() => { setSearch(''); setSelectedCategory('all') }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>

      {/* Service Details Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedService(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-card border border-border p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 mb-2">
                  ID: {selectedService.service}
                </Badge>
                <h3 className="text-xl font-bold text-foreground">{selectedService.name}</h3>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border">
                <span className="text-sm text-muted-foreground">Price per 1000</span>
                <span className="font-bold text-foreground">{selectedService.rate} INR</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border">
                <span className="text-sm text-muted-foreground">Minimum Order</span>
                <span className="font-bold text-foreground">{parseInt(selectedService.min).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border">
                <span className="text-sm text-muted-foreground">Maximum Order</span>
                <span className="font-bold text-foreground">{parseInt(selectedService.max).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border">
                <span className="text-sm text-muted-foreground">Avg Delivery</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4 text-emerald-500" /> ~2 min
                </span>
              </div>
            </div>

            <Link
              to="/signup"
              className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 hover:-translate-y-0.5 transition-all"
            >
              Sign up to order <TrendingUp className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      )}

      <CTASection
        title="Ready to place your first order?"
        subtitle="Sign up for free and get instant access to all 1,000+ services. No credit card required."
      />
    </div>
  )
}
