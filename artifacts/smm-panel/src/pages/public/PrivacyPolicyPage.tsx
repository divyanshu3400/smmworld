import { motion } from 'framer-motion'
import { Shield, Lock, Cookie, ChartBar as BarChart, CreditCard, Users, FileText, Mail } from 'lucide-react'
import PageHero from '@/components/landing/PageHero'
import ReadingProgress from '@/components/landing/ReadingProgress'
import TableOfContents from '@/components/landing/TableOfContents'
import CTASection from '@/components/landing/CTASection'
import SEO from '@/components/seo/SEO'
import { pageSEO } from '@/components/seo/seo-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const sections = [
  { id: 'introduction', label: 'Introduction', icon: FileText },
  { id: 'information', label: 'Information We Collect', icon: Users },
  { id: 'usage', label: 'How We Use Information', icon: BarChart },
  { id: 'cookies', label: 'Cookies', icon: Cookie },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'third-parties', label: 'Third Parties', icon: Users },
  { id: 'security', label: 'Data Security', icon: Lock },
  { id: 'rights', label: 'User Rights', icon: Shield },
  { id: 'gdpr', label: 'GDPR', icon: Shield },
  { id: 'ccpa', label: 'CCPA', icon: Shield },
  { id: 'childrens', label: "Children's Privacy", icon: Users },
  { id: 'contact', label: 'Contact', icon: Mail },
]

const content: Record<string, { title: string; body: string[] }> = {
  introduction: {
    title: 'Introduction',
    body: [
      'SMMHub ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.',
      'By using SMMHub, you agree to the collection and use of information in accordance with this policy. We will not use or share your data with anyone except as described in this Privacy Policy.',
    ],
  },
  information: {
    title: 'Information We Collect',
    body: [
      'We collect information you provide directly to us when you create an account, place orders, or contact support. This includes your name, email address, payment information, and order details.',
      'We also automatically collect certain information about your device and usage, including IP address, browser type, and pages visited. This helps us provide and improve our services.',
    ],
  },
  usage: {
    title: 'How We Use Your Information',
    body: [
      'We use your information to process orders, maintain your account, send important notifications, provide customer support, and improve our services.',
      'We may also use your information to detect and prevent fraud, comply with legal obligations, and communicate with you about new features and promotions.',
    ],
  },
  cookies: {
    title: 'Cookies',
    body: [
      'We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze how you use our platform.',
      'You can control cookies through your browser settings. Disabling cookies may affect some functionality of our platform.',
    ],
  },
  analytics: {
    title: 'Analytics',
    body: [
      'We use analytics tools to understand how users interact with our platform. This helps us improve user experience and optimize our services.',
      'The data collected is aggregated and does not personally identify individual users.',
    ],
  },
  payments: {
    title: 'Payments',
    body: [
      'We process payments through trusted third-party payment processors. We do not store your full credit card information on our servers.',
      'Payment processors handle your financial data in accordance with PCI-DSS standards and their own privacy policies.',
    ],
  },
  'third-parties': {
    title: 'Third-Party Services',
    body: [
      'We may share your information with trusted third-party service providers who help us operate our platform, process payments, and deliver services.',
      'These providers are contractually obligated to protect your information and use it only for the purposes we specify.',
    ],
  },
  security: {
    title: 'Data Security',
    body: [
      'We implement industry-standard security measures including 256-bit SSL encryption, secure data storage, and regular security audits.',
      'While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.',
    ],
  },
  rights: {
    title: 'Your Rights',
    body: [
      'You have the right to access, correct, or delete your personal information. You can also object to certain processing of your data.',
      'To exercise these rights, contact us at privacy@smmhub.com. We will respond within 30 days.',
    ],
  },
  gdpr: {
    title: 'GDPR Compliance',
    body: [
      'For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation (GDPR).',
      'We process your data based on your consent, to fulfill contractual obligations, or for our legitimate business interests.',
    ],
  },
  ccpa: {
    title: 'CCPA Compliance',
    body: [
      'For California residents, we comply with the California Consumer Privacy Act (CCPA). You have the right to know what personal information we collect, request deletion, and opt-out of the sale of personal information.',
      'We do not sell your personal information to third parties.',
    ],
  },
  childrens: {
    title: "Children's Privacy",
    body: [
      'Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13.',
      'If you believe we have collected information from a child under 13, please contact us immediately at privacy@smmhub.com.',
    ],
  },
  contact: {
    title: 'Contact Us',
    body: [
      'If you have any questions about this Privacy Policy, please contact us at privacy@smmhub.com or through our contact page.',
      'We are committed to resolving any privacy concerns promptly and transparently.',
    ],
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.privacy} />
      <ReadingProgress />
      <PageHero
        badge="Privacy Policy"
        title="Your privacy matters to us"
        subtitle="This policy explains what data we collect, why we collect it, and how we protect it."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
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
        title="Questions about your privacy?"
        subtitle="Our team is here to help. Reach out and we will get back to you within 24 hours."
        primaryLabel="Contact Support"
        primaryHref="/contact"
        secondaryLabel="Read Terms"
        secondaryHref="/terms"
      />
    </div>
  )
}
