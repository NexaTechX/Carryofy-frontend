import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/truck.jpg"
          alt="Delivery truck"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60 z-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center text-white">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
          We carry your goods, you sell — we deliver.
        </h1>
        <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 max-w-3xl mx-auto text-gray-200 px-2">
          Carryofy connects Nigerian sellers and buyers with seamless e-commerce
          fulfillment. Focus on your sales, we handle the logistics.
        </p>
        <div className="mb-6 sm:mb-8 px-4">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-primary/30">
            <span className="text-white text-sm sm:text-base font-semibold">
              🚀 Same-Day Delivery - First in Nigeria!
            </span>
          </div>
        </div>
        <div className="flex justify-center px-4">
          <Link
            href="/auth/signup"
            className="px-8 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

