import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { CheckCircle, TrendingUp, Package, LayoutDashboard, Truck, Shield, Users, Zap } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema, HowToSchema } from '../components/seo/JsonLd';

export default function MerchantOnboarding() {
    const benefits = [
        {
            icon: TrendingUp,
            title: 'Faster delivery = more sales',
            description: 'Customers buy more when they know they\'ll get it fast. Same-day delivery in Lagos boosts conversion by 40%.',
        },
        {
            icon: LayoutDashboard,
            title: 'AI tools to optimize growth',
            description: 'Use our AI to price products competitively, find new customers, and predict demand.',
        },
        {
            icon: Package,
            title: 'Storage + packaging done for you',
            description: 'We store, pack, and ship. You just sell. No warehouse needed, no logistics headaches.',
        },
        {
            icon: CheckCircle,
            title: 'Simple seller dashboard',
            description: 'Track inventory, orders, earnings, and payouts in one place. Mobile-friendly interface.',
        },
        {
            icon: Truck,
            title: 'Nationwide delivery network',
            description: 'Reach customers in all 36 Nigerian states. We handle the last-mile delivery.',
        },
        {
            icon: Shield,
            title: 'Seller protection program',
            description: 'Protection against fraud, chargebacks, and damaged goods. We\'ve got your back.',
        },
        {
            icon: Users,
            title: 'Access to millions of buyers',
            description: 'Tap into our growing customer base looking for quality Nigerian products.',
        },
        {
            icon: Zap,
            title: 'Fast payouts',
            description: 'Get paid within 24-48 hours after delivery confirmation. No waiting for weeks.',
        },
    ];

    const steps = [
        {
            number: '1',
            title: 'Apply & get verified',
            description: 'Submit your business details. We verify and onboard you.',
        },
        {
            number: '2',
            title: 'List products',
            description: 'Add your products. We help if needed.',
        },
        {
            number: '3',
            title: 'We handle orders & delivery',
            description: 'We store, pack, and deliver. You focus on selling.',
        },
        {
            number: '4',
            title: 'Get paid',
            description: 'Receive payouts after delivery confirmation.',
        },
    ];

    const merchantKeywords = [
        // Primary seller intent keywords
        'sell on Carryofy',
        'become Carryofy seller',
        'Carryofy merchant',
        'join Carryofy',
        'Carryofy seller registration',
        'register as seller Nigeria',
        
        // Business opportunity keywords
        'sell online Nigeria',
        'start online business Nigeria',
        'ecommerce business Nigeria',
        'online store Nigeria',
        'sell products online Africa',
        'start selling online Lagos',
        
        // Platform comparison keywords
        'trusted marketplace Nigeria',
        'where to sell online Nigeria',
        'ecommerce platform Nigeria',
        'jumia alternative sellers',
        'konga alternative sellers',
        
        // Feature keywords
        'fulfillment service Nigeria',
        'warehouse for sellers Nigeria',
        'same day delivery sellers Lagos',
        'fast payout sellers Nigeria',
        'seller dashboard Nigeria',
        
        // Problem-aware keywords
        'how to sell online Nigeria',
        'grow online business Nigeria',
        'increase sales Nigeria',
        'reach more customers Nigeria',
        'logistics for sellers Lagos',
        
        // Long-tail keywords
        'sell clothes online Nigeria',
        'sell electronics online Lagos',
        'sell food products online Nigeria',
        'sell handmade products Nigeria',
        'sell wholesale Nigeria',
        'dropshipping Nigeria',
        'vendor registration Nigeria',
    ].join(', ');

    // HowTo steps for structured data
    const howToSteps = [
        {
            name: 'Create Your Seller Account',
            text: 'Visit carryofy.com/auth/signup and create your free seller account. Provide your email, phone number, and business details. Verification takes less than 24 hours.',
            url: '/auth/signup',
        },
        {
            name: 'Add Your Products',
            text: 'Upload your product photos, write compelling descriptions, and set competitive prices. We help optimize your listings for maximum visibility.',
            url: '/seller/products/new',
        },
        {
            name: 'Ship Inventory to Warehouse',
            text: 'Send your products to our Lagos warehouse. We provide labels and pickup services. Your inventory is stored securely and ready for same-day dispatch.',
        },
        {
            name: 'Start Selling and Get Paid',
            text: 'Your products go live on the Carryofy marketplace. When orders come in, we handle packaging, delivery, and customer service. You receive payouts within 24-48 hours.',
        },
    ];

    return (
        <>
            <SEO
                title="Become a Seller on Carryofy - Sell Online in Nigeria | Free Registration, Fast Payouts"
                description="Join trusted sellers on Carryofy. List your products, reach buyers in Lagos, and enjoy reliable same-day delivery. Zero upfront costs, fast payouts within 24-48 hours. Start selling today!"
                keywords={merchantKeywords}
                canonical="https://carryofy.com/merchant-onboarding"
                ogType="website"
                ogImage="https://carryofy.com/og/merchant.png"
                ogImageAlt="Become a Seller on Carryofy - Start Selling Online in Nigeria"
            />
            
            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Become a Merchant', url: '/merchant-onboarding' },
                ]}
                howTo={{
                    name: 'How to Start Selling on Carryofy in Nigeria',
                    description: 'A complete guide to becoming a successful seller on Carryofy in Lagos. Learn how to register, list products, and start earning.',
                    steps: howToSteps,
                    totalTime: 'PT15M',
                }}
            />
            
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20">
                        <div className="container mx-auto px-4 text-center">
                            <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold mb-6">
                                Early access — limited slots
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Grow your business. We handle delivery.</h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                Carryofy helps SMEs sell online with built-in logistics, payments, and customer trust.
                            </p>
                            <p className="text-gray-600 mb-8 max-w-xl mx-auto text-sm">
                                Commission-based — no upfront fees. Manual support during onboarding. Early seller incentives.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <a
                                    href="/auth/signup"
                                    className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark transition shadow-lg shadow-primary/30"
                                >
                                    Apply as a Seller
                                </a>
                                <a
                                    href="#how-it-works"
                                    className="px-8 py-4 bg-white text-gray-700 rounded-full font-bold text-lg hover:bg-gray-50 transition border border-gray-200"
                                >
                                    How It Works
                                </a>
                            </div>
                            
                            {/* Trust badges */}
                            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Commission-based
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    No upfront fees
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Payouts after delivery
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Same-day delivery
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Trust strip */}
                    <section className="py-8 bg-gray-900 text-white">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
                                {[
                                    { label: 'Verified sellers' },
                                    { label: 'Fast payouts' },
                                    { label: 'Same-day delivery' },
                                    { label: 'Paystack payments' },
                                ].map((item, index) => (
                                    <div key={index}>
                                        <p className="text-gray-300 font-medium text-sm">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Benefits Section */}
                    <section className="py-20 bg-white">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Sell on Carryofy?</h2>
                            <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                                Everything you need to grow your business, all in one platform.
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                                {benefits.map((benefit, index) => (
                                    <article key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                            <benefit.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section id="how-it-works" className="py-20 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
                            <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                                Start selling in 4 simple steps. Get your store up and running in less than 15 minutes.
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                                {steps.map((step, index) => (
                                    <article key={index} className="relative bg-white p-6 rounded-xl shadow-sm text-center">
                                        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                            {step.number}
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                                        <p className="text-gray-600 text-sm">{step.description}</p>
                                        {index < steps.length - 1 && (
                                            <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30" />
                                        )}
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Testimonials Placeholder */}
                    <section className="py-20 bg-white">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold text-center mb-4">What Sellers Say</h2>
                            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                                Join thousands of successful Nigerian merchants growing with Carryofy.
                            </p>
                            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                {[
                                    {
                                        quote: 'Carryofy transformed my business. Same-day delivery helped me compete with big brands.',
                                        name: 'Adebayo O.',
                                        business: 'Fashion Retailer, Lagos',
                                    },
                                    {
                                        quote: 'The AI pricing tool helped me increase margins by 20%. Fast payouts keep my cash flow healthy.',
                                        name: 'Chioma N.',
                                        business: 'Electronics Seller, Abuja',
                                    },
                                    {
                                        quote: 'No more logistics headaches. I focus on products, Carryofy handles everything else.',
                                        name: 'Ibrahim M.',
                                        business: 'Home Goods, Kano',
                                    },
                                ].map((testimonial, index) => (
                                    <blockquote key={index} className="bg-gray-50 p-6 rounded-xl">
                                        <p className="text-gray-600 mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                                        <footer>
                                            <cite className="font-bold text-gray-900 not-italic">{testimonial.name}</cite>
                                            <p className="text-sm text-gray-500">{testimonial.business}</p>
                                        </footer>
                                    </blockquote>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-white">
                        <div className="container mx-auto px-4 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
                            <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                                Join Carryofy. We handle delivery, storage, and payments. You focus on selling.
                            </p>
                            <a
                                href="/auth/signup"
                                className="inline-block px-10 py-4 bg-white text-primary rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
                            >
                                Apply as a Seller
                            </a>
                            <p className="mt-6 text-white/60 text-sm">
                                Already have an account?{' '}
                                <a href="/auth/login" className="text-white underline hover:no-underline">
                                    Login here
                                </a>
                            </p>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
