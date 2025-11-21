import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { HelpCircle, ShoppingBag, Truck, CreditCard, Package } from 'lucide-react';

export default function Help() {
    const categories = [
        { icon: ShoppingBag, title: 'Buyer Help', desc: 'Orders, returns, and account settings.' },
        { icon: HelpCircle, title: 'Seller Help', desc: 'Managing products, inventory, and sales.' },
        { icon: Truck, title: 'Delivery & Tracking', desc: 'Track your package and delivery times.' },
        { icon: CreditCard, title: 'Payments', desc: 'Refunds, payouts, and payment methods.' },
        { icon: Package, title: 'Warehouse & Inventory', desc: 'Storage fees and stock management.' },
    ];

    return (
        <>
            <Head>
                <title>Help Center - Carryofy</title>
                <meta name="description" content="Get help with your Carryofy account, orders, and more." />
            </Head>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl font-bold mb-4">Need Help? We’re Here for You.</h1>
                            <p className="text-xl text-gray-600">Search our help center or browse categories below.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {categories.map((cat, index) => (
                                <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 cursor-pointer group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <cat.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">{cat.title}</h3>
                                    <p className="text-gray-600">{cat.desc}</p>
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
