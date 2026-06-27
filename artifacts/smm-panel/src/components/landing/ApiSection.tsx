import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Check, Terminal, ArrowRight, Code as Code2 } from 'lucide-react'
import { apiCodeExample } from './landing-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

export default function ApiSection() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiCodeExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-24 px-6 mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — text */}
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-5">
            <Code2 className="h-3.5 w-3.5" />
            Developer API
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4">
            Automate everything with our API
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Full REST API compatible with standard SMM panel APIs. Place orders, check balances,
            and track status programmatically. Perfect for agencies and resellers.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              'Simple HTTP API — no SDKs required',
              'Real-time order status webhooks',
              '99.9% API uptime guarantee',
              'Full documentation and code examples',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/api-docs"
            className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-emerald-500/40 hover:bg-accent transition-all"
          >
            Read the docs <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Right — terminal window */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-2xl bg-[#0d0d0d] border border-border shadow-2xl overflow-hidden"
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1.5 ml-2 text-xs text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              <span>request.ts</span>
            </div>
            <button
              onClick={handleCopy}
              className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Code content */}
          <div className="p-5 overflow-x-auto">
            <pre className="text-sm leading-relaxed font-mono">
              <code className="text-muted-foreground">
                {apiCodeExample.split('\n').map((line, i) => {
                  const trimmed = line.trim()
                  let className = 'text-slate-300'
                  if (trimmed.startsWith('//')) className = 'text-slate-500'
                  else if (trimmed.startsWith('const') || trimmed.startsWith('let') || trimmed.startsWith('var')) className = 'text-purple-400'
                  else if (trimmed.startsWith('await') || trimmed.startsWith('fetch') || trimmed.startsWith('response')) className = 'text-blue-400'
                  else if (trimmed.startsWith("'") || trimmed.startsWith('"')) className = 'text-emerald-400'
                  else if (trimmed.startsWith('{') || trimmed.startsWith('}')) className = 'text-slate-500'
                  else if (trimmed.includes('method:') || trimmed.includes('headers:') || trimmed.includes('body:')) className = 'text-cyan-400'
                  else if (trimmed.includes('service:') || trimmed.includes('link:') || trimmed.includes('quantity:')) className = 'text-amber-400'

                  return (
                    <div key={i} className={className}>
                      <span className="text-slate-600 mr-3 select-none">{String(i + 1).padStart(2, '0')}</span>
                      {line}
                    </div>
                  )
                })}
              </code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
