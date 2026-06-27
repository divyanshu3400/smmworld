import { motion } from 'framer-motion'
import { Star, BadgeCheck } from 'lucide-react'
import { testimonials } from './landing-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function Reviews() {
  return (
    <section className="py-24 px-6 mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mb-16"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
          Testimonials
        </p>
        <h2 className="text-3xl sm:text-5xl font-bold text-foreground text-balance">
          Trusted by thousands
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Join 850,000+ creators, agencies, and businesses who grow with us
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i % 3}
            variants={fadeUp}
            className="flex flex-col p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <BadgeCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm flex-1">"{t.text}"</p>
            <div className="mt-5 flex items-center gap-3 pt-5 border-t border-border">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
