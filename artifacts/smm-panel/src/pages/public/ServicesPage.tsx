import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Instagram, Facebook, Youtube, Music2, Twitter, Send, Music, Linkedin, Package } from 'lucide-react'
import { getServices, categorizeServices, type SMMService } from '@/services/smm-api.service'
import { Card, CardContent } from '@/components/ui/card'
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

export default function ServicesPage() {
  const [services, setServices] = useState<SMMService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const data = await getServices()
        setServices(data)
        setError(null)
      } catch (err) {
        setError('Failed to load services. Please try again later.')
        console.error(err)
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
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.service.toString().includes(q)
      )
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

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-emerald-900/20 via-background to-indigo-900/20 py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Our Services</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our catalog of {services.length}+ services for all major social media platforms.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-500">{services.length}+</div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-500">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-500">
                {formatPrice(
                  services.length > 0
                    ? Math.min(...services.map((s) => parseFloat(s.rate)).filter((r) => r > 0))
                    : 0.001
                )}
              </div>
              <div className="text-sm text-muted-foreground">Starting Price</div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-10 h-12 bg-card"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                />
              </div>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-card">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {categories.filter(c => c !== 'all').map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 h-12 bg-card">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Filter Pills */}
      <section className="py-6 px-6 border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            <button
              onClick={() => { setSelectedCategory('all'); setCurrentPage(1) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' ? 'bg-emerald-500 text-white' : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              All
            </button>
            {categories.filter(c => c !== 'all').map((cat) => {
              const Icon = platformIcons[cat] || Package
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat ? 'bg-emerald-500 text-white' : 'bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="text-center py-16">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedServices.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredServices.length)} of {filteredServices.length} services
              </div>

              <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedServices.map((service) => {
                  const rate = parseFloat(service.rate)
                  const min = parseInt(service.min)
                  const max = parseInt(service.max)

                  return (
                    <motion.div key={service.service} variants={item}>
                      <Card className="h-full hover:border-emerald-500/50 transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                              ID: {service.service}
                            </Badge>
                            <div className="text-right">
                              <div className="font-bold text-foreground">{formatPrice(rate, 4)}</div>
                              <div className="text-xs text-muted-foreground">per 1000</div>
                            </div>
                          </div>
                          <h3 className="font-medium text-foreground mb-2 line-clamp-2 group-hover:text-emerald-500 transition-colors">
                            {service.name}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div><span className="font-medium">Min:</span> {min.toLocaleString()}</div>
                            <div><span className="font-medium">Max:</span> {max.toLocaleString()}</div>
                          </div>
                          <Link
                            to="/signup"
                            className="mt-4 w-full block text-center py-2 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            Order Now
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
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
        </div>
      </section>
    </div>
  )
}
