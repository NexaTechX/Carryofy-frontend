import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function PrivacyPolicy() {
    return (
        <>
            <SEO
                title="Privacy Policy - Carryofy | How We Protect Your Data"
                description="Learn how Carryofy collects, uses, and protects your personal information. Read our comprehensive privacy policy for detailed information about data security and user rights."
                keywords="Carryofy privacy policy, data protection Nigeria, privacy rights, personal information security, ecommerce privacy"
                canonical="https://carryofy.com/privacy-policy"
                ogType="website"
            />

            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Privacy Policy', url: '/privacy-policy' },
                ]}
            />

            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 sm:py-16 md:py-20">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                                Privacy Policy
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
                                        At Carryofy, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform and services.
                                    </p>
                                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                        By using Carryofy, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                                    </p>
                                </div>

                                {/* 1. Information We Collect */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">1. Information We Collect</h2>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">1.1 Personal Information</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        When you register for an account or use our services, we may collect:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Full name and contact information (email address, phone number)</li>
                                        <li>Delivery addresses and location data</li>
                                        <li>Payment information (processed securely through third-party payment processors)</li>
                                        <li>Business information (for sellers and merchants)</li>
                                        <li>Government-issued identification (for KYC verification)</li>
                                    </ul>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">1.2 Automatically Collected Information</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We automatically collect certain information when you use our platform:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Device information (IP address, browser type, operating system)</li>
                                        <li>Usage data (pages viewed, time spent, clickstream data)</li>
                                        <li>Cookies and similar tracking technologies</li>
                                        <li>Location data (with your permission)</li>
                                    </ul>
                                </div>

                                {/* 2. How We Use Your Information */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">2. How We Use Your Information</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We use the collected information for various purposes:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>To provide, maintain, and improve our services</li>
                                        <li>To process and fulfill orders and deliveries</li>
                                        <li>To verify your identity and prevent fraud</li>
                                        <li>To communicate with you about orders, promotions, and updates</li>
                                        <li>To personalize your experience and provide tailored recommendations</li>
                                        <li>To analyze usage patterns and optimize our platform</li>
                                        <li>To comply with legal obligations and enforce our terms</li>
                                        <li>To resolve disputes and provide customer support</li>
                                    </ul>
                                </div>

                                {/* 3. Information Sharing and Disclosure */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">3. Information Sharing and Disclosure</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We may share your information in the following circumstances:
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">3.1 Service Providers</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We share information with third-party service providers who perform services on our behalf, including payment processing, delivery services, data analysis, and customer support.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">3.2 Business Transfers</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">3.3 Legal Requirements</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We may disclose your information if required by law, court order, or governmental request, or to protect our rights, property, or safety.
                                    </p>

                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 mt-6">3.4 With Your Consent</h3>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We may share your information with third parties when you have given us explicit consent to do so.
                                    </p>
                                </div>

                                {/* 4. Data Security */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">4. Data Security</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Encryption of data in transit and at rest</li>
                                        <li>Regular security assessments and audits</li>
                                        <li>Access controls and authentication mechanisms</li>
                                        <li>Secure payment processing through PCI-DSS compliant providers</li>
                                        <li>Employee training on data protection and privacy</li>
                                    </ul>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
                                    </p>
                                </div>

                                {/* 5. Your Rights and Choices */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">5. Your Rights and Choices</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        You have certain rights regarding your personal information:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li><strong>Access:</strong> You can request a copy of the personal information we hold about you</li>
                                        <li><strong>Correction:</strong> You can update or correct your personal information through your account settings</li>
                                        <li><strong>Deletion:</strong> You can request deletion of your personal information, subject to legal obligations</li>
                                        <li><strong>Objection:</strong> You can object to certain processing of your data</li>
                                        <li><strong>Portability:</strong> You can request your data in a portable format</li>
                                        <li><strong>Opt-out:</strong> You can opt-out of marketing communications at any time</li>
                                    </ul>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        To exercise these rights, please contact us at <a href="mailto:privacy@carryofy.com" className="text-primary hover:underline">privacy@carryofy.com</a>.
                                    </p>
                                </div>

                                {/* 6. Cookies and Tracking Technologies */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">6. Cookies and Tracking Technologies</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        We use cookies and similar tracking technologies to enhance your experience on our platform. These technologies help us:
                                    </p>
                                    <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-2">
                                        <li>Remember your preferences and settings</li>
                                        <li>Understand how you use our platform</li>
                                        <li>Improve our services and personalize content</li>
                                        <li>Measure the effectiveness of our marketing campaigns</li>
                                    </ul>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform.
                                    </p>
                                </div>

                                {/* 7. Data Retention */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">7. Data Retention</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When your information is no longer needed, we will securely delete or anonymize it.
                                    </p>
                                </div>

                                {/* 8. Children's Privacy */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">8. Children's Privacy</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.
                                    </p>
                                </div>

                                {/* 9. International Data Transfers */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">9. International Data Transfers</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        Your information may be transferred to and processed in countries other than Nigeria. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
                                    </p>
                                </div>

                                {/* 10. Changes to This Policy */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">10. Changes to This Privacy Policy</h2>
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
                                    </p>
                                </div>

                                {/* 11. Contact Us */}
                                <div className="mb-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">11. Contact Us</h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                                        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                                    </p>
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <p className="text-gray-700 mb-2"><strong>Carryofy</strong></p>
                                        <p className="text-gray-600 mb-1">Email: <a href="mailto:privacy@carryofy.com" className="text-primary hover:underline">privacy@carryofy.com</a></p>
                                        <p className="text-gray-600 mb-1">Phone: <a href="tel:+2349166783040" className="text-primary hover:underline">+234 916 678 3040</a></p>
                                        <p className="text-gray-600">Address: 123 Logistics Way, Victoria Island, Lagos, Nigeria</p>
                                    </div>
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
