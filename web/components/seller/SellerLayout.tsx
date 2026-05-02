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
  LogOut,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { useAuth, tokenManager } from '../../lib/auth';
import { getApiBaseUrl } from '../../lib/api/utils';


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
  pickupAddress?: string;
  latitude?: number;
  longitude?: number;
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
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycBannerDismissed, setKycBannerDismissed] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const KYC_BANNER_DISMISSED_KEY = 'seller-kyc-banner-dismissed';

  // Only get user on client side after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    fetchSellerProfile();
    fetchKycStatus();
    if (typeof window !== 'undefined') {
      setKycBannerDismissed(!!sessionStorage.getItem(KYC_BANNER_DISMISSED_KEY));
    }
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

      const apiUrl = getApiBaseUrl();

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

      const apiUrl = getApiBaseUrl();

      const response = await fetch(`${apiUrl}/sellers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const sellerData = result.data || result;
        setSellerProfile({
          id: sellerData.id,
          businessName: sellerData.businessName,
          logo: sellerData.logo,
          pickupAddress: sellerData.pickupAddress,
          latitude: sellerData.latitude,
          longitude: sellerData.longitude,
        });
      } else if (response.status === 404) {
        setSellerProfile(null);
      }
    } catch (error) {
      setSellerProfile(null);
    }
  };

  const fetchKycStatus = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const apiUrl = getApiBaseUrl();

      const response = await fetch(`${apiUrl}/sellers/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        setKycStatus(responseData.status);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const dismissKycBanner = () => {
    setKycBannerDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(KYC_BANNER_DISMISSED_KEY, '1');
    }
  };

  // Refetch seller profile and KYC when route changes (to catch logo/KYC updates)
  useEffect(() => {
    if (mounted) {
      fetchSellerProfile();
      fetchKycStatus();
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
          const apiUrl = getApiBaseUrl();

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
    { name: 'Settings', href: '/seller/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    logout();
  };

  const isActive = (href: string) => {
    const [path, query] = href.split('?');
    if (path === '/seller') {
      return router.pathname === '/seller';
    }
    if (query) {
      const params = new URLSearchParams(query);
      const tab = params.get('tab');
      if (tab) {
        return router.pathname === path && String(router.query?.tab ?? '') === tab;
      }
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Seller onboarding is separate at /seller/onboard; no buyer AI onboarding banner here */}
      {/* Top Header - fixed height so fixed sidebar aligns below it */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-gray-200 bg-white safe-top sm:h-16">
        <div className="flex w-full items-center justify-between px-6 py-3 sm:py-4 lg:px-8">
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
              <span className="text-lg font-bold text-orange-500 sm:text-xl">Carryofy</span>
            </Link>
          </div>

          {/* Search Bar - Desktop only */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4">

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-500 transition hover:text-orange-500 touch-target btn-mobile"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full">
                    <span className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></span>
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-2 flex max-h-[500px] w-80 flex-col rounded-xl border border-gray-200 bg-white shadow-lg sm:w-96">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs text-gray-500">{unreadCount} new</span>}
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full px-4 py-3 text-left transition-colors hover:bg-orange-50 ${!notification.read ? 'bg-orange-50/50' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`rounded-lg p-2 ${notification.type === 'order' ? 'bg-blue-50 text-blue-600' :
                                notification.type === 'product' ? 'bg-green-50 text-green-600' :
                                  notification.type === 'payout' ? 'bg-amber-50 text-amber-700' :
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className={`mb-1 text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'
                                      }`}>
                                      {notification.title}
                                    </p>
                                    <p className="mb-2 line-clamp-2 text-xs text-gray-500">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatTime(notification.createdAt)}</span>
                                    </div>
                                  </div>
                                  {!notification.read && (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500"></span>
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
                  <div className="border-t border-gray-100 px-4 py-3">
                    <Link
                      href="/seller/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="block w-full rounded-lg bg-orange-500 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-orange-600"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="group relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 touch-target btn-mobile"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                Sign out
              </span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-orange-200 bg-white">
                  {mounted && sellerProfile?.logo ? (
                    <img
                      src={sellerProfile.logo}
                      alt={sellerProfile.businessName || 'Business Logo'}
                      className="h-full w-full object-cover"
                    />
                  ) : mounted && user?.name ? (
                    <span className="text-sm font-semibold text-orange-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-orange-600">U</span>
                  )}
                </div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="touch-target text-gray-600 hover:text-gray-900 btn-mobile lg:hidden"
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
            } fixed inset-y-0 left-0 z-40 w-[280px] border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out sm:w-64
            lg:bottom-0 lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:flex-col`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center space-x-2 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Carryofy"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-orange-500 sm:text-xl">Carryofy</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:space-y-2 sm:px-4 sm:py-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex touch-target items-center space-x-3 rounded-lg px-3 py-3 transition btn-mobile sm:py-2 ${active
                      ? 'bg-orange-500 font-medium text-white'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
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
                className="btn-mobile flex h-11 max-w-[480px] min-w-[84px] w-full cursor-pointer touch-target items-center justify-center overflow-hidden rounded-lg bg-orange-500 px-4 text-sm font-medium leading-normal tracking-[0.015em] text-white transition-colors hover:bg-orange-600 sm:h-10"
              >
                <span className="truncate">Add Product</span>
              </Link>
            </div>

            {/* Help and Support */}
            <div className="safe-bottom space-y-1 border-t border-gray-200 px-3 py-3 sm:px-4 sm:py-4">
              <Link
                href="/seller/help"
                onClick={() => setSidebarOpen(false)}
                className={`flex touch-target items-center space-x-3 rounded-lg px-3 py-3 transition btn-mobile sm:py-2 ${isActive('/seller/help')
                  ? 'bg-orange-500 font-medium text-white'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Help and Support</span>
              </Link>
              <Link
                href="/seller/feedback"
                onClick={() => setSidebarOpen(false)}
                className={`flex touch-target items-center space-x-3 rounded-lg px-3 py-3 transition btn-mobile sm:py-2 ${isActive('/seller/feedback')
                  ? 'bg-orange-500 font-medium text-white'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
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
            className="fixed inset-0 z-30 bg-gray-900/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content wrapper: reserved space for fixed sidebar on desktop, scrollable */}
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col lg:ml-64">
          <main className="flex-1 scroll-smooth overflow-x-hidden overflow-y-auto bg-background">
            {/* KYC Reminder Banner - shown when KYC not submitted or rejected */}
            {kycStatus && !kycBannerDismissed && (kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED') && (
              <div className="mx-3 sm:mx-4 lg:mx-6 xl:mx-8 mt-3 sm:mt-4 lg:mt-6 xl:mt-8 mb-3">
                <div
                  className={`h-10 flex items-center justify-between gap-3 rounded-lg px-4 ${
                    kycStatus === 'REJECTED'
                      ? 'bg-[#fff0e6] border border-[#ff944d]'
                      : 'bg-[#fff6ef] border border-[#ffb27a]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[#111111] text-sm font-medium truncate">
                      {kycStatus === 'REJECTED'
                        ? 'Verification Rejected — Please resubmit'
                        : 'Complete your KYC verification to activate your store and start receiving orders.'}
                    </span>
                    <Link
                      href="/seller/settings?tab=kyc"
                      className="shrink-0 rounded-md bg-orange-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-orange-600"
                    >
                      {kycStatus === 'REJECTED' ? 'Resubmit' : 'Complete KYC'}
                    </Link>
                  </div>
                  <button
                    onClick={dismissKycBanner}
                    className="shrink-0 p-1 rounded hover:bg-[#FF6600]/10 text-[#8a4f1a] hover:text-[#111111] transition"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="dashboard-page-padding safe-bottom py-6 lg:py-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

