import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  Home,
  ShoppingBag,
  Package,
  Truck,
  User,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  HelpCircle,
  Bookmark,
  FileText,
  Layers,
  Search,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import NotificationsDropdown from './NotificationsDropdown';

const CartDrawer = dynamic(() => import('./CartDrawer'), {
  ssr: false,
});
import { useAuth, tokenManager } from '../../lib/auth';
import { useCart } from '../../lib/contexts/CartContext';
import ErrorBoundary from '../common/ErrorBoundary';
// import OnboardingBanner from '../ai-onboarding/OnboardingBanner';

interface BuyerLayoutProps {
  children: ReactNode;
}

export default function BuyerLayout({ children }: BuyerLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cartCount, openDrawer } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buyer/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navigation = [
    { name: 'Home', href: '/buyer', icon: Home },
    { name: 'Shop', href: '/buyer/products', icon: ShoppingBag },
    { name: 'My Orders', href: '/buyer/orders', icon: Package },
    { name: 'My Quotes', href: '/buyer/quotes', icon: FileText },
    { name: 'Bulk Order', href: '/buyer/bulk-order', icon: Layers },
    { name: 'Saved Lists', href: '/buyer/wishlist', icon: Bookmark },
    { name: 'Track Shipment', href: '/buyer/track', icon: Truck },
    { name: 'Profile', href: '/buyer/profile', icon: User },
    { name: 'Help', href: '/buyer/help', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    logout();
  };

  const isActive = (href: string) => {
    const path = (router.asPath || '/').split('?')[0];
    if (href === '/buyer') {
      return path === '/buyer';
    }
    return path === href || path.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col font-inter" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
      <header className="bg-[#111111] border-b border-[#FF6B00]/30 sticky top-0 z-50 safe-top">
        <div className="flex items-center gap-4 px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-[#ffcc99]/90 hover:text-white p-2 touch-target btn-mobile"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <Link href="/buyer" className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 relative">
                <Image
                  src="/logo.png"
                  alt="Carryofy"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="text-[#FF6B00] text-lg sm:text-2xl font-bold">Carryofy</span>
            </Link>
          </div>

          {/* Search Bar - persistent, all pages */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className="flex-1 flex items-center bg-[#1a1a1a] rounded-lg border border-[#FF6B00]/20 focus-within:border-[#FF6B00]/50 transition-colors">
              <Search className="w-4 h-4 text-[#ffcc99]/60 ml-3 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-white placeholder:text-[#ffcc99]/50 py-2.5 px-3 text-sm focus:outline-none"
                aria-label="Search products"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-auto">
            {/* Cart */}
            <button
              onClick={openDrawer}
              className="relative p-2 text-[#ffcc99] hover:text-white transition touch-target btn-mobile"
              aria-label={`Cart ${cartCount > 0 ? `(${cartCount} items)` : ''}`}
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#FF6B00] text-black text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <NotificationsDropdown className="relative" />

            {/* User Menu */}
            {mounted && user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden md:block text-white text-sm truncate max-w-[100px]">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#ffcc99] hover:text-white transition touch-target btn-mobile"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-[280px] sm:w-64 bg-[#111111] border-r border-[#FF6B00]/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } overflow-y-auto`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Close Button */}
            <div className="lg:hidden flex justify-between items-center p-4 border-b border-[#FF6B00]/30">
              <Link href="/buyer" className="flex items-center gap-2">
                <div className="w-7 h-7 relative">
                  <Image
                    src="/logo.png"
                    alt="Carryofy"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[#FF6B00] text-lg font-bold">Carryofy</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[#ffcc99] hover:text-white p-2 touch-target btn-mobile"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 safe-bottom">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 sm:py-3 rounded-xl transition touch-target btn-mobile ${isActive(item.href)
                      ? 'bg-[#FF6B00] text-black font-semibold'
                      : 'text-[#ffcc99]/90 hover:bg-[#1a1a1a] hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth relative bg-[#111111]">
          <ErrorBoundary>
            <div className="relative p-3 sm:p-4 lg:p-6 xl:p-8 safe-bottom">{children}</div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}

