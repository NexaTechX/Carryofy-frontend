import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Star,
  HelpCircle,
  MessageSquare,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';
import SellerLayout from '../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../lib/auth';
import { getApiBaseUrl } from '../../lib/api/utils';

interface SellerProfile {
  businessName: string;
  pickupAddress?: string;
}

export default function SellerMorePage() {
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    const load = async () => {
      try {
        const token = tokenManager.getAccessToken();
        if (!token) return;
        const res = await fetch(`${getApiBaseUrl()}/sellers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          const d = result.data || result;
          setProfile({
            businessName: d.businessName ?? 'Your store',
            pickupAddress: d.pickupAddress,
          });
        }
      } catch {
        /* ignore */
      }
    };
    load();
  }, [router, isLoading, isAuthenticated, user]);

  const initials =
    profile?.businessName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') ||
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') ||
    'U';

  if (isLoading || !isAuthenticated || !user) return null;

  return (
    <>
      <Head>
        <title>More | Seller Portal | Carryofy</title>
      </Head>
      <SellerLayout>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2.5 lg:gap-6">
          {/* Mobile — Carryofy mobile nav reference */}
          <div className="space-y-2.5 lg:hidden">
            <Link
              href="/seller/settings"
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5"
            >
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/20 text-sm font-bold text-orange-500">
                {initials.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white">
                  {profile?.businessName ?? 'Your store'}
                </p>
                {profile?.pickupAddress ? (
                  <p className="mt-0.5 truncate text-[9px] text-gray-500">{profile.pickupAddress}</p>
                ) : null}
              </div>
              <ChevronRight className="h-[13px] w-[13px] shrink-0 text-gray-600" />
            </Link>

            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1d27]">
              {[
                { href: '/seller/reviews', icon: Star, name: 'Reviews', sub: 'Customer feedback' },
                { href: '/seller/help', icon: HelpCircle, name: 'Help & Support', sub: 'Get assistance' },
                { href: '/seller/feedback', icon: MessageSquare, name: 'Feedback', sub: 'Share your thoughts' },
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
              <Link
                href="/seller/notifications"
                className="flex items-center justify-between px-2.5 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                  <div>
                    <p className="text-[11px] text-white">Notifications</p>
                    <p className="mt-0.5 text-[8px] text-gray-500">Alerts</p>
                  </div>
                </div>
                <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
              </Link>
              <Link
                href="/seller/settings?tab=security"
                className="flex items-center justify-between border-t border-white/[0.03] px-2.5 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                  <div>
                    <p className="text-[11px] text-white">Security</p>
                    <p className="mt-0.5 text-[8px] text-gray-500">Account security</p>
                  </div>
                </div>
                <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
              </Link>
              <div className="border-t border-white/[0.03] px-2.5 py-2.5">
                <Link
                  href="/seller/settings"
                  className="mb-2 flex items-center justify-between rounded-lg py-1"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                    <span className="text-[11px] text-white">Settings</span>
                  </div>
                  <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
                </Link>
                <Link href="/seller/quotes" className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                    <span className="text-[11px] text-white">Quotes</span>
                  </div>
                  <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
                </Link>
                <Link href="/seller/analytics" className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-[17px] w-[18px] shrink-0 text-orange-500" />
                    <span className="text-[11px] text-white">Analytics</span>
                  </div>
                  <ChevronRight className="h-[11px] w-[11px] text-gray-600" />
                </Link>
              </div>
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

          {/* Desktop — compact redirect list */}
          <div className="hidden lg:block space-y-4">
            <p className="text-2xl font-bold text-white">More</p>
            <p className="text-sm text-foreground/70">
              Use the sidebar for all seller tools. On mobile, this page mirrors the quick links from the app shell.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-primary">
              <li>
                <Link href="/seller/settings" className="hover:underline">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/seller/reviews" className="hover:underline">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/seller/help" className="hover:underline">
                  Help
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}
