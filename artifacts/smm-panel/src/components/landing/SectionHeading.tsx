import { motion } from 'framer-motion'

interface SectionHeadingProps {
  badge?: string
  title: string
  subtitle?: string
  center?: boolean
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function SectionHeading({ badge, title, subtitle, center = true }: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={fadeUp}
      className={center ? 'text-center mb-16' : 'mb-16'}
    >
      {badge && (
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
          {badge}
        </p>
      )}
      <h2 className="text-3xl sm:text-5xl font-bold text-foreground text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg text-muted-foreground max-w-xl ${center ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
