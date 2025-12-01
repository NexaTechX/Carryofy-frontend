import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Blog() {
    const categories = [
        'Merchant Growth',
        'Logistics Innovation',
        'AI in Commerce',
        'Fulfillment Strategies',
        'Case Studies',
        'E-commerce Tips',
        'Nigerian Business',
    ];

    const blogKeywords = [
        // Blog intent keywords
        'ecommerce blog Nigeria',
        'logistics blog Africa',
        'business tips Nigeria',
        'online selling tips',
        'merchant growth strategies',
        
        // Content keywords
        'how to sell online Nigeria',
        'ecommerce tips Africa',
        'logistics insights Nigeria',
        'delivery business tips',
        'online business Nigeria',
        'African commerce news',
        'startup tips Nigeria',
        
        // Industry news
        'ecommerce news Nigeria',
        'logistics news Africa',
        'African business news',
        'tech news Nigeria',
        'startup news Lagos',
        
        // Educational keywords
        'learn ecommerce Nigeria',
        'online selling guide Africa',
        'logistics guide Nigeria',
        'merchant success stories',
        'ecommerce case studies Africa',
        
        // Trending keywords
        'dropshipping Nigeria',
        'fulfillment tips Africa',
        'inventory management Nigeria',
        'delivery optimization Lagos',
        'AI commerce Africa',
    ].join(', ');

    // Placeholder blog posts for structured data
    const featuredPosts = [
        {
            title: 'How to Start Selling Online in Nigeria: A Complete Guide',
            excerpt: 'Learn everything you need to know about starting your e-commerce business in Nigeria, from registration to your first sale.',
            category: 'Merchant Growth',
            date: '2024-01-15',
        },
        {
            title: 'Same-Day Delivery: How It\'s Transforming Nigerian E-Commerce',
            excerpt: 'Discover how same-day delivery is changing customer expectations and boosting sales for Nigerian merchants.',
            category: 'Logistics Innovation',
            date: '2024-01-10',
        },
        {
            title: 'AI in African E-Commerce: The Future is Here',
            excerpt: 'Explore how artificial intelligence is revolutionizing commerce in Africa, from pricing optimization to customer service.',
            category: 'AI in Commerce',
            date: '2024-01-05',
        },
    ];

    return (
        <>
            <SEO
                title="Carryofy Blog - E-Commerce Tips, Logistics Insights & African Business News"
                description="Stay updated with the latest e-commerce trends, logistics innovations, and business tips for African entrepreneurs. Expert insights on selling online, delivery optimization, AI commerce, and growing your business in Nigeria and Africa."
                keywords={blogKeywords}
                canonical="https://carryofy.com/blog"
                ogType="website"
                ogImage="https://carryofy.com/og/blog.png"
                ogImageAlt="Carryofy Blog - E-Commerce and Logistics Insights"
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
                        {/* Hero Section */}
                        <header className="text-center mb-16">
                            <h1 className="text-4xl font-bold mb-6">Insights on African Commerce, Logistics & AI</h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Stay updated with the latest trends, tips, and strategies for growing your business in Nigeria and across Africa.
                            </p>
                        </header>

                        {/* Categories */}
                        <nav className="flex flex-wrap justify-center gap-4 mb-16" aria-label="Blog categories">
                            {categories.map((cat, index) => (
                                <button
                                    key={index}
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-primary hover:text-primary cursor-pointer transition"
                                >
                                    {cat}
                                </button>
                            ))}
                        </nav>

                        {/* Featured Posts */}
                        <section className="mb-16">
                            <h2 className="text-2xl font-bold mb-8 text-center">Featured Articles</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                                {featuredPosts.map((post, index) => (
                                    <article key={index} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                            <span className="text-primary font-bold text-lg">{post.category}</span>
                                        </div>
                                        <div className="p-6">
                                            <span className="text-xs text-primary font-medium uppercase tracking-wider">{post.category}</span>
                                            <h3 className="text-xl font-bold mt-2 mb-3 text-gray-900 hover:text-primary transition cursor-pointer">
                                                {post.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                                            <time className="text-xs text-gray-400" dateTime={post.date}>
                                                {new Date(post.date).toLocaleDateString('en-NG', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </time>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* Coming Soon Section */}
                        <section className="text-center py-12 bg-white rounded-2xl max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold mb-4">More Content Coming Soon!</h2>
                            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                                We&apos;re working on more valuable content for Nigerian and African entrepreneurs. 
                                Subscribe to get notified when new articles are published.
                            </p>
                            <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto px-4">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </section>

                        {/* Topics We Cover */}
                        <section className="mt-16 max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold mb-8 text-center">Topics We Cover</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: 'E-Commerce Strategies',
                                        desc: 'Learn how to start, grow, and scale your online business in Nigeria.',
                                    },
                                    {
                                        title: 'Logistics & Delivery',
                                        desc: 'Insights on optimizing delivery, reducing costs, and improving customer satisfaction.',
                                    },
                                    {
                                        title: 'AI & Technology',
                                        desc: 'How AI and technology are transforming African commerce.',
                                    },
                                    {
                                        title: 'Merchant Success Stories',
                                        desc: 'Real stories from Nigerian sellers who have grown with Carryofy.',
                                    },
                                ].map((topic, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                                        <h3 className="font-bold text-lg mb-2">{topic.title}</h3>
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
