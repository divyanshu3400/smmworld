import { motion } from 'framer-motion'
import { platforms } from './landing-data'

export default function TrustBar() {
  return (
    <section className="py-16 overflow-hidden">
      <div className="px-6 mx-auto max-w-7xl mb-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Trusted by creators, agencies, businesses & resellers
        </motion.p>
      </div>
      <div className="relative">
        <div className="flex animate-marquee gap-6 w-max">
          {[...platforms, ...platforms].map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border whitespace-nowrap shrink-0 hover:border-emerald-500/30 transition-colors"
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
  )
}
