import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Store, ShoppingBag } from 'lucide-react';

export default function RoleSelection() {
  const router = useRouter();

  const handleRoleSelect = (role: 'buyer' | 'seller') => {
    router.push(`/auth/signup?role=${role}`);
  };

  return (
    <>
      <Head>
        <title>Choose Your Role - Carryofy</title>
        <meta
          name="description"
          content="Join Carryofy as a seller or buyer. Start your e-commerce journey today."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded"></div>
              <span className="text-2xl font-bold text-black">Carryofy</span>
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center py-12 sm:py-16 px-4">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Join Carryofy
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Choose how you want to use Carryofy. Are you looking to sell products or shop for them?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Seller Card */}
              <div
                onClick={() => handleRoleSelect('seller')}
                className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg border-2 border-gray-200 hover:border-primary transition-all cursor-pointer transform hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-900">
                  Become a Seller
                </h2>
                <p className="text-gray-600 mb-6 text-center leading-relaxed">
                  List your products, manage orders, and grow your business. We handle the logistics
                  so you can focus on sales.
                </p>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      List unlimited products
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Same-day delivery support
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Real-time order tracking
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Secure payment processing
                    </span>
                  </li>
                </ul>
                <button className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-base">
                  Sign Up as Seller
                </button>
              </div>

              {/* Buyer Card */}
              <div
                onClick={() => handleRoleSelect('buyer')}
                className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg border-2 border-gray-200 hover:border-primary transition-all cursor-pointer transform hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-900">
                  Shop as Buyer
                </h2>
                <p className="text-gray-600 mb-6 text-center leading-relaxed">
                  Discover unique products from Nigerian sellers. Enjoy secure payments and
                  same-day delivery.
                </p>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Browse thousands of products
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Same-day delivery available
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Secure checkout process
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Track orders in real-time
                    </span>
                  </li>
                </ul>
                <button className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-base">
                  Sign Up as Buyer
                </button>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:text-primary-dark font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

