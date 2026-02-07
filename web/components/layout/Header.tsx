import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import FloatingAssistant from '../ai-assistant/FloatingAssistant';

export default function Header() {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Sell', href: '/merchant-onboarding' },
    {
      name: 'Resources',
      href: '#',
      children: [
        { name: 'Blog', href: '/blog' },
        { name: 'Help Center', href: '/help' },
        { name: 'Careers', href: '/careers' },
      ]
    },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top ${scrolled ? 'glass shadow-sm py-2 sm:py-3' : 'bg-transparent py-3 sm:py-5'
        }`}
    >
      <nav className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center transition-all duration-300 transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Carryofy Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className={`font-heading text-xl sm:text-2xl font-bold transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              Carryofy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((item) => (
              <div key={item.name} className="relative group">
                {item.children ? (
                  <button
                    className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors py-2 focus:outline-none"
                    onMouseEnter={() => setResourcesOpen(true)}
                    onMouseLeave={() => setResourcesOpen(false)}
                  >
                    {item.name}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="relative text-gray-700 font-medium hover:text-primary transition-colors group py-2"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )}

                {/* Dropdown */}
                {item.children && (
                  <div
                    className={`absolute top-full left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top ${resourcesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
                    onMouseEnter={() => setResourcesOpen(true)}
                    onMouseLeave={() => setResourcesOpen(false)}
                  >
                    <div className="py-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-gray-700 font-semibold hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/buyer/products"
              className="px-6 py-2.5 text-gray-700 font-semibold rounded-full border border-gray-300 hover:border-primary hover:text-primary transition-colors"
            >
              Start Shopping
            </Link>
            <Link
              href="/merchant-onboarding"
              className="px-6 py-2.5 bg-linear-to-r from-primary to-primary-light text-white rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
            >
              Sell on Carryofy
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 focus:outline-none p-2 touch-target btn-mobile rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex flex-col p-4 space-y-1 safe-bottom">
                  {navLinks.map((item) => (
                    <div key={item.name}>
                      {item.children ? (
                        <div className="space-y-1">
                          <div className="px-4 py-3 text-gray-900 font-semibold text-base">{item.name}</div>
                          <div className="pl-4 border-l-2 border-primary/20 ml-4 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="block py-3 px-4 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors touch-target btn-mobile"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="block py-3 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors font-medium touch-target btn-mobile"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}

                  {/* Mobile CTAs */}
                  <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                    <Link
                      href="/auth/login"
                      className="block w-full py-3 text-center text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition-colors touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/buyer/products"
                      className="block w-full py-3 text-center text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition-colors touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start Shopping
                    </Link>
                    <Link
                      href="/merchant-onboarding"
                      className="block w-full py-3 text-center bg-linear-to-r from-primary to-primary-light text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sell on Carryofy
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
      {/* <FloatingAssistant /> */}
    </header>
  );
}


