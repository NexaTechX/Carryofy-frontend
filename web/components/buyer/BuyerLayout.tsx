import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  List,
  Package,
  MapPin,
  User,
  ShoppingCart,
  Menu,
  X,
  Search,
  LogOut,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import { useAuth, tokenManager } from '../../lib/auth';
import ErrorBoundary from '../common/ErrorBoundary';

interface BuyerLayoutProps {
  children: ReactNode;
}

export default function BuyerLayout({ children }: BuyerLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const cart = result.data || result;
        setCartCount(cart.totalItems || 0);
      }
    } catch (error) {
      console.warn('Failed to fetch cart count:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/buyer', icon: Home },
    { name: 'Categories', href: '/buyer/categories', icon: List },
    { name: 'My Orders', href: '/buyer/orders', icon: Package },
    { name: 'Track Order', href: '/buyer/track', icon: MapPin },
    { name: 'Profile', href: '/buyer/profile', icon: User },
  ];

  const helpNavigation = [
    { name: 'Help & Support', href: '/buyer/help', icon: HelpCircle },
    { name: 'Feedback', href: '/buyer/feedback', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    logout();
  };

  const isActive = (href: string) => {
    if (href === '/buyer') {
      return router.pathname === '/buyer';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Header */}
      <header className="bg-black border-b border-[#ff6600]/30 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-[#ffcc99] hover:text-white p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/buyer" className="text-[#ff6600] text-2xl font-bold">
              Carryofy
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              href="/buyer/cart"
              className="relative p-2 text-[#ffcc99] hover:text-white transition"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff6600] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <NotificationsDropdown className="relative" />

            {/* User Menu */}
            {mounted && user && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-white text-sm">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#ffcc99] hover:text-white transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-black border-r border-[#ff6600]/30 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } overflow-y-auto`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Close Button */}
            <div className="lg:hidden flex justify-end p-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[#ffcc99] hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${isActive(item.href)
                        ? 'bg-[#ff6600] text-black font-semibold'
                        : 'text-[#ffcc99] hover:bg-[#1a1a1a] hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Help & Support Section */}
            <div className="px-4 pb-6 border-t border-[#ff6600]/30 pt-4">
              <div className="space-y-2">
                {helpNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${isActive(item.href)
                          ? 'bg-[#ff6600] text-black font-semibold'
                          : 'text-[#ffcc99] hover:bg-[#1a1a1a] hover:text-white'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-black">
          <ErrorBoundary>
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

