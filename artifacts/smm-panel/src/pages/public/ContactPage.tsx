import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, Briefcase, Headphones, Clock, MapPin, Send, Check, Battery as Twitter, Notebook as Facebook, Drama as Instagram, Link as Linkedin } from 'lucide-react'
import PageHero from '@/components/landing/PageHero'
import SectionHeading from '@/components/landing/SectionHeading'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

const supportCards = [
  { icon: MessageSquare, title: 'General Inquiry', description: 'Questions about our services or platform', email: 'hello@smmhub.com', action: 'Email Us' },
  { icon: Briefcase, title: 'Sales', description: 'Enterprise plans and partnerships', email: 'sales@smmhub.com', action: 'Contact Sales' },
  { icon: Headphones, title: 'Technical Support', description: 'Issues with orders, API, or your account', email: 'support@smmhub.com', action: 'Get Support' },
  { icon: Phone, title: 'Live Chat', description: 'Available 24/7 for instant help', email: 'Available in dashboard', action: 'Start Chat' },
]

const socialLinks = [
  { icon: Twitter, name: 'Twitter', href: '#' },
  { icon: Facebook, name: 'Facebook', href: '#' },
  { icon: Instagram, name: 'Instagram', href: '#' },
  { icon: Linkedin, name: 'LinkedIn', href: '#' },
]

const faqPreview = [
  { q: 'How fast do you respond?', a: 'Our average response time is under 2 hours. Live chat is instant during business hours.' },
  { q: 'Do you offer phone support?', a: 'We primarily offer support via email and live chat. Phone support is available for enterprise customers.' },
  { q: 'What are your business hours?', a: 'Our support team is available 24/7. Live chat operates around the clock.' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', category: 'general', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setForm({ name: '', email: '', subject: '', category: 'general', message: '' })
      setTimeout(() => setSubmitted(false), 4000)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        badge="Contact Us"
        title="We are here to help"
        subtitle="Have a question? Need help with an order? Want to partner with us? Our team is available 24/7 to support you."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />

      {/* Support Cards */}
      <section className="py-12 px-6 mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="group rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <card.icon className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{card.description}</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-4">{card.email}</p>
              <button className="text-sm font-semibold text-foreground hover:text-emerald-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                {card.action} <Send className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-20 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <SectionHeading badge="Send a Message" title="Get in touch" center={false} />
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="sales">Sales</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
                    placeholder="Tell us more..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || submitted}
                  className="group inline-flex items-center justify-center gap-2 w-full rounded-full bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70"
                >
                  {loading ? (
                    <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                  ) : submitted ? (
                    <><Check className="h-4 w-4" /> Message Sent!</>
                  ) : (
                    <>Send Message <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Office Info */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={fadeUp} className="space-y-6">
              <SectionHeading badge="Office Info" title="Visit us" center={false} />
              <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Our Office</h3>
                    <p className="text-sm text-muted-foreground">123 Tech Park, Bangalore</p>
                    <p className="text-sm text-muted-foreground">Karnataka 560001, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Email Us</h3>
                    <p className="text-sm text-muted-foreground">support@smmhub.com</p>
                    <p className="text-sm text-muted-foreground">sales@smmhub.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Business Hours</h3>
                    <p className="text-sm text-muted-foreground">Support: 24/7</p>
                    <p className="text-sm text-muted-foreground">Office: Mon-Fri, 9am-6pm IST</p>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="rounded-2xl bg-card border border-border overflow-hidden h-64 relative">
                <div className="absolute inset-0 bg-grid opacity-20 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-emerald-500/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Interactive Map</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map(s => (
                  <a
                    key={s.name}
                    href={s.href}
                    className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                    aria-label={s.name}
                  >
                    <s.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 px-6 mx-auto max-w-3xl">
        <SectionHeading badge="Quick Answers" title="Before you reach out" />
        <div className="space-y-4">
          {faqPreview.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="rounded-xl bg-card border border-border p-6"
            >
              <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
