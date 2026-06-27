import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock, Star } from 'lucide-react'
import { services } from './landing-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const categories = ['All', 'Instagram', 'YouTube', 'TikTok']

export default function ServicesShowcase() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? services : services.filter(s => s.platform === filter)

  return (
    <section id="services" className="py-24 px-6 mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-12"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
          Services
        </p>
        <h2 className="text-3xl sm:text-5xl font-bold text-foreground text-balance">
          Most Popular Services
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Hand-picked services with the best quality-to-price ratio
        </p>
      </motion.div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === cat
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item, i) => (
          <motion.div
            key={`${item.platform}-${item.service}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i % 3}
            variants={fadeUp}
            className="group relative rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1"
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

            {/* Delivery + quality badges */}
            <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                {item.delivery}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
                {item.quality}
              </span>
            </div>

            <ul className="space-y-2 mb-5">
              {item.features.map((f, fi) => (
                <li key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />{f}
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
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:gap-3 transition-all"
        >
          Explore all 1,000+ services <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
