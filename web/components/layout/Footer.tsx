import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    { Icon: Facebook, href: 'https://facebook.com/carryofy', label: 'Facebook' },
    { Icon: Twitter, href: 'https://twitter.com/carryofy', label: 'Twitter' },
    { Icon: Instagram, href: 'https://instagram.com/carryofy', label: 'Instagram' },
    { Icon: Linkedin, href: 'https://linkedin.com/company/carryofy', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 border-t border-gray-800 safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-12 sm:mb-16">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Carryofy Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold">Carryofy</span>
            </div>
            <p className="text-gray-400 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              Reliable local commerce with verified sellers. We connect sellers and buyers with delivery, storage, and trust.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors duration-300 group touch-target btn-mobile"
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-white">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Careers', href: '/careers' },
                { name: 'Blog', href: '/blog' },
                { name: 'Contact', href: '/contact' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-gray-400 hover:text-primary transition-colors text-sm sm:text-base py-1 inline-block">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-white">Resources</h3>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { name: 'Sell on Carryofy', href: '/merchant-onboarding' },
                { name: 'Help Center', href: '/help' },
                { name: 'Products', href: '/buyer/products' },
                { name: 'Track Order', href: '/buyer/track' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-gray-400 hover:text-primary transition-colors text-sm sm:text-base py-1 inline-block">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Full width on mobile */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-white">Contact Us</h3>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base">123 Logistics Way, Victoria Island, Lagos, Nigeria</span>
              </li>
              <li>
                <a href="tel:+2348001234567" className="flex items-center gap-3 text-gray-400 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span className="text-sm sm:text-base">+234 916 678 3040</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@carryofy.com" className="flex items-center gap-3 text-gray-400 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span className="text-sm sm:text-base">support@carryofy.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} Carryofy. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
