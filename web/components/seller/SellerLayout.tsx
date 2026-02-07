import { useState, useEffect, ReactNode, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Package,
  Files,
  DollarSign,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Menu,
  X,
  ShoppingCart,
  Clock,
  ShieldCheck,
  Star,
  BarChart3,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useAuth, tokenManager } from '../../lib/auth';
import OnboardingBanner from '../ai-onboarding/OnboardingBanner';

interface Notification {
  id: string;
  type: string; // Backend sends uppercase: ORDER, PRODUCT, PAYOUT, SYSTEM, KYC
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface SellerProfile {
  id: string;
  businessName: string;
  logo?: string;
}

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Only get user on client side after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    fetchSellerProfile();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const fetchNotifications = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      try {
        const response = await fetch(`${apiUrl}/notifications?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          const notificationsData = result.data || result;
          setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
          setUnreadCount(Array.isArray(notificationsData) ? notificationsData.filter((n: Notification) => !n.read).length : 0);
        } else {
          // API returned an error status
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (fetchError) {
        // Network error or fetch failed (API server not running, CORS, etc.)
        console.warn('Failed to fetch notifications from API:', fetchError);
        // Silently fail - set empty arrays so UI doesn't break
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Any other error
      console.error('Error in fetchNotifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const fetchSellerProfile = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/sellers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const sellerData = result.data || result;
        console.log('[SellerLayout] Fetched seller profile:', { logo: sellerData.logo, businessName: sellerData.businessName });
        setSellerProfile({
          id: sellerData.id,
          businessName: sellerData.businessName,
          logo: sellerData.logo,
        });
      }
    } catch (error) {
      console.warn('Failed to fetch seller profile:', error);
    }
  };

  // Refetch seller profile when route changes (to catch logo updates from settings)
  useEffect(() => {
    if (mounted) {
      fetchSellerProfile();
    }
  }, [router.asPath]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'payout':
        return <DollarSign className="w-4 h-4" />;
      case 'kyc':
        return <ShieldCheck className="w-4 h-4" />;
      case 'system':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
      setNotificationsOpen(false);

      // Mark as read via API
      if (!notification.read) {
        try {
          const token = tokenManager.getAccessToken();
          const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
          const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

          await fetch(`${apiUrl}/notifications/${notification.id}/mark-as-read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
          });

          setNotifications(notifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          ));
          setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/seller', icon: LayoutDashboard },
    { name: 'Products', href: '/seller/products', icon: Package },
    { name: 'Orders', href: '/seller/orders', icon: Files },
    { name: 'Quotes', href: '/seller/quotes', icon: FileText },
    { name: 'Reviews', href: '/seller/reviews', icon: Star },
    { name: 'Analytics', href: '/seller/analytics', icon: BarChart3 },
    { name: 'Earnings', href: '/seller/earnings', icon: DollarSign },
    { name: 'Identity Verification', href: '/seller/settings?tab=kyc', icon: ShieldCheck },
    { name: 'Settings', href: '/seller/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    logout();
  };

  const isActive = (href: string) => {
    if (href === '/seller') {
      return router.pathname === '/seller';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <OnboardingBanner />
      {/* Top Header - fixed height so fixed sidebar aligns below it */}
      <header className="bg-black border-b border-primary/30 sticky top-0 z-50 safe-top h-14 sm:h-16 shrink-0 flex items-center">
        <div className="flex items-center justify-between w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          {/* Mobile Logo - Only visible on mobile when sidebar is hidden */}
          <div className="flex lg:hidden items-center gap-2">
            <Link href="/seller" className="flex items-center gap-2">
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
              <span className="text-[#ff6600] text-lg sm:text-xl font-bold">Carryofy</span>
            </Link>
          </div>

          {/* Search Bar - Desktop only */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#ffcc99]" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-primary/30 rounded-lg text-white placeholder-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-[#ffcc99] hover:text-white transition touch-target btn-mobile"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full">
                    <span className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></span>
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-primary/30 rounded-xl shadow-xl z-50 max-h-[500px] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-primary/30">
                    <h3 className="text-white font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[#ffcc99] text-xs">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                        <p className="text-[#ffcc99] text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-primary/10">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${notification.type === 'order' ? 'bg-blue-500/20 text-blue-400' :
                                notification.type === 'product' ? 'bg-green-500/20 text-green-400' :
                                  notification.type === 'payout' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-primary/20 text-primary'
                                }`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className={`text-sm font-semibold mb-1 ${!notification.read ? 'text-white' : 'text-[#ffcc99]'
                                      }`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-[#ffcc99] line-clamp-2 mb-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-[#ffcc99]">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatTime(notification.createdAt)}</span>
                                    </div>
                                  </div>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-primary/30 px-4 py-3">
                    <Link
                      href="/seller/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="block w-full text-center px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-primary flex items-center justify-center overflow-hidden">
                  {mounted && sellerProfile?.logo ? (
                    <img
                      src={sellerProfile.logo}
                      alt={sellerProfile.businessName || 'Business Logo'}
                      className="w-full h-full object-cover"
                    />
                  ) : mounted && user?.name ? (
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-white font-semibold text-sm">U</span>
                  )}
                </div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-[#ffcc99] hover:text-white touch-target btn-mobile"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - fixed on desktop so only content scrolls; overlay on mobile */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed inset-y-0 left-0 z-40 w-[280px] sm:w-64 bg-black border-r border-primary/30 transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:top-16 lg:bottom-0 lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-primary/30">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Carryofy"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">Carryofy</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 sm:py-2 rounded-xl transition touch-target btn-mobile ${active
                      ? 'bg-primary/20 text-white'
                      : 'text-[#ffcc99] hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Add Product Button */}
            <div className="px-3 sm:px-4 py-3 sm:py-4">
              <Link
                href="/seller/products/new"
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 sm:h-10 px-4 bg-primary text-black text-sm font-bold leading-normal tracking-[0.015em] w-full hover:bg-primary-dark transition-colors touch-target btn-mobile"
              >
                <span className="truncate">Add Product</span>
              </Link>
            </div>

            {/* Help and Support */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-primary/30 safe-bottom space-y-1">
              <Link
                href="/seller/help"
                className="flex items-center space-x-3 px-3 py-3 sm:py-2 text-[#ffcc99] hover:bg-gray-800 hover:text-white rounded-xl transition touch-target btn-mobile"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Help and Support</span>
              </Link>
              <Link
                href="/seller/feedback"
                className="flex items-center space-x-3 px-3 py-3 sm:py-2 text-[#ffcc99] hover:bg-gray-800 hover:text-white rounded-xl transition touch-target btn-mobile"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium text-sm">Feedback</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content wrapper: reserved space for fixed sidebar on desktop, scrollable */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full lg:ml-64">
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-black scroll-smooth">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8 safe-bottom">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

