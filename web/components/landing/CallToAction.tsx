import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-black">
          Ready to Get Started?
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Join Carryofy today and experience the convenience of same-day delivery.
        </p>
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

