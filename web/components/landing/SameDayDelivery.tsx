import { Zap, Clock, MapPin, Package } from 'lucide-react';

export default function SameDayDelivery() {
  const features = [
    {
      icon: Clock,
      title: 'Order by 12 PM',
      description: 'Place your order before 12 PM and receive it the same day.',
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Our streamlined process ensures quick order fulfillment.',
    },
    {
      icon: MapPin,
      title: 'Smart Routing',
      description: 'Optimized delivery routes for maximum efficiency and speed.',
    },
    {
      icon: Package,
      title: 'Real-Time Tracking',
      description: 'Track your order in real-time from dispatch to delivery.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-r from-[#FF6B00]/10 via-white to-[#FF6B00]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FF6B00]/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-6">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B00]" />
              <span className="text-[#FF6B00] text-sm sm:text-base font-bold">
                OUR CORE ADVANTAGE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
              Fulfillment + logistics,{' '}
              <span className="text-[#FF6B00]">built in</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Warehousing. Packing. Last-mile delivery. We own the full stack. Sellers send inventory — we store it, fulfill orders, and deliver same-day in Lagos. No third-party courier chaos.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-5 sm:p-6 rounded-xl shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF6B00]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-[#FF6B00] to-[#E65F00] rounded-2xl p-6 sm:p-8 md:p-10 text-center text-white">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Order by noon. Delivered today.
            </h3>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-white/90">
              Same-day delivery in Lagos. Real-time tracking. No more waiting.
            </p>
            <div className="flex justify-center">
              <a
                href="/auth/signup"
                className="px-8 sm:px-10 py-3 sm:py-4 bg-white text-[#FF6B00] rounded-lg hover:bg-gray-100 transition font-semibold text-base sm:text-lg inline-block shadow-lg hover:shadow-xl"
              >
                Start shopping
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

