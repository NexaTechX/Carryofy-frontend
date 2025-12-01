import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { HelpCircle, ShoppingBag, Truck, CreditCard, Package, Search, MessageCircle, Phone } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';
import { useState } from 'react';

export default function Help() {
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { icon: ShoppingBag, title: 'Buyer Help', desc: 'Orders, returns, account settings, and shopping tips.', href: '#buyer' },
        { icon: HelpCircle, title: 'Seller Help', desc: 'Managing products, inventory, sales, and payouts.', href: '#seller' },
        { icon: Truck, title: 'Delivery & Tracking', desc: 'Track your package, delivery times, and shipping issues.', href: '#delivery' },
        { icon: CreditCard, title: 'Payments', desc: 'Refunds, payouts, payment methods, and billing.', href: '#payments' },
        { icon: Package, title: 'Warehouse & Inventory', desc: 'Storage fees, stock management, and fulfillment.', href: '#warehouse' },
        { icon: MessageCircle, title: 'Account & Security', desc: 'Login issues, password reset, and account security.', href: '#account' },
    ];

    const faqs = [
        {
            question: 'How do I track my order?',
            answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You\'ll see real-time tracking updates for all your orders. You can also track via the tracking number sent to your email/SMS.',
        },
        {
            question: 'How do I become a seller on Carryofy?',
            answer: 'Click "Become a Merchant" on our homepage or visit the seller onboarding page. Create an account, provide your business details, and our team will review and approve your application within 24-48 hours.',
        },
        {
            question: 'What is Carryofy\'s return policy?',
            answer: 'We offer a 7-day return policy for most items. If you\'re not satisfied, initiate a return request in your account. Ensure the item is unused and in original packaging. Refunds are processed within 3-5 business days.',
        },
        {
            question: 'How long does delivery take?',
            answer: 'Delivery times: Same-day delivery in Lagos for orders before 12pm. 1-3 business days for major Nigerian cities. 3-7 business days for other areas. You can track your order in real-time.',
        },
        {
            question: 'What payment methods are accepted?',
            answer: 'We accept bank transfers, debit/credit cards (Visa, Mastercard), USSD, and mobile money. All payments are secure and encrypted. Sellers receive payouts via bank transfer.',
        },
        {
            question: 'How do I contact customer support?',
            answer: 'Email us at support@carryofy.com or use the contact form on our website. Our support team is available Monday-Friday, 8am-6pm, and Saturday 9am-3pm WAT. Average response time is under 4 hours.',
        },
    ];

    const helpKeywords = [
        // Help intent keywords
        'Carryofy help',
        'Carryofy support',
        'Carryofy FAQ',
        'Carryofy customer service',
        'how to use Carryofy',
        
        // Buyer help keywords
        'track order Carryofy',
        'Carryofy returns',
        'Carryofy refund',
        'cancel order Carryofy',
        'Carryofy delivery time',
        'order tracking Nigeria',
        
        // Seller help keywords
        'how to sell on Carryofy',
        'Carryofy seller guide',
        'Carryofy payout',
        'add products Carryofy',
        'seller support Nigeria',
        
        // General help keywords
        'ecommerce help Nigeria',
        'online shopping help',
        'delivery help Lagos',
        'payment issues Nigeria',
        'account help',
        
        // Problem keywords
        'Carryofy not working',
        'Carryofy login issues',
        'order not delivered',
        'payment failed',
        'refund not received',
    ].join(', ');

    return (
        <>
            <SEO
                title="Help Center - Carryofy Support, FAQs & Guides | Nigeria E-Commerce Help"
                description="Get help with your Carryofy account, orders, shipping, payments, and more. Comprehensive guides for Nigerian merchants and buyers. Find answers to FAQs, track orders, manage returns, and contact our support team."
                keywords={helpKeywords}
                canonical="https://carryofy.com/help"
                ogType="website"
                ogImage="https://carryofy.com/og/help.png"
                ogImageAlt="Carryofy Help Center - Customer Support"
            />
            
            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Help Center', url: '/help' },
                ]}
                faqs={faqs}
            />
            
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section with Search */}
                    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16 md:py-20">
                        <div className="container mx-auto px-4 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">Need Help? We&apos;re Here for You.</h1>
                            <p className="text-xl text-gray-600 mb-8">Search our help center or browse categories below.</p>
                            
                            {/* Search Bar */}
                            <div className="max-w-2xl mx-auto relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for help articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Categories Grid */}
                    <section className="py-16 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-bold text-center mb-12">Browse Help Topics</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                {categories.map((cat, index) => (
                                    <a 
                                        key={index} 
                                        href={cat.href}
                                        className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group"
                                    >
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                                            <cat.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">{cat.title}</h3>
                                        <p className="text-gray-600">{cat.desc}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Popular FAQs */}
                    <section className="py-16 bg-white">
                        <div className="container mx-auto px-4">
                            <h2 className="text-2xl font-bold text-center mb-4">Frequently Asked Questions</h2>
                            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                                Quick answers to the most common questions from our users.
                            </p>
                            <div className="max-w-3xl mx-auto space-y-4">
                                {faqs.map((faq, index) => (
                                    <article key={index} className="bg-gray-50 p-6 rounded-xl">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {faq.question}
                                        </h3>
                                        <p className="text-gray-600">
                                            {faq.answer}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Contact Support CTA */}
                    <section className="py-16 bg-gray-900 text-white">
                        <div className="container mx-auto px-4">
                            <div className="max-w-4xl mx-auto text-center">
                                <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
                                <p className="text-gray-400 mb-8">
                                    Our support team is ready to assist you. Choose how you&apos;d like to reach us.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <a 
                                        href="/contact"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Contact Support
                                    </a>
                                    <a 
                                        href="mailto:support@carryofy.com"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Email Us
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Quick Links */}
                    <section className="py-12 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-xl font-bold mb-6">Quick Links</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Track Order', href: '/buyer/track' },
                                        { label: 'Return Request', href: '/buyer/orders' },
                                        { label: 'Seller Dashboard', href: '/seller' },
                                        { label: 'Payment Methods', href: '/help#payments' },
                                        { label: 'Shipping Rates', href: '/help#delivery' },
                                        { label: 'Account Settings', href: '/buyer/profile' },
                                        { label: 'Become a Seller', href: '/merchant-onboarding' },
                                        { label: 'Contact Us', href: '/contact' },
                                    ].map((link, index) => (
                                        <a 
                                            key={index}
                                            href={link.href}
                                            className="text-gray-600 hover:text-primary transition"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
