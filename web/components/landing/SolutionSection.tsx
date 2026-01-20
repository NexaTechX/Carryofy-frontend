import { CheckCircle, ShoppingBag, Truck, CreditCard, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SolutionSection() {
    const solutions = [
        {
            icon: ShoppingBag,
            title: 'Verified Sellers',
            description: 'Trusted local sellers you can rely on.',
        },
        {
            icon: Clock,
            title: 'Same-Day Delivery',
            description: 'Order today, receive today in Nigeria.',
        },
        {
            icon: Truck,
            title: 'Real-Time Tracking',
            description: 'Know exactly where your order is.',
        },
        {
            icon: CreditCard,
            title: 'Buyer Protection',
            description: 'Money-back guarantee on all orders.',
        },
    ];

    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                    <div>
                        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                            Order Today, Receive Today <br className="hidden sm:block" />
                            <span className="text-primary">Or Get Your Money Back</span>
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                            Carryofy connects you with trusted local sellers in Nigeria and handles reliable same-day delivery.
                        </p>

                        <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                            {[
                                'Verified sellers you can trust',
                                'Same-day delivery in Nigeria',
                                'Real-time order tracking',
                                'No more constant follow-ups',
                                'Money-back guarantee',
                                'Secure payment options'
                            ].map((item, index) => (
                                <li key={index} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-700">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl sm:rounded-3xl -rotate-2 sm:-rotate-3"></div>
                        <div className="relative bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            {solutions.map((solution, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-50 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl text-center hover:bg-primary/5 transition-colors"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 sm:mb-4 text-primary">
                                        <solution.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{solution.title}</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">{solution.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
