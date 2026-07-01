import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  canonicalPath?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
    section?: string
  }
  product?: {
    price?: string
    currency?: string
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  }
  noindex?: boolean
  children?: React.ReactNode
}

const SITE_URL = 'https://ssmm.online'
const DEFAULT_OG_IMAGE = '/opengraph.png'

export default function SEO({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  article,
  product,
  noindex = false,
  children,
}: SEOProps) {
  const fullTitle = title.includes('SSMM') ? title : `${title} | SSMM`
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="SSMM" />
      <meta property="og:locale" content="en_US" />

      {/* Article specific */}
      {ogType === 'article' && article && (
        <>
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
        </>
      )}

      {/* Product specific */}
      {ogType === 'product' && product && (
        <>
          {product.price && <meta property="product:price:amount" content={product.price} />}
          {product.currency && <meta property="product:price:currency" content={product.currency} />}
          {product.availability && <meta property="product:availability" content={product.availability} />}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ssmmonline" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {children}
    </Helmet>
  )
}
