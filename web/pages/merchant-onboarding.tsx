import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { CheckCircle, TrendingUp, Package, LayoutDashboard } from 'lucide-react';

export default function MerchantOnboarding() {
    const benefits = [
        {
            icon: TrendingUp,
            title: 'Faster delivery = more sales',
            description: 'Customers buy more when they know they’ll get it fast.',
        },
        {
            icon: LayoutDashboard,
            title: 'AI tools to optimize growth',
            description: 'Use our AI to price products and find new customers.',
        },
        {
            icon: Package,
            title: 'Storage + packaging done for you',
            description: 'We store, pack, and ship. You just sell.',
        },
        {
            icon: CheckCircle,
            title: 'Simple dashboard',
            description: 'Track inventory, orders, and payments in one place.',
        },
    ];

    return (
        <>
            <Head>
                <title>Sell Smarter with Carryofy - Merchant Onboarding</title>
                <meta name="description" content="Join Carryofy and start selling smarter. AI tools, fast delivery, and seamless fulfillment." />
            </Head>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow py-20">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl font-bold mb-6">Sell Smarter with Carryofy</h1>
                        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                            The all-in-one platform for African merchants.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-left">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <benefit.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                                    <p className="text-gray-600">{benefit.description}</p>
                                </div>
                            ))}
                        </div>

                        <a
                            href="/auth/signup"
                            className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark transition"
                        >
                            Become a Merchant
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}
