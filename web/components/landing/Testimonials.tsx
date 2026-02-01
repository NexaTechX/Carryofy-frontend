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

  // Show only one strong testimonial
  const featuredTestimonial = testimonials[0];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 sm:p-10 border border-gray-100 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-300 mr-4 flex-shrink-0">
                <Image
                  src={featuredTestimonial.avatar}
                  alt={featuredTestimonial.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{featuredTestimonial.name}</h3>
                <p className="text-sm text-gray-600">{featuredTestimonial.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < featuredTestimonial.rating ? 'fill-primary text-primary' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <blockquote className="text-lg sm:text-xl text-gray-700 italic leading-relaxed">
              "{featuredTestimonial.quote}"
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
