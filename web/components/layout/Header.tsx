import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_CTA_ID = 'hero-primary-cta';

export default function Header() {
  const router = useRouter();
  const isHome = router.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroCtaInView, setHeroCtaInView] = useState(true);
  const transparentNav = isHome && !scrolled && !mobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setHeroCtaInView(false);
      return;
    }

    setHeroCtaInView(true);

    const el = document.getElementById(HERO_CTA_ID);
    if (!el) {
      setHeroCtaInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroCtaInView(entry.isIntersecting);
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: [0, 0.01, 0.1, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isHome, router.asPath]);

  const showNavStartSourcing = !isHome || !heroCtaInView;

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
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const navBgClass = scrolled
    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#ffd4b5] py-3'
    : 'bg-white py-4 border-b border-[#ffe8d8]';

  const navLinkClass = 'text-[#111111] font-medium hover:text-[#FF6600] transition-colors py-2';

  const brandTextClass = 'text-[#111111]';

  const secondaryLinkClass = 'px-5 py-2.5 text-[#111111] font-medium hover:text-[#FF6600] transition-colors';

  const primaryCtaClass =
    'px-6 py-2.5 bg-[#FF6600] text-black rounded-full font-semibold hover:bg-[#E65E00] transition-colors';

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
            <span className={`font-inter text-xl sm:text-2xl font-bold transition-colors ${brandTextClass}`}>
              Carryofy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((item) => (
              <Link key={item.name} href={item.href} className={navLinkClass}>
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login" className={secondaryLinkClass}>
              Sign in
            </Link>
            {showNavStartSourcing && (
              <Link href="/auth/signup" className={primaryCtaClass}>
                Start sourcing
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {showNavStartSourcing && (
              <Link
                href="/auth/signup"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  'bg-[#FF6600] text-black hover:bg-[#E65E00]'
                }`}
              >
                Start sourcing
              </Link>
            )}
            <button
              type="button"
              className={`focus:outline-none p-2 touch-target btn-mobile rounded-lg transition-colors ${
                'text-[#111111] hover:bg-[#FFF1E8]'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#FF6600]/10 backdrop-blur-sm lg:hidden z-40"
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
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block py-3 px-4 text-[#111111] hover:text-[#FF6600] hover:bg-[#FF6600]/5 rounded-xl transition-colors font-medium touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                    <Link
                      href="/auth/login"
                      className="block w-full py-3 text-center text-[#111111] font-semibold rounded-xl border border-gray-200 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block w-full py-3 text-center bg-[#FF6600] text-black rounded-xl font-semibold touch-target btn-mobile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start sourcing
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
