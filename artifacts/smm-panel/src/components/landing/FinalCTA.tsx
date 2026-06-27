import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { usePublicStats } from '@/hooks/usePublicStats'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`
  return n.toLocaleString()
}

export default function FinalCTA() {
  const { data: stats, isLoading: statsLoading } = usePublicStats()
  const totalCustomers = stats?.totalCustomers ?? 0

  return (
    <section className="py-24 px-6 mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-10 sm:p-16 text-center"
      >
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-teal-300/20 blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative">
          <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
            Ready to grow your<br className="hidden sm:block" /> social media?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Join {statsLoading ? '850,000+' : formatCompact(totalCustomers)} customers who trust us to grow their online presence every day.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-bold text-emerald-600 shadow-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Growing Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
  )
}
