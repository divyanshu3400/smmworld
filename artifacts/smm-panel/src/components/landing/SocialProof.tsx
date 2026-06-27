import { motion } from 'framer-motion'
import { ShoppingCart, Users, Award, TrendingUp, Globe, Headphones } from 'lucide-react'
import { usePublicStats } from '@/hooks/usePublicStats'
import { CountUp } from '@/components/ui/CountUp'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function SocialProof() {
  const { data: stats, isLoading: statsLoading } = usePublicStats()

  const totalOrders = stats?.totalOrders ?? 0
  const totalCustomers = stats?.totalCustomers ?? 0

  const statCards = [
    { value: totalOrders, label: 'Orders Completed', icon: ShoppingCart, suffix: '+', fallback: '2.5M+' },
    { value: 99, label: 'Success Rate', icon: TrendingUp, suffix: '.98%', fallback: '99.98%' },
    { value: totalCustomers, label: 'Active Users', icon: Users, suffix: '+', fallback: '850K+' },
    { value: 1000, label: 'Services Available', icon: Award, suffix: '+', fallback: '1,000+' },
    { value: 100, label: 'Countries Served', icon: Globe, suffix: '+', fallback: '100+' },
    { value: 24, label: 'Support Available', icon: Headphones, suffix: '/7', fallback: '24/7' },
  ]

  return (
    <section className="py-14 border-y border-border bg-card/50">
      <div className="px-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {statCards.map((s, i) => (
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
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                {statsLoading || s.value === 0 ? s.fallback : <CountUp end={s.value} suffix={s.suffix} duration={1800} />}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
