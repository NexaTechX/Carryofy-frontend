import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import AnnouncementBar from '../components/promotions/AnnouncementBar';
import HeroBanner from '../components/promotions/HeroBanner';
import PromoBanner from '../components/promotions/PromoBanner';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import TrustSection from '../components/landing/TrustSection';
import HowItWorks from '../components/landing/HowItWorks';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import ValuePropositionsSection from '../components/landing/ValuePropositionsSection';
import SameDayDelivery from '../components/landing/SameDayDelivery';
import B2BSection from '../components/landing/B2BSection';
import SmartCommerce from '../components/landing/SmartCommerce';
import SellerCTASection from '../components/landing/BuyerSellerSection';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';
import SEO, { generateKeywords } from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Home() {
  const homeKeywords = generateKeywords(['primary', 'problemAware', 'longTail', 'brand', 'locations', 'industry']);

  const additionalKeywords = [
    'verified marketplace Nigeria',
    'multi-vendor marketplace Nigeria',
    'verified vendors Nigeria',
    'trusted marketplace Africa',
    'online marketplace Nigeria',
    'ecommerce platform Nigeria',
    'sell online Nigeria',
    'buy online Nigeria',
    'online shopping Nigeria',
    'verified sellers Nigeria',
    'secure marketplace Nigeria',
    'transparent commissions',
    'verified vendors marketplace',
    'trusted ecommerce Nigeria',
    'secure payments Nigeria',
    'buyer protection Nigeria',
    'admin approved products',
    'marketplace for businesses',
    'vendor marketplace Nigeria',
    'sell products online Nigeria',
    'multi-vendor platform',
    'African ecommerce',
    'African marketplace',
    'marketplace Lagos',
    'ecommerce Lagos',
    'online marketplace Lagos',
    'verified vendors Lagos',
    'commerce infrastructure Africa',
    'fulfillment logistics Nigeria',
    'AI-powered marketplace',
  ].join(', ');

  const fullKeywords = `${homeKeywords}, ${additionalKeywords}`;

  return (
    <>
      <SEO
        title="Carryofy | Source Wholesale. Sell Retail. Scale Globally."
        description="The all-in-one AI platform for African SMEs to buy inventory from top manufacturers and sell directly to consumers with built-in logistics. Start your business today with $0 inventory."
        keywords={fullKeywords}
        canonical="https://carryofy.com"
        ogType="website"
        ogImage="https://carryofy.com/og/home.png"
        ogImageAlt="Carryofy - Source Wholesale. Sell Retail. Scale Globally."
      />

      <CombinedSchema
        includeOrganization
        includeWebsite
        includeSoftwareApp
        breadcrumbs={[{ name: 'Home', url: '/' }]}
        faqs={[
          {
            question: 'How does delivery work?',
            answer: "Carryofy stores all products in our warehouse. When you order, we pack and ship directly to you. Same-day delivery is available in Lagos for orders placed before 12pm. For other areas in Nigeria, delivery takes 1-3 business days. You'll receive tracking information once your order ships.",
          },
          {
            question: 'Who do I contact if something goes wrong?',
            answer: 'Contact Carryofy support directly via phone at +234 916 678 3040 or email support@carryofy.com. Our Nigerian support team is available to help with orders, delivery issues, refunds, or any questions. We resolve issues quickly.',
          },
          {
            question: 'How do refunds work?',
            answer: "Carryofy offers a 7-day return policy. If you receive a damaged or incorrect item, contact our support team via phone or email. We'll arrange a full refund or replacement. Refunds are processed to your original payment method within 3-5 business days after we receive the returned item.",
          },
          {
            question: 'Are products really in stock?',
            answer: 'Yes. All products shown are stocked in our Carryofy warehouse. We display real-time inventory, so if a product shows "In stock — Fulfilled by Carryofy," it\'s ready to ship immediately.',
          },
          {
            question: 'Is it safe to pay on Carryofy?',
            answer: "Yes. Your payment is protected by Carryofy. We use secure payment infrastructure with buyer protection. All transactions are encrypted. We only release funds after successful delivery, so you're covered if anything goes wrong.",
          },
        ]}
      />

      <div className="min-h-screen flex flex-col font-inter bg-[#FAFAFA]">
        <AnnouncementBar />
        <Header />
        <main className="grow">
          <HeroBanner />
          <HeroSection />
          <PromoBanner />
          <TrustSection />
          <ValuePropositionsSection />
          <ProblemSection />
          <SolutionSection />
          <WhyChooseCarryofy />
          <SameDayDelivery />
          <B2BSection />
          <SmartCommerce />
          <HowItWorks />
          <Testimonials />
          <SellerCTASection />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}
