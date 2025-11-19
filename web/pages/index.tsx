import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import SameDayDelivery from '../components/landing/SameDayDelivery';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import FeaturedProducts from '../components/landing/FeaturedProducts';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';

export default function Home() {
  return (
    <>
      <Head>
        <title>Carryofy - Nigerian E-commerce Fulfillment Platform</title>
        <meta
          name="description"
          content="Carryofy connects Nigerian sellers and buyers with seamless e-commerce fulfillment. Focus on your sales, we handle the logistics."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <SameDayDelivery />
          <HowItWorks />
          <WhyChooseCarryofy />
          <FeaturedProducts />
          <Testimonials />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}

