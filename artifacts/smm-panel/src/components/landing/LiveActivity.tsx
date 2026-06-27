import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { liveActivity } from './landing-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const actionColors: Record<string, string> = {
  ordered: 'text-emerald-500',
  completed: 'text-blue-500',
  refilled: 'text-amber-500',
}

export default function LiveActivity() {
  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Activity
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground text-balance">
            Orders happening right now
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Real-time feed of orders being placed and completed across the platform
          </p>
        </motion.div>

        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-background/50">
            <Radio className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-foreground">Live Order Feed</span>
            <span className="ml-auto text-xs text-muted-foreground">Updated in real-time</span>
          </div>
          <div className="divide-y divide-border">
            {liveActivity.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {item.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{item.user}</span>{' '}
                    <span className={actionColors[item.action]}>{item.action}</span>{' '}
                    <span className="font-semibold">{item.amount}</span>{' '}
                    <span className="text-muted-foreground">{item.service}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  <span className="text-xs font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-accent">{item.country}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
