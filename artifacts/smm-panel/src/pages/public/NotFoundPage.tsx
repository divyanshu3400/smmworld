import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hop as Home, Search, ArrowRight, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[120px] animate-glow-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-teal-500/6 blur-[100px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute inset-0 bg-grid opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

      <div className="relative text-center max-w-2xl">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <h1 className="text-[120px] sm:text-[180px] font-bold leading-none bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            404
          </h1>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-6 -right-2 sm:right-10 h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg"
          >
            <Compass className="h-8 w-8 text-emerald-500 animate-spin" style={{ animationDuration: '8s' }} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-balance">
            Oops, this page took a wrong turn
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            The page you are looking for might have been moved, deleted, or possibly never existed.
            Even the best algorithms get lost sometimes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <Link
              to="/services"
              className="group inline-flex items-center gap-2 rounded-full bg-card border border-border px-8 py-4 text-base font-semibold text-foreground hover:border-emerald-500/40 hover:bg-accent transition-all duration-200"
            >
              <Search className="h-4 w-4" />
              Browse Services
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-8 top-1/4 h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg hidden sm:flex"
        >
          <span className="text-2xl">?</span>
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -right-8 bottom-1/4 h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg hidden sm:flex"
        >
          <span className="text-2xl">!</span>
        </motion.div>
      </div>
    </div>
  )
}
