import { CheckCircle, ShoppingBag, Warehouse, Truck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SolutionSection() {
    const solutions = [
        {
            icon: ShoppingBag,
            title: 'AI-Powered Marketplace',
            description: 'Smart product discovery and verified sellers.',
        },
        {
            icon: Warehouse,
            title: 'Smart Fulfillment',
            description: 'Automated picking, packing, and storage.',
        },
        {
            icon: Truck,
            title: '90-Minute Delivery',
            description: 'Fastest delivery zones in Lagos.',
        },
        {
            icon: CreditCard,
            title: 'Instant Payouts',
            description: 'Secure payments and 24h settlements.',
        },
    ];

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                            Carryofy Solves All of These—<br />
                            <span className="text-primary">In One Platform</span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Carryofy is Africa’s first full-stack commerce OS, giving merchants everything they need to succeed.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {[
                                'AI-powered marketplace',
                                'Smart fulfillment centers',
                                '90-minute & same-day delivery',
                                'Real-time inventory management',
                                'Automated picking and packaging',
                                'Secure payments and 24h settlements'
                            ].map((item, index) => (
                                <li key={index} className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-3xl -rotate-3"></div>
                        <div className="relative bg-white border border-gray-100 rounded-3xl shadow-xl p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {solutions.map((solution, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-50 p-6 rounded-xl text-center hover:bg-primary/5 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-primary">
                                        <solution.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">{solution.title}</h3>
                                    <p className="text-sm text-gray-600">{solution.description}</p>
                                </motion.div>
                            ))}

                            {/* Connecting arrows visualization could go here */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
