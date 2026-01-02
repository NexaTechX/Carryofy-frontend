import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import WhoCarryofyIsFor from '../components/landing/WhoCarryofyIsFor';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import HowItWorks from '../components/landing/HowItWorks';
import TrustCredibility from '../components/landing/TrustCredibility';
import CallToAction from '../components/landing/CallToAction';
import SEO, { generateKeywords } from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Home() {
  // Comprehensive keywords for maximum SEO coverage
  const homeKeywords = generateKeywords(['primary', 'problemAware', 'longTail', 'brand', 'locations', 'industry']);

  // Additional long-tail keywords specifically for homepage
  const additionalKeywords = [
    // E-commerce intent keywords
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

    // Trust and credibility keywords
    'secure marketplace Nigeria',
    'transparent commissions',
    'verified vendors marketplace',
    'trusted ecommerce Nigeria',
    'secure payments Nigeria',
    'buyer protection Nigeria',
    'admin approved products',

    // Business focused keywords
    'marketplace for businesses',
    'vendor marketplace Nigeria',
    'sell products online Nigeria',
    'multi-vendor platform',
    'African ecommerce',
    'African marketplace',

    // Location variations
    'marketplace Lagos',
    'ecommerce Lagos',
    'online marketplace Lagos',
    'verified vendors Lagos',
  ].join(', ');

  const fullKeywords = `${homeKeywords}, ${additionalKeywords}`;

  return (
    <>
      <SEO
        title="Carryofy - Verified Multi-Vendor Marketplace for Modern African Commerce"
        description="Carryofy is a verified multi-vendor marketplace that helps businesses sell faster and buyers shop safely, without the chaos of traditional marketplaces. Built for modern African commerce."
        keywords={fullKeywords}
        canonical="https://carryofy.com"
        ogType="website"
        ogImage="https://carryofy.com/og/home.png"
        ogImageAlt="Carryofy - Verified Multi-Vendor Marketplace for Modern African Commerce"
      />

      <CombinedSchema
        includeOrganization
        includeWebsite
        includeSoftwareApp
        breadcrumbs={[
          { name: 'Home', url: '/' },
        ]}
        faqs={[
          {
            question: 'What is Carryofy?',
            answer: 'Carryofy is a verified multi-vendor marketplace that helps businesses sell faster and buyers shop safely, without the chaos of traditional marketplaces. We provide transparent commissions, secure payments, and a clean, focused experience.',
          },
          {
            question: 'How do I become a vendor on Carryofy?',
            answer: 'Click "Become a Vendor" on our homepage, apply, and get verified. Once approved, you can list your products with transparent commissions per product and use our built-in tools to manage listings and orders.',
          },
          {
            question: 'What makes Carryofy different from other marketplaces?',
            answer: 'Carryofy focuses on verification first with quality vendors only, transparent rules with no hidden fees, a clean UI built for speed, and is designed for Africa while being scalable globally.',
          },
          {
            question: 'How does payment work on Carryofy?',
            answer: 'We use secure payment infrastructure with buyer protection. All transactions are secure and encrypted. Vendors receive payments securely after successful sales.',
          },
          {
            question: 'Are products on Carryofy verified?',
            answer: 'Yes, all products are admin-approved and vendors go through a verification process to ensure quality and trust.',
          },
        ]}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <WhoCarryofyIsFor />
          <WhyChooseCarryofy />
          <HowItWorks />
          <TrustCredibility />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}


