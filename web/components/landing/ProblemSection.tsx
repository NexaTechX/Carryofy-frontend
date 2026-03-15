import { UserX, Clock, XCircle, Package, ShieldX, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSection() {
    const sellerProblems = [
        {
            icon: Truck,
            title: 'Logistics chaos',
            description: 'Juggling multiple couriers, lost packages, and angry customers. Delivery eats your margins and your time.',
            iconColor: 'text-red-500',
            bgColor: 'bg-red-50',
        },
        {
            icon: Package,
            title: 'Fulfillment headaches',
            description: 'No warehouse. No packing. No scale. You\'re stuck doing everything yourself.',
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-50',
        },
        {
            icon: ShieldX,
            title: 'Payments & trust',
            description: 'Getting paid is slow. Building buyer trust is harder. Fraud and chargebacks add risk.',
            iconColor: 'text-red-500',
            bgColor: 'bg-red-50',
        },
    ];

    const buyerProblems = [
        {
            icon: UserX,
            title: 'Unreliable sellers',
            description: 'Fake listings, ghost vendors, and products that never arrive. Buyer beware is the default.',
            iconColor: 'text-red-500',
            bgColor: 'bg-red-50',
        },
        {
            icon: Clock,
            title: 'Slow delivery',
            description: 'Days turn into weeks. No tracking. No accountability. Just hope and follow-up calls.',
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-50',
        },
        {
            icon: XCircle,
            title: 'No buyer protection',
            description: 'Wrong item? Damaged? Never arrived? Good luck getting your money back.',
            iconColor: 'text-red-500',
            bgColor: 'bg-red-50',
        },
    ];

    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-left mb-12 sm:mb-16">
                        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Commerce in Africa is fragmented.
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                            Sellers and buyers both pay the price. Logistics, fulfillment, payments, and trust all broken into pieces.
                        </p>
                    </div>

                    {/* Sellers */}
                    <div className="mb-12">
                        <h3 className="text-lg font-semibold text-gray-700 mb-6">Sellers struggle with:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {sellerProblems.map((problem, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                                >
                                    <div className="relative h-40 overflow-hidden">
                                        <img
                                            src={
                                                index === 0
                                                    ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'
                                                    : index === 1
                                                    ? 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=400&fit=crop'
                                                    : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop'
                                            }
                                            alt={problem.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                        <div className="absolute top-4 left-4">
                                            <div className={`w-12 h-12 ${problem.bgColor} rounded-lg flex items-center justify-center shadow-lg`}>
                                                <problem.icon className={`w-6 h-6 ${problem.iconColor}`} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {problem.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Buyers */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-6">Buyers struggle with:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {buyerProblems.map((problem, index) => (
                                <motion.div
                                    key={`buyer-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                                >
                                    <div className="relative h-40 overflow-hidden">
                                        <img
                                            src={
                                                index === 0
                                                    ? 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop'
                                                    : index === 1
                                                    ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'
                                                    : 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop'
                                            }
                                            alt={problem.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                        <div className="absolute top-4 left-4">
                                            <div className={`w-12 h-12 ${problem.bgColor} rounded-lg flex items-center justify-center shadow-lg`}>
                                                <problem.icon className={`w-6 h-6 ${problem.iconColor}`} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {problem.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
