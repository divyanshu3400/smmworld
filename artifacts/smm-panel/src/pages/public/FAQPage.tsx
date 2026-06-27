import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Headphones, Mail, MessageSquare, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHero from '@/components/landing/PageHero'
import SectionHeading from '@/components/landing/SectionHeading'
import CTASection from '@/components/landing/CTASection'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const faqCategories = [
  {
    category: 'Getting Started',
    questions: [
      { q: 'What is SMMHub?', a: 'SMMHub is a social media marketing platform that helps you grow your presence on Instagram, YouTube, TikTok, Facebook, and 30+ other platforms with real, high-quality engagement.' },
      { q: 'How do I create an account?', a: 'Click "Get Started" on our homepage, enter your email and password, and you are ready to go. No credit card required to sign up.' },
      { q: 'Do I need to provide my password?', a: 'Never. We only need your public profile link or post URL. We will never ask for your account password.' },
      { q: 'Is it free to join?', a: 'Yes, creating an account is completely free. You only pay when you place an order, and you can add funds to your wallet at any time.' },
    ],
  },
  {
    category: 'Orders & Delivery',
    questions: [
      { q: 'How fast will my order start?', a: 'Most orders start within minutes. Some services may take longer depending on the platform and quantity. You can track progress live in your dashboard.' },
      { q: 'Can I track my order?', a: 'Yes, every order has a live status tracker in your dashboard. You can see start count, remaining count, and completion status in real-time.' },
      { q: 'What if my order does not complete?', a: 'If an order fails to deliver, you receive an automatic refund to your wallet. If it is partially delivered, you get a refund for the undelivered portion.' },
      { q: 'Can I cancel an order?', a: 'Orders can be cancelled before they enter processing. Once processing begins, cancellation is not possible. Contact support immediately if you need to cancel.' },
    ],
  },
  {
    category: 'Payments & Refunds',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept credit/debit cards, UPI, net banking, and cryptocurrency. All payments are processed securely through trusted gateways.' },
      { q: 'How do refunds work?', a: 'Wallet refunds are instant. Refunds to original payment methods take 5-7 business days. See our Refund Policy for full details.' },
      { q: 'Is my wallet balance refundable?', a: 'Wallet balances can be refunded to the original payment method at our discretion, subject to a processing fee.' },
      { q: 'Do you offer bulk discounts?', a: 'Yes, we offer volume discounts for large orders and reseller accounts. Contact our sales team for custom pricing.' },
    ],
  },
  {
    category: 'API & Resellers',
    questions: [
      { q: 'Do you have an API?', a: 'Yes, we provide a full REST API compatible with standard SMM panel APIs. You can automate orders, check balances, and track status programmatically.' },
      { q: 'How do I get my API key?', a: 'Your API key is available in your dashboard under Settings. You can regenerate it at any time.' },
      { q: 'What are the API rate limits?', a: 'We allow 60 requests per minute, 1,000 per hour, and 10,000 per day. Contact us if you need higher limits.' },
      { q: 'Can I resell your services?', a: 'Absolutely. Many of our customers are resellers. Our API makes it easy to integrate our services into your own panel.' },
    ],
  },
]

const popularQuestions = [
  'Is it safe to use for my accounts?',
  'How fast will I see results?',
  'What payment methods do you accept?',
  'Do you support API access?',
]

export default function FAQPage() {
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', ...faqCategories.map(c => c.category)]

  const filteredFaqs = faqCategories
    .filter(c => activeCategory === 'All' || c.category === activeCategory)
    .flatMap(c => c.questions.map(q => ({ ...q, category: c.category })))
    .filter(q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        badge="FAQ"
        title="Frequently asked questions"
        subtitle="Find answers to the most common questions about SMMHub. Can't find what you are looking for? Our support team is here to help."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]}
      />

      {/* Search */}
      <section className="py-8 px-6 mx-auto max-w-3xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full bg-card border border-border text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Popular Questions */}
      {search === '' && activeCategory === 'All' && (
        <section className="py-8 px-6 mx-auto max-w-3xl">
          <div className="rounded-2xl bg-card border border-border p-6 mb-12">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Popular Questions
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {popularQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setSearch(q)}
                  className="text-left text-sm text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ List */}
      <section className="py-8 px-6 mx-auto max-w-3xl">
        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => {
            const id = `${faq.category}-${i}`
            return (
              <motion.div
                key={id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenId(openId === id ? null : id)}
                >
                  <div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block mb-1">
                      {faq.category}
                    </span>
                    <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      openId === id ? 'text-emerald-500 rotate-180' : 'text-muted-foreground'
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openId === id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No questions match your search. Try different keywords or contact support.</p>
          </div>
        )}
      </section>

      {/* Still Need Help */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <SectionHeading badge="Still Need Help?" title="We are here for you" subtitle="Our support team is available 24/7 to answer any questions you might have" />
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              to="/contact"
              className="group rounded-2xl bg-card border border-border p-8 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">Get help via email. Average response time under 2 hours.</p>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                Contact Us <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <div className="rounded-2xl bg-card border border-border p-8">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">Chat with our support team in real-time, 24/7.</p>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Headphones className="h-4 w-4" /> Available 24/7
              </span>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to get started?"
        subtitle="Join 850,000+ customers who trust SMMHub with their social media growth."
      />
    </div>
  )
}
