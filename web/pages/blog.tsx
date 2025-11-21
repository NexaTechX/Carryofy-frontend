import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function Blog() {
    const categories = [
        'Merchant Growth',
        'Logistics Innovation',
        'AI in Commerce',
        'Fulfillment Strategies',
        'Case Studies',
    ];

    return (
        <>
            <Head>
                <title>Blog - Carryofy</title>
                <meta name="description" content="Insights on African Commerce, Logistics & AI." />
            </Head>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl font-bold mb-6">Insights on African Commerce, Logistics & AI</h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Stay updated with the latest trends and tips for growing your business.
                            </p>
                        </div>

                        {/* Categories */}
                        <div className="flex flex-wrap justify-center gap-4 mb-16">
                            {categories.map((cat, index) => (
                                <span
                                    key={index}
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-primary hover:text-primary cursor-pointer transition"
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>

                        {/* Placeholder Blog Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                                    <div className="p-6">
                                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}
