export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-background to-indigo-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-40" />

        <div className="relative px-6 py-24 mx-auto max-w-7xl sm:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              #1 Social Media Marketing Platform
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Grow Your Social Media{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Presence
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              The most powerful SMM panel for Instagram, YouTube, TikTok, Facebook, and more.
              Boost your engagement instantly with real followers, likes, views, and comments.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="w-full sm:w-auto rounded-full bg-emerald-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all hover:scale-105"
              >
                Get Started Free
              </a>
              <a
                href="#services"
                className="w-full sm:w-auto rounded-full bg-background border border-border px-8 py-4 text-lg font-semibold text-foreground hover:bg-accent transition-all"
              >
                View Services
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Instant delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">500K+</div>
              <div className="mt-2 text-muted-foreground">Orders Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">150K+</div>
              <div className="mt-2 text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">1000+</div>
              <div className="mt-2 text-muted-foreground">Services Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">24/7</div>
              <div className="mt-2 text-muted-foreground">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 px-6 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            All Platforms, One Dashboard
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We support all major social media platforms
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Instagram', icon: 'M12 2c2.7 0 5.4 1.1 7.4 3.1C21.6 7.1 22.7 9.8 22.7 12.5c0 5.2-4.2 9.4-9.4 9.4-1.6 0-3.2-.4-4.6-1.2l-4.9 1.3 1.3-4.8c-.8-1.4-1.2-3-1.2-4.6 0-5.3 4.2-9.6 9.4-9.6zm0-2C6 0 1.3 4.7 1.3 10.6c0 1.9.5 3.8 1.5 5.4L0 22l6.2-1.6c1.5.8 3.2 1.3 5 1.3 5.8 0 10.5-4.7 10.5-10.5S17 0.8 11.2 0.8L12 2z' },
            { name: 'YouTube', icon: 'M23.5 6.2c-.3-1-1.1-1.8-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5c-1 .3-1.8 1.1-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z' },
            { name: 'TikTok', icon: 'M12.5.9c1.2 0 2.4.2 3.5.6.6.2 1.3.7 2 .4.8 0 1.4-.3 2-.9-.6-.6-1-1.4-1-2.4 0-1.7 1.4-3.1 3.1-3.1 1.6 0 2.9 1.2 3.1 2.8.9-.7 2-1.2 3.2-1.4-.5-.2-1.1-.3-1.7-.3-2.4 0-4.5 1.6-5.2 3.8-.3-.1-.6-.1-.9-.1-1.5 0-2.8.8-3.5 2-.4-.1-.8-.1-1.2-.1-3.4 0-6.1 2.7-6.1 6.1 0 3.1 2.3 5.6 5.3 6l-.5-2.2c-1.5-.5-2.6-1.9-2.6-3.5 0-2.1 1.7-3.8 3.8-3.8.5 0 1 .1 1.4.3.2-1.6 1.6-2.9 3.3-2.9.3 0 .6 0 .9.1z' },
            { name: 'Facebook', icon: 'M24 12.1c0-6.6-5.4-12-12-12S0 5.5 0 12.1c0 5.9 4.4 10.9 10.1 11.8v-8.3H7.1v-3.4h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 2v2.4h3.4l-.5 3.5h-2.8v8.3c5.7-.9 10.1-5.9 10.1-11.8z' },
            { name: 'Twitter / X', icon: 'M18.2 5.3l-6.8 7.6 7.5 10.8h-6l-4.3-6.4-5.2 6.4H2l7.4-8.6L2.3 3.3h6.1l4 5.8 5-5.8h5.8v0zM15.2 21.2L5.6 7.5l1.6-2 9.6 13.4-1.6 2.3z' },
            { name: 'Telegram', icon: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.5 6.5l-1.8 8.5s-.3.7-1 .4l-3-2.2-1.8 1.6s-.2.2-.5.2l.2-2.8 5-4.5s.2-.2-.1-.3c-.2-.1-.3 0-.3 0l-6.3 4-2.7-.9s-.4-.1-.5-.5c0-.4.5-.6.5-.6l10.4-4.1s.9-.4.9.4z' },
            { name: 'Spotify', icon: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.7 0 12 0zm5.6 17.4c-.2.4-.7.5-1.1.3-2.9-1.6-6.5-1.9-10.8-1-.4.1-.9-.2-1-.6-.1-.4.2-.9.6-1 4.7-1 8.7-.6 11.9 1.1.4.2.6.7.4 1.2zm1.5-3.5c-.3.5-.9.7-1.4.4-3.3-1.8-8.3-2.3-12.2-1.3-.5.2-1.1-.1-1.3-.7-.2-.5.1-1.1.7-1.3 4.4-1.2 10-.6 13.8 1.5.5.2.7.8.4 1.4zm.1-3.7c-4-2.2-10.5-2.4-14.3-1.3-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.4-1.2 11.5-1 16.1 1.5.6.3.8 1 .4 1.6-.3.5-1 .7-1.5.5z' },
            { name: 'LinkedIn', icon: 'M20.4 20.5H17V14c0-1.5-.5-2.5-1.8-2.5-1 0-1.6.7-1.9 1.3-.1.2-.1.6-.1 1v6.7h-3.5v-8s0-1.7-.1-2.8h3l.1 1.5c.5-.8 1.3-1.3 2.6-1.3 2.2 0 3.8 1.4 3.8 4.5v6.1h.3zM6 8.3c-1.2 0-2-.8-2-1.8s.8-1.8 2-1.8 2 .8 2 1.8-.8 1.8-2 1.8zM4.2 20.5V10h3.6v10.5H4.2zM22.7 0H1.3C.6 0 0 .6 0 1.3v21.4c0 .7.6 1.3 1.3 1.3h21.4c.7 0 1.3-.6 1.3-1.3V1.3c0-.7-.6-1.3-1.3-1.3z' },
          ].map((platform) => (
            <div
              key={platform.name}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/50 transition-all hover:scale-105 cursor-pointer group"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="h-6 w-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d={platform.icon} />
                </svg>
              </div>
              <span className="font-medium text-foreground">{platform.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 mx-auto max-w-7xl bg-card/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started in minutes with just 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Create Account',
              description: 'Sign up for free and add funds to your wallet using your preferred payment method.',
              icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
            },
            {
              step: '02',
              title: 'Choose Service',
              description: 'Browse our catalog of 1000+ services for Instagram, YouTube, TikTok, and more.',
              icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            },
            {
              step: '03',
              title: 'Watch Your Growth',
              description: 'Enter your link, set quantity, and watch your social media grow instantly!',
              icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="text-6xl font-bold text-emerald-500/20 mb-4">{item.step}</div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Preview */}
      <section id="services" className="py-20 px-6 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Popular Services
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most requested services by our customers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { platform: 'Instagram', service: 'Followers', price: '$0.50', per: 'per 1000', features: ['High Quality', 'Instant Start', 'Refill Guarantee'] },
            { platform: 'Instagram', service: 'Likes', price: '$0.30', per: 'per 1000', features: ['Real Users', 'Fast Delivery', 'No Drop'] },
            { platform: 'YouTube', service: 'Views', price: '$1.00', per: 'per 1000', features: ['Real Views', 'Watch Time', 'Monetizable'] },
            { platform: 'YouTube', service: 'Subscribers', price: '$2.00', per: 'per 1000', features: ['Real Subs', 'No Drop', 'Lifetime Warranty'] },
            { platform: 'TikTok', service: 'Followers', price: '$0.80', per: 'per 1000', features: ['High Quality', 'Fast Start', 'Refill 30 Days'] },
            { platform: 'TikTok', service: 'Views', price: '$0.20', per: 'per 1000', features: ['Real Views', ' viral Ready', 'Instant'] },
          ].map((item, index) => (
            <div key={index} className="rounded-2xl bg-card border border-border p-6 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
                  {item.platform}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{item.price}</div>
                  <div className="text-xs text-muted-foreground">{item.per}</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{item.service}</h3>
              <ul className="space-y-2">
                {item.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="/services"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium hover:bg-emerald-500/20 transition-colors"
              >
                Order Now
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/services"
            className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
          >
            View All 1000+ Services
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 mx-auto max-w-7xl bg-card/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Why Choose SMMHub?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We provide the best SMM services with unmatched quality
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Instant Delivery', description: 'Orders start processing within seconds. Watch your engagement grow in real-time.' },
            { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Best Prices', description: 'We offer the most competitive prices in the market. Quality service at affordable rates.' },
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Safe & Secure', description: 'Your account safety is our priority. We never ask for passwords, only your profile link.' },
            { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: 'Refill Guarantee', description: 'If you experience any drop, we will refill your order for free within the guarantee period.' },
            { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: '24/7 Support', description: 'Our support team is available around the clock to help you with any questions or issues.' },
            { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Order Tracking', description: 'Track all your orders in real-time from your dashboard. Know exactly when your order completes.' },
          ].map((feature, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { q: 'What is SMMHub?', a: 'SMMHub is a social media marketing platform that helps you grow your social media presence. We provide services for Instagram, YouTube, TikTok, Facebook, Twitter, and more.' },
            { q: 'Is it safe to use?', a: 'Yes, absolutely! We never ask for your password. All we need is your profile link or username. We use secure payment methods and all transactions are encrypted.' },
            { q: 'How fast will I see results?', a: 'Most orders start within minutes and complete within hours to days depending on the service and quantity. You can track your order progress in real-time from your dashboard.' },
            { q: 'Do you offer refunds?', a: 'Yes, we offer refunds or refills for orders that do not get delivered as promised. We also offer refill guarantees on many services for drops that occur after delivery.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, cryptocurrency, and various local payment methods. Add funds easily through your dashboard.' },
          ].map((faq, index) => (
            <div key={index} className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{faq.q}</h3>
              <p className="text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 mx-auto max-w-7xl">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 lg:p-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to Grow Your Social Media?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Join thousands of influencers, businesses, and creators who trust SMMHub for their social media growth.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-600 shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
            >
              Start Growing Now
            </a>
            <a
              href="/services"
              className="w-full sm:w-auto rounded-full bg-white/20 border border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/30 transition-all"
            >
              View Services
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
