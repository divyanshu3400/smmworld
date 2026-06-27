import { motion } from 'framer-motion'
import { Check, X, Clock, RefreshCw, Wallet, CreditCard, Headphones, CircleAlert as AlertCircle } from 'lucide-react'
import PageHero from '@/components/landing/PageHero'
import ReadingProgress from '@/components/landing/ReadingProgress'
import SectionHeading from '@/components/landing/SectionHeading'
import CTASection from '@/components/landing/CTASection'
import { faqs as faqData } from '@/components/landing/landing-data'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const eligibleItems = [
  'Orders that fail to start within the stated delivery time',
  'Orders that are partially delivered (refund for the undelivered portion)',
  'Orders cancelled by our system due to service unavailability',
  'Duplicate charges for the same order',
]

const nonRefundableItems = [
  'Orders that have been successfully completed',
  'Orders where the wrong link was submitted by the user',
  'Orders for services marked as "no refund" in the service description',
  'Wallet top-ups (unless required by law)',
]

const refundSteps = [
  { step: '01', title: 'Submit Request', description: 'Contact support with your order ID and reason for refund. You can do this from your dashboard or via email.', icon: Headphones },
  { step: '02', title: 'Review Process', description: 'Our team reviews your request within 24-48 hours. We check order status, delivery logs, and eligibility.', icon: Clock },
  { step: '03', title: 'Refund Approved', description: 'If approved, the refund is credited to your SMMHub wallet instantly. You can use it for new orders immediately.', icon: Wallet },
  { step: '04', title: 'Original Payment', description: 'For wallet-to-source refunds, the amount is returned to your original payment method within 5-7 business days.', icon: CreditCard },
]

const refundFaqs = [
  { q: 'How long does a refund take?', a: 'Wallet refunds are instant. Refunds to original payment methods take 5-7 business days depending on your bank.' },
  { q: 'Can I get a refund for a completed order?', a: 'Completed orders are non-refundable. However, if you experience a drop, our refill guarantee may apply.' },
  { q: 'What if my order is partially delivered?', a: 'You receive a partial refund for the undelivered portion. The delivered portion is charged proportionally.' },
  { q: 'How do I request a refund?', a: 'You can request a refund from your dashboard by opening a support ticket, or by emailing support@smmhub.com with your order ID.' },
  { q: 'Can wallet balance be withdrawn?', a: 'Wallet balances can be refunded to the original payment method at our discretion, subject to a processing fee.' },
]

export default function RefundPolicyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <ReadingProgress />
      <PageHero
        badge="Refund Policy"
        title="Fair and transparent refunds"
        subtitle="We believe in fair refunds. If something goes wrong with your order, we will make it right."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Refund Policy' }]}
      />

      {/* Refund Eligibility */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-2xl bg-card border border-border p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Refund Eligible</h2>
            </div>
            <ul className="space-y-3">
              {eligibleItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={1}
            variants={fadeUp}
            className="rounded-2xl bg-card border border-border p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Non-Refundable</h2>
            </div>
            <ul className="space-y-3">
              {nonRefundableItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Refund Process Timeline */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-5xl">
          <SectionHeading badge="Refund Process" title="How refunds work" subtitle="A simple 4-step process to get your refund" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {refundSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="relative"
              >
                <div className="rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/30 transition-colors h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <span className="text-2xl font-bold text-emerald-500/20">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {i < refundSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partial Refunds & Cancellation */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl bg-card border border-border p-8">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Partial Refunds</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If an order is partially delivered, you receive a refund for the undelivered portion.
              The delivered portion is charged proportionally based on the service rate.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Partial refunds are credited to your wallet automatically once the order status
              is updated to "Partial" in our system.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={fadeUp} className="rounded-2xl bg-card border border-border p-8">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Cancellation Policy</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Orders can be cancelled before they enter the processing queue. Once processing begins,
              cancellation is not possible.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To cancel an order, contact support immediately with your order ID. The faster you
              reach out, the higher the chance of successful cancellation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Processing Time & Payment Methods */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wallet, title: 'Wallet Refunds', value: 'Instant', description: 'Credited to your SMMHub wallet immediately' },
              { icon: CreditCard, title: 'Card Refunds', value: '5-7 Days', description: 'Refunded to original payment method' },
              { icon: Clock, title: 'Review Time', value: '24-48h', description: 'Time to review your refund request' },
              { icon: Headphones, title: 'Support', value: '24/7', description: 'Available round the clock for help' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="rounded-2xl bg-card border border-border p-6 text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent mb-1">
                  {item.value}
                </p>
                <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 mx-auto max-w-3xl">
        <SectionHeading badge="FAQ" title="Refund questions answered" />
        <div className="space-y-3">
          {refundFaqs.map((faq, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="rounded-xl bg-card border border-border overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                    openFaq === i ? 'text-emerald-500 rotate-180' : 'text-muted-foreground'
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
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
          ))}
        </div>
      </section>

      <CTASection
        title="Need help with a refund?"
        subtitle="Our support team is available 24/7 to help you with any refund-related questions."
        primaryLabel="Contact Support"
        primaryHref="/contact"
        secondaryLabel="Browse Services"
        secondaryHref="/services"
      />
    </div>
  )
}
