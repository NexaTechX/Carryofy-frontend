import { UserX, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSection() {
    const problems = [
        {
            icon: UserX,
            title: 'Fake Sellers',
            description: 'Every week a vendor goes nomadic. What you see is rarely what you get.',
            iconColor: 'text-red-500',
            bgColor: 'bg-red-50',
        },
        {
            icon: Clock,
            title: 'Delivery Delays',
            description: 'Inventory is stored in courier hubs, ready for long transmission periods via USPS.',
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-50',
        },
        {
            icon: XCircle,
            title: 'No Support',
            description: 'Item bumps, local drivers, life lessons. We resolve enquiries and issues within 24 hours.',
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
                            Online shopping in Nigeria shouldn't be this hard.
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                            We solve the most frustrating parts of the Nigerian marketplace experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {problems.map((problem, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                            >
                                <div className="relative h-48 overflow-hidden">
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
        </section>
    );
}
