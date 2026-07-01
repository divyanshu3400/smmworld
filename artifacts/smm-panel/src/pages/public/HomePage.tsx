import HeroSection from '@/components/landing/HeroSection'
import TrustBar from '@/components/landing/TrustBar'
import SocialProof from '@/components/landing/SocialProof'
import WhyChooseUs from '@/components/landing/WhyChooseUs'
import HowItWorks from '@/components/landing/HowItWorks'
import ServicesShowcase from '@/components/landing/ServicesShowcase'
import LiveActivity from '@/components/landing/LiveActivity'
import ApiSection from '@/components/landing/ApiSection'
import Reviews from '@/components/landing/Reviews'
import FAQ from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import InstantOrderSection from './InstantOrderSection'
import SEO from '@/components/seo/SEO'
import { FAQJsonLD, HowToJsonLD } from '@/components/seo/JsonLD'
import { pageSEO, faqData, howToSteps } from '@/components/seo/seo-data'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.home} />
      <FAQJsonLD questions={faqData} />
      <HowToJsonLD
        name="How to Order on SSMM"
        description="Follow these simple steps to place your first social media marketing order on SSMM"
        steps={howToSteps}
      />
      <HeroSection />
      <InstantOrderSection />
      <TrustBar />
      <SocialProof />
      <WhyChooseUs />
      <HowItWorks />
      <ServicesShowcase />
      <LiveActivity />
      <ApiSection />
      <Reviews />
      <FAQ />
      <FinalCTA />
    </div>
  )
}
