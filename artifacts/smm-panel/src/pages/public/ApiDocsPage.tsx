import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Copy, Check, Terminal, Code as Code2, Key, Webhook, TriangleAlert as AlertTriangle, Gauge, BookOpen, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHero from '@/components/landing/PageHero'
import ReadingProgress from '@/components/landing/ReadingProgress'
import CTASection from '@/components/landing/CTASection'
import SEO from '@/components/seo/SEO'
import { BreadcrumbJsonLD } from '@/components/seo/JsonLD'
import { pageSEO } from '@/components/seo/seo-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const navItems = [
  { id: 'authentication', label: 'Authentication', icon: Key },
  { id: 'endpoints', label: 'Endpoints', icon: Code2 },
  { id: 'examples', label: 'Code Examples', icon: Terminal },
  { id: 'errors', label: 'Errors', icon: AlertTriangle },
  { id: 'rate-limits', label: 'Rate Limits', icon: Gauge },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
]

const endpoints = [
  {
    method: 'POST',
    action: 'services',
    description: 'Get a list of all available services',
    parameters: [],
    response: `[
  {
    "service": 1,
    "name": "Instagram Followers [High Quality]",
    "type": "Followers",
    "rate": "0.50",
    "min": "50",
    "max": "10000"
  }
]`,
  },
  {
    method: 'POST',
    action: 'add',
    description: 'Create a new order',
    parameters: [
      { name: 'service', type: 'integer', required: true, description: 'Service ID' },
      { name: 'link', type: 'string', required: true, description: 'Link to the profile or post' },
      { name: 'quantity', type: 'integer', required: true, description: 'Quantity to order' },
    ],
    response: `{ "order": 12345 }`,
  },
  {
    method: 'POST',
    action: 'status',
    description: 'Get the status of an order',
    parameters: [{ name: 'order', type: 'integer', required: true, description: 'Order ID' }],
    response: `{
  "order": 12345,
  "status": "completed",
  "charge": "0.50",
  "start_count": 100,
  "remains": 0,
  "currency": "USD"
}`,
  },
  {
    method: 'POST',
    action: 'balance',
    description: 'Get your account balance',
    parameters: [],
    response: `{ "balance": "100.50", "currency": "USD" }`,
  },
]

const codeExamples: Record<string, string> = {
  javascript: `const API_URL = 'https://api.smmhub.com/v2';
const API_KEY = 'YOUR_API_KEY';

async function apiRequest(data) {
  const formData = new URLSearchParams();
  formData.append('key', API_KEY);
  Object.entries(data).forEach(([k, v]) => {
    formData.append(k, v);
  });

  const res = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

// Create an order
const order = await apiRequest({
  action: 'add',
  service: 1,
  link: 'https://instagram.com/username',
  quantity: 1000
});

console.log(order); // { order: 12345 }`,
  python: `import requests

API_URL = 'https://api.smmhub.com/v2'
API_KEY = 'YOUR_API_KEY'

def api_request(data):
    data['key'] = API_KEY
    response = requests.post(API_URL, data=data)
    return response.json()

# Create an order
order = api_request({
    'action': 'add',
    'service': 1,
    'link': 'https://instagram.com/username',
    'quantity': 1000
})

print(order)  # {'order': 12345}`,
  php: `<?php
$api_url = 'https://api.smmhub.com/v2';
$api_key = 'YOUR_API_KEY';

function api_request($data) {
    global $api_url, $api_key;
    $data['key'] = $api_key;
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result);
}

// Create an order
$order = api_request([
    'action' => 'add',
    'service' => 1,
    'link' => 'https://instagram.com/username',
    'quantity' => 1000
]);

print_r($order); // stdClass Object ( [order] => 12345 )
?>`,
}

const errorCodes = [
  { code: '100', message: 'Invalid API key', description: 'The API key provided is invalid or expired.' },
  { code: '101', message: 'Insufficient balance', description: 'Your wallet does not have enough funds for this order.' },
  { code: '102', message: 'Service not found', description: 'The service ID provided does not exist.' },
  { code: '103', message: 'Invalid link', description: 'The link provided is invalid or not accessible.' },
  { code: '104', message: 'Quantity out of range', description: 'The quantity is below the minimum or above the maximum for this service.' },
  { code: '105', message: 'Order already exists', description: 'A duplicate order was detected within the cooldown period.' },
]

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-[#0d0d0d] border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className="text-slate-300">{code}</code>
      </pre>
    </div>
  )
}

export default function ApiDocsPage() {
  const [activeLang, setActiveLang] = useState('javascript')
  const [search, setSearch] = useState('')

  const filteredEndpoints = endpoints.filter(
    e => e.action.includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.apiDocs} />
      <BreadcrumbJsonLD
        items={[
          { name: 'Home', url: 'https://ssmm.online/' },
          { name: 'API Docs', url: 'https://ssmm.online/api-docs' },
        ]}
      />
      <ReadingProgress />
      <PageHero
        badge="API Documentation"
        title="Build with our API"
        subtitle="Automate orders, check balances, and integrate SMMHub into your platform with our simple REST API."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'API Docs' }]}
      />

      <div className="px-6 mx-auto max-w-7xl pb-20">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <nav className="space-y-1 mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Documentation
                </p>
                {navItems.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-2">Need help?</p>
                <Link to="/contact" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-1.5 flex items-center gap-1 transition-all">
                  Contact Support <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-3xl">
            {/* Quick Start */}
            <motion.section
              id="authentication"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Authentication</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                All API requests require your API key. You can find your API key in your dashboard
                under Settings. Include it as a <code className="px-1.5 py-0.5 rounded bg-muted text-emerald-500 text-sm font-mono">key</code> parameter in every request.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">API URL</p>
                  <code className="text-sm text-emerald-500 font-mono">https://api.smmhub.com/v2</code>
                </div>
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Method</p>
                  <code className="text-sm text-emerald-500 font-mono">POST (form-data)</code>
                </div>
              </div>
              <CodeBlock language="bash" code={`curl -X POST https://api.smmhub.com/v2 \\
  -d "key=YOUR_API_KEY" \\
  -d "action=balance"`} />
            </motion.section>

            {/* Endpoints */}
            <motion.section
              id="endpoints"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Endpoints</h2>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>

              <div className="space-y-6">
                {filteredEndpoints.map((ep, i) => (
                  <motion.div
                    key={ep.action}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    custom={i}
                    variants={fadeUp}
                    className="rounded-xl bg-card border border-border overflow-hidden"
                  >
                    <div className="p-6 border-b border-border">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                          {ep.method}
                        </span>
                        <code className="text-base font-semibold text-foreground font-mono">action={ep.action}</code>
                      </div>
                      <p className="text-muted-foreground text-sm">{ep.description}</p>
                    </div>

                    {ep.parameters.length > 0 && (
                      <div className="p-6 border-b border-border bg-muted/30">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Parameters</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground">
                                <th className="pr-4 pb-2">Name</th>
                                <th className="pr-4 pb-2">Type</th>
                                <th className="pr-4 pb-2">Required</th>
                                <th className="pb-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ep.parameters.map(p => (
                                <tr key={p.name} className="text-foreground">
                                  <td className="pr-4 py-1.5 font-mono text-emerald-500">{p.name}</td>
                                  <td className="pr-4 py-1.5">{p.type}</td>
                                  <td className="pr-4 py-1.5">
                                    {p.required ? <span className="text-emerald-500">Yes</span> : <span className="text-muted-foreground">No</span>}
                                  </td>
                                  <td className="py-1.5 text-muted-foreground">{p.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Response</h4>
                      <CodeBlock language="json" code={ep.response} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Code Examples */}
            <motion.section
              id="examples"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Terminal className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Code Examples</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Choose your preferred language. All examples show how to create an order.
              </p>
              <div className="flex gap-2 mb-4">
                {Object.keys(codeExamples).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      activeLang === lang
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <CodeBlock language={activeLang} code={codeExamples[activeLang]} />
            </motion.section>

            {/* Errors */}
            <motion.section
              id="errors"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Error Codes</h2>
              </div>
              <div className="space-y-3">
                {errorCodes.map(err => (
                  <div key={err.code} className="rounded-xl bg-card border border-border p-4 flex items-start gap-4">
                    <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-xs font-bold font-mono shrink-0">
                      {err.code}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{err.message}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{err.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Rate Limits */}
            <motion.section
              id="rate-limits"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Rate Limits</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { limit: '60', label: 'Requests per minute' },
                  { limit: '1,000', label: 'Requests per hour' },
                  { limit: '10,000', label: 'Requests per day' },
                ].map(r => (
                  <div key={r.label} className="rounded-xl bg-card border border-border p-6 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                      {r.limit}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{r.label}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Webhooks */}
            <motion.section
              id="webhooks"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-12 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Webhook className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Webhooks</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Get real-time notifications when your order status changes. Configure your webhook URL
                in the dashboard, and we will POST order updates to your endpoint.
              </p>
              <CodeBlock language="json" code={`{
  "event": "order.completed",
  "order_id": 12345,
  "status": "completed",
  "charge": "0.50",
  "currency": "USD",
  "timestamp": 1719504000
}`} />
            </motion.section>
          </div>
        </div>
      </div>

      <CTASection
        title="Ready to start building?"
        subtitle="Sign up now and get instant access to our API. Start automating your social media growth today."
        primaryLabel="Get Your API Key"
        primaryHref="/signup"
        secondaryLabel="View Services"
        secondaryHref="/services"
      />
    </div>
  )
}
