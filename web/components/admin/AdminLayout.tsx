import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import clsx from 'clsx';
import {
  HelpCircle,
  Menu,
  Store,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import AdminBreadcrumbs from './AdminBreadcrumbs';
import NotificationsDropdown from './NotificationsDropdown';
import { RealtimeProvider } from '../../lib/contexts/RealtimeContext';
import { useAuth } from '../../lib/auth/context';
import { fetchUnacknowledgedSosCount } from '../../lib/admin/api';
import {
  ADMIN_NAV_FLAT,
  ADMIN_NAV_GROUPS,
  type AdminNavItem,
} from '../../lib/admin/adminNavConfig';
import { canAccessAdminRoute } from '../../lib/admin/adminPermissions';
import { useAdminProfile } from '../../lib/admin/hooks/useAdminProfile';
import AdminPermissionGate from './AdminPermissionGate';

const NAV_EXPANDED_KEY = 'carryofy-admin-nav-expanded-v1';

function readNavExpanded(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(NAV_EXPANDED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

interface AdminLayoutProps {
  children: ReactNode;
}

function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href === '/admin/settings') {
    return pathname === '/admin/settings';
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setGroupExpanded(readNavExpanded());
  }, []);

  const persistExpanded = useCallback((next: Record<string, boolean>) => {
    setGroupExpanded(next);
    try {
      localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const canFetchAdminData = isAuthenticated && !authLoading;
  const { data: adminProfile, isLoading: adminProfileLoading } = useAdminProfile();
  const adminTier = adminProfile?.adminRole;

  const visibleNavGroups = useMemo(() => {
    return ADMIN_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminRoute(item.href, adminTier)),
    })).filter((group) => group.items.length > 0);
  }, [adminTier]);
  const { data: safetySosBadge = 0 } = useSWR(
    router.pathname.startsWith('/admin') && canFetchAdminData ? 'safety-sos-badge' : null,
    fetchUnacknowledgedSosCount,
    { refreshInterval: canFetchAdminData ? 30000 : 0, dedupingInterval: 5000 },
  );

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

  const isGroupOpen = useCallback(
    (groupId: string) => {
      if (groupExpanded[groupId] === undefined) return true;
      return groupExpanded[groupId] === true;
    },
    [groupExpanded],
  );

  const toggleGroup = (groupId: string) => {
    const open = isGroupOpen(groupId);
    persistExpanded({ ...groupExpanded, [groupId]: !open });
  };

  const currentPage = useMemo(() => {
    if (router.pathname === '/admin') {
      return ADMIN_NAV_FLAT[0];
    }

    const candidates = ADMIN_NAV_FLAT.filter((item) => isNavItemActive(item, router.pathname));
    const matched = candidates.sort((a, b) => b.href.length - a.href.length)[0];
    if (matched) {
      return matched;
    }

    return ADMIN_NAV_FLAT[0];
  }, [router.pathname]);

  const handleLogout = () => {
    logout();
  };

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      <div className="space-y-4">
        {visibleNavGroups.map((group) => {
          const open = isGroupOpen(group.id);
          const hasActive = group.items.some((item) => isNavItemActive(item, router.pathname));
          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  hasActive ? 'text-primary' : 'text-gray-500 hover:text-gray-300',
                )}
                aria-expanded={open}
              >
                <ChevronDown
                  className={clsx(
                    'h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform',
                    !open && '-rotate-90',
                  )}
                />
                <span className="min-w-0 truncate">{group.label}</span>
              </button>
              {open ? (
                <div className="space-y-0.5 border-l border-border-custom/60 pl-2 ml-1.5">
                  {group.items.map((item) => {
                    const { name, href, icon: Icon } = item;
                    const active = isNavItemActive(item, router.pathname);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={clsx(
                          'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-border-custom text-foreground shadow-[0_6px_16px_rgba(255,107,0,0.12)]'
                            : 'text-gray-400 hover:bg-border-custom/50 hover:text-foreground',
                        )}
                        onClick={onNavigate}
                      >
                        <Icon
                          className={clsx(
                            'h-[18px] w-[18px] shrink-0',
                            active ? 'text-primary' : 'text-gray-500 group-hover:text-foreground',
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">{name}</span>
                        {href === '/admin/safety' && safetySosBadge > 0 ? (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                            {safetySosBadge > 99 ? '99+' : safetySosBadge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );

  const footer = (opts?: { mobile?: boolean }) => (
    <div
      className={clsx(
        'shrink-0 border-t border-border-custom px-4 py-5',
        opts?.mobile ? 'space-y-3' : 'space-y-4',
      )}
    >
      {!opts?.mobile ? (
        <div className="flex items-center justify-between rounded-full border border-border-custom px-3 py-2 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Live mode
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">On</span>
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-border-custom hover:text-red-400"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </div>
  );

  return (
    <RealtimeProvider enabled={true} interval={15000}>
      <div className="flex min-h-screen bg-background font-inter text-foreground antialiased">
        <aside className="fixed inset-y-0 left-0 z-20 hidden h-screen w-70 flex-col border-r border-sidebar-border bg-sidebar-bg lg:flex">
          <div className="flex shrink-0 items-center gap-3 border-b border-border-custom px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-light text-sm font-semibold text-black">
              CF
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight font-heading">Carryofy Admin</p>
              <p className="text-xs text-gray-500">Operations</p>
            </div>
          </div>
          {renderNavLinks()}
          {footer()}
        </aside>

        <div
          className={clsx(
            'fixed inset-y-0 left-0 z-40 flex h-screen w-70 flex-col border-r border-sidebar-border bg-sidebar-bg transition-transform duration-200 lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border-custom px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-light text-sm font-semibold text-black">
                CF
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold font-heading">Carryofy Admin</p>
                <p className="text-xs text-gray-500">Operations</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-2 text-gray-400 transition hover:bg-border-custom hover:text-foreground"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {renderNavLinks(() => setSidebarOpen(false))}
          {footer({ mobile: true })}
        </div>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            aria-label="Close menu overlay"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <div className="flex flex-1 flex-col lg:ml-70">
          <header className="sticky top-0 z-20 border-b border-border-custom bg-background/90 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-border-custom p-2 text-gray-400 transition hover:border-primary hover:text-foreground lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 items-center gap-2 text-sm font-medium text-gray-400 sm:flex">
                <span className="text-primary-light">Carryofy</span>
                <span className="text-gray-600">/</span>
                <span className="truncate text-foreground font-heading">{currentPage?.name ?? 'Admin'}</span>
              </div>

              <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:ml-0 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="relative max-w-md flex-1 rounded-xl border border-border-custom bg-card px-3 py-2 text-left text-sm text-gray-500 transition hover:border-primary/50"
                >
                  <span className="hidden sm:inline">Search sellers, orders, products…</span>
                  <span className="sm:hidden">Search…</span>
                  <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border-custom bg-background px-1.5 py-0.5 text-[10px] text-gray-500 sm:inline">
                    ⌘K
                  </kbd>
                </button>

                <div className="hidden sm:flex">
                  <NotificationsDropdown />
                </div>

                <Link
                  href="/admin/support"
                  className="hidden rounded-xl border border-border-custom p-2 text-gray-400 transition hover:border-primary hover:text-foreground sm:flex"
                  title="Support Center"
                  aria-label="Support Center"
                >
                  <HelpCircle className="h-5 w-5" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-xl border border-border-custom p-2 text-gray-400 transition hover:border-red-500/40 hover:text-red-400 sm:flex"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-light text-xs font-semibold text-black">
                  AD
                </div>
              </div>
            </div>
          </header>

          <AdminBreadcrumbs />

          <main className="flex-1 overflow-y-auto bg-background">
            <AdminPermissionGate adminRole={adminTier} isRoleLoading={adminProfileLoading}>
              {children}
            </AdminPermissionGate>
          </main>
        </div>

        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </RealtimeProvider>
  );
}
