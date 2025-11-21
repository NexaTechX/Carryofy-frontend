import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Rocket, Globe, Users } from 'lucide-react';

export default function Careers() {
    const benefits = [
        {
            icon: Rocket,
            title: 'Work on impactful technology',
            desc: 'Build the infrastructure that powers African commerce.',
        },
        {
            icon: Globe,
            title: 'Help millions of merchants scale',
            desc: 'Your work directly impacts the livelihoods of business owners.',
        },
        {
            icon: Users,
            title: 'Be part of a high-growth startup',
            desc: 'Join a team of passionate individuals changing the status quo.',
        },
    ];

    return (
        <>
            <Head>
                <title>Careers - Carryofy</title>
                <meta name="description" content="Join the Carryofy team and build the future of African commerce." />
            </Head>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl font-bold mb-6">Build the Future of African Commerce with Us</h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                We are looking for talented individuals to join our mission.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="text-center p-6">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <benefit.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                    <p className="text-gray-600">{benefit.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-8">Open Positions</h2>
                            <div className="bg-gray-50 p-12 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">No open positions at the moment. Check back soon!</p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}
