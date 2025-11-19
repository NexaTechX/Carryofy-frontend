import { Shield, Headphones, User, Zap } from 'lucide-react';

export default function WhyChooseCarryofy() {
  const features = [
    {
      icon: Zap,
      title: 'Same-Day Delivery',
      description: 'Pioneering same-day delivery in Nigeria! We solve the long delivery time problem that has plagued e-commerce for years - get your orders delivered the same day.',
    },
    {
      icon: Shield,
      title: 'Reliable Delivery',
      description: 'We ensure timely and secure delivery of your products, with real-time tracking and notifications.',
    },
    {
      icon: Headphones,
      title: 'Seller Support',
      description: 'Our dedicated support team is available to assist sellers with any questions or issues, ensuring a smooth experience.',
    },
    {
      icon: User,
      title: 'Buyer Privacy',
      description: 'We prioritize buyer privacy and data security, protecting your personal information and transactions.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 text-black">
          Why Choose Carryofy
        </h2>
        <div className="text-center mb-8 sm:mb-12 px-4">
          <p className="text-base sm:text-lg font-semibold text-black mb-2">Our Commitment to You</p>
          <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto">
            Carryofy is dedicated to providing a trustworthy and efficient e-commerce
            experience for both sellers and buyers in Nigeria.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="text-center bg-white p-5 sm:p-6 rounded-lg shadow-sm">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

