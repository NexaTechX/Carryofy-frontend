import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function VendorPartnershipTerms() {
    return (
        <>
            <SEO
                title="Vendor Partnership Terms - Carryofy | Seller Agreement Summary"
                description="Carryofy Vendor Partnership Agreement. Zero-risk entry, 7-day escrow, weekly payouts, logistics support, and transparent terms for marketplace sellers in Nigeria."
                keywords="Carryofy vendor terms, seller partnership, marketplace agreement, escrow payouts, logistics Nigeria, zero signup fee"
                canonical="https://carryofy.com/vendor-partnership-terms"
                ogType="website"
            />

            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Vendor Partnership Terms', url: '/vendor-partnership-terms' },
                ]}
            />

            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 sm:py-16 md:py-20">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                                Vendor Partnership Terms
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                                Carryofy Vendor Partnership Agreement (Summary)
                            </p>
                        </div>
                    </section>

                    {/* Content Section */}
                    <section className="py-12 sm:py-16 bg-white">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="max-w-4xl mx-auto prose prose-lg">

                                <div className="mb-12">
                                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                        Welcome to the Carryofy ecosystem. By listing your products on our marketplace, you agree to the following operational terms designed to ensure a secure, high-growth environment for both suppliers and resellers.
                                    </p>
                                </div>

                                {/* 1. Zero-Risk Entry Model */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">1. The &quot;Zero-Risk&quot; Entry Model</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        For all initial partners, Carryofy charges ₦0.00 (Zero Naira) to sign up, list products, and maintain a digital storefront. Our goal is to digitize your inventory and connect you with our network of active resellers at no upfront cost.
                                    </p>
                                </div>

                                {/* 2. Secure Escrow & Payout Cycle */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">2. Secure Escrow & Payout Cycle (The 7-Day Rule)</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        To protect our customers and ensure quality control, Carryofy operates a strict Escrow System:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li><strong>Payment Collection:</strong> When a sale is made, Carryofy collects the full payment (Product + Delivery) from the customer/reseller.</li>
                                        <li><strong>Escrow Period:</strong> Funds are held in a secure escrow account for 7 days after the customer confirms receipt of the item. This allows for the resolution of any disputes or return requests.</li>
                                        <li><strong>Weekly Payouts:</strong> All cleared funds are paid out to your nominated bank account every Friday.</li>
                                    </ul>
                                </div>

                                {/* 3. Logistics & Fulfillment */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">3. Logistics & Fulfillment</h2>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Carryofy handles all last-mile delivery and logistics through our verified dispatch partners.</li>
                                        <li>The cost of delivery is paid by the customer/reseller and managed by Carryofy.</li>
                                        <li>Vendors are responsible for having the item &quot;Ready for Pickup&quot; within 4 hours of an order notification.</li>
                                    </ul>
                                </div>

                                {/* 4. Future Value-Added Services */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">4. Future Value-Added Services (Revenue Disclosure)</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        As Carryofy scales to provide more tools to help you grow, we will introduce the following optional revenue streams:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li><strong>Logistics Margin:</strong> Carryofy retains a service fee from the delivery charges paid by the customer.</li>
                                        <li><strong>Sponsored Listings:</strong> Future options to pay for &quot;Top of Page&quot; placement to increase your sales.</li>
                                        <li><strong>Payment Processing:</strong> A small transaction fee may be applied to cover bank gateway charges for instant transfers.</li>
                                        <li><strong>Supply Chain Financing:</strong> Future access to inventory credit/loans based on your sales history on our platform.</li>
                                    </ul>
                                </div>

                                {/* 5. Dispute Resolution */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">5. Dispute Resolution</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        If a customer receives a defective item, the 7-day escrow allows Carryofy to facilitate a return or refund. If no dispute is raised within 7 days, the sale is final and the vendor is paid.
                                    </p>
                                </div>

                                {/* Signature */}
                                <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mt-8">
                                    <p className="text-base text-gray-700 font-medium">
                                        Shinaayomi<br />
                                        <span className="text-gray-600 font-normal">Founder, Carryofy</span>
                                    </p>
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
