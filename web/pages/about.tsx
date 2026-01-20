import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function About() {
  const aboutKeywords = [
    // Brand keywords
    'Carryofy about',
    'Carryofy company',
    'Carryofy Nigeria',
    'Carryofy Lagos',
    'Carryofy team',
    'who is Carryofy',
    'Carryofy founder',
    'Carryofy history',
    
    // Industry keywords
    'ecommerce company Nigeria',
    'logistics company Lagos',
    'African ecommerce startup',
    'Nigerian tech startup',
    'commerce platform Africa',
    'delivery company Nigeria',
    'fulfillment company Lagos',
    
    // Trust keywords
    'trusted ecommerce Nigeria',
    'reliable delivery company Lagos',
    'best logistics Nigeria',
    'top ecommerce Africa',
    
    // Location keywords
    'ecommerce Lagos Nigeria',
    'tech company Nigeria',
    'startup Lagos',
    'African commerce company',
    'West African ecommerce',
  ].join(', ');

  return (
    <>
      <SEO
        title="About Carryofy - Same-Day Delivery Platform for Lagos | Our Mission & Vision"
        description="Learn about Carryofy, Lagos' trusted same-day delivery platform. We connect buyers with verified local sellers and handle reliable delivery in Lagos, Nigeria."
        keywords={aboutKeywords}
        canonical="https://carryofy.com/about"
        ogType="website"
        ogImage="https://carryofy.com/og/about.png"
        ogImageAlt="About Carryofy - Same-Day Delivery Platform for Lagos"
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
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 sm:py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                About Carryofy
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                Enabling same-day delivery for trusted local sellers in Lagos
              </p>
            </div>
          </section>

          {/* Mission & Vision Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto space-y-12">
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                    Our Mission
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                    Carryofy helps urban customers in Lagos get same-day delivery from trusted local sellers. We connect buyers with verified sellers and handle reliable delivery with real-time tracking.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                    Our Vision
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                    To become Lagos' most trusted same-day delivery platform. We envision a future where buying from local sellers is as reliable and easy as ordering from any major retailer.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Story Section */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                  Our Story
                </h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                  Born in Lagos, Carryofy began with a simple idea: help urban customers get same-day delivery from trusted local sellers with transparent tracking. We saw the challenges buyers face with unreliable social media vendors and delayed deliveries. Today, we're building reliable same-day delivery in Lagos, connecting buyers with verified sellers.
                </p>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
                Our Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {[
                  { title: 'Reliability', desc: 'We deliver on our promises. Order today, receive today. Or your money back.' },
                  { title: 'Simplicity', desc: 'Buying from local sellers should be simple. No hassle, just order and receive with tracking.' },
                  { title: 'Trust', desc: 'We verify every seller so you can shop with confidence.' },
                  { title: 'Customer-first', desc: 'Your success is our top priority. We grow when you grow.' },
                  { title: 'Transparency', desc: 'We believe in open and honest communication with all stakeholders.' },
                ].map((value, index) => (
                  <article key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{value.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{value.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 sm:py-16 bg-gray-900 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
                {[
                  { value: '12,450+', label: 'Deliveries Completed' },
                  { value: '99.8%', label: 'Satisfaction Rate' },
                  { value: '1,000+', label: 'Active Merchants' },
                  { value: 'Lagos', label: 'Coverage Area' },
                ].map((stat, index) => (
                  <div key={index}>
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
                    <p className="text-gray-400 text-sm md:text-base">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
                Join Us Today
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Shop from trusted local sellers in Lagos and get same-day delivery with real-time tracking. Order today, receive today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="/auth/signup"
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-base sm:text-lg inline-block shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </a>
                <a
                  href="/merchant-onboarding"
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-white text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold text-base sm:text-lg inline-block"
                >
                  Become a Merchant
                </a>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
