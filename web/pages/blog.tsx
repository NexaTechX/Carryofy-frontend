import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Blog() {
  const categories = [
    'Merchant Growth',
    'Logistics Innovation',
    'B2B Sourcing',
    'Retail Operations',
    'Lagos Business',
  ];

  const blogKeywords = [
    'Carryofy blog',
    'B2B retail Lagos',
    'Lagos retailers',
    'sourcing marketplace Nigeria',
  ].join(', ');

  const featuredPosts = [
    {
      title: 'How to Start Selling Online in Nigeria: A Complete Guide',
      excerpt:
        'Learn everything you need to know about starting your e-commerce business in Nigeria, from registration to your first sale.',
      category: 'Merchant Growth',
      date: '2026-01-15',
    },
    {
      title: "Faster Fulfillment: How Expectations Are Shifting for Nigerian E-Commerce",
      excerpt:
        'Discover how faster fulfillment is changing expectations for merchants and retailers in Nigerian cities.',
      category: 'Logistics Innovation',
      date: '2026-01-10',
    },
    {
      title: 'How to Source from Verified Vendors in Lagos: A Practical Guide',
      excerpt:
        'A practical look at sourcing stock for your store through trusted channels and clear delivery expectations.',
      category: 'Buyer Tips',
      date: '2026-01-05',
    },
    {
      title: 'Why Lagos Retailers Are Ditching Market Trips in 2026',
      excerpt:
        'How B2B marketplaces are helping retailers save time and reduce uncertainty when restocking.',
      category: 'Merchant Growth',
      date: '2026-04-02',
    },
  ];

  return (
    <>
      <SEO
        title="Carryofy Blog — Sourcing, Selling & Scaling"
        description="Ideas and updates on sourcing, selling, and scaling on Carryofy — for Lagos retailers and verified vendors."
        keywords={blogKeywords}
        canonical="https://carryofy.com/blog"
        ogType="website"
        ogImage="https://carryofy.com/og/blog.png"
        ogImageAlt="Carryofy Blog"
      />

      <CombinedSchema
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ]}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <header className="text-center mb-16">
              <h1 className="text-4xl font-bold mb-6 text-gray-900">Insights for Retailers & Vendors</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Tips and perspectives on sourcing, selling, and scaling on Carryofy.
              </p>
            </header>

            <nav className="flex flex-wrap justify-center gap-4 mb-16" aria-label="Blog categories">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-primary hover:text-primary cursor-pointer transition"
                >
                  {cat}
                </button>
              ))}
            </nav>

            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Featured Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {featuredPosts.map((post, index) => (
                  <article
                    key={index}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-4">
                      <span className="text-primary font-bold text-sm text-center leading-snug">{post.category}</span>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-xs text-primary font-medium uppercase tracking-wider">{post.category}</span>
                      <h3 className="text-xl font-bold mt-2 mb-3 text-gray-900 hover:text-primary transition cursor-pointer">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 flex-1">{post.excerpt}</p>
                      <time className="text-xs text-gray-400 mt-auto" dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="text-center py-12 bg-white rounded-2xl max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">More articles</h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                We&apos;re working on more articles for retailers and vendors in Lagos. Subscribe to hear when we publish.
              </p>
              <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto px-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-black rounded-lg font-semibold hover:bg-primary-dark transition"
                >
                  Subscribe
                </button>
              </form>
            </section>

            <section className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Topics We Cover</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'B2B Sourcing',
                    desc: 'How retailers find verified vendors and restock without endless market trips.',
                  },
                  {
                    title: 'Logistics & Delivery',
                    desc: 'What to expect when delivery is coordinated for your store or your buyers.',
                  },
                  {
                    title: 'Retail Operations',
                    desc: 'Practical ideas for running a store in Lagos with less friction.',
                  },
                  {
                    title: 'Merchant Growth',
                    desc: 'Stories and tactics for vendors reaching more retailers on Carryofy.',
                  },
                ].map((topic, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{topic.title}</h3>
                    <p className="text-gray-600 text-sm">{topic.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
