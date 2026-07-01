import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_CTA_ID = 'hero-browse-cta';

export default function Header() {
  const router = useRouter();
  const isHome = router.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroCtaInView, setHeroCtaInView] = useState(true);
  /** Home hero is a dark marketplace canvas — nav is transparent over it, then
   *  condenses to a solid navy bar on scroll. Other pages keep the light bar. */
  const darkHome = isHome;
  const transparentNav = isHome && !scrolled;

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

  const showNavBrowseCta = !isHome || !heroCtaInView;

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
    { name: 'Browse catalogue', href: '/buyer/products' },
    { name: 'Sell wholesale', href: '/merchant-onboarding' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const navBgClass = darkHome
    ? scrolled
      ? 'bg-background/95 backdrop-blur-md border-b border-border-custom py-3'
      : 'bg-transparent py-4 border-b border-transparent'
    : scrolled
      ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 py-3'
      : 'bg-white py-4';

  const navLinkClass = darkHome
    ? 'text-foreground/75 font-medium hover:text-primary transition-colors py-2'
    : 'text-[#111111] font-medium hover:text-[#FF6B00] transition-colors py-2';

  const brandTextClass = darkHome ? 'text-foreground' : 'text-[#111111]';

  const secondaryLinkClass = darkHome
    ? 'px-5 py-2.5 text-foreground/75 font-medium hover:text-primary transition-colors'
    : 'px-5 py-2.5 text-[#111111] font-medium hover:text-[#FF6B00] transition-colors';

  const primaryCtaClass = darkHome
    ? 'px-6 py-2.5 bg-primary text-[#1a0e00] rounded-full font-semibold hover:bg-primary-dark transition-colors'
    : 'px-6 py-2.5 bg-[#FF6B00] text-black rounded-full font-semibold hover:bg-[#E65100] transition-colors';

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
            <span className={`text-xl font-bold tracking-tight transition-colors sm:text-2xl ${brandTextClass}`}>
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
            {showNavBrowseCta && (
              <Link href="/buyer/products" className={primaryCtaClass}>
                Browse catalogue
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {showNavBrowseCta && (
              <Link
                href="/buyer/products"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  darkHome
                    ? 'bg-primary text-[#1a0e00] hover:bg-primary-dark'
                    : 'bg-[#FF6B00] text-black hover:bg-[#E65100]'
                }`}
              >
                Browse
              </Link>
            )}
            <button
              type="button"
              className={`focus:outline-none p-2 touch-target btn-mobile rounded-lg transition-colors ${
                darkHome ? 'text-foreground hover:bg-white/10' : 'text-[#111111] hover:bg-gray-100'
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
                className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`lg:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto ${
                  darkHome ? 'bg-card border-border-custom' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex flex-col p-4 space-y-1 safe-bottom">
                  {navLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block py-3 px-4 rounded-xl transition-colors font-medium touch-target btn-mobile ${
                        darkHome
                          ? 'text-foreground/85 hover:text-primary hover:bg-primary/10'
                          : 'text-[#111111] hover:text-[#FF6B00] hover:bg-[#FF6B00]/5'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <div
                    className={`pt-4 mt-2 border-t space-y-2 ${
                      darkHome ? 'border-border-custom' : 'border-gray-100'
                    }`}
                  >
                    <Link
                      href="/auth/login"
                      className={`block w-full py-3 text-center font-semibold rounded-xl border transition-colors touch-target btn-mobile ${
                        darkHome
                          ? 'text-foreground border-border-strong hover:border-primary hover:text-primary'
                          : 'text-[#111111] border-gray-200 hover:border-[#FF6B00] hover:text-[#FF6B00]'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/buyer/products"
                      className={`block w-full py-3 text-center rounded-xl font-semibold touch-target btn-mobile ${
                        darkHome ? 'bg-primary text-[#1a0e00]' : 'bg-[#FF6B00] text-black'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Browse catalogue
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
