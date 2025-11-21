import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - Carryofy</title>
        <meta
          name="description"
          content="Learn about Carryofy - Nigeria's trusted e-commerce fulfillment platform connecting sellers and buyers."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
                Empowering Nigerian businesses with seamless e-commerce fulfillment
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
                    Carryofy is transforming African commerce by building a reliable, scalable, and intelligent infrastructure for buying and selling.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                    Our Vision
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center">
                    To become Africa’s most trusted commerce engine—powering millions of businesses with AI, logistics, and financial tools.
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
                  Born in Lagos, Carryofy began with a simple idea: make commerce seamless for sellers and fast for buyers. Today, we are building the continent’s first integrated commerce OS.
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
                  { title: 'Innovation', desc: 'We constantly push boundaries to create better solutions.' },
                  { title: 'Reliability', desc: 'We deliver on our promises, every single time.' },
                  { title: 'Efficiency', desc: 'We optimize every step to save time and resources.' },
                  { title: 'Customer-first', desc: 'Your success is our top priority.' },
                  { title: 'Transparency', desc: 'We believe in open and honest communication.' },
                ].map((value, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{value.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{value.desc}</p>
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
                Whether you're a seller looking to expand your reach or a buyer seeking quality
                products, Carryofy is here to help you succeed.
              </p>
              <div className="flex justify-center">
                <a
                  href="/auth/signup"
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-base sm:text-lg inline-block shadow-lg hover:shadow-xl"
                >
                  Get Started
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
