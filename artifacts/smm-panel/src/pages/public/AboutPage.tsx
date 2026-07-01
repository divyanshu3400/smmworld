import { motion } from 'framer-motion'
import { Target, Eye, Heart, Zap, Shield, Users, Globe, TrendingUp, Award, Sparkles } from 'lucide-react'
import PageHero from '@/components/landing/PageHero'
import SectionHeading from '@/components/landing/SectionHeading'
import CTASection from '@/components/landing/CTASection'
import { CountUp } from '@/components/ui/CountUp'
import SEO from '@/components/seo/SEO'
import { BreadcrumbJsonLD, OrganizationJsonLD } from '@/components/seo/JsonLD'
import { pageSEO } from '@/components/seo/seo-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

const values = [
  { icon: Zap, title: 'Speed', description: 'We obsess over delivery speed. Every second counts when you are growing your presence.' },
  { icon: Shield, title: 'Trust', description: 'Security is not an afterthought. We protect your data and your accounts at every step.' },
  { icon: Heart, title: 'Customer First', description: 'Every decision starts with the question: does this make our customers more successful?' },
  { icon: TrendingUp, title: 'Growth', description: 'We measure our success by your growth. When you win, we win.' },
  { icon: Award, title: 'Quality', description: 'We never compromise on service quality. Premium results, every single time.' },
  { icon: Globe, title: 'Accessibility', description: 'Premium social media growth should be accessible to everyone, everywhere.' },
]

const stats = [
  { value: 5, label: 'Years in Business', suffix: '+' },
  { value: 2500000, label: 'Orders Delivered', suffix: '+' },
  { value: 100, label: 'Countries', suffix: '+' },
  { value: 850000, label: 'Happy Customers', suffix: '+' },
]

const timeline = [
  { year: '2021', title: 'The Idea', description: 'Founded with a simple mission: make social media growth accessible, affordable, and reliable for everyone.' },
  { year: '2022', title: 'Rapid Growth', description: 'Reached 100K customers and expanded to 50+ platforms. Launched our API for resellers and agencies.' },
  { year: '2023', title: 'Scale & Trust', description: 'Crossed 1M orders delivered. Built our infrastructure for 99.9% uptime and instant delivery.' },
  { year: '2024', title: 'Premium Platform', description: 'Rebuilt from the ground up as a premium SaaS platform. Now serving 850K+ customers across 100+ countries.' },
]

const team = [
  { name: 'Arjun Sharma', role: 'CEO & Founder', avatar: 'AS' },
  { name: 'Priya Nair', role: 'CTO', avatar: 'PN' },
  { name: 'Rahul Mehta', role: 'Head of Support', avatar: 'RM' },
  { name: 'Sarah Chen', role: 'Head of Product', avatar: 'SC' },
  { name: 'Mike Johnson', role: 'Head of Engineering', avatar: 'MJ' },
  { name: 'Aisha Patel', role: 'Head of Operations', avatar: 'AP' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.about} />
      <BreadcrumbJsonLD
        items={[
          { name: 'Home', url: 'https://ssmm.online/' },
          { name: 'About', url: 'https://ssmm.online/about' },
        ]}
      />
      <OrganizationJsonLD />
      <PageHero
        badge="About Us"
        title="Building the future of social media growth"
        subtitle="We are on a mission to make premium social media marketing accessible to everyone — from solo creators to global agencies."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      {/* Who We Are */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <SectionHeading badge="Who We Are" title="A team obsessed with your growth" center={false} />
            <p className="text-muted-foreground leading-relaxed mb-4">
              SMMHub started as a small project to help local businesses grow their social media presence.
              Today, we are a global platform serving over 850,000 customers across 100+ countries.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe that social media growth should not be a luxury reserved for big brands with big budgets.
              It should be accessible, affordable, and reliable for everyone — from a solo content creator
              to a multinational agency.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              That belief drives every line of code we write, every service we offer, and every support
              ticket we answer.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl bg-card border border-border p-8 shadow-xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <Target className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">Our Mission</h3>
                  <p className="text-sm text-muted-foreground">Democratize social media growth for everyone</p>
                </div>
                <div className="text-center">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">Our Vision</h3>
                  <p className="text-sm text-muted-foreground">Be the most trusted SMM platform worldwide</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-4xl">
          <SectionHeading badge="Our Story" title="Why we started" />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="prose prose-invert max-w-none"
          >
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              In 2021, our founder was running a digital marketing agency and struggling to find
              an SMM panel that was reliable, fast, and actually cared about customer success.
              Every panel he tried had slow delivery, poor quality, and non-existent support.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              So he built one. What started as an internal tool for the agency quickly became
              something bigger — a platform that thousands of people were asking to use.
              That is when SMMHub was born.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Today, we process millions of orders, serve customers in over 100 countries,
              and have never lost sight of that original mission: build something that actually works,
              that people can trust, and that makes social media growth accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <SectionHeading badge="Core Values" title="What we believe in" subtitle="The principles that guide every decision we make" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i % 3}
              variants={fadeUp}
              className="group flex gap-4 p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
            >
              <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <v.icon className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Our Numbers */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <SectionHeading badge="Our Numbers" title="Growth that speaks for itself" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
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
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  <CountUp end={s.value} suffix={s.suffix} duration={1800} />
                </div>
                <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6 mx-auto max-w-4xl">
        <SectionHeading badge="Our Journey" title="The road so far" />
        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" />
          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className={`relative flex ${i % 2 === 0 ? 'sm:justify-end' : 'sm:justify-start'} mb-12 sm:w-1/2 ${i % 2 === 0 ? 'sm:ml-auto sm:pl-12' : 'sm:pr-12'}`}
            >
              <div className="flex items-center gap-4 sm:block">
                <div className="absolute left-4 sm:left-auto sm:right-0 top-0 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-background sm:translate-x-1/2 ${i % 2 === 0 ? 'sm:right-0' : 'sm:left-0'}" style={{ left: 'auto' }} />
                <div className="ml-12 sm:ml-0 rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/30 transition-colors">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
                    {item.year}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <SectionHeading badge="Our Team" title="The people behind SMMHub" subtitle="A passionate team dedicated to your growth" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex flex-col items-center text-center"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg shadow-emerald-500/20">
                  {member.avatar}
                </div>
                <h3 className="font-bold text-foreground text-sm">{member.name}</h3>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Security */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl bg-card border border-border p-8">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Our Technology</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Built on a modern, scalable infrastructure that processes thousands of orders per minute
              with 99.9% uptime. Our API is designed for developers, by developers.
            </p>
            <ul className="space-y-2">
              {['Real-time order processing', 'Global CDN for fast delivery', '99.9% uptime guarantee', 'REST API for developers'].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={fadeUp} className="rounded-2xl bg-card border border-border p-8">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Security & Infrastructure</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bank-grade encryption protects every transaction. We never store passwords or sensitive
              account data. Your security is our top priority.
            </p>
            <ul className="space-y-2">
              {['256-bit SSL encryption', 'PCI-compliant payments', 'No password storage', '24/7 monitoring'].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Want to grow with us?"
        subtitle="Join 850,000+ creators, agencies, and businesses who trust SMMHub with their social media growth."
      />
    </div>
  )
}
