import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { CheckCircle, TrendingUp, Package, LayoutDashboard, Truck, Shield, Users, Zap, ArrowRight, BarChart3, Globe, CreditCard } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';
import Link from 'next/link';

export default function MerchantOnboarding() {
    const benefits = [
        {
            icon: TrendingUp,
            title: 'Reach Lagos retailers',
            description:
                'List where retailers already source fashion, beauty, electronics, and grocery with delivery coordinated through Carryofy.',
        },
        {
            icon: LayoutDashboard,
            title: 'AI-powered tools',
            description: 'Smarter pricing and demand signals as we roll out new seller tools on the platform.',
            comingSoon: true,
        },
        {
            icon: Package,
            title: 'Logistics support',
            description:
                'We coordinate pickup and last-mile delivery with our partners in Lagos corridors — you keep inventory ready for dispatch.',
        },
        {
            icon: CreditCard,
            title: 'Fast & Secure Payouts',
            description: 'Keep your cash flow healthy. Payouts are processed within 24-48 hours after delivery confirmation directly to your Nigerian bank account.',
        },
    ];

    const deepBenefits = [
        {
            icon: Truck,
            title: 'Lagos-first reach',
            description:
                'Lagos (Yaba, Surulere, Lekki/Ajah) — expanding corridor by corridor.',
        },
        {
            icon: Shield,
            title: 'Seller Protection',
            description: 'Sell with peace of mind. Our protection program covers you against fraudulent chargebacks and damaged goods during transit.',
        },
        {
            icon: Users,
            title: 'Targeted Marketing',
            description: 'Your products aren\'t just listed; they\'re promoted. We use data-driven marketing to put your store in front of the right buyers.',
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Get deep insights into your business performance with our mobile-friendly dashboard. Track inventory, orders, and growth in real-time.',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Application & Verification',
            description: 'Submit your business details and valid ID. Our team verifies your business within 24 hours to maintain our "Verified Vendor" status.',
            link: '/auth/signup?role=SELLER',
            btnText: 'Register Now'
        },
        {
            number: '02',
            title: 'List & prepare orders',
            description:
                'Add products and pricing on your dashboard. Keep stock ready — when an order comes in, you prepare for pickup per Carryofy dispatch.',
        },
        {
            number: '03',
            title: 'We coordinate delivery',
            description:
                'Orders route through Carryofy; we work with logistics partners for pickup and delivery to the retailer. You get notifications at each step.',
        },
        {
            number: '04',
            title: 'Collect Your Earnings',
            description: 'Once the buyer receives the product, we release the funds. Automated payouts ensure you never have to chase your money.',
        },
    ];

    const merchantKeywords = [
        'sell on Carryofy', 'become Carryofy seller', 'Carryofy merchant', 'join Carryofy',
        'Carryofy seller registration', 'register as seller Nigeria', 'sell online Nigeria',
        'start online business Nigeria', 'ecommerce business Nigeria', 'online store Nigeria',
        'fulfillment service Nigeria', 'warehouse for sellers Nigeria', 'same day delivery sellers Lagos',
        'fast payout sellers Nigeria', 'seller dashboard Nigeria', 'logistics for sellers Lagos'
    ].join(', ');

    return (
        <>
            <SEO
                title="Sell on Carryofy — Verified Vendors for Lagos Retailers"
                description="List products for Lagos retailers in Yaba, Surulere, and Lekki/Ajah. Carryofy coordinates delivery — zero listing fee. Apply to sell on Carryofy."
                keywords={merchantKeywords}
                canonical="https://carryofy.com/merchant-onboarding"
                ogType="website"
            />

            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Become a Seller', url: '/merchant-onboarding' },
                ]}
            />

            <div className="min-h-screen flex flex-col bg-white">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -z-10" />

                        <div className="container mx-auto px-4">
                            <div className="max-w-4xl mx-auto text-center">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold mb-8 animate-fade-in">
                                    <Globe className="w-4 h-4" />
                                    B2B MARKETPLACE FOR LAGOS RETAILERS
                                </span>
                                <h1 className="text-4xl md:text-6xl font-extrabold text-[#111111] leading-tight mb-8">
                                    You source the products.<br />
                                    <span className="text-primary italic">We handle the rest.</span>
                                </h1>
                                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    List for Lagos retailers, coordinate delivery with Carryofy, and grow without building logistics from scratch.
                                </p>

                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <Link
                                        href="/auth/signup?role=SELLER"
                                        className="px-10 py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        Apply as a Seller
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-50 transition border-2 border-gray-100 flex items-center justify-center"
                                    >
                                        How It Works
                                    </a>
                                </div>
                                <p className="mt-6 text-sm text-gray-500">
                                    By applying, you agree to our{' '}
                                    <Link href="/vendor-partnership-terms" className="text-primary font-semibold hover:underline">
                                        Vendor Partnership Terms
                                    </Link>
                                    .
                                </p>

                                <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-6">
                                    {[
                                        { label: 'Listing fee', value: '₦0' },
                                        { label: 'Categories', value: '4' },
                                        { label: 'Vendors', value: 'Verified' },
                                    ].map((stat, i) => (
                                        <div key={i} className="text-center">
                                            <p className="text-2xl font-extrabold text-[#111111]">{stat.value}</p>
                                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section className="py-24 bg-[#FAFAFA]">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-4">Everything you need to scale</h2>
                                <p className="text-gray-600 max-w-2xl mx-auto">
                                    Verified listing, coordinated delivery in Lagos corridors, and payouts designed for sellers — without fluff.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                                {benefits.map((benefit, index) => (
                                    <article key={index} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group relative">
                                        {'comingSoon' in benefit && benefit.comingSoon ? (
                                            <span className="absolute top-6 right-6 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full">
                                                Coming Soon
                                            </span>
                                        ) : null}
                                        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                            <benefit.icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#111111] mb-3 pr-16">{benefit.title}</h3>
                                        <p className="text-gray-600 leading-relaxed text-sm">{benefit.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* How It Works - Detailed */}
                    <section id="how-it-works" className="py-24 bg-white overflow-hidden">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col lg:flex-row gap-16 items-center max-w-7xl mx-auto">
                                <div className="lg:w-1/2">
                                    <h2 className="text-3xl md:text-5xl font-bold text-[#111111] mb-8 leading-tight">
                                        The simplest way to<br />
                                        <span className="text-primary italic">sell online in Nigeria.</span>
                                    </h2>
                                    <div className="space-y-8">
                                        {steps.map((step, index) => (
                                            <div key={index} className="flex gap-6">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center font-bold text-primary">
                                                    {step.number}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-[#111111] mb-2">{step.title}</h3>
                                                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                                    {step.link && (
                                                        <Link href={step.link} className="inline-flex items-center gap-2 text-primary font-bold mt-4 hover:underline">
                                                            {step.btnText} <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:w-1/2 relative">
                                    <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                                        <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-12">
                                            {/* Representing the UI */}
                                            <div className="w-full h-full bg-white rounded-2xl shadow-lg p-6 space-y-4">
                                                <div className="h-6 w-1/3 bg-gray-100 rounded-lg" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="aspect-square bg-gray-50 rounded-xl" />
                                                    <div className="space-y-4">
                                                        <div className="h-4 w-full bg-gray-50 rounded-lg" />
                                                        <div className="h-4 w-2/3 bg-gray-50 rounded-lg" />
                                                        <div className="h-10 w-full bg-primary rounded-lg" />
                                                    </div>
                                                </div>
                                                <div className="h-40 w-full bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                                    <LayoutDashboard className="w-12 h-12 opacity-20" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Detailed Benefits - The "Why" */}
                    <section className="py-24 bg-[#111111] text-white">
                        <div className="container mx-auto px-4">
                            <div className="max-w-7xl mx-auto">
                                <div className="grid lg:grid-cols-2 gap-20 items-center">
                                    <div>
                                        <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                                            We solve the hardest part of <span className="text-primary italic">E-commerce.</span>
                                        </h2>
                                        <p className="text-xl text-gray-400 mb-12">
                                            Logistics and trust are the biggest barriers to selling online in Africa. Carryofy solves both.
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-8">
                                            {deepBenefits.map((item, i) => (
                                                <div key={i}>
                                                    <item.icon className="w-8 h-8 text-primary mb-4" />
                                                    <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                                                    <p className="text-sm text-gray-400">{item.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-primary/5 rounded-3xl p-10 border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6">Vendor FAQ</h3>
                                        <p className="text-sm text-gray-400 mb-6">
                                            Read our{' '}
                                            <Link href="/vendor-partnership-terms" className="text-primary font-semibold hover:underline">
                                                Vendor Partnership Terms
                                            </Link>
                                            {' '}for full details on escrow, payouts, and logistics.
                                        </p>
                                        <div className="space-y-6">
                                            {[
                                                { q: 'How much are the commissions?', a: 'We operate on a transparent commission model. You only pay when you sell. Standard commission is 5-15% depending on product category.' },
                                                { q: 'How does pickup work?', a: 'When an order is placed, you prepare the stock for pickup. Carryofy coordinates dispatch with our logistics partners — details are confirmed in your seller flow.' },
                                                { q: 'When do I get paid?', a: 'Funds are settled in your Carryofy wallet immediately after delivery. You can withdraw to any Nigerian bank account, with processing taking 24-48 hours.' },
                                                { q: 'Is there a signup fee?', a: 'Zero. Registering and listing your products on Carryofy is completely free. We only succeed when you succeed.' }
                                            ].map((faq, i) => (
                                                <div key={i} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                                    <h4 className="font-bold text-primary mb-2">Q: {faq.q}</h4>
                                                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Social proof */}
                    <section className="py-24 bg-white border-t border-gray-100">
                        <div className="container mx-auto px-4 max-w-3xl text-center">
                            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                                Be among the first verified vendors on Carryofy. Zero listing fee. We only win when you sell.
                            </p>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="py-24 bg-primary text-white text-center px-4">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">Ready to build your<br />online empire?</h2>
                            <p className="text-xl text-white/80 mb-12">
                                Apply in minutes. We review vendors to keep the marketplace trusted for retailers.
                            </p>
                            <Link
                                href="/auth/signup?role=SELLER"
                                className="inline-block px-12 py-5 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-2xl hover:scale-105 active:scale-95"
                            >
                                Get Started Now — It's Free
                            </Link>
                            <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-white/60">
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                    No signup fee
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                    Unlimited listings
                                </span>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
