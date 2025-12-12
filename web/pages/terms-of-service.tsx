import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function TermsOfService() {
    return (
        <>
            <SEO
                title="Terms of Service - Carryofy | User Agreement & Platform Rules"
                description="Read Carryofy's Terms of Service to understand your rights and obligations when using our e-commerce and logistics platform. Learn about account usage, seller and buyer responsibilities, and more."
                keywords="Carryofy terms of service, user agreement, platform rules, ecommerce terms, seller terms, buyer terms Nigeria"
                canonical="https://carryofy.com/terms-of-service"
                ogType="website"
            />

            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Terms of Service', url: '/terms-of-service' },
                ]}
            />

            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 sm:py-16 md:py-20">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                                Terms of Service
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </section>

                    {/* Content Section */}
                    <section className="py-12 sm:py-16 bg-white">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="max-w-4xl mx-auto prose prose-lg">

                                {/* Introduction */}
                                <div className="mb-12">
                                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                                        Welcome to Carryofy! These Terms of Service ("Terms") govern your access to and use of the Carryofy platform, including our website, mobile applications, and related services (collectively, the "Services").
                                    </p>
                                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                        By accessing or using our Services, you agree to be bound by these Terms. If you do not agree with these Terms, please do not use our Services. These Terms constitute a legally binding agreement between you and Carryofy.
                                    </p>
                                </div>

                                {/* 1. Acceptance of Terms */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">1. Acceptance of Terms</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        By creating an account or using Carryofy's Services, you confirm that:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>You are at least 18 years of age or have reached the age of majority in your jurisdiction</li>
                                        <li>You have the legal capacity to enter into a binding agreement</li>
                                        <li>You will comply with all applicable laws and regulations</li>
                                        <li>All information you provide is accurate, current, and complete</li>
                                    </ul>
                                </div>

                                {/* 2. Account Registration */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">2. Account Registration and Security</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">2.1 Account Creation</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        To access certain features of our Services, you must create an account. You agree to:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Provide accurate and complete registration information</li>
                                        <li>Maintain and update your information to keep it current</li>
                                        <li>Keep your account credentials secure and confidential</li>
                                        <li>Not share your account with others or allow others to use your account</li>
                                        <li>Notify us immediately of any unauthorized access or security breach</li>
                                    </ul>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">2.2 Account Responsibility</h3>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        You are responsible for all activities that occur under your account. Carryofy is not liable for any loss or damage arising from your failure to maintain account security.
                                    </p>
                                </div>

                                {/* 3. User Conduct */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">3. User Conduct and Prohibited Activities</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        When using our Services, you agree not to:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Violate any applicable laws, regulations, or third-party rights</li>
                                        <li>Engage in fraudulent, deceptive, or misleading activities</li>
                                        <li>Sell prohibited, counterfeit, stolen, or illegal items</li>
                                        <li>Manipulate prices, ratings, or reviews</li>
                                        <li>Interfere with or disrupt the Services or servers</li>
                                        <li>Use automated systems (bots, scrapers) without authorization</li>
                                        <li>Attempt to gain unauthorized access to our systems</li>
                                        <li>Harass, threaten, or abuse other users or staff</li>
                                        <li>Infringe on intellectual property rights</li>
                                        <li>Post or transmit harmful, offensive, or inappropriate content</li>
                                    </ul>
                                </div>

                                {/* 4. Seller Terms */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">4. Seller Terms</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">4.1 Seller Obligations</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        As a seller on Carryofy, you agree to:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Provide accurate product descriptions, images, and pricing</li>
                                        <li>Fulfill orders promptly and deliver products as described</li>
                                        <li>Maintain adequate inventory levels</li>
                                        <li>Comply with all applicable laws and regulations</li>
                                        <li>Complete KYC (Know Your Customer) verification when required</li>
                                        <li>Respond to customer inquiries and resolve disputes professionally</li>
                                        <li>Honor our refund and return policies</li>
                                    </ul>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">4.2 Seller Fees and Payments</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        Sellers are subject to transaction fees, commission rates, and other charges as outlined in our pricing policy. Payments to sellers will be processed according to our payment schedule, minus applicable fees and any chargebacks or refunds.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">4.3 Product Listings</h3>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        Carryofy reserves the right to remove, modify, or reject any product listings that violate these Terms, applicable laws, or our content policies.
                                    </p>
                                </div>

                                {/* 5. Buyer Terms */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">5. Buyer Terms</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">5.1 Purchasing and Payment</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        When making purchases on Carryofy, you agree to:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Provide accurate delivery and billing information</li>
                                        <li>Pay for all orders placed through your account</li>
                                        <li>Use valid and authorized payment methods</li>
                                        <li>Review product details carefully before purchasing</li>
                                    </ul>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">5.2 Delivery</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We strive to deliver orders within estimated timeframes. However, delivery times are estimates and not guarantees. You are responsible for providing accurate delivery addresses and being available to receive deliveries.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">5.3 Returns and Refunds</h3>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        Our return and refund policies are detailed in our Help Center. You may be eligible for returns or refunds under certain conditions, such as receiving damaged, defective, or incorrect items.
                                    </p>
                                </div>

                                {/* 6. Intellectual Property */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">6. Intellectual Property Rights</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">6.1 Carryofy's Property</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        All content, features, and functionality of the Services, including but not limited to text, graphics, logos, icons, images, software, and design, are owned by Carryofy or its licensors and are protected by copyright, trademark, and other intellectual property laws.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">6.2 User Content</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        By submitting content to Carryofy (product listings, reviews, images, etc.), you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, adapt, publish, and distribute such content for the purpose of providing and promoting our Services.
                                    </p>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        You represent and warrant that you own or have the necessary rights to all content you submit and that such content does not violate any third-party rights.
                                    </p>
                                </div>

                                {/* 7. Disclaimers and Limitations */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">7. Disclaimers and Limitations of Liability</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">7.1 Service "As Is"</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        Our Services are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the Services will be uninterrupted, error-free, or secure.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">7.2 Third-Party Content</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        Carryofy acts as a marketplace platform connecting buyers and sellers. We do not manufacture, store, or control products sold by third-party sellers. We are not responsible for the quality, safety, legality, or accuracy of seller listings.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">7.3 Limitation of Liability</h3>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        To the maximum extent permitted by law, Carryofy and its affiliates, officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or use, arising out of or related to your use of the Services.
                                    </p>
                                </div>

                                {/* 8. Indemnification */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">8. Indemnification</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        You agree to indemnify, defend, and hold harmless Carryofy and its affiliates from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or related to your use of the Services, violation of these Terms, or infringement of any third-party rights.
                                    </p>
                                </div>

                                {/* 9. Dispute Resolution */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">9. Dispute Resolution</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">9.1 Informal Resolution</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        If you have a dispute with Carryofy, you agree to first contact us at <a href="mailto:support@carryofy.com" className="text-primary hover:underline">support@carryofy.com</a> to attempt to resolve the dispute informally.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">9.2 Governing Law</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">9.3 Arbitration</h3>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        Any disputes not resolved informally shall be resolved through binding arbitration in Lagos, Nigeria, in accordance with the Arbitration and Conciliation Act.
                                    </p>
                                </div>

                                {/* 10. Termination */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">10. Termination and Suspension</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We reserve the right to suspend or terminate your account and access to the Services at any time, with or without notice, for any reason, including:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Violation of these Terms or our policies</li>
                                        <li>Fraudulent or illegal activity</li>
                                        <li>Requests by law enforcement or government agencies</li>
                                        <li>Discontinuation or material modification of the Services</li>
                                        <li>Prolonged inactivity</li>
                                    </ul>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        You may terminate your account at any time by contacting customer support. Upon termination, your right to use the Services will immediately cease, but certain provisions of these Terms will survive termination.
                                    </p>
                                </div>

                                {/* 11. Changes to Terms */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">11. Changes to These Terms</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        We may update these Terms from time to time to reflect changes in our Services, legal requirements, or business practices. We will notify you of material changes by posting the updated Terms on our platform and updating the "Last updated" date. Your continued use of the Services after such changes constitutes acceptance of the new Terms.
                                    </p>
                                </div>

                                {/* 12. General Provisions */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">12. General Provisions</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">12.1 Entire Agreement</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        These Terms, along with our Privacy Policy and any other legal notices or policies published on our platform, constitute the entire agreement between you and Carryofy.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">12.2 Severability</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">12.3 Waiver</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">12.4 Assignment</h3>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
                                    </p>
                                </div>

                                {/* 13. Contact Us */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">13. Contact Information</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us:
                                    </p>
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <p className="text-gray-700 mb-2"><strong>Carryofy</strong></p>
                                        <p className="text-gray-600 mb-1">Email: <a href="mailto:legal@carryofy.com" className="text-primary hover:underline">legal@carryofy.com</a></p>
                                        <p className="text-gray-600 mb-1">Support: <a href="mailto:support@carryofy.com" className="text-primary hover:underline">support@carryofy.com</a></p>
                                        <p className="text-gray-600 mb-1">Phone: <a href="tel:+2349166783040" className="text-primary hover:underline">+234 916 678 3040</a></p>
                                        <p className="text-gray-600">Address: 123 Logistics Way, Victoria Island, Lagos, Nigeria</p>
                                    </div>
                                </div>

                                {/* Agreement Acknowledgment */}
                                <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mt-8">
                                    <p className="text-base text-gray-700 font-medium">
                                        By using Carryofy's Services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
