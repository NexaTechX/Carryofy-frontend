import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Bell,
  MapPin,
  FileText,
  Building2,
  Gift,
  Star,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { useAuth } from '../../lib/auth';

export default function BuyerAccountHubPage() {
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/auth/login?redirect=/buyer/account');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const initials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'U';

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Account | Carryofy Buyer</title>
      </Head>
      <BuyerLayout>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2.5 lg:gap-8">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-white">Account</h1>
            <p className="mt-1 text-sm text-foreground/70">Manage your profile, orders, and preferences.</p>
          </div>

          <div className="space-y-2.5 lg:hidden">
            <Link
              href="/buyer/profile"
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5"
            >
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/20 text-sm font-bold text-orange-500">
                {initials.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white">{user.name}</p>
                {user.email ? (
                  <p className="mt-0.5 truncate text-[9px] text-gray-500">{user.email}</p>
                ) : null}
              </div>
              <ChevronRight className="h-[13px] w-[13px] shrink-0 text-gray-600" />
            </Link>

            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1d27]">
              {[
                { href: '/buyer/notifications', icon: Bell, name: 'Notifications', sub: 'Alerts & order updates' },
                { href: '/buyer/profile', icon: MapPin, name: 'Saved addresses', sub: 'Delivery locations' },
                { href: '/buyer/quotes', icon: FileText, name: 'My Quotes', sub: 'Pending quote requests' },
                { href: '/buyer/bulk-order', icon: Building2, name: 'Bulk Order', sub: 'B2B order management' },
              ].map((row, i) => {
                const RowIcon = row.icon;
                return (
                  <Link
                    key={row.href}
                    href={row.href}
                    className={`flex items-center justify-between px-2.5 py-2.5 ${i > 0 ? 'border-t border-white/[0.03]' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <RowIcon className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                      <div>
                        <p className="text-[11px] text-white">{row.name}</p>
                        <p className="mt-0.5 text-[8px] text-gray-500">{row.sub}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
                  </Link>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1d27]">
              {[
                { href: '/buyer/referrals', icon: Gift, name: 'Referrals', sub: 'Invite & earn' },
                { href: '/buyer/wallet', icon: Star, name: 'Rewards', sub: 'Points & benefits' },
                { href: '/buyer/disputes', icon: ShieldCheck, name: 'Disputes', sub: 'Report an issue' },
                { href: '/buyer/help', icon: HelpCircle, name: 'Help', sub: 'Get support' },
              ].map((row, i) => {
                const RowIcon = row.icon;
                return (
                  <Link
                    key={row.href}
                    href={row.href}
                    className={`flex items-center justify-between px-2.5 py-2.5 ${i > 0 ? 'border-t border-white/[0.03]' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <RowIcon className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                      <div>
                        <p className="text-[11px] text-white">{row.name}</p>
                        <p className="mt-0.5 text-[8px] text-gray-500">{row.sub}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 border-t border-white/[0.03] px-2.5 py-2.5 text-left"
              >
                <LogOut className="h-[17px] w-[18px] shrink-0 text-red-500" />
                <span className="text-[11px] font-medium text-red-500">Sign out</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: '/buyer/profile', label: 'Profile & addresses' },
              { href: '/buyer/wishlist', label: 'Saved lists' },
              { href: '/buyer/bulk-order', label: 'Bulk order' },
              { href: '/buyer/quotes', label: 'Quotes' },
              { href: '/buyer/wallet', label: 'Rewards wallet' },
              { href: '/buyer/referrals', label: 'Referrals' },
              { href: '/buyer/disputes', label: 'Disputes' },
              { href: '/buyer/notifications', label: 'Notifications' },
              { href: '/buyer/help', label: 'Help' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-border-custom bg-card p-4 transition hover:border-primary/40"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}
