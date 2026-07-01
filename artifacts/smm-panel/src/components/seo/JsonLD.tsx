import { Helmet } from 'react-helmet-async'

interface OrganizationJsonLDProps {
  name?: string
  url?: string
  logo?: string
  description?: string
}

export function OrganizationJsonLD({
  name = 'SSMM',
  url = 'https://ssmm.online',
  logo = 'https://ssmm.online/logo.png',
  description = 'SSMM is a leading SMM panel platform offering social media growth services including Instagram followers, YouTube views, TikTok likes, and more at the cheapest prices with instant delivery.',
}: OrganizationJsonLDProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}/#organization`,
    name,
    alternateName: ['SSMM Panel', 'SSMM Social Media Marketing'],
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512,
    },
    description,
    sameAs: [
      'https://twitter.com/ssmmonline',
      'https://t.me/ssmmonline',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'English',
      url: `${url}/contact`,
    },
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}

interface BreadcrumbJsonLDProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbJsonLD({ items }: BreadcrumbJsonLDProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}

interface ServiceJsonLDProps {
  name: string
  description: string
  url: string
  provider?: string
  priceRange?: string
  areaServed?: string
}

export function ServiceJsonLD({
  name,
  description,
  url,
  provider = 'SSMM',
  priceRange = '$0.001 - $100',
  areaServed = 'Worldwide',
}: ServiceJsonLDProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: provider,
      url: 'https://ssmm.online',
    },
    priceRange,
    areaServed: {
      '@type': 'GeoRegion',
      name: areaServed,
    },
    serviceType: 'Social Media Marketing',
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}

interface FAQJsonLDProps {
  questions: Array<{ question: string; answer: string }>
}

export function FAQJsonLD({ questions }: FAQJsonLDProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}

interface HowToJsonLDProps {
  name: string
  description: string
  steps: Array<{ name: string; text: string; image?: string }>
  totalTime?: string
  estimatedCost?: string
}

export function HowToJsonLD({
  name,
  description,
  steps,
  totalTime = 'PT5M',
  estimatedCost = '$1',
}: HowToJsonLDProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    totalTime,
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: estimatedCost,
    },
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}

interface ProductJsonLDProps {
  name: string
  description: string
  url: string
  price: string
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand?: string
  aggregateRating?: {
    ratingValue: string
    reviewCount: string
  }
}

export function ProductJsonLD({
  name,
  description,
  url,
  price,
  currency = 'USD',
  availability = 'InStock',
  brand = 'SSMM',
  aggregateRating,
}: ProductJsonLDProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  }

  if (aggregateRating) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    }
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  )
}
