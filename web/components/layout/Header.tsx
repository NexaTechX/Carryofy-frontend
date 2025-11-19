import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded"></div>
            <span className="text-xl sm:text-2xl font-bold text-black">Carryofy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link href="/" className="text-sm xl:text-base text-gray-700 hover:text-primary transition py-2 px-1 touch-manipulation">
              Home
            </Link>
            <Link href="/about" className="text-sm xl:text-base text-gray-700 hover:text-primary transition py-2 px-1 touch-manipulation">
              About Us
            </Link>
            <Link href="/contact" className="text-sm xl:text-base text-gray-700 hover:text-primary transition py-2 px-1 touch-manipulation">
              Contact
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center">
            <Link
              href="/auth/signup"
              className="px-4 xl:px-6 py-2 text-sm xl:text-base bg-primary text-white rounded-lg hover:bg-primary-dark transition whitespace-nowrap touch-manipulation active:bg-primary-dark font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 focus:outline-none p-2 -mr-2 touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-3 pb-4 border-t border-gray-200 pt-4">
            <Link 
              href="/" 
              className="block py-3 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition touch-manipulation active:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="block py-3 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition touch-manipulation active:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="block py-3 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition touch-manipulation active:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/auth/signup"
                className="block px-4 py-3 bg-primary text-white rounded-lg text-center font-semibold touch-manipulation active:bg-primary-dark transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

