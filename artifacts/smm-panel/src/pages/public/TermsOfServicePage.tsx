import { motion } from 'framer-motion'
import { FileText, UserCheck, ShoppingCart, CreditCard, RefreshCw, Settings, Ban, Code, Copyright, Circle as XCircle, TriangleAlert as AlertTriangle, File as FileEdit, Mail } from 'lucide-react'
import PageHero from '@/components/landing/PageHero'
import ReadingProgress from '@/components/landing/ReadingProgress'
import TableOfContents from '@/components/landing/TableOfContents'
import CTASection from '@/components/landing/CTASection'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const sections = [
  { id: 'acceptance', label: 'Acceptance of Terms', icon: FileText },
  { id: 'accounts', label: 'Accounts', icon: UserCheck },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw },
  { id: 'usage', label: 'Service Usage', icon: Settings },
  { id: 'prohibited', label: 'Prohibited Activities', icon: Ban },
  { id: 'api', label: 'API Usage', icon: Code },
  { id: 'ip', label: 'Intellectual Property', icon: Copyright },
  { id: 'termination', label: 'Termination', icon: XCircle },
  { id: 'disclaimer', label: 'Disclaimer', icon: AlertTriangle },
  { id: 'liability', label: 'Liability', icon: AlertTriangle },
  { id: 'changes', label: 'Changes to Terms', icon: FileEdit },
  { id: 'contact', label: 'Contact', icon: Mail },
]

const content: Record<string, { title: string; body: string[] }> = {
  acceptance: {
    title: 'Acceptance of Terms',
    body: [
      'By accessing or using SMMHub, you agree to be bound by these Terms of Service and all applicable laws and regulations.',
      'If you do not agree with any part of these terms, you may not access or use our platform.',
    ],
  },
  accounts: {
    title: 'Accounts',
    body: [
      'You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
      'You must be at least 18 years old to create an account. You agree to provide accurate and complete information during registration.',
    ],
  },
  orders: {
    title: 'Orders',
    body: [
      'When you place an order, you agree to pay the listed price for the selected service. Orders are processed automatically once payment is confirmed.',
      'Delivery times vary by service. While most orders start within minutes, we do not guarantee specific delivery timeframes unless explicitly stated.',
    ],
  },
  payments: {
    title: 'Payments',
    body: [
      'We accept various payment methods including credit/debit cards, UPI, and cryptocurrency. All payments are processed securely through trusted payment gateways.',
      'Funds added to your wallet are non-transferable and can only be used for services on our platform.',
    ],
  },
  refunds: {
    title: 'Refunds',
    body: [
      'Refunds are available for orders that fail to deliver. Please review our Refund Policy for detailed information about eligibility and processing times.',
      'Wallet balances may be refunded to the original payment method at our discretion, subject to applicable fees.',
    ],
  },
  usage: {
    title: 'Service Usage',
    body: [
      'You agree to use our services only for lawful purposes. You are solely responsible for the content and links you submit for orders.',
      'We never ask for your social media passwords. Only public profile links or post URLs are required.',
    ],
  },
  prohibited: {
    title: 'Prohibited Activities',
    body: [
      'You may not use our services to: (a) violate any law or regulation, (b) infringe on others rights, (c) submit content that is illegal, harmful, or offensive, (d) attempt to disrupt or compromise platform security.',
      'Violating these prohibitions may result in immediate account termination and forfeiture of any wallet balance.',
    ],
  },
  api: {
    title: 'API Usage',
    body: [
      'API access is available for registered users. You must keep your API key confidential and not share it with third parties.',
      'We reserve the right to limit or revoke API access for excessive usage, abuse, or violation of these terms.',
    ],
  },
  ip: {
    title: 'Intellectual Property',
    body: [
      'All content, features, and functionality on SMMHub, including text, graphics, logos, and software, are owned by us and protected by intellectual property laws.',
      'You may not reproduce, distribute, or create derivative works from our platform without express written permission.',
    ],
  },
  termination: {
    title: 'Termination',
    body: [
      'We may terminate or suspend your account at any time, without prior notice, for violation of these terms or for any other reason we deem appropriate.',
      'You may close your account at any time by contacting support. Upon termination, your right to use our services ceases immediately.',
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    body: [
      'Our services are provided "as is" without warranties of any kind. We do not guarantee specific results from our social media marketing services.',
      'Results may vary based on platform algorithms, content quality, and other factors beyond our control.',
    ],
  },
  liability: {
    title: 'Limitation of Liability',
    body: [
      'SMMHub shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.',
      'Our total liability shall not exceed the amount you have paid for the service giving rise to the claim.',
    ],
  },
  changes: {
    title: 'Changes to Terms',
    body: [
      'We reserve the right to modify these terms at any time. Changes are effective immediately upon posting.',
      'Continued use of our services after changes constitutes acceptance of the updated terms.',
    ],
  },
  contact: {
    title: 'Contact Us',
    body: [
      'For questions about these Terms of Service, contact us at legal@smmhub.com or through our contact page.',
    ],
  },
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <ReadingProgress />
      <PageHero
        badge="Terms of Service"
        title="The rules of our platform"
        subtitle="Please read these terms carefully before using SMMHub. By using our services, you agree to these terms."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
      />

      <div className="px-6 mx-auto max-w-7xl pb-20">
        <div className="grid lg:grid-cols-[260px_1fr] gap-12">
          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <TableOfContents items={sections.map(s => ({ id: s.id, label: s.label }))} />
            <div className="mt-8 p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-2">Last Updated</p>
              <p className="text-sm font-semibold text-foreground">June 27, 2026</p>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-3xl">
            {sections.map((section, i) => {
              const data = content[section.id]
              const Icon = section.icon
              return (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  className="mb-12 scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{data.title}</h2>
                  </div>
                  {data.body.map((p, pi) => (
                    <p key={pi} className="text-muted-foreground leading-relaxed mb-4">
                      {p}
                    </p>
                  ))}
                </motion.section>
              )
            })}
          </div>
        </div>
      </div>

      <CTASection
        title="Have questions about our terms?"
        subtitle="Our support team is happy to clarify anything in these terms. Reach out anytime."
        primaryLabel="Contact Support"
        primaryHref="/contact"
        secondaryLabel="Read Privacy Policy"
        secondaryHref="/privacy"
      />
    </div>
  )
}
