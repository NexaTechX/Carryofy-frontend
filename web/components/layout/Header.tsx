import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Truck, ChevronDown } from 'lucide-react';
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

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Merchants', href: '/merchant-onboarding' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-sm py-3' : 'bg-transparent py-5'
        }`}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 relative flex items-center justify-center transition-all duration-300 transform group-hover:scale-105">
              <img src="/logo.png" alt="Carryofy Logo" className="w-full h-full object-contain" />
            </div>
            <span className={`text-2xl font-bold transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-gray-900'}`}>
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

          {/* CTA Button */}
          <div className="hidden lg:flex items-center">
            <Link
              href="/auth/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 focus:outline-none p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl mt-4 border border-gray-100 shadow-xl"
            >
              <div className="flex flex-col p-4 space-y-2">
                {navLinks.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <div className="space-y-2">
                        <div className="px-4 py-2 text-gray-900 font-semibold">{item.name}</div>
                        <div className="pl-4 border-l-2 border-gray-100 ml-4 space-y-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="block py-2 px-4 text-gray-600 hover:text-primary rounded-lg transition-colors"
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
                        className="block py-3 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
                <div className="pt-2">
                  <Link
                    href="/auth/signup"
                    className="block w-full py-3 text-center bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold shadow-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

