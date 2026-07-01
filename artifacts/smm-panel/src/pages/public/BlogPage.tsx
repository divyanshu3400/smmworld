import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Clock, ArrowRight, TrendingUp, Mail, Check } from 'lucide-react'
import PageHero from '@/components/landing/PageHero'
import SectionHeading from '@/components/landing/SectionHeading'
import SEO from '@/components/seo/SEO'
import { BreadcrumbJsonLD } from '@/components/seo/JsonLD'
import { pageSEO } from '@/components/seo/seo-data'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const } }),
}

const featuredPost = {
  title: 'How to Grow Your Instagram from 0 to 10K Followers in 2024',
  excerpt: 'A complete step-by-step guide to growing your Instagram account organically and with strategic boosts. Learn the exact strategies that top creators use.',
  category: 'Instagram',
  author: 'Sarah Chen',
  date: 'Jun 15, 2024',
  readTime: '8 min read',
  image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

const trendingPosts = [
  { title: 'The Ultimate Guide to TikTok Algorithm in 2024', category: 'TikTok', date: 'Jun 10, 2024', readTime: '6 min' },
  { title: 'YouTube SEO: How to Rank Your Videos Higher', category: 'YouTube', date: 'Jun 8, 2024', readTime: '7 min' },
  { title: 'Why Engagement Rate Matters More Than Follower Count', category: 'Strategy', date: 'Jun 5, 2024', readTime: '5 min' },
]

const latestPosts = [
  { title: '10 Instagram Reels Ideas That Go Viral', excerpt: 'Boost your reach with these proven Reels formats that are trending right now.', category: 'Instagram', author: 'Priya Nair', date: 'Jun 14, 2024', readTime: '5 min read', image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { title: 'How to Monetize Your YouTube Channel Fast', excerpt: 'From ads to sponsorships, here are the fastest ways to start earning from YouTube.', category: 'YouTube', author: 'Rahul Mehta', date: 'Jun 12, 2024', readTime: '6 min read', image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { title: 'The Best Time to Post on Social Media in 2024', excerpt: 'Maximize your reach by posting at the right time. Here is the data-backed answer.', category: 'Strategy', author: 'Arjun Sharma', date: 'Jun 11, 2024', readTime: '4 min read', image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { title: 'TikTok vs Instagram: Which Platform Should You Focus On?', excerpt: 'A detailed comparison to help you decide where to invest your time and money.', category: 'Strategy', author: 'Sarah Chen', date: 'Jun 9, 2024', readTime: '7 min read', image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { title: 'How to Build a Personal Brand on LinkedIn', excerpt: 'LinkedIn is not just for job seekers. Here is how to build a powerful personal brand.', category: 'LinkedIn', author: 'Mike Johnson', date: 'Jun 7, 2024', readTime: '6 min read', image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { title: 'The Complete Guide to Social Media Analytics', excerpt: 'Understand the metrics that actually matter and how to use them to grow faster.', category: 'Strategy', author: 'Aisha Patel', date: 'Jun 5, 2024', readTime: '8 min read', image: 'https://images.pexels.com/photos/3754674/pexels-photo-3754674.jpeg?auto=compress&cs=tinysrgb&w=600' },
]

const categories = ['All', 'Instagram', 'YouTube', 'TikTok', 'Strategy', 'LinkedIn']

export default function BlogPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const filteredPosts = latestPosts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.blog} />
      <BreadcrumbJsonLD
        items={[
          { name: 'Home', url: 'https://ssmm.online/' },
          { name: 'Blog', url: 'https://ssmm.online/blog' },
        ]}
      />
      <PageHero
        badge="Blog"
        title="Insights, tips & growth strategies"
        subtitle="Learn from the experts. Get the latest social media growth tips, platform updates, and marketing strategies."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]}
      />

      {/* Featured Article */}
      <section className="py-12 px-6 mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="grid lg:grid-cols-2 gap-8 rounded-3xl bg-card border border-border overflow-hidden hover:border-emerald-500/30 transition-colors group"
        >
          <div className="relative h-64 lg:h-auto overflow-hidden">
            <img
              src={featuredPost.image}
              alt={featuredPost.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
              Featured
            </div>
          </div>
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {featuredPost.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{featuredPost.readTime}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 group-hover:text-emerald-500 transition-colors">
              {featuredPost.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {featuredPost.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {featuredPost.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{featuredPost.author}</p>
                  <p className="text-xs text-muted-foreground">{featuredPost.date}</p>
                </div>
              </div>
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all">
                Read More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trending Posts */}
      <section className="py-12 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {trendingPosts.map((post, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="group rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-emerald-500 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search + Categories */}
      <section className="py-12 px-6 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>

        {/* Latest Articles */}
        <SectionHeading badge="Latest Articles" title="Fresh from the blog" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, i) => (
            <motion.article
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i % 3}
              variants={fadeUp}
              className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-white text-xs font-semibold backdrop-blur-sm">
                  {post.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {post.author.charAt(0)}
                    </div>
                    <span>{post.author}</span>
                  </div>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No articles found. Try a different search or category.</p>
          </div>
        )}
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-balance">
              Never miss a growth tip
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
              Get the latest social media strategies delivered to your inbox every week. No spam, ever.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3.5 rounded-full bg-white/15 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/25 transition-colors"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-emerald-600 shadow-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
              >
                {subscribed ? <><Check className="h-4 w-4" /> Subscribed</> : 'Subscribe'}
              </button>
            </form>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
