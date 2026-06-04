import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tokenManager } from '../../lib/auth';
import { sellerGet } from '../../lib/seller/http';
import { parseSellerOrdersList } from '../../lib/seller/orders';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  Clock,
  FileText,
  Building2,
  ArrowUpRight,
  LucideIcon,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  loading?: boolean;
  icon: LucideIcon;
  isRevenue?: boolean;
  href?: string;
}

function StatCard({ title, value, description, loading, icon: Icon, isRevenue, href }: StatCardProps) {
  const cardClass =
    'surface-card group flex flex-col gap-3.5 p-5 transition-all duration-200' +
    (isRevenue ? ' border-l-2 border-l-primary' : '') +
    (href ? ' hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated' : '');
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 -translate-x-1 text-foreground/30 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
        ) : null}
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-md bg-[var(--color-surface-2)]" />
      ) : (
        <p className="font-display text-3xl font-bold leading-none tracking-tight text-foreground tabular-nums">{value}</p>
      )}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">{title}</p>
        {description ? <p className="mt-1 text-xs leading-snug text-foreground/45">{description}</p> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}

interface DashboardKPIs {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  availableBalance: number;
  pendingPayoutRequestsCount: number;
  pendingPayoutRequestsTotal: number;
  pendingQuoteRequestsCount: number;
  b2bOrdersCount: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      if (!tokenManager.getAccessToken()) {
        setLoading(false);
        return;
      }

      const [
        dashboardData,
        payoutRequestsList,
        salesTrendData,
        orderDistributionData,
        productCountData,
        sellerStatsData,
        ordersB2BData,
      ] = await Promise.all([
        sellerGet<Record<string, unknown>>('/reports/dashboard'),
        sellerGet<unknown[]>('/payouts/requests'),
        sellerGet<Record<string, unknown>>('/reports/sales-trend'),
        sellerGet<Record<string, unknown>>('/reports/order-distribution'),
        sellerGet<Record<string, unknown>>('/reports/seller-product-count'),
        sellerGet<Record<string, unknown>>('/sellers/me/stats'),
        sellerGet<unknown>('/orders?orderType=B2B'),
      ]);

      if (!dashboardData) {
        console.warn('[DashboardStats] Dashboard KPIs request failed');
      }

      // Number(undefined) is NaN (not null), so `?? 0` never fires — guard with isFinite.
      const finite = (...vals: unknown[]): number => {
        for (const v of vals) {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return 0;
      };
      const pendingQuoteRequestsCount = finite(
        sellerStatsData?.pendingQuoteRequestsCount,
      );
      const b2bOrders = parseSellerOrdersList(ordersB2BData);
      const b2bOrdersCount = b2bOrders.length;

      type PayoutRequestRow = { status?: string; amount?: number };
      const payoutList: PayoutRequestRow[] = Array.isArray(payoutRequestsList)
        ? (payoutRequestsList as PayoutRequestRow[])
        : [];

      const availableBalance =
        Number(dashboardData?.sellerAvailableBalanceKobo) ||
        Number(dashboardData?.availableBalance) ||
        0;

      const pendingRequestStatuses = new Set(['REQUESTED', 'APPROVED', 'PROCESSING']);
      const pendingPayoutRequests = payoutList.filter((r) =>
        pendingRequestStatuses.has(r.status ?? ''),
      );
      const pendingPayoutRequestsCount = pendingPayoutRequests.length;
      const pendingPayoutRequestsTotal = pendingPayoutRequests.reduce(
        (sum, r) => sum + (r.amount || 0),
        0,
      );

      const totalProducts = finite(
        productCountData?.count,
        dashboardData?.totalProducts,
      );

      const totalOrders = finite(
        orderDistributionData?.total,
        dashboardData?.totalOrders,
      );
      const totalRevenue = finite(
        dashboardData?.totalRevenue,
        salesTrendData?.totalSales,
      );

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        availableBalance,
        pendingPayoutRequestsCount,
        pendingPayoutRequestsTotal,
        pendingQuoteRequestsCount,
        b2bOrdersCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  const compactVal = (v: string) =>
    loading ? (
      <div className="h-5 w-16 animate-pulse rounded bg-white/10" />
    ) : (
      <span className="font-display text-lg font-bold leading-none text-foreground tabular-nums">{v}</span>
    );

  const MobileStat = ({
    icon: Icon,
    value,
    label,
    span,
  }: {
    icon: LucideIcon;
    value: string;
    label: string;
    span?: boolean;
  }) => (
    <div className={`surface-card p-3 ${span ? 'col-span-2' : ''}`}>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      {compactVal(value)}
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/50">{label}</p>
    </div>
  );

  return (
    <>
    {/* Mobile stat grid */}
    <div className="grid grid-cols-2 gap-2.5 reveal-stagger lg:hidden">
      <MobileStat icon={Package} value={stats ? stats.totalProducts.toString() : '0'} label="Total products" />
      <MobileStat icon={ShoppingCart} value={stats ? stats.totalOrders.toString() : '0'} label="Total orders" />
      <MobileStat icon={DollarSign} value={stats ? formatPrice(stats.totalRevenue) : '₦0.00'} label="Total revenue" />
      <MobileStat icon={Wallet} value={stats ? formatPrice(stats.availableBalance) : '₦0.00'} label="Available balance" />
      <MobileStat icon={Clock} value={stats ? stats.pendingPayoutRequestsCount.toString() : '0'} label="Pending payouts" />
      <MobileStat icon={FileText} value={stats ? stats.pendingQuoteRequestsCount.toString() : '0'} label="Quote requests" />
      <MobileStat icon={Building2} value={stats ? stats.b2bOrdersCount.toString() : '0'} label="B2B orders" span />
    </div>

    {/* Desktop stat cards */}
    <div className="hidden gap-4 reveal-stagger lg:grid lg:grid-cols-4">
      <StatCard
        title="Total Products"
        value={stats ? stats.totalProducts.toString() : '0'}
        loading={loading}
        icon={Package}
        href="/seller/products"
      />
      <StatCard
        title="Total Orders"
        value={stats ? stats.totalOrders.toString() : '0'}
        loading={loading}
        icon={ShoppingCart}
        href="/seller/orders"
      />
      <StatCard
        title="Total Revenue"
        value={stats ? formatPrice(stats.totalRevenue) : '₦0.00'}
        loading={loading}
        icon={DollarSign}
        isRevenue
      />
      <StatCard
        title="Available Balance"
        value={stats ? formatPrice(stats.availableBalance) : '₦0.00'}
        loading={loading}
        icon={Wallet}
        href="/seller/earnings"
      />
      <StatCard
        title="Pending Payouts"
        value={stats ? stats.pendingPayoutRequestsCount.toString() : '0'}
        description={
          stats && stats.pendingPayoutRequestsTotal > 0
            ? `${formatPrice(stats.pendingPayoutRequestsTotal)} awaiting`
            : undefined
        }
        loading={loading}
        icon={Clock}
        href="/seller/earnings"
      />
      <StatCard
        title="Quote Requests"
        value={stats ? stats.pendingQuoteRequestsCount.toString() : '0'}
        loading={loading}
        icon={FileText}
        href="/seller/quotes"
      />
      <StatCard
        title="B2B Orders"
        value={stats ? stats.b2bOrdersCount.toString() : '0'}
        loading={loading}
        icon={Building2}
        href="/seller/orders?orderType=B2B"
      />
    </div>
    </>
  );
}
