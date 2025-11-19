import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Image from 'next/image';

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

          {/* Mission Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                  Our Mission
                </h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                  Carryofy was founded with a clear vision: to revolutionize e-commerce in Nigeria by
                  making it easier for sellers to reach customers and for buyers to access quality
                  products. We believe that every business, regardless of size, should have access to
                  professional logistics and fulfillment services.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Our mission is to bridge the gap between sellers and buyers, providing a trusted
                  platform that handles the complexities of logistics, payment processing, and order
                  fulfillment, so entrepreneurs can focus on what they do best - creating and selling
                  great products.
                </p>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
                Our Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Trust</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    We build trust through transparency, reliability, and consistent delivery of
                    our promises to both sellers and buyers.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Innovation</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    We continuously innovate to improve our platform, making e-commerce more
                    accessible and efficient for everyone.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Support</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    We provide dedicated support to help our users succeed, ensuring a smooth
                    experience at every step.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Accessibility</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    We make professional e-commerce services accessible to businesses of all sizes,
                    from startups to established enterprises.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Quality</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    We maintain the highest standards in everything we do, from product handling
                    to customer service.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Community</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    We foster a strong community of sellers and buyers, creating opportunities
                    for growth and collaboration.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Story Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900">
                  Our Story
                </h2>
                <div className="space-y-6">
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Carryofy was born from a simple observation: many talented Nigerian entrepreneurs
                    struggle with logistics and fulfillment, preventing them from scaling their
                    businesses. While the products were excellent, the infrastructure to deliver them
                    efficiently was lacking.
                  </p>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    We set out to solve this problem by creating a comprehensive platform that
                    handles everything from product listing to delivery. Today, Carryofy connects
                    thousands of sellers with buyers across Nigeria, processing thousands of orders
                    monthly.
                  </p>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Our team is passionate about supporting Nigerian businesses and contributing to
                    the growth of the e-commerce ecosystem. We're constantly working to improve our
                    services and expand our reach to serve more sellers and buyers across the country.
                  </p>
                </div>
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

