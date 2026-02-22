import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      ],
    },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const navBgClass = scrolled
    ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 py-3'
    : 'bg-transparent py-4';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top ${navBgClass}`}
    >
      <nav className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Carryofy Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-inter text-xl sm:text-2xl font-bold text-[#111111]">
              Carryofy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((item) => (
              <div key={item.name} className="relative group">
                {item.children ? (
                  <button
                    type="button"
                    className="flex items-center text-[#111111]/80 font-medium hover:text-[#FF6B00] transition-colors py-2 focus:outline-none"
                    onMouseEnter={() => setResourcesOpen(true)}
                    onMouseLeave={() => setResourcesOpen(false)}
                  >
                    {item.name}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="text-[#111111]/80 font-medium hover:text-[#FF6B00] transition-colors py-2"
                  >
                    {item.name}
                  </Link>
                )}

                {item.children && (
                  <div
                    className={`absolute top-full left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top ${
                      resourcesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                    }`}
                    onMouseEnter={() => setResourcesOpen(true)}
                    onMouseLeave={() => setResourcesOpen(false)}
                  >
                    <div className="py-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FF6B00]/5 hover:text-[#FF6B00] transition-colors"
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
              className="px-5 py-2.5 text-[#111111] font-medium hover:text-[#FF6B00] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/buyer/products"
              className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-full font-semibold hover:bg-[#E65F00] transition-colors"
            >
              Start Shopping
            </Link>
            <Link
              href="/merchant-onboarding"
              className="px-6 py-2.5 bg-[#111111] text-white rounded-full font-semibold hover:bg-[#333] transition-colors"
            >
              Sell on Carryofy
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden text-[#111111] focus:outline-none p-2 touch-target btn-mobile rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex flex-col p-4 space-y-1 safe-bottom">
                  {navLinks.map((item) => (
                    <div key={item.name}>
                      {item.children ? (
                        <div className="space-y-1">
                          <div className="px-4 py-3 text-[#111111] font-semibold text-base">
                            {item.name}
                          </div>
                          <div className="pl-4 border-l-2 border-[#FF6B00]/20 ml-4 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="block py-3 px-4 text-gray-600 hover:text-[#FF6B00] hover:bg-[#FF6B00]/5 rounded-lg transition-colors touch-target btn-mobile"
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
                          className="block py-3 px-4 text-[#111111] hover:text-[#FF6B00] hover:bg-[#FF6B00]/5 rounded-xl transition-colors font-medium touch-target btn-mobile"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}

                  <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                    <Link
                      href="/auth/login"
                      className="block w-full py-3 text-center text-[#111111] font-semibold rounded-xl border border-gray-200 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/buyer/products"
                      className="block w-full py-3 text-center bg-[#FF6B00] text-white rounded-xl font-semibold touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start Shopping
                    </Link>
                    <Link
                      href="/merchant-onboarding"
                      className="block w-full py-3 text-center bg-[#111111] text-white rounded-xl font-semibold touch-target btn-mobile"
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
    </header>
  );
}
