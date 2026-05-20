import Link from 'next/link';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import {
  LayoutDashboard,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  Menu,
  LogOut,
  Coffee,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { fetchFleetIncomingDeliveries } from '../../lib/api/fleet';

const NAV = [
  { href: '/fleet', label: 'Overview', icon: LayoutDashboard },
  { href: '/fleet/riders', label: 'Riders', icon: Users },
  { href: '/fleet/break-requests', label: 'Break requests', icon: Coffee },
  { href: '/fleet/deliveries/incoming', label: 'Incoming', icon: Inbox, badge: true },
  { href: '/fleet/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/fleet/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/fleet/payouts', label: 'Payouts', icon: CreditCard },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  on,
  onNavigate,
  badgeCount,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  on: boolean;
  onNavigate?: () => void;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        on
          ? 'bg-orange-500/15 text-orange-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badgeCount != null && badgeCount > 0 && (
        <span className="min-w-[1.25rem] rounded-full bg-[#F97316] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  );
}

export default function FleetLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: incoming = [] } = useSWR(
    isAuthenticated && user?.role === 'FLEET_OPERATOR'
      ? ['fleet-deliveries-incoming']
      : null,
    fetchFleetIncomingDeliveries,
    { refreshInterval: 60_000 },
  );
  const incomingCount = incoming.length;

  const isActive = (href: string) => {
    if (href === '/fleet') return router.pathname === '/fleet';
    if (href === '/fleet/deliveries') {
      return (
        router.pathname === '/fleet/deliveries' ||
        (router.pathname.startsWith('/fleet/deliveries') &&
          !router.pathname.includes('/incoming'))
      );
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#090c11] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#090c11]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/fleet" className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="Carryofy" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-semibold text-white">Fleet</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="hidden sm:inline">{user?.name}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-b border-zinc-800 px-4 py-3 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  on={isActive(item.href)}
                  onNavigate={() => setOpen(false)}
                  badgeCount={'badge' in item && item.badge ? incomingCount : undefined}
                />
              ))}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1 rounded-xl border border-zinc-800 bg-[#0f1218] p-3">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                on={isActive(item.href)}
                badgeCount={'badge' in item && item.badge ? incomingCount : undefined}
              />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
