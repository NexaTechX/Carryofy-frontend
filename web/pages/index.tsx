import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import SameDayDelivery from '../components/landing/SameDayDelivery';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import FeaturedProducts from '../components/landing/FeaturedProducts';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';

export default function Home() {
  return (
    <>
      <Head>
        <title>Carryofy - The AI-Powered Commerce Platform</title>
        <meta
          name="description"
          content="Carryofy unifies marketplace, logistics, warehousing, and delivery into one intelligent platform—built specifically for African merchants."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <ProblemSection />
          <SolutionSection />
          <WhyChooseCarryofy />
          <HowItWorks />
          <FeaturedProducts />
          <Testimonials />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}

