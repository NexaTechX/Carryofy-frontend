import { Star } from 'lucide-react';
import Image from 'next/image';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Aisha Okonkwo',
      rating: 5,
      time: '2 months ago',
      location: 'Ikoyi, Lagos',
      productCategory: 'Electronics',
      quote: 'Ordered a smartphone from a seller in Victoria Island. The delivery was super fast - got it in just 3 hours! No WhatsApp back-and-forth, just smooth shopping. Carryofy is a game-changer.',
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
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-black">
          What Our Customers Say
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 p-5 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-300 mr-3 sm:mr-4 flex-shrink-0">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-black truncate">{testimonial.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{testimonial.location}</p>
                  <p className="text-xs text-gray-400">{testimonial.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      i < testimonial.rating ? 'fill-primary text-primary' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">{testimonial.productCategory}</span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
