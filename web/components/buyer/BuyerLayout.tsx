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
  LogOut,
  HelpCircle,
  Bookmark,
  FileText,
  Layers,
  Search,
  Scale,
  Gift,
  Wallet as WalletIcon,
  Bell,
  ClipboardList,
  MoreHorizontal,
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

type BuyerMobileTab = 'home' | 'shop' | 'orders' | 'saved' | 'more';

export default function BuyerLayout({ children }: BuyerLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cartCount, openDrawer } = useCart();
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
    { name: 'Notifications', href: '/buyer/notifications', icon: Bell },
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

  const buyerPath = (router.asPath || '/').split('?')[0];

  const buyerMobileTopTitle = () => {
    const p = router.pathname;
    if (p.startsWith('/buyer/products')) return 'Shop';
    if (p.startsWith('/buyer/orders')) return 'Orders';
    if (p.startsWith('/buyer/wishlist')) return 'Saved & Rewards';
    if (p.startsWith('/buyer/account') || p.startsWith('/buyer/profile')) return 'Account';
    if (p.startsWith('/buyer/cart')) return 'Cart';
    if (p.startsWith('/buyer/checkout')) return 'Checkout';
    return 'Carryofy';
  };

  const buyerMobileTab = (): BuyerMobileTab => {
    if (buyerPath === '/buyer') return 'home';
    if (
      buyerPath.startsWith('/buyer/products') ||
      buyerPath.startsWith('/buyer/categories') ||
      buyerPath.startsWith('/buyer/cart')
    )
      return 'shop';
    if (
      buyerPath.startsWith('/buyer/orders') ||
      buyerPath.startsWith('/buyer/track') ||
      buyerPath.startsWith('/buyer/disputes')
    )
      return 'orders';
    if (buyerPath.startsWith('/buyer/wishlist')) return 'saved';
    if (
      buyerPath.startsWith('/buyer/account') ||
      buyerPath.startsWith('/buyer/profile') ||
      buyerPath.startsWith('/buyer/notifications') ||
      buyerPath.startsWith('/buyer/quotes') ||
      buyerPath.startsWith('/buyer/bulk-order') ||
      buyerPath.startsWith('/buyer/referrals') ||
      buyerPath.startsWith('/buyer/wallet') ||
      buyerPath.startsWith('/buyer/help') ||
      buyerPath.startsWith('/buyer/feedback') ||
      buyerPath.startsWith('/buyer/preferences')
    )
      return 'more';
    return 'home';
  };

  const buyerTab = buyerMobileTab();
  const accountHref = user ? '/buyer/account' : '/auth/login?redirect=/buyer/account';

  const buyerMobileNav: { id: BuyerMobileTab; href: string; label: string; Icon: typeof Home }[] = [
    { id: 'home', href: '/buyer', label: 'Home', Icon: Home },
    { id: 'shop', href: '/buyer/products', label: 'Shop', Icon: ShoppingBag },
    { id: 'orders', href: '/buyer/orders', label: 'Orders', Icon: ClipboardList },
    { id: 'saved', href: '/buyer/wishlist', label: 'Saved', Icon: Bookmark },
    { id: 'more', href: accountHref, label: 'More', Icon: MoreHorizontal },
  ];

  const buyerInitials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <div className="flex min-h-screen flex-col bg-background font-inter max-lg:h-svh max-lg:min-h-0 max-lg:overflow-hidden max-lg:bg-[#0f1117]">
      <header className="sticky top-0 z-50 hidden safe-top shrink-0 border-b border-border-custom bg-background lg:block">
        <div className="flex items-center gap-4 px-3 py-3 sm:px-4 lg:px-8 sm:py-4">
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link href="/buyer" className="flex items-center gap-2">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                <Image
                  src="/logo.png"
                  alt="Carryofy"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <span className="text-lg font-bold text-primary sm:text-2xl">Carryofy</span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="mx-4 hidden max-w-xl flex-1 md:flex">
            <div className="flex flex-1 items-center rounded-lg border border-border-custom bg-card transition-colors focus-within:border-primary/50">
              <Search className="ml-3 h-4 w-4 shrink-0 text-foreground/50" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
                aria-label="Search products"
              />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              onClick={openDrawer}
              className="btn-mobile touch-target relative p-2 text-foreground/70 transition hover:text-foreground"
              aria-label={`Cart ${cartCount > 0 ? `(${cartCount} items)` : ''}`}
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-xs">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {mounted && user && <NotificationsDropdown className="relative" />}

            {mounted && !user && (
              <Link href="/auth/login" className="px-2 text-sm font-semibold text-primary hover:underline">
                Sign in
              </Link>
            )}

            {mounted && user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden max-w-[100px] truncate text-sm text-foreground md:block">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="btn-mobile touch-target p-2 text-foreground/70 transition hover:text-foreground"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-50 shrink-0 border-b border-white/[0.06] bg-[#0f1117] safe-top lg:hidden">
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4">
          <Link href="/buyer" className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0">
              <Image src="/logo.png" alt="Carryofy" width={36} height={36} className="h-full w-full object-contain" priority />
            </div>
            {router.pathname !== '/buyer' && (
              <span className="truncate text-base font-extrabold text-white">{buyerMobileTopTitle()}</span>
            )}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openDrawer}
              className="btn-mobile relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/[0.07] bg-[#1a1d27]"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingCart className="h-5 w-5 text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0f1117] bg-orange-500 px-1 text-[11px] font-bold leading-none text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            {mounted && user && <NotificationsDropdown className="relative" carryofyMobileShell />}
            <Link
              href={accountHref}
              className="btn-mobile flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-full border border-orange-500/50 bg-orange-500/20 text-xs font-bold text-orange-500"
              aria-label="More — profile, notifications, and settings"
            >
              {user ? buyerInitials.slice(0, 2) : '…'}
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border-custom bg-card lg:block">
          <div className="flex h-full flex-col">
            <nav className="safe-bottom flex-1 space-y-1 px-3 py-4 sm:space-y-2 sm:px-4 sm:py-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`btn-mobile touch-target flex items-center space-x-3 rounded-xl px-4 py-3 transition sm:py-3 ${
                      isActive(item.href)
                        ? 'bg-primary font-semibold text-black'
                        : 'text-foreground/70 hover:bg-background hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="relative max-lg:bg-[#0f1117] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth bg-background [-webkit-overflow-scrolling:touch]">
          <ErrorBoundary>
            <div className="relative p-3 max-lg:px-3 max-lg:pb-[calc(7rem+env(safe-area-inset-bottom))] max-lg:pt-3 sm:p-4 lg:p-6 xl:p-8">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-[55] flex shrink-0 border-t border-white/10 bg-[#13161f] px-1 pt-2 lg:hidden"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
        aria-label="Buyer primary navigation"
      >
        {buyerMobileNav.map(({ id, href, label, Icon }) => {
          const on = buyerTab === id;
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

      <CartDrawer />
    </div>
  );
}
