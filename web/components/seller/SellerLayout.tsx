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
  ClipboardList,
  MoreHorizontal,
  Plus,
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
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycBannerDismissed, setKycBannerDismissed] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRefMobile = useRef<HTMLDivElement>(null);

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
      const t = event.target as Node;
      const inDesktop = notificationDropdownRef.current?.contains(t);
      const inMobile = notificationDropdownRefMobile.current?.contains(t);
      if (!inDesktop && !inMobile) setNotificationsOpen(false);
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

  const showSellerMobileChrome = !router.pathname.startsWith('/seller/onboard');

  const sellerMobileTopTitle = () => {
    const p = router.pathname;
    if (p.startsWith('/seller/products')) return 'Products';
    if (p.startsWith('/seller/orders')) return 'Orders & Quotes';
    if (p.startsWith('/seller/earnings')) return 'Earnings';
    if (p.startsWith('/seller/more')) return 'More';
    if (p.startsWith('/seller/reviews')) return 'Reviews';
    if (p.startsWith('/seller/analytics')) return 'Analytics';
    if (p.startsWith('/seller/settings')) return 'Settings';
    if (p.startsWith('/seller/quotes')) return 'Orders & Quotes';
    if (p.startsWith('/seller/notifications')) return 'Notifications';
    if (p.startsWith('/seller/help')) return 'Help';
    if (p.startsWith('/seller/feedback')) return 'Feedback';
    return 'Carryofy';
  };

  type SellerMobileTab = 'home' | 'products' | 'orders' | 'earnings' | 'more';
  const sellerMobileTab = (): SellerMobileTab => {
    const p = router.pathname;
    if (p === '/seller' || p === '/seller/') return 'home';
    if (p.startsWith('/seller/products')) return 'products';
    if (p.startsWith('/seller/orders') || p.startsWith('/seller/quotes')) return 'orders';
    if (p.startsWith('/seller/earnings')) return 'earnings';
    if (
      p.startsWith('/seller/more') ||
      p.startsWith('/seller/reviews') ||
      p.startsWith('/seller/analytics') ||
      p.startsWith('/seller/settings') ||
      p.startsWith('/seller/help') ||
      p.startsWith('/seller/feedback') ||
      p.startsWith('/seller/notifications')
    )
      return 'more';
    return 'home';
  };

  const sellerMobileNav: { id: SellerMobileTab; href: string; label: string; Icon: typeof LayoutDashboard }[] = [
    { id: 'home', href: '/seller', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'products', href: '/seller/products', label: 'Products', Icon: Package },
    { id: 'orders', href: '/seller/orders', label: 'Orders', Icon: ClipboardList },
    { id: 'earnings', href: '/seller/earnings', label: 'Earnings', Icon: BarChart3 },
    { id: 'more', href: '/seller/more', label: 'More', Icon: MoreHorizontal },
  ];

  const mobileTab = sellerMobileTab();
  const productsListMobilePlus = router.pathname === '/seller/products';

  const sellerAvatarInner = () => {
    if (mounted && sellerProfile?.logo) {
      return (
        <img
          src={sellerProfile.logo}
          alt=""
          className="h-full w-full object-cover"
        />
      );
    }
    const initials =
      mounted && sellerProfile?.businessName
        ? sellerProfile.businessName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join('')
        : mounted && user?.name
          ? user.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('')
          : 'U';
    return <span className="text-xs font-bold text-orange-500">{initials.slice(0, 2)}</span>;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background max-lg:h-svh max-lg:min-h-0 max-lg:overflow-hidden max-lg:bg-[#0f1117]">
      {/* Seller onboarding is separate at /seller/onboard; no buyer AI onboarding banner here */}
      {/* Desktop header */}
      <header className="hidden lg:flex bg-background border-b border-border-custom sticky top-0 z-50 safe-top h-14 sm:h-16 shrink-0 items-center">
        <div className="flex items-center justify-between w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/50" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-card border border-border-custom rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-foreground/70 hover:text-foreground transition touch-target btn-mobile"
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

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border-custom rounded-xl shadow-xl z-50 max-h-[500px] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom">
                    <h3 className="text-foreground font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-foreground/60 text-xs">{unreadCount} new</span>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                        <p className="text-foreground/50 text-sm">No notifications</p>
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
                                    <p className={`text-sm font-semibold mb-1 ${!notification.read ? 'text-foreground' : 'text-foreground/70'
                                      }`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-foreground/60 line-clamp-2 mb-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-foreground/50">
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

                  <div className="border-t border-border-custom px-4 py-3">
                    <Link
                      href="/seller/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="block w-full text-center px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="relative p-2 text-foreground/50 hover:text-foreground hover:bg-red-500/20 rounded-lg transition-colors touch-target btn-mobile group"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border border-border-custom rounded text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Sign out
              </span>
            </button>

            <div className="relative">
              <button type="button" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center overflow-hidden">
                  {mounted && sellerProfile?.logo ? (
                    <img
                      src={sellerProfile.logo}
                      alt={sellerProfile.businessName || 'Business Logo'}
                      className="w-full h-full object-cover"
                    />
                  ) : mounted && user?.name ? (
                    <span className="text-foreground font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-foreground font-semibold text-sm">U</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile topbar — Carryofy mobile nav reference */}
      {showSellerMobileChrome && (
        <header className="sticky top-0 z-50 shrink-0 border-b border-white/[0.06] bg-[#0f1117] safe-top lg:hidden">
          <div className="flex items-center justify-between px-3 py-2.5 sm:px-4">
            <Link href="/seller" className="flex min-w-0 items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Carryofy"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              {router.pathname !== '/seller' && (
                <span className="truncate text-base font-extrabold text-white">{sellerMobileTopTitle()}</span>
              )}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {productsListMobilePlus && (
                <Link
                  href="/seller/products/new"
                  className="btn-mobile flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-orange-500 bg-orange-500"
                  aria-label="Add product"
                >
                  <Plus className="h-5 w-5 text-white" />
                </Link>
              )}
              <div className="relative" ref={notificationDropdownRefMobile}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="btn-mobile relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/[0.07] bg-[#1a1d27]"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[#0f1117] bg-orange-500" />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="fixed left-2 right-2 top-14 max-h-[min(500px,70vh)] overflow-hidden rounded-xl border border-border-custom bg-card shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-h-[500px] z-[60] flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom">
                      <h3 className="text-foreground font-bold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-foreground/60 text-xs">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-[min(400px,55vh)]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                          <p className="text-foreground/50 text-sm">No notifications</p>
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
                                  <p className={`text-sm font-semibold mb-1 ${!notification.read ? 'text-foreground' : 'text-foreground/70'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-foreground/60 line-clamp-2 mb-2">{notification.message}</p>
                                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(notification.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border-custom px-4 py-3">
                      <Link
                        href="/seller/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="block w-full text-center px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/seller/more"
                className="btn-mobile flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-full border border-orange-500/50 bg-orange-500/20"
                aria-label="Account and more"
              >
                {sellerAvatarInner()}
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only (mobile uses bottom nav + /seller/more) */}
        <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 z-40 h-[calc(100vh-4rem)] w-64 flex-col border-r border-border-custom bg-background">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-border-custom">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Carryofy"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">Carryofy</span>
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
                    className={`flex items-center space-x-3 px-3 py-3 sm:py-2 rounded-xl transition touch-target btn-mobile ${active
                      ? 'bg-primary/20 text-foreground'
                      : 'text-foreground/70 hover:bg-card hover:text-foreground'
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
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 sm:h-10 px-4 bg-primary text-black text-sm font-bold leading-normal tracking-[0.015em] w-full hover:bg-primary/90 transition-colors touch-target btn-mobile"
              >
                <span className="truncate">Add Product</span>
              </Link>
            </div>

            {/* Help and Support */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-border-custom safe-bottom space-y-1">
              <Link
                href="/seller/help"
                className={`flex items-center space-x-3 px-3 py-3 sm:py-2 rounded-xl transition touch-target btn-mobile ${isActive('/seller/help')
                  ? 'bg-primary/20 text-foreground'
                  : 'text-foreground/70 hover:bg-card hover:text-foreground'
                  }`}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Help and Support</span>
              </Link>
              <Link
                href="/seller/feedback"
                className={`flex items-center space-x-3 px-3 py-3 sm:py-2 rounded-xl transition touch-target btn-mobile ${isActive('/seller/feedback')
                  ? 'bg-primary/20 text-foreground'
                  : 'text-foreground/70 hover:bg-card hover:text-foreground'
                  }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium text-sm">Feedback</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content wrapper: reserved space for fixed sidebar on desktop, scrollable */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full lg:ml-64">
          <main
            className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth bg-background [-webkit-overflow-scrolling:touch] max-lg:bg-[#0f1117] ${showSellerMobileChrome ? 'max-lg:pb-[calc(7rem+env(safe-area-inset-bottom))]' : ''}`}
          >
            {/* KYC Reminder Banner - shown when KYC not submitted or rejected */}
            {kycStatus && !kycBannerDismissed && (kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED') && (
              <div className="mx-3 sm:mx-4 lg:mx-6 xl:mx-8 mt-3 sm:mt-4 lg:mt-6 xl:mt-8 mb-3">
                <div
                  className={`h-10 flex items-center justify-between gap-3 rounded-lg px-4 ${
                    kycStatus === 'REJECTED'
                      ? 'bg-red-900/40 border border-red-500/30'
                      : 'bg-blue-900/40 border border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-white text-sm font-medium truncate">
                      {kycStatus === 'REJECTED'
                        ? 'Verification Rejected — Please resubmit'
                        : 'Complete your KYC verification to activate your store and start receiving orders.'}
                    </span>
                    <Link
                      href="/seller/settings?tab=kyc"
                      className="shrink-0 text-xs font-bold px-3 py-1 rounded-md transition bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {kycStatus === 'REJECTED' ? 'Resubmit' : 'Complete KYC'}
                    </Link>
                  </div>
                  <button
                    onClick={dismissKycBanner}
                    className="shrink-0 p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div
              className={`p-3 sm:p-4 lg:p-6 xl:p-8 safe-bottom ${showSellerMobileChrome ? 'max-lg:px-3 max-lg:pb-2 max-lg:pt-3' : ''}`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {showSellerMobileChrome && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[55] flex shrink-0 border-t border-white/10 bg-[#13161f] px-1 pt-2 lg:hidden"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
          aria-label="Seller primary navigation"
        >
          {sellerMobileNav.map(({ id, href, label, Icon }) => {
            const on = mobileTab === id;
            return (
              <Link
                key={id}
                href={href}
                className={`btn-mobile flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 transition-colors active:opacity-80 ${on ? 'text-orange-500' : 'text-gray-500'}`}
              >
                <span
                  className={`h-1 w-1 shrink-0 rounded-full bg-orange-500 transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden
                />
                <Icon className="h-7 w-7 shrink-0" strokeWidth={on ? 2.35 : 2} />
                <span className="text-[11px] font-semibold leading-tight tracking-tight">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

