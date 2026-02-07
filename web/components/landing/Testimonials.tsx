import { Star, Quote } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Aisha Okonkwo',
      rating: 5,
      time: '2 months ago',
      location: 'Ikoyi, Lagos',
      productCategory: 'Electronics',
      quote: 'Ordered a smartphone from a seller in Victoria Island. The delivery was super fast - got it in just 3 hours! No hassle, just smooth shopping. Carryofy is a game-changer.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    },
    {
      name: 'Chukwudi Eze',
      rating: 5,
      time: '1 month ago',
      location: 'Surulere, Lagos',
      productCategory: 'Fashion',
      quote: 'Bought some designer sneakers from a verified seller. The real-time tracking showed exactly when my order would arrive. Delivered same day as promised. This is how online shopping should be!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    },
    {
      name: 'Ngozi Adebayo',
      rating: 5,
      time: '3 months ago',
      location: 'Lekki, Lagos',
      productCategory: 'Home & Living',
      quote: 'As someone who shops online frequently, I appreciate the secure payment options and buyer protection. Ordered home decor items and received them within 4 hours. Carryofy is now my go-to for online shopping in Lagos.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-linear-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Loved by Nigerian shoppers
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Join thousands of satisfied buyers and sellers across Lagos and beyond
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
            >
              <Quote className="w-10 h-10 text-primary/20 mb-4" aria-hidden />
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      i < testimonial.rating ? 'fill-primary text-primary' : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-2">{testimonial.time}</span>
              </div>
              <blockquote className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6 grow">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500">{testimonial.location} • {testimonial.productCategory}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
