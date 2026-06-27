import { motion } from 'framer-motion'
import { UserPlus, Wallet, Rocket } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

const steps = [
  {
    step: '01',
    title: 'Create Account',
    description: 'Sign up for free in seconds. No credit card required to get started.',
    icon: UserPlus,
  },
  {
    step: '02',
    title: 'Add Funds',
    description: 'Top up your wallet with UPI, cards, or crypto. Funds available instantly.',
    icon: Wallet,
  },
  {
    step: '03',
    title: 'Place Your Order',
    description: 'Choose any service, paste your link, and watch your growth happen live.',
    icon: Rocket,
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-card/30">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground text-balance">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            No technical knowledge needed. Place your first order in under 2 minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider">
                STEP {item.step}
              </div>
              <div className="mt-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <item.icon className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
