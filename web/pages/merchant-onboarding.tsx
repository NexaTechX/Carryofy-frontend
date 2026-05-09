import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MerchantCategoryCommissions from '../components/merchant/MerchantCategoryCommissions';
import { CheckCircle, LayoutDashboard, Truck, Shield, Users, Zap, ArrowRight, BarChart3, Globe, CreditCard } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';
import Link from 'next/link';

export default function MerchantOnboarding() {
    const benefits = [
        {
            icon: Globe,
            title: 'Wider Reach',
            description:
                'Showcase your products to thousands of active buyers across verified Lagosian retailers.',
        },
        {
            icon: Zap,
            title: 'Automated Sales',
            description:
                'Streamline order processing, invoicing, and payment collection so you can focus on fulfilment.',
        },
        {
            icon: Shield,
            title: 'Guaranteed Payments',
            description:
                'Secure your revenue with our reliable payment system — settlements you can plan around.',
        },
        {
            icon: Truck,
            title: 'Logistics Support',
            description:
                'Leverage our network for efficient delivery across Lagos — coordinated pickup and last-mile.',
        },
    ];

    const deepBenefits = [
        {
            icon: Users,
            title: 'Verified retail network',
            description:
                'Connect with serious buyers — not random DMs — so every order is tied to a real storefront.',
        },
        {
            icon: LayoutDashboard,
            title: 'Operations in one flow',
            description:
                'From order to dispatch to payout, reduce back-and-forth with a single operational thread.',
        },
        {
            icon: BarChart3,
            title: 'Market visibility',
            description:
                'See what moves, where demand clusters, and how your catalogue performs over time.',
        },
        {
            icon: CreditCard,
            title: 'Settlement discipline',
            description:
                'Clear rules on when funds release — so you spend less time chasing reconciliation.',
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
                title="Sell on Carryofy — Expand Your Reach Across Lagos Retailers"
                description="Partner with Carryofy: wider reach, automated sales, guaranteed payments, and logistics support. Verified retailers, zero listing fee — apply to sell."
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
                                <h1 className="text-4xl md:text-5xl font-extrabold text-[#111111] leading-tight mb-6">
                                    For Vendors: Expand Your Market,<br />
                                    <span className="text-primary">Simplify Your Sales.</span>
                                </h1>
                                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    Partner with Carryofy and connect with a vast network of verified Lagosian retailers. Join us and scale your distribution with confidence.
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
                                <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-4">Why sell with Carryofy</h2>
                                <p className="text-gray-600 max-w-2xl mx-auto">
                                    Wider reach, automated sales, reliable payments, and logistics support — built for vendors who want to grow without doing everything alone.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                                {benefits.map((benefit, index) => (
                                    <article key={index} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group relative">
                                        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                            <benefit.icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#111111] mb-3">{benefit.title}</h3>
                                        <p className="text-gray-600 leading-relaxed text-sm">{benefit.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3.3 — resolved: live category commission table */}
                    <section className="py-16 bg-white border-t border-gray-100">
                        <div className="container mx-auto px-4 max-w-4xl">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#111111] mb-2 text-center">
                                Commission rates by category
                            </h2>
                            <p className="text-gray-600 text-center mb-8 text-sm md:text-base">
                                Carryofy earns a percentage on each sale — rates below are current for active categories (retail vs wholesale).
                            </p>
                            <MerchantCategoryCommissions />
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
                                            Let us help you <span className="text-primary italic">scale distribution</span> and grow your brand.
                                        </h2>
                                        <p className="text-xl text-gray-400 mb-12">
                                            Trust and logistics shouldn&apos;t be DIY. Carryofy connects you to buyers, coordinates delivery, and keeps payments predictable.
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
                                                { q: 'How much are the commissions?', a: 'We operate on a transparent category-based model — you only pay when you sell. See the table above for current retail and wholesale rates per category.' },
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
                                Join Carryofy as a verified vendor — zero listing fee, serious retail demand, and operations support across Lagos.
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
