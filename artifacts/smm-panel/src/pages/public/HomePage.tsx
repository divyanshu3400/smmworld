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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
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
