import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Shield, RefreshCcw, Clock, Headphones, BarChart2,
  ArrowRight, Check, Star, ChevronDown, ChevronUp,
  TrendingUp, Users, ShoppingCart, Award,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
}

const platforms = [
  { name: 'Instagram', color: 'from-pink-500 to-orange-400', path: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.987.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.054-.058 1.37-.058 4.04 0 2.672.01 2.988.058 4.042.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.04.058 2.672 0 2.988-.01 4.042-.058.975-.045 1.504-.207 1.857-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.054.058-1.37.058-4.042 0-2.67-.01-2.986-.058-4.04-.045-.975-.207-1.504-.344-1.857a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.059-4.042-.059zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z' },
  { name: 'YouTube', color: 'from-red-500 to-red-600', path: 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z' },
  { name: 'TikTok', color: 'from-slate-800 to-slate-900', path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.82a8.16 8.16 0 004.77 1.52V6.9a4.85 4.85 0 01-1-.21z' },
  { name: 'Facebook', color: 'from-blue-600 to-blue-700', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { name: 'Twitter/X', color: 'from-slate-700 to-slate-900', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { name: 'Telegram', color: 'from-sky-500 to-sky-600', path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  { name: 'Spotify', color: 'from-green-500 to-green-600', path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
  { name: 'LinkedIn', color: 'from-blue-700 to-blue-800', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
]

const stats = [
  { value: '500K+', label: 'Orders Completed', icon: ShoppingCart },
  { value: '150K+', label: 'Happy Customers', icon: Users },
  { value: '1,000+', label: 'Services Available', icon: Award },
  { value: '99.9%', label: 'Uptime Guaranteed', icon: TrendingUp },
]

const steps = [
  {
    step: '01',
    title: 'Create Account',
    description: 'Sign up for free in seconds. No credit card required to get started.',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    step: '02',
    title: 'Add Funds',
    description: 'Top up your wallet with UPI, cards, or crypto. Funds available instantly.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    step: '03',
    title: 'Place Your Order',
    description: 'Choose any service, paste your link, and watch your growth happen live.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
]

const services = [
  { platform: 'Instagram', service: 'Followers', price: '$0.50', per: 'per 1000', features: ['High Quality Profiles', 'Instant Start', 'Refill Guarantee'], badge: 'Best Seller' },
  { platform: 'Instagram', service: 'Likes', price: '$0.30', per: 'per 1000', features: ['Real Users', 'Fast Delivery', 'No Drop Policy'], badge: null },
  { platform: 'YouTube', service: 'Views', price: '$1.00', per: 'per 1000', features: ['Real Watch Time', 'Monetizable Safe', 'Retention Views'], badge: 'Popular' },
  { platform: 'YouTube', service: 'Subscribers', price: '$2.00', per: 'per 1000', features: ['Real Subscribers', 'Lifetime Warranty', 'No Drop'], badge: null },
  { platform: 'TikTok', service: 'Followers', price: '$0.80', per: 'per 1000', features: ['High Quality', 'Fast Start', '30-Day Refill'], badge: 'Trending' },
  { platform: 'TikTok', service: 'Views', price: '$0.20', per: 'per 1000', features: ['Real Views', 'Viral Boost Ready', 'Instant Delivery'], badge: null },
]

const features = [
  { icon: Zap, title: 'Instant Delivery', description: 'Orders start within seconds. Real-time progress tracking from your dashboard.' },
  { icon: Shield, title: 'Safe & Secure', description: 'We never ask for your password. Only your public profile link is needed.' },
  { icon: RefreshCcw, title: 'Refill Guarantee', description: 'Experiencing drops? We refill your order for free within the guarantee period.' },
  { icon: Clock, title: 'Always On', description: '99.9% uptime with automated order processing running 24/7 with no downtime.' },
  { icon: Headphones, title: '24/7 Support', description: 'Our expert team is available around the clock via live chat and email.' },
  { icon: BarChart2, title: 'Live Order Tracking', description: 'Monitor your order completion in real-time directly from your dashboard.' },
]

const testimonials = [
  { name: 'Arjun Sharma', handle: '@arjun.smm', avatar: 'AS', rating: 5, text: 'Switched from 3 different panels to SMMHub and never looked back. The delivery speed and quality is unmatched. My clients love the results.' },
  { name: 'Priya Nair', handle: '@priya_digital', avatar: 'PN', rating: 5, text: 'Finally a panel that actually works in India with UPI payments. Orders process within minutes and support is incredibly responsive.' },
  { name: 'Rahul Mehta', handle: '@rahulmehta_ig', avatar: 'RM', rating: 5, text: 'Running an agency and SMMHub has completely transformed how we deliver results. The API integration is smooth and the prices are the best I\'ve found.' },
]

const faqs = [
  { q: 'Is it safe to use for my accounts?', a: 'Absolutely. We never request your password or login credentials. All services only require your public profile URL or username. Your account security is never at risk.' },
  { q: 'How fast will I see results?', a: 'Most orders begin within minutes of placement. Completion times vary by service and quantity — typically a few hours to a few days. You can track progress live in your dashboard.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, all major credit & debit cards, net banking, and cryptocurrency. Funds are added to your wallet instantly and can be used across all services.' },
  { q: 'What if my order doesn\'t complete?', a: 'We offer automatic refunds or refills for incomplete orders. If you experience a drop after delivery, our refill guarantee covers you for the stated period.' },
  { q: 'Do you support API access?', a: 'Yes! We provide a full REST API compatible with standard SMM panel APIs. Perfect for agencies and resellers who want to automate orders.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/8 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-500/8 dark:bg-teal-500/6 blur-[100px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%2310b981' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative w-full px-6 py-28 mx-auto max-w-7xl sm:py-36 lg:py-44">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* left content */}
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                #1 SMM Panel in India
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-foreground">
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
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
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
                    <Check className="h-4 w-4 text-emerald-500" />
                    {t}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* right — decorative dashboard card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* main card */}
                <div className="rounded-2xl bg-card border border-border p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Orders</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">12,849</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Instagram Followers', pct: 82, color: 'bg-pink-500' },
                      { label: 'YouTube Views', pct: 65, color: 'bg-red-500' },
                      { label: 'TikTok Likes', pct: 54, color: 'bg-slate-700' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{item.label}</span>
                          <span>{item.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${item.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.pct}%` }}
                            transition={{ delay: 0.8, duration: 0.9, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* floating stat pill — top right */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="absolute -top-5 -right-4 rounded-xl bg-card border border-border px-4 py-3 shadow-lg flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Delivery</p>
                    <p className="text-sm font-bold text-foreground">under 2 min</p>
                  </div>
                </motion.div>

                {/* floating stat pill — bottom left */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="absolute -bottom-5 -left-4 rounded-xl bg-card border border-border px-4 py-3 shadow-lg flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Happy Clients</p>
                    <p className="text-sm font-bold text-foreground">150,000+</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-14 border-y border-border bg-card/50">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-1">
                  <s.icon className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Marquee ── */}
      <section className="py-16 overflow-hidden">
        <div className="px-6 mx-auto max-w-7xl mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            All platforms supported
          </p>
        </div>
        <div className="relative">
          <div className="flex animate-marquee gap-6 w-max">
            {[...platforms, ...platforms].map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border whitespace-nowrap shrink-0"
              >
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d={p.path} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Up and running in minutes</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              No technical knowledge needed. Place your first order in under 2 minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-emerald-500/40" style={{ top: '4rem' }} />

            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-colors"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider">
                  STEP {item.step}
                </div>
                <div className="mt-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-5">
                  <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Services ── */}
      <section id="services" className="py-24 px-6 mx-auto max-w-7xl">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Services</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Most Popular Services</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Hand-picked services with the best quality-to-price ratio
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="show" viewport={{ once: true }} custom={i % 3} variants={fadeUp}
              className="group relative rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
            >
              {item.badge && (
                <div className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/30">
                  {item.badge}
                </div>
              )}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
                    {item.platform}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">{item.service}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{item.price}</div>
                  <div className="text-xs text-muted-foreground">{item.per}</div>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {item.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/services"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors group-hover:gap-3"
              >
                Order Now <ArrowRight className="h-4 w-4 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/services" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:gap-3 transition-all">
            Explore all 1,000+ services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Why Us</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Built for serious growth</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Every feature is designed around reliability, speed, and your account's safety
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={i % 3} variants={fadeUp}
                className="flex gap-4 p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-colors"
              >
                <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 mx-auto max-w-7xl">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Trusted by thousands</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Don't just take our word for it
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} variants={fadeUp}
              className="flex flex-col p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm flex-1">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3 pt-5 border-t border-border">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.handle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-card/30">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Common questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.5} variants={fadeUp}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-5"
                  >
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 mx-auto max-w-7xl">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
              Ready to grow your<br className="hidden sm:block" /> social media?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Join 150,000+ customers who trust us to grow their online presence every day.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-bold text-emerald-600 shadow-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Growing Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-10 py-4 text-base font-semibold text-white hover:bg-white/25 transition-all duration-200"
              >
                View Services
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
