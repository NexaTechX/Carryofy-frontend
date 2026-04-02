import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';
import Link from 'next/link';

export default function About() {
  const aboutKeywords = [
    'Carryofy about',
    'Carryofy company',
    'Carryofy Nigeria',
    'Carryofy Lagos',
    'B2B marketplace Lagos',
    'who is Carryofy',
    'Carryofy founder',
  ].join(', ');

  return (
    <>
      <SEO
        title="About Carryofy — B2B Sourcing for Lagos Retailers"
        description="Carryofy connects Lagos retailers with verified vendors. We coordinate delivery across Yaba, Surulere, and Lekki/Ajah. Learn our mission and story."
        keywords={aboutKeywords}
        canonical="https://carryofy.com/about"
        ogType="website"
        ogImage="https://carryofy.com/og/about.png"
        ogImageAlt="About Carryofy"
      />

      <CombinedSchema
        includeOrganization
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'About Us', url: '/about' },
        ]}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <section className="bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#111111] py-12 sm:py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white drop-shadow-sm">
                About Carryofy
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                The B2B marketplace for Lagos retailers — source from verified vendors, delivery coordinated for your store.
              </p>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto space-y-12">
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                    Our Mission
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                    To eliminate unnecessary market trips for Lagos retailers by building Africa&apos;s most reliable B2B sourcing and delivery network.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                    Our Vision
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                    A future where any retailer in Africa can source inventory from verified vendors in clicks — with delivery handled end-to-end.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                  Our Story
                </h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                  Carryofy started with a simple observation: Lagos retailers spend hours making market trips just to restock basic inventory. The market is fragmented, suppliers are unverified, and there&apos;s no reliable delivery. We&apos;re building the infrastructure to fix that — starting with Lagos.
                </p>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
                Our Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
                {[
                  {
                    title: 'Reliability',
                    desc: 'We say what we do and follow through — for retailers, vendors, and partners.',
                  },
                  {
                    title: 'Transparency',
                    desc: 'Clear expectations on sourcing, delivery, and how Carryofy works with you.',
                  },
                  {
                    title: 'Merchant-First',
                    desc: 'Product decisions start with what helps retailers and vendors succeed.',
                  },
                ].map((value, index) => (
                  <article key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{value.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{value.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-gray-900 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                  Currently live across Yaba, Surulere, and Lekki/Ajah. Onboarding retailers and vendors now.
                </p>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
                Join Us
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Start sourcing for your store or list as a verified vendor on Carryofy.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-base sm:text-lg inline-block shadow-lg hover:shadow-xl"
                >
                  Start Sourcing
                </Link>
                <Link
                  href="/merchant-onboarding"
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-white text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold text-base sm:text-lg inline-block"
                >
                  Sell on Carryofy
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
