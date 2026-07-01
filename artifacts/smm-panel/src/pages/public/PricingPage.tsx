import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Calculator, TrendingUp, Users, Building2, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHero from '@/components/landing/PageHero'
import SectionHeading from '@/components/landing/SectionHeading'
import CTASection from '@/components/landing/CTASection'
import { useCurrency } from '@/contexts/CurrencyContext'
import SEO from '@/components/seo/SEO'
import { BreadcrumbJsonLD } from '@/components/seo/JsonLD'
import { pageSEO } from '@/components/seo/seo-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const plans = [
  {
    name: 'Starter',
    icon: Users,
    description: 'Perfect for individuals and small creators',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Access to 1,000+ services',
      'Instant order processing',
      'Live order tracking',
      'Email support',
      'UPI, Card & Crypto payments',
      'Basic API access (100 req/day)',
    ],
    notIncluded: ['Priority support', 'Bulk discounts', 'Custom API limits'],
    cta: 'Get Started Free',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Pro',
    icon: TrendingUp,
    description: 'For agencies and power users who need more',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'Everything in Starter',
      'Priority order processing',
      'Priority 24/7 support',
      '10% bulk discount on all orders',
      'Advanced API access (1,000 req/day)',
      'Webhook notifications',
      'Order analytics dashboard',
      'Custom service requests',
    ],
    notIncluded: ['Dedicated account manager', 'White-label options'],
    cta: 'Start Pro Trial',
    href: '/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Building2,
    description: 'For large agencies and resellers',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      '20% bulk discount on all orders',
      'Unlimited API access',
      'White-label dashboard option',
      'Custom integrations',
      'SLA guarantee (99.99% uptime)',
      'Priority refund processing',
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
]

const paymentMethods = [
  { name: 'Credit Card', icon: '💳' },
  { name: 'Debit Card', icon: '💳' },
  { name: 'UPI', icon: '📱' },
  { name: 'Net Banking', icon: '🏦' },
  { name: 'Crypto', icon: '₿' },
  { name: 'PayPal', icon: '🅿️' },
]

const bulkDiscounts = [
  { amount: '$100+', discount: '5% off' },
  { amount: '$500+', discount: '10% off' },
  { amount: '$1,000+', discount: '15% off' },
  { amount: '$5,000+', discount: '20% off' },
]

const featureComparison = [
  { feature: 'Services Available', starter: '1,000+', pro: '1,000+', enterprise: '1,000+' },
  { feature: 'Order Processing', starter: 'Standard', pro: 'Priority', enterprise: 'Highest Priority' },
  { feature: 'API Requests/Day', starter: '100', pro: '1,000', enterprise: 'Unlimited' },
  { feature: 'Support', starter: 'Email', pro: 'Priority 24/7', enterprise: 'Dedicated Manager' },
  { feature: 'Bulk Discount', starter: '—', pro: '10%', enterprise: '20%' },
  { feature: 'Webhooks', starter: '—', pro: 'Yes', enterprise: 'Yes' },
  { feature: 'Analytics', starter: 'Basic', pro: 'Advanced', enterprise: 'Custom' },
  { feature: 'White-label', starter: '—', pro: '—', enterprise: 'Yes' },
  { feature: 'SLA Guarantee', starter: '—', pro: '—', enterprise: '99.99%' },
]

const pricingFaqs = [
  { q: 'Are there any hidden fees?', a: 'No. You only pay for the services you order. Plan fees are transparent and billed upfront.' },
  { q: 'Can I change my plan anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately.' },
  { q: 'Do you offer refunds on plans?', a: 'Plan subscriptions are non-refundable, but you can cancel anytime to stop future billing.' },
  { q: 'What is the difference between monthly and yearly?', a: 'Yearly billing saves you approximately 2 months compared to monthly billing. You pay once per year.' },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [orderVolume, setOrderVolume] = useState(1000)
  const { formatPrice } = useCurrency()

  const estimatedCost = orderVolume * 0.5
  const proDiscount = estimatedCost * 0.1
  const enterpriseDiscount = estimatedCost * 0.2

  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.pricing} />
      <BreadcrumbJsonLD
        items={[
          { name: 'Home', url: 'https://ssmm.online/' },
          { name: 'Pricing', url: 'https://ssmm.online/pricing' },
        ]}
      />
      <PageHero
        badge="Pricing"
        title="Simple, transparent pricing"
        subtitle="Choose the plan that fits your needs. No hidden fees, no surprises. Cancel anytime."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]}
      />

      {/* Billing Toggle */}
      <section className="py-8 px-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative h-7 w-12 rounded-full bg-muted border border-border transition-colors"
            aria-label="Toggle billing period"
          >
            <motion.div
              className="absolute top-0.5 h-5 w-5 rounded-full bg-emerald-500 shadow-md"
              animate={{ left: yearly ? '26px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly <span className="text-emerald-500">(Save 17%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className={`relative rounded-2xl bg-card border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/10 animate-border-glow'
                  : 'border-border hover:border-emerald-500/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/30">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-emerald-500/15' : 'bg-emerald-500/10'}`}>
                  <plan.icon className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <div className="mb-6">
                {plan.monthlyPrice === 0 ? (
                  <div className="text-4xl font-bold text-foreground">Free</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(yearly ? plan.yearlyPrice / 12 : plan.monthlyPrice, 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                )}
                {yearly && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed annually at {formatPrice(plan.yearlyPrice, 0)}
                  </p>
                )}
              </div>

              <Link
                to={plan.href}
                className={`group flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all mb-8 ${
                  plan.popular
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:-translate-y-0.5'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {plan.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <ul className="space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/50">
                    <X className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Calculator */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-3xl">
          <SectionHeading badge="Calculator" title="Estimate your savings" subtitle="See how much you can save with our bulk discounts" />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-2xl bg-card border border-border p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Bulk Order Calculator</h3>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Monthly Order Volume: <span className="text-emerald-500 font-bold">{orderVolume.toLocaleString()}</span> units
              </label>
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={orderVolume}
                onChange={e => setOrderVolume(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>100</span>
                <span>50,000</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-background/50 border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Starter</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(estimatedCost, 2)}</p>
                <p className="text-xs text-muted-foreground mt-1">No discount</p>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Pro (10% off)</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(estimatedCost - proDiscount, 2)}</p>
                <p className="text-xs text-emerald-500 mt-1">Save {formatPrice(proDiscount, 2)}/mo</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Enterprise (20% off)</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(estimatedCost - enterpriseDiscount, 2)}</p>
                <p className="text-xs text-emerald-500 mt-1">Save {formatPrice(enterpriseDiscount, 2)}/mo</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-6 mx-auto max-w-5xl">
        <SectionHeading badge="Compare" title="Feature comparison" subtitle="See exactly what each plan includes" />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl bg-card border border-border overflow-hidden overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-5 text-sm font-semibold text-foreground">Feature</th>
                <th className="text-center p-5 text-sm font-semibold text-foreground">Starter</th>
                <th className="text-center p-5 text-sm font-semibold text-emerald-500">Pro</th>
                <th className="text-center p-5 text-sm font-semibold text-foreground">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                  <td className="text-left p-5 text-sm text-muted-foreground">{row.feature}</td>
                  <td className="text-center p-5 text-sm text-foreground">{row.starter}</td>
                  <td className="text-center p-5 text-sm text-foreground bg-emerald-500/5">{row.pro}</td>
                  <td className="text-center p-5 text-sm text-foreground">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* Payment Methods & Bulk Discounts */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Payment Methods */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <SectionHeading badge="Payments" title="Accepted payment methods" center={false} />
              <div className="grid grid-cols-3 gap-4">
                {paymentMethods.map(pm => (
                  <div key={pm.name} className="rounded-xl bg-card border border-border p-4 text-center hover:border-emerald-500/30 transition-colors">
                    <div className="text-2xl mb-2">{pm.icon}</div>
                    <p className="text-sm font-medium text-foreground">{pm.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bulk Discounts */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={fadeUp}>
              <SectionHeading badge="Volume" title="Bulk order discounts" center={false} />
              <div className="space-y-3">
                {bulkDiscounts.map(d => (
                  <div key={d.amount} className="flex items-center justify-between rounded-xl bg-card border border-border p-4 hover:border-emerald-500/30 transition-colors">
                    <span className="text-sm font-medium text-foreground">{d.amount}</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                      {d.discount}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 mx-auto max-w-3xl">
        <SectionHeading badge="FAQ" title="Pricing questions" />
        <div className="space-y-3">
          {pricingFaqs.map((faq, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="rounded-xl bg-card border border-border p-6"
            >
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                {faq.q}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <CTASection
        title="Still have questions?"
        subtitle="Our team is happy to help you choose the right plan for your needs."
        primaryLabel="Contact Sales"
        primaryHref="/contact"
        secondaryLabel="Start Free"
        secondaryHref="/signup"
      />
    </div>
  )
}
