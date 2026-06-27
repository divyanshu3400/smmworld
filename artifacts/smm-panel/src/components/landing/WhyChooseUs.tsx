import { motion } from 'framer-motion'
import { Zap, Shield, RefreshCcw, Clock, Headphones, ChartBar as BarChart2, Lock, Code, Globe } from 'lucide-react'
import { features } from './landing-data'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Shield, RefreshCcw, Clock, Headphones, BarChart2, Lock, Code, Globe,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function WhyChooseUs() {
  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
            Why Us
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground text-balance">
            Built for serious growth
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Every feature is designed around reliability, speed, and your account's safety
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon]
            return (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i % 3}
                variants={fadeUp}
                className="group relative flex gap-4 p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
              >
                <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  {Icon && <Icon className="h-5 w-5 text-emerald-500" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
