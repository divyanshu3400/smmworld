export interface PageSEO {
  title: string
  description: string
  keywords?: string
  canonicalPath?: string
}

export const siteSEO = {
  siteName: 'SSMM',
  siteUrl: 'https://ssmm.online',
  defaultImage: '/opengraph.png',
}

export const pageSEO: Record<string, PageSEO> = {
  home: {
    title: 'SSMM – #1 SMM Panel | Buy Instagram, YouTube & TikTok Followers',
    description: 'SSMM is the world\'s leading SMM panel to grow your social media accounts. Buy real Instagram followers, YouTube views, TikTok likes, Facebook fans & more. Instant delivery, cheapest prices, 24/7 support.',
    keywords: 'SMM panel, buy Instagram followers, buy YouTube views, buy TikTok likes, social media marketing, cheapest SMM panel, real followers, SSMM, social media growth',
    canonicalPath: '/',
  },
  services: {
    title: 'SMM Services – Buy Followers, Likes & Views | SSMM',
    description: 'Browse 500+ social media marketing services on SSMM. Buy Instagram followers, YouTube views, TikTok likes, Spotify streams, Telegram members & more at the lowest prices.',
    keywords: 'buy Instagram followers, buy YouTube views, buy TikTok followers, Spotify streams, Telegram members, SMM services, social media growth services',
    canonicalPath: '/services',
  },
  pricing: {
    title: 'Affordable SMM Pricing Plans | SSMM',
    description: 'SSMM offers the cheapest SMM prices starting from $0.001. View our transparent pricing for Instagram, YouTube, TikTok, Facebook, Twitter services with no hidden fees.',
    keywords: 'SMM pricing, cheapest SMM panel, social media marketing cost, Instagram followers price, YouTube views cost',
    canonicalPath: '/pricing',
  },
  about: {
    title: 'About SSMM – Best & Cheapest SMM Panel Since 2020',
    description: 'Learn about SSMM, the trusted SMM panel serving 500K+ customers worldwide. Discover our mission, 24/7 support, instant delivery, and why we\'re the #1 choice for social media growth.',
    keywords: 'about SSMM, SMM panel company, social media marketing platform, trusted SMM service',
    canonicalPath: '/about',
  },
  blog: {
    title: 'SMM Blog – Social Media Growth Tips & Guides | SSMM',
    description: 'Expert tips, tutorials, and guides on growing your social media presence. Learn Instagram strategies, YouTube growth hacks, TikTok trends, and more from SSMM.',
    keywords: 'SMM blog, social media marketing tips, Instagram growth guide, YouTube tips, TikTok marketing',
    canonicalPath: '/blog',
  },
  faq: {
    title: 'FAQ – Common Questions About SMM Services | SSMM',
    description: 'Find answers to frequently asked questions about SSMM social media marketing services. Learn about delivery times, safety, payment methods, API access, and more.',
    keywords: 'SMM FAQ, social media marketing questions, buy followers FAQ, SMM panel help',
    canonicalPath: '/faq',
  },
  apiDocs: {
    title: 'SMM API Documentation – Developer Integration | SSMM',
    description: 'Integrate SSMM services into your own platform with our powerful API. Full documentation for order placement, balance checking, service listings, and automation.',
    keywords: 'SMM API, social media API, reseller API, SMM panel integration, developer API',
    canonicalPath: '/api-docs',
  },
  contact: {
    title: 'Contact SSMM – 24/7 Customer Support',
    description: 'Contact SSMM support team 24/7 via live chat, email, or Telegram. Get help with orders, technical issues, or general questions about our social media marketing services.',
    keywords: 'SSMM contact, SMM support, social media marketing help, customer service',
    canonicalPath: '/contact',
  },
  terms: {
    title: 'Terms of Service – SSMM User Agreement',
    description: 'Read SSMM\'s terms of service including user responsibilities, payment terms, service guarantees, and acceptable use policy for our social media marketing platform.',
    canonicalPath: '/terms',
  },
  privacy: {
    title: 'Privacy Policy – Data Protection at SSMM',
    description: 'SSMM privacy policy explains how we collect, use, and protect your personal information. We never share your data with third parties or require account passwords.',
    canonicalPath: '/privacy',
  },
  refund: {
    title: 'Refund Policy – SSMM Money-Back Guarantee',
    description: 'SSMM offers transparent refund and refill policies. Learn about our money-back guarantee, refill coverage for dropped followers, and how to request a refund.',
    canonicalPath: '/refund-policy',
  },
  login: {
    title: 'Login to SSMM – Access Your SMM Dashboard',
    description: 'Sign in to your SSMM account to manage orders, add funds, track delivery status, and access all social media marketing services.',
    canonicalPath: '/login',
  },
  signup: {
    title: 'Create Free Account – Join SSMM Today',
    description: 'Register for a free SSMM account in seconds. Start buying Instagram followers, YouTube views, and TikTok likes with instant delivery and lowest prices.',
    canonicalPath: '/signup',
  },
}

export const platformSEO: Record<string, PageSEO> = {
  instagram: {
    title: 'Buy Instagram Followers, Likes & Views | SSMM',
    description: 'Buy real Instagram followers, likes, views, comments, and story views from SSMM. Instant delivery, cheapest prices, auto-refill guarantee. Grow your Instagram today.',
    keywords: 'buy Instagram followers, buy Instagram likes, Instagram views, real Instagram followers, cheapest Instagram SMM',
    canonicalPath: '/services?platform=instagram',
  },
  youtube: {
    title: 'Buy YouTube Views, Subscribers & Likes | SSMM',
    description: 'Grow your YouTube channel with SSMM. Buy real YouTube views, subscribers, likes, watch hours, and comments. Boost your monetization eligibility.',
    keywords: 'buy YouTube views, buy YouTube subscribers, YouTube likes, YouTube watch hours, YouTube growth',
    canonicalPath: '/services?platform=youtube',
  },
  tiktok: {
    title: 'Buy TikTok Followers, Likes & Views | SSMM',
    description: 'Boost your TikTok presence with SSMM. Buy TikTok followers, likes, views, shares, and comments. Instant delivery and lowest prices guaranteed.',
    keywords: 'buy TikTok followers, buy TikTok likes, TikTok views, TikTok viral, TikTok growth',
    canonicalPath: '/services?platform=tiktok',
  },
  facebook: {
    title: 'Buy Facebook Likes, Followers & Views | SSMM',
    description: 'Grow your Facebook page with SSMM. Buy real Facebook page likes, followers, post likes, video views, and reactions. Boost your social proof.',
    keywords: 'buy Facebook likes, buy Facebook followers, Facebook page likes, Facebook views',
    canonicalPath: '/services?platform=facebook',
  },
  twitter: {
    title: 'Buy Twitter Followers, Likes & Retweets | SSMM',
    description: 'Increase your Twitter presence with SSMM. Buy real Twitter followers, likes, retweets, and views. Grow your account safely and affordably.',
    keywords: 'buy Twitter followers, buy Twitter likes, Twitter retweets, X followers, Twitter growth',
    canonicalPath: '/services?platform=twitter',
  },
  telegram: {
    title: 'Buy Telegram Members & Views | SSMM',
    description: 'Grow your Telegram channel or group with SSMM. Buy real Telegram members, post views, reactions, and votes. Instant delivery, lowest prices.',
    keywords: 'buy Telegram members, Telegram views, Telegram subscribers, Telegram growth',
    canonicalPath: '/services?platform=telegram',
  },
  spotify: {
    title: 'Buy Spotify Streams, Followers & Plays | SSMM',
    description: 'Boost your Spotify music career with SSMM. Buy real Spotify streams, followers, monthly listeners, and saves. Increase your royalties and visibility.',
    keywords: 'buy Spotify streams, buy Spotify followers, Spotify plays, Spotify monthly listeners',
    canonicalPath: '/services?platform=spotify',
  },
}

export const faqData = [
  {
    question: 'What is SSMM?',
    answer: 'SSMM (ssmm.online) is a professional Social Media Marketing panel where you can buy followers, likes, views, comments, and subscribers for Instagram, YouTube, TikTok, Facebook, Twitter, and 30+ other platforms at the cheapest prices with instant delivery.',
  },
  {
    question: 'Is SSMM safe to use?',
    answer: 'Yes. SSMM uses safe, high-quality delivery methods that comply with platform guidelines. Your account password is never required, and all services are delivered gradually to appear organic.',
  },
  {
    question: 'How fast is delivery on SSMM?',
    answer: 'Most SSMM orders start within minutes. Delivery speed depends on the specific service but the majority of orders are delivered within 0-24 hours.',
  },
  {
    question: 'What payment methods does SSMM accept?',
    answer: 'SSMM accepts multiple payment methods including credit/debit cards, PayPal, cryptocurrency (Bitcoin, USDT), UPI, and various local payment options depending on your region.',
  },
  {
    question: 'Does SSMM offer an API for resellers?',
    answer: 'Yes. SSMM provides a full API that allows resellers and developers to automate orders, check balances, and integrate SSMM services into their own SMM panels.',
  },
  {
    question: 'What is the minimum order amount?',
    answer: 'SSMM has very low minimum order requirements, starting from as few as 10 units on most services, making it accessible for individuals and businesses of any size.',
  },
  {
    question: 'What happens if followers drop?',
    answer: 'SSMM provides free refills for many services. Check the service description for refill guarantees, and contact support if you notice any drops.',
  },
]

export const howToSteps = [
  {
    name: 'Create an Account',
    text: 'Sign up for a free SSMM account in seconds. No credit card required to get started.',
  },
  {
    name: 'Add Funds',
    text: 'Add funds to your wallet using your preferred payment method including cards, PayPal, crypto, or UPI.',
  },
  {
    name: 'Choose a Service',
    text: 'Browse our catalog of 500+ services for Instagram, YouTube, TikTok, Facebook, and 30+ platforms.',
  },
  {
    name: 'Place Your Order',
    text: 'Enter your link or username, select quantity, and place your order. Delivery starts automatically.',
  },
  {
    name: 'Track Progress',
    text: 'Monitor your order progress in real-time from your dashboard. Get notified when complete.',
  },
]
