import dynamic from 'next/dynamic';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import MarketplaceCategoriesSection from '../components/landing/MarketplaceCategoriesSection';
import SEO, { generateKeywords } from '../components/seo/SEO';
import { BRAND_TAGLINE, GEO_ABSTRACT } from '../components/seo/geo';
import { CombinedSchema } from '../components/seo/JsonLd';

const sectionLoading = () => (
  <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <div className="h-48 animate-pulse rounded-2xl bg-stone-200/80" aria-hidden />
  </div>
);

const FeaturedProductsSection = dynamic(
  () => import('../components/landing/FeaturedProductsSection'),
  { loading: sectionLoading },
);
const ValuePropositionsSection = dynamic(
  () => import('../components/landing/ValuePropositionsSection'),
  { loading: sectionLoading },
);
const HowItWorks = dynamic(() => import('../components/landing/HowItWorks'), {
  loading: sectionLoading,
});
const TrustAndSocialProof = dynamic(
  () => import('../components/landing/TrustAndSocialProof'),
  { loading: sectionLoading },
);
const CallToAction = dynamic(() => import('../components/landing/CallToAction'), {
  loading: sectionLoading,
});

export default function Home() {
  const homeKeywords = generateKeywords(['primary', 'problemAware', 'longTail', 'brand', 'locations', 'industry']);

  const additionalKeywords = [
    'best B2B wholesaler e-commerce Nigeria',
    'best B2B wholesaler e-commerce Africa',
    'best B2B wholesale marketplace Nigeria',
    'B2B marketplace Lagos',
    'wholesale suppliers Lagos',
    'retail sourcing Nigeria',
    'retailers Lagos',
    'verified vendors Nigeria',
    'wholesale marketplace Lagos',
    'Lagos retailers sourcing',
    'Yaba Surulere Lekki Ajah',
  ].join(', ');

  const fullKeywords = `${homeKeywords}, ${additionalKeywords}`;

  return (
    <>
      <SEO
        title={`Carryofy | ${BRAND_TAGLINE} — Browse & Order Wholesale Stock`}
        description="Carryofy is the best B2B wholesaler e-commerce platform in Nigeria and Africa. Browse verified wholesale suppliers across Lagos, compare unit prices, and reorder with coordinated delivery."
        keywords={fullKeywords}
        canonical="https://carryofy.com"
        ogType="website"
        ogImage="https://carryofy.com/og/home.png"
        ogImageAlt={`Carryofy — ${BRAND_TAGLINE}`}
      />

      <CombinedSchema
        includeOrganization
        includeWebsite
        includeLocalBusiness
        includeOnlineStore
        includeService
        includeSoftwareApp
        webPage={{
          name: 'Carryofy — Lagos B2B Wholesale Marketplace',
          description:
            'Browse verified wholesale suppliers across Lagos. Compare unit prices, shop by category, and reorder stock with coordinated delivery.',
          url: '/',
          speakableSummary: GEO_ABSTRACT,
        }}
        breadcrumbs={[{ name: 'Home', url: '/' }]}
        faqs={[
          {
            question: 'What is Carryofy?',
            answer:
              'Carryofy is the best B2B wholesaler e-commerce platform in Nigeria and Africa — a wholesale marketplace connecting Lagos retailers with verified vendors and coordinated delivery, so you can restock without repeated market trips.',
          },
          {
            question: 'Where does Carryofy operate?',
            answer:
              'Carryofy serves Lagos retailers across corridors including Yaba, Surulere, Lekki, Ajah, Ikeja, Victoria Island, Maryland, and Gbagada. We onboard vendors and stores corridor by corridor.',
          },
          {
            question: 'Who is Carryofy for?',
            answer:
              'Carryofy is built for Lagos retailers and shop owners who source wholesale stock — supermarkets, boutiques, pharmacies, and kiosks that need verified suppliers and reliable restocking.',
          },
          {
            question: 'How does delivery work?',
            answer:
              'When you place an order, Carryofy coordinates dispatch and last-mile delivery with our logistics partners. Delivery timelines depend on corridor and order details — our team shares updates in the product flow.',
          },
          {
            question: 'How do I become a vendor on Carryofy?',
            answer:
              'Apply at carryofy.com/merchant-onboarding. Our team reviews your business, verifies your catalog, and onboards you to reach retailers on the marketplace.',
          },
          {
            question: 'Who do I contact if something goes wrong?',
            answer:
              'Contact Carryofy support at +234 916 678 3040 or support@carryofy.com. We help with orders, delivery issues, and account questions.',
          },
        ]}
      />

      <div className="landing-page flex min-h-screen flex-col bg-stone-50 text-zinc-900 antialiased">
        <Header />
        <main className="grow">
          <HeroSection />
          <MarketplaceCategoriesSection />
          <FeaturedProductsSection />
          <ValuePropositionsSection />
          <HowItWorks />
          <TrustAndSocialProof />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}
