import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorks from '../components/landing/HowItWorks';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import ValuePropositionsSection from '../components/landing/ValuePropositionsSection';
import HomepageOnboardingNote from '../components/landing/HomepageOnboardingNote';
import CallToAction from '../components/landing/CallToAction';
import SEO, { generateKeywords } from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Home() {
  const homeKeywords = generateKeywords(['primary', 'problemAware', 'longTail', 'brand', 'locations', 'industry']);

  const additionalKeywords = [
    'B2B marketplace Lagos',
    'retailers Lagos',
    'verified vendors Nigeria',
    'wholesale marketplace Lagos',
    'fashion beauty electronics grocery Lagos',
    'Lagos retailers sourcing',
    'Yaba Surulere Lekki Ajah',
  ].join(', ');

  const fullKeywords = `${homeKeywords}, ${additionalKeywords}`;

  return (
    <>
      <SEO
        title="Carryofy | The B2B Marketplace for Lagos Retailers"
        description="The B2B marketplace for Lagos retailers. Source everything — fashion, beauty, electronics, grocery — from verified vendors. We handle delivery."
        keywords={fullKeywords}
        canonical="https://carryofy.com"
        ogType="website"
        ogImage="https://carryofy.com/og/home.png"
        ogImageAlt="Carryofy — B2B marketplace for Lagos retailers"
      />

      <CombinedSchema
        includeOrganization
        includeWebsite
        includeSoftwareApp
        breadcrumbs={[{ name: 'Home', url: '/' }]}
        faqs={[
          {
            question: 'What is Carryofy?',
            answer:
              'Carryofy is a B2B marketplace connecting Lagos retailers with verified vendors across fashion, beauty, electronics, and grocery. We coordinate delivery so you can restock without repeated market trips.',
          },
          {
            question: 'Where does Carryofy operate?',
            answer:
              'We are live across Lagos corridors including Yaba, Surulere, and Lekki/Ajah, and we are onboarding retailers and vendors in these areas.',
          },
          {
            question: 'How does delivery work?',
            answer:
              'When you place an order, Carryofy coordinates dispatch and last-mile delivery with our logistics partners. Delivery timelines depend on corridor and order details — our team shares updates in the product flow.',
          },
          {
            question: 'Who do I contact if something goes wrong?',
            answer:
              'Contact Carryofy support at +234 916 678 3040 or support@carryofy.com. We help with orders, delivery issues, and account questions.',
          },
        ]}
      />

      <div className="min-h-screen flex flex-col font-inter bg-[#FAFAFA]">
        <Header />
        <main className="grow">
          <HeroSection />
          <StatsBar />
          <ValuePropositionsSection />
          <ProblemSection />
          <HowItWorks />
          <WhyChooseCarryofy />
          <HomepageOnboardingNote />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}
