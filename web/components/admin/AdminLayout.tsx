import Link from 'next/link';
import { ReactNode, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import {
  DollarSign,
  FileBarChart2,
  HelpCircle,
  House,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import NotificationsDropdown from './NotificationsDropdown';
import { RealtimeProvider } from '../../lib/contexts/RealtimeContext';

interface AdminLayoutProps {
  children: ReactNode;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', href: '/admin', icon: House },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Sellers', href: '/admin/sellers', icon: Store },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Tag },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { name: 'Refunds', href: '/admin/refunds', icon: DollarSign },
  { name: 'Deliveries', href: '/admin/deliveries', icon: Truck },
  { name: 'Warehouse', href: '/admin/warehouse', icon: WarehouseIcon },
  { name: 'Payouts', href: '/admin/payouts', icon: DollarSign },
  { name: 'Finance', href: '/admin/finance', icon: FileBarChart2 },
  { name: 'Reports', href: '/admin/reports', icon: FileBarChart2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Support Center', href: '/admin/support', icon: HelpCircle },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return router.pathname === '/admin';
    return router.pathname.startsWith(href);
  };

  const currentPage = useMemo(() => {
    if (router.pathname === '/admin') {
      return NAV_ITEMS[0];
    }

    const matched = NAV_ITEMS.find((item) => item.href !== '/admin' && router.pathname.startsWith(item.href));
    if (matched) {
      return matched;
    }

    return NAV_ITEMS[0];
  }, [router.pathname]);

  const navContent = useMemo(
    () => (
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-[#1a1a1a] text-white shadow-[0_8px_18px_rgba(255,102,0,0.15)]'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-5 w-5 text-gray-500 group-hover:text-white" />
              {name}
            </Link>
          ))}
        </div>
      </nav>
    ),
    [sidebarOpen, router.asPath]
  );

  return (
    <RealtimeProvider enabled={true} interval={15000}>
      <div className="flex min-h-screen bg-[#090c11] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-[#12161f] bg-[#05070c] lg:flex">
        <div className="flex items-center gap-3 border-b border-[#12161f] px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#ff9955] text-sm font-semibold text-black">
            CF
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Carryofy Admin</p>
            <p className="text-xs text-gray-500">Control Center</p>
          </div>
        </div>
        {navContent}
        <div className="border-t border-[#12161f] px-6 py-6">
          <div className="flex items-center justify-between rounded-full border border-[#1f2432] px-4 py-2 text-xs font-medium text-gray-400">
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Live Mode
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">ON</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 z-40 w-72 flex-col border-r border-[#12161f] bg-[#05070c] transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-[#12161f] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#ff9955] text-sm font-semibold text-black">
              CF
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Carryofy Admin</p>
              <p className="text-xs text-gray-500">Control Center</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-full p-2 text-gray-400 transition hover:bg-[#131926] hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[#12161f] bg-[#090c11]/90 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-full border border-[#1f2432] p-2 text-gray-400 transition hover:border-primary hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-3 text-sm font-semibold text-gray-300 sm:flex">
              <span className="text-[#ff9955]">Carryofy</span>
              <span className="text-gray-600">/</span>
              <span>{currentPage?.name ?? 'Admin'}</span>
            </div>

            <div className="ml-auto flex flex-1 items-center gap-3 sm:ml-0 sm:gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="relative flex-1 max-w-xs rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2 text-left text-sm text-gray-500 hover:border-primary sm:max-w-md"
              >
                <span>Search across analytics, sellers, orders...</span>
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[#2a2a2a] bg-[#151515] px-2 py-0.5 text-xs">
                  ⌘K
                </kbd>
              </button>

              <div className="hidden sm:flex">
                <NotificationsDropdown />
              </div>
              <button className="hidden rounded-full border border-[#1f2432] p-2 text-gray-400 transition hover:border-primary hover:text-white sm:flex">
                <HelpCircle className="h-5 w-5" />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#ff9955] text-sm font-semibold text-black">
                AD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#090c11] pb-16">
          {children}
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </RealtimeProvider>
  );
}

