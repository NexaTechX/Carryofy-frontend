import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Rocket, Globe, Users, Heart, Zap, Shield } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';

export default function Careers() {
    const benefits = [
        {
            icon: Rocket,
            title: 'Work on impactful technology',
            desc: 'Build reliable same-day delivery infrastructure that serves Lagos buyers and sellers.',
        },
        {
            icon: Globe,
            title: 'Help millions of merchants scale',
            desc: 'Your work directly impacts buyers and sellers in Lagos.',
        },
        {
            icon: Users,
            title: 'Be part of a high-growth startup',
            desc: 'Join a team of passionate individuals building reliable delivery in Lagos.',
        },
        {
            icon: Heart,
            title: 'Competitive benefits',
            desc: 'Health insurance, flexible work, learning budget, and equity opportunities.',
        },
        {
            icon: Zap,
            title: 'Fast career growth',
            desc: 'Grow quickly as we scale. High performers get opportunities to lead teams.',
        },
        {
            icon: Shield,
            title: 'Work with the best',
            desc: 'Collaborate with talented engineers, designers, and operators from top companies.',
        },
    ];

    const departments = [
        'Engineering',
        'Product',
        'Design',
        'Operations',
        'Logistics',
        'Customer Success',
        'Sales',
        'Marketing',
    ];

    const careersKeywords = [
        // Career intent keywords
        'jobs at Carryofy',
        'Carryofy careers',
        'work at Carryofy',
        'Carryofy hiring',
        'join Carryofy',
        'Carryofy jobs Lagos',
        'Carryofy vacancies',
        
        // Industry job keywords
        'ecommerce jobs Nigeria',
        'tech jobs Lagos',
        'logistics jobs Nigeria',
        'startup jobs Nigeria',
        'software engineer jobs Lagos',
        'product manager jobs Nigeria',
        'operations jobs Nigeria',
        
        // Company culture keywords
        'best tech companies Nigeria',
        'top startups Lagos',
        'tech companies hiring Lagos',
        'remote jobs Lagos',
        'tech startup careers Lagos',
        
        // Role specific keywords
        'frontend developer jobs Lagos',
        'backend engineer Nigeria',
        'logistics manager jobs',
        'customer success Nigeria',
        'sales jobs Lagos',
        'marketing jobs Nigeria',
    ].join(', ');

    return (
        <>
            <SEO
                title="Careers at Carryofy - Join Our Team in Lagos | Jobs in Lagos Nigeria"
                description="Join the Carryofy team and help build reliable same-day delivery in Lagos. We're hiring engineers, product managers, designers, and operations professionals in Lagos, Nigeria. Build your career with Lagos' same-day delivery platform. Competitive salary, equity, and benefits."
                keywords={careersKeywords}
                canonical="https://carryofy.com/careers"
                ogType="website"
                ogImage="https://carryofy.com/og/careers.png"
                ogImageAlt="Careers at Carryofy - Join Our Team"
            />
            
            <CombinedSchema
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Careers', url: '/careers' },
                ]}
            />
            
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20">
                        <div className="container mx-auto px-4 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">Build Reliable Same-Day Delivery in Lagos</h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                                We&apos;re looking for talented individuals to join our mission of building reliable same-day delivery for Lagos.
                            </p>
                            <a 
                                href="#openings" 
                                className="inline-block px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark transition"
                            >
                                View Open Positions
                            </a>
                        </div>
                    </section>

                    {/* Benefits Section */}
                    <section className="py-20 bg-white">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold text-center mb-4">Why Join Carryofy?</h2>
                            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                                We&apos;re building something special and we want you to be part of it.
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                                {benefits.map((benefit, index) => (
                                    <article key={index} className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <benefit.icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                        <p className="text-gray-600">{benefit.desc}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Departments Section */}
                    <section className="py-20 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold text-center mb-4">Our Teams</h2>
                            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                                We have opportunities across various departments.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                                {departments.map((dept, index) => (
                                    <span 
                                        key={index} 
                                        className="px-6 py-3 bg-white border border-gray-200 rounded-full text-gray-700 font-medium hover:border-primary hover:text-primary transition cursor-pointer"
                                    >
                                        {dept}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Open Positions Section */}
                    <section id="openings" className="py-20 bg-white">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
                            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                                We&apos;re always looking for exceptional talent. Check out our current openings below.
                            </p>
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-gray-50 p-12 rounded-2xl border border-dashed border-gray-300 text-center">
                                    <p className="text-gray-500 text-lg mb-4">No open positions at the moment.</p>
                                    <p className="text-gray-400">
                                        Don&apos;t see a role that fits? Send us your resume at{' '}
                                        <a href="mailto:careers@carryofy.com" className="text-primary hover:underline">
                                            careers@carryofy.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="py-20 bg-gray-900 text-white">
                        <div className="container mx-auto px-4 text-center">
                            <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
                            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                                Join us in building reliable same-day delivery in Lagos. Send your resume and we&apos;ll be in touch.
                            </p>
                            <a 
                                href="mailto:careers@carryofy.com"
                                className="inline-block px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark transition"
                            >
                                Send Your Resume
                            </a>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
