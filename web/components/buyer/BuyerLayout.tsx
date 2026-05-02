import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
// SECTION 3.1 — resolved: layout supports logged-out catalog browse
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
  Scale,
  Gift,
  Wallet as WalletIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import NotificationsDropdown from './NotificationsDropdown';

const CartDrawer = dynamic(() => import('./CartDrawer'), {
  ssr: false,
});
import { useAuth } from '../../lib/auth';
import { useCart } from '../../lib/contexts/CartContext';
import ErrorBoundary from '../common/ErrorBoundary';


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

  useEffect(() => {
    if (!mounted || !router.isReady) return;
    if (router.pathname !== '/buyer/products') {
      setSearchQuery('');
      return;
    }
    const raw = router.query.search;
    const s = typeof raw === 'string' ? raw : '';
    setSearchQuery(s);
  }, [mounted, router.isReady, router.pathname, router.query.search]);

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
    { name: 'Disputes', href: '/buyer/disputes', icon: Scale },
    { name: 'Referrals', href: '/buyer/referrals', icon: Gift },
    { name: 'Rewards', href: '/buyer/wallet', icon: WalletIcon },
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
    <div className="min-h-screen bg-background flex flex-col font-inter">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white safe-top">
        <div className="flex items-center gap-4 px-6 py-3 sm:py-4 lg:px-8">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-foreground/70 hover:text-foreground p-2 touch-target btn-mobile"
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
              <span className="text-lg font-bold text-orange-500 sm:text-2xl">Carryofy</span>
            </Link>
          </div>

          {/* Search Bar - persistent, all pages */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className="flex flex-1 items-center rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-orange-400">
              <Search className="ml-3 h-4 w-4 shrink-0 text-gray-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 border-0 bg-transparent py-2.5 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                aria-label="Search products"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-auto">

            {/* Cart */}
            <button
              onClick={openDrawer}
              className="relative p-2 text-gray-500 transition hover:text-orange-500 touch-target btn-mobile"
              aria-label={`Cart ${cartCount > 0 ? `(${cartCount} items)` : ''}`}
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white sm:-top-1 sm:-right-1 sm:h-5 sm:w-5 sm:text-xs">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Notifications — authenticated buyers only */}
            {mounted && user && (
              <NotificationsDropdown className="relative" />
            )}

            {mounted && !user && (
              <Link
                href="/auth/login"
                className="px-2 text-sm font-semibold text-orange-500 hover:underline"
              >
                Sign in
              </Link>
            )}

            {/* User Menu */}
            {mounted && user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden max-w-[100px] truncate text-sm text-gray-900 md:block">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 transition hover:text-gray-900 touch-target btn-mobile"
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
          className={`fixed inset-y-0 left-0 z-40 w-[280px] transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out sm:w-64 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } overflow-y-auto`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 lg:hidden">
              <Link href="/buyer" className="flex items-center gap-2">
                <div className="relative h-7 w-7">
                  <Image
                    src="/logo.png"
                    alt="Carryofy"
                    width={28}
                    height={28}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-orange-500">Carryofy</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-900 touch-target btn-mobile"
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
                    className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition touch-target btn-mobile sm:py-3 ${isActive(item.href)
                      ? 'bg-orange-500 font-medium text-white'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
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
            className="fixed inset-0 z-30 bg-gray-900/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="relative flex-1 scroll-smooth overflow-y-auto bg-background">
          <ErrorBoundary>
            <div className="dashboard-page-padding relative py-6 safe-bottom lg:py-8">{children}</div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}

