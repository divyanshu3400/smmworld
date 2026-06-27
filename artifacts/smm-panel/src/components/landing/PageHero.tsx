import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface PageHeroProps {
  badge?: string
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function PageHero({ badge, title, subtitle, breadcrumbs }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-emerald-500/8 blur-[100px] animate-glow-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-teal-500/6 blur-[80px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute inset-0 bg-grid opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl text-center">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-1.5 mb-6 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-emerald-500 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            ))}
          </motion.nav>
        )}

        {badge && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6"
          >
            {badge}
          </motion.div>
        )}

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground text-balance"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  )
}
