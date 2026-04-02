import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Rocket, Globe, Users, Heart, Zap, Shield } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Careers() {
  const benefits = [
    {
      icon: Rocket,
      title: 'Work on impactful technology',
      desc: 'Build B2B sourcing and delivery tools that serve Lagos retailers and verified vendors.',
    },
    {
      icon: Globe,
      title: 'Solve a real operations problem',
      desc: 'Help merchants spend less time on market trips and more time running their stores.',
    },
    {
      icon: Users,
      title: 'Be part of an early-stage team',
      desc: 'Join people who care about execution, trust, and long-term infrastructure.',
    },
    {
      icon: Heart,
      title: 'Competitive benefits',
      desc: 'Health insurance, flexible work, and a learning budget as we grow.',
    },
    {
      icon: Zap,
      title: 'Fast career growth',
      desc: 'Grow with the company — high performers take on real ownership early.',
    },
    {
      icon: Shield,
      title: 'Work with a focused team',
      desc: 'Collaborate with engineers, operators, and designers building for Lagos first.',
    },
  ];

  const departments = [
    'Engineering',
    'Product',
    'Design',
    'Operations',
    'Logistics',
    'Customer Success',
    'Sales',
    'Marketing',
  ];

  const careersKeywords = [
    'jobs at Carryofy',
    'Carryofy careers',
    'work at Carryofy',
    'Carryofy hiring',
    'join Carryofy',
    'Carryofy jobs Lagos',
    'tech jobs Lagos',
  ].join(', ');

  return (
    <>
      <SEO
        title="Careers at Carryofy — Build B2B Commerce in Lagos"
        description="We're an early-stage team building the B2B marketplace for Lagos retailers. Explore careers and how to reach us."
        keywords={careersKeywords}
        canonical="https://carryofy.com/careers"
        ogType="website"
        ogImage="https://carryofy.com/og/careers.png"
        ogImageAlt="Careers at Carryofy"
      />

      <CombinedSchema
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Careers', url: '/careers' },
        ]}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <section className="bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#111111] py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-sm">
                Build the Infrastructure for B2B Commerce in Lagos
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                We&apos;re an early-stage team solving a real problem for Lagos retailers. If you want to build something that matters, we&apos;d like to meet you.
              </p>
              <a
                href="#openings"
                className="inline-block px-8 py-4 bg-primary text-black rounded-full font-bold text-lg hover:bg-primary-dark transition"
              >
                View Open Positions
              </a>
            </div>
          </section>

          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Why Join Carryofy?</h2>
              <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                We&apos;re building something focused and we want the right people alongside us.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {benefits.map((benefit, index) => (
                  <article key={index} className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <benefit.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Our Teams</h2>
              <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                We hire across these areas as needs come up.
              </p>
              <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                {departments.map((dept, index) => (
                  <span
                    key={index}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-full text-gray-700 font-medium hover:border-primary hover:text-primary transition cursor-default"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section id="openings" className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Open Positions</h2>
              <div className="max-w-3xl mx-auto">
                <div className="bg-gray-50 p-12 rounded-2xl border border-dashed border-gray-300 text-center">
                  <p className="text-gray-700 text-lg mb-4 font-medium">No open positions at the moment.</p>
                  <p className="text-gray-600 leading-relaxed">
                    We hire based on need, not headcount. Send your CV and what you&apos;d build here to{' '}
                    <a href="mailto:careers@carryofy.com" className="text-primary font-semibold hover:underline">
                      careers@carryofy.com
                    </a>{' '}
                    — we read every one.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-900 text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Tell us what you want to build and how you&apos;d help Lagos retailers and vendors.
              </p>
              <a
                href="mailto:careers@carryofy.com"
                className="inline-block px-8 py-4 bg-primary text-black rounded-full font-bold text-lg hover:bg-primary-dark transition"
              >
                Send Your Resume
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
