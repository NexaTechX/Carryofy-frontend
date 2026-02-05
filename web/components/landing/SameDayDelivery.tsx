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
    <section className="py-12 sm:py-16 bg-gradient-to-r from-primary/10 via-white to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-6">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-primary text-sm sm:text-base font-bold">
                INDUSTRY FIRST
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
              Same-Day Delivery -{' '}
              <span className="text-primary">Fast, reliable logistics</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              For the first time in Nigeria's e-commerce and logistics history, Carryofy brings
              <strong className="text-gray-900"> same-day delivery</strong> to life. We solve the
              long delivery time problem that has frustrated customers and limited business growth
              for years.
            </p>
          </div>

          {/* Problem Statement */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-12 shadow-lg border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
              The Problem We're Solving
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-4 leading-relaxed">
              Traditional e-commerce delivery in Nigeria takes days, sometimes weeks. This has been
              the norm across the entire industry - until now.
            </p>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              <strong className="text-gray-900">Carryofy is changing the game.</strong> We've
              built the first same-day delivery system in Nigeria, solving the long delivery time
              challenge that has plagued both the e-commerce and logistics industries.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-5 sm:p-6 rounded-xl shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 sm:p-8 md:p-10 text-center text-white">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Experience the Future of Delivery
            </h3>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-white/90">
              Join thousands of sellers and buyers who are already experiencing the convenience
              of same-day delivery. Order before 12 PM and get your products delivered the same day!
            </p>
            <div className="flex justify-center">
              <a
                href="/auth/signup"
                className="px-8 sm:px-10 py-3 sm:py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold text-base sm:text-lg inline-block shadow-lg hover:shadow-xl"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

