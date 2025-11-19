import { useState } from 'react';
import { Files, Store, DollarSign, Search, ShoppingCart, Truck } from 'lucide-react';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'sellers' | 'buyers'>('sellers');

  const sellersFeatures = [
    {
      icon: Files,
      title: 'List Your Products',
      description: 'Easily list your products on the Carryofy platform with detailed descriptions and images.',
    },
    {
      icon: Store,
      title: 'Manage Your Store',
      description: 'Track your inventory, orders, and sales performance through our intuitive Seller Portal.',
    },
    {
      icon: DollarSign,
      title: 'Get Paid',
      description: 'Receive secure and timely payments for your sales, directly to your preferred account.',
    },
  ];

  const buyersFeatures = [
    {
      icon: Search,
      title: 'Browse and Discover',
      description: 'Explore a diverse marketplace of products from local sellers, with detailed descriptions and reviews.',
    },
    {
      icon: ShoppingCart,
      title: 'Secure Checkout',
      description: 'Shop with confidence using our secure payment gateway, ensuring your transactions are protected.',
    },
    {
      icon: Truck,
      title: 'Same-Day Delivery',
      description: 'Get your orders delivered the same day - a first in Nigerian e-commerce! Real-time tracking from dispatch to your doorstep.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-black">
          How It Works
        </h2>

        {/* Tabs */}
        <div className="flex justify-center mb-8 sm:mb-12 overflow-x-auto">
          <div className="flex border-b-2 border-gray-200 min-w-fit">
            <button
              onClick={() => setActiveTab('sellers')}
              className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold transition whitespace-nowrap ${
                activeTab === 'sellers'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Sellers
            </button>
            <button
              onClick={() => setActiveTab('buyers')}
              className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold transition whitespace-nowrap ${
                activeTab === 'buyers'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Buyers
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'sellers' ? (
            <>
              <p className="text-gray-600 text-center mb-8 sm:mb-12 text-base sm:text-lg px-4">
                Carryofy simplifies your e-commerce journey, from listing to delivery. We
                handle the logistics, so you can focus on growing your business.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {sellersFeatures.map((feature, index) => (
                  <div key={index} className="text-center px-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-8 sm:mb-12 text-base sm:text-lg px-4">
                Discover a wide range of products from Nigerian sellers, all in one place.
                Enjoy secure payments and experience same-day delivery - revolutionizing logistics in Nigeria.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {buyersFeatures.map((feature, index) => (
                  <div key={index} className="text-center px-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

