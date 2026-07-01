import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Zap, TrendingUp, Users, Wallet, Activity, ShoppingCart } from 'lucide-react'
import { usePublicStats } from '@/hooks/usePublicStats'
import { CountUp } from '@/components/ui/CountUp'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`
  return n.toLocaleString()
}

export default function HeroSection() {
  const { data: stats, isLoading: statsLoading } = usePublicStats()

  const totalOrders = stats?.totalOrders ?? 0
  const totalCustomers = stats?.totalCustomers ?? 0
  const ordersToday = stats?.ordersToday ?? 0

  return (
    <section className="relative overflow-hidden min-h-[92vh] flex items-center">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/8 blur-[120px] animate-glow-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-500/8 dark:bg-teal-500/6 blur-[100px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </div>
      <div className="absolute inset-0 bg-grid opacity-[0.025] dark:opacity-[0.04] pointer-events-none" />

      <div className="relative w-full px-6 py-28 mx-auto max-w-7xl sm:py-5 lg:py-5">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left column */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              #1 SMM Panel in India
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-foreground text-balance">
              Grow Your<br />
              Social Media{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                Faster
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
              The most trusted SMM panel for Instagram, YouTube, TikTok, Facebook and more.
              Boost your engagement instantly with premium-quality services.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-card border border-border px-8 py-4 text-base font-semibold text-foreground hover:border-emerald-500/40 hover:bg-accent transition-all duration-200"
              >
                Browse Services
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {['No credit card required', 'Instant setup', '24/7 support'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />{t}
                </span>
              ))}
            </motion.div>

            {/* Rating + payment trust */}
            <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5 from 12,000+ reviews</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column — interactive admin dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main dashboard card */}
              <div className="rounded-2xl bg-card border border-border p-6 shadow-2xl animate-border-glow">
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Dashboard</p>
                      <p className="text-xs text-muted-foreground">Live overview</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
                  </div>
                </div>

                {/* Revenue + wallet row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-background/50 border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Revenue</p>
                      <Wallet className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? <span className="animate-pulse text-muted-foreground">—</span> : <>${(totalOrders * 0.05).toFixed(0)}</>}
                    </p>
                    <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> +12.5%
                    </p>
                  </div>
                  <div className="rounded-xl bg-background/50 border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Orders</p>
                      <ShoppingCart className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? <span className="animate-pulse text-muted-foreground">—</span> : <CountUp end={totalOrders} duration={1600} />}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statsLoading ? 'Loading...' : <><CountUp end={ordersToday} duration={1200} /> today</>}
                    </p>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="rounded-xl bg-background/50 border border-border p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Weekly Activity</p>
                    <span className="text-xs text-emerald-500 font-medium">+24%</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 55, 45, 70, 60, 85, 75].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-500"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                  {[
                    { label: 'Instagram Followers', pct: 82, color: 'bg-pink-500' },
                    { label: 'YouTube Views', pct: 65, color: 'bg-red-500' },
                    { label: 'TikTok Likes', pct: 54, color: 'bg-slate-700' },
                  ].map((item, i) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{item.label}</span><span>{item.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ delay: 0.8 + i * 0.15, duration: 0.9, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating pill — delivery time */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="absolute -top-5 right-0 rounded-xl bg-card border border-border px-4 py-3 shadow-lg flex items-center gap-3 animate-float"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Delivery</p>
                  <p className="text-sm font-bold text-foreground">under 2 min</p>
                </div>
              </motion.div>

              {/* Floating pill — happy clients */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="absolute -bottom-5 left-0 rounded-xl bg-card border border-border px-4 py-3 shadow-lg flex items-center gap-3 animate-float-delayed"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Happy Clients</p>
                  <p className="text-sm font-bold text-foreground">
                    {statsLoading ? '—' : formatCompact(totalCustomers)}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
