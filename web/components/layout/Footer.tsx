import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    { Icon: Facebook, href: 'https://facebook.com/carryofy', label: 'Facebook' },
    { Icon: Twitter, href: 'https://twitter.com/carryofy', label: 'Twitter' },
    { Icon: Instagram, href: 'https://instagram.com/carryofy', label: 'Instagram' },
    { Icon: Linkedin, href: 'https://linkedin.com/company/carryofy', label: 'LinkedIn' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const resourcesLinks = [{ name: 'Help Center', href: '/help' }];

  const sellerLinks = [
    { name: 'Sell on Carryofy', href: '/merchant-onboarding' },
    { name: 'Vendor Partnership Terms', href: '/vendor-partnership-terms' },
    { name: 'Seller FAQs', href: '/help#sellers' },
  ];

  const contactLinks = [
    { name: 'support@carryofy.com', href: 'mailto:support@carryofy.com' },
    { name: '+234 916 678 3040', href: 'tel:+2349166783040' },
  ];

  return (
    <footer className="bg-white text-[#111111] pt-16 pb-8 safe-bottom border-t border-[#ffd4b5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt="Carryofy Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <span className="font-inter text-xl font-bold">Carryofy</span>
            </div>
            <p className="text-[#7a4a1d] text-sm leading-relaxed mb-6">
              AI-native B2B commerce for Lagos — verified supply, orchestrated logistics, built for
              operators.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-[#fff3ea] text-[#ff6b00] flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-inter font-bold text-base mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-[#7a4a1d] hover:text-primary transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-inter font-bold text-base mb-4">Resources</h3>
            <ul className="space-y-3">
              {resourcesLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-[#7a4a1d] hover:text-primary transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-inter font-bold text-base mb-4">For Sellers</h3>
            <ul className="space-y-3">
              {sellerLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-[#7a4a1d] hover:text-primary transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-inter font-bold text-base mb-4">Contact Us</h3>
            <ul className="space-y-3">
              {contactLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-[#7a4a1d] hover:text-primary transition-colors text-sm"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#ffd4b5] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[#9a6a3d] text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} Carryofy. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#9a6a3d]">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/vendor-partnership-terms" className="hover:text-primary transition-colors">
              Vendor Partnership Terms
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
        <p className="text-center text-[#9a6a3d] text-sm mt-6">
          Nigeria&apos;s Smart Marketplace · Est. 2026
        </p>
      </div>
    </footer>
  );
}
