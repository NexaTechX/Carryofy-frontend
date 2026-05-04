import Link from 'next/link';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

const NAV = [
  { href: '/fleet', label: 'Overview', icon: LayoutDashboard },
  { href: '/fleet/riders', label: 'Riders', icon: Users },
  { href: '/fleet/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/fleet/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/fleet/payouts', label: 'Payouts', icon: CreditCard },
];

export default function FleetLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/fleet'
      ? router.pathname === '/fleet'
      : router.pathname.startsWith(href);

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
              {NAV.map((item) => {
                const Icon = item.icon;
                const on = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      on ? 'bg-orange-500/15 text-orange-400' : 'text-zinc-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1 rounded-xl border border-zinc-800 bg-[#0f1218] p-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              const on = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    on
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
