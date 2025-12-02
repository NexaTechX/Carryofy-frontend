import { Star } from 'lucide-react';
import Image from 'next/image';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Aisha',
      rating: 5,
      time: '2 months ago',
      quote: 'Carryofy has transformed my online business! Their reliable delivery and seller support have made selling so much easier.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    },
    {
      name: 'Chukwudi',
      rating: 4,
      time: '1 month ago',
      quote: 'I love shopping on Carryofy. The products are unique, and the delivery is always on time. Highly recommend!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    },
    {
      name: 'Ngozi',
      rating: 5,
      time: '3 months ago',
      quote: 'As a buyer, I appreciate the secure payment options and the ability to track my orders. Carryofy is my go-to for online shopping.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-black">
          Testimonials
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 p-5 sm:p-6 rounded-lg">
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
                  <p className="text-xs sm:text-sm text-gray-500">{testimonial.time}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      i < testimonial.rating ? 'fill-primary text-primary' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

