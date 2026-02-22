import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { useCategories } from '../../lib/buyer/hooks/useCategories';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';
import {
  Package,
  FileText,
  Bookmark,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  Layers,
  Sparkles,
  Wheat,
  Droplet,
  Flame,
  Coffee,
  Smartphone,
  Shirt,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Category slug to Lucide icon mapping (real icons, not generic box)
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cream: Sparkles,
  'beauty-personal-care': Sparkles,
  'personal-care': Sparkles,
  grains: Wheat,
  'grain-and-rice': Wheat,
  'grains-rice': Wheat,
  groceries: Wheat,
  oils: Droplet,
  packaged: Package,
  spices: Flame,
  beverages: Coffee,
  electronics: Smartphone,
  fashion: Shirt,
};

const getCategoryIcon = (slug: string) =>
  CATEGORY_ICONS[slug?.toLowerCase() || ''] || Package;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'];

// Transparent 1x1 placeholder for missing images (avoids external 404s)
const IMG_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const STATUS_COLORS: Record<string, string> = {
  Processing: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
  PROCESSING: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
  Shipped: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
  SHIPPED: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
  Delivered: 'bg-green-500/20 text-green-400 border-green-400/30',
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-400/30',
  Cancelled: 'bg-red-500/20 text-red-400 border-red-400/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-400/30',
  Pending: 'bg-gray-500/20 text-gray-400 border-gray-400/30',
  PENDING: 'bg-gray-500/20 text-gray-400 border-gray-400/30',
  CONFIRMED: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
  OUT_FOR_DELIVERY: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
};

function formatNgn(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface DashboardOrder {
  id: string;
  productName: string;
  productImage: string;
  date: string;
  status: string;
}

interface ReorderProduct {
  id: string;
  name: string;
  image: string;
  lastPrice: number;
}

interface RecommendedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingQuotes: 0,
    savedLists: 0,
    monthlySpend: 0,
    spendTrend: 'neutral' as 'up' | 'down' | 'neutral',
  });
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [reorderProducts, setReorderProducts] = useState<ReorderProduct[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];
  const displayCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 6); // Compact 6-column grid, show 6 only

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (!mounted || !tokenManager.isAuthenticated()) return;
    const fetchDashboard = async () => {
      setDashboardLoading(true);
      try {
        const [ordersRes, quotesRes, wishlistRes, productsRes] = await Promise.allSettled([
          apiClient.get('/orders'),
          apiClient.get('/quote-requests'),
          apiClient.get('/wishlist'),
          apiClient.get('/products?limit=8&sortBy=popular'),
        ]);

        const ordersData = ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.data || ordersRes.value.data) : null;
        const ordersList = ordersData?.orders ?? (Array.isArray(ordersData) ? ordersData : []);
        const activeOrders = ordersList.filter((o: { status: string }) => ACTIVE_ORDER_STATUSES.includes(o.status));
        const dashboardOrders: DashboardOrder[] = (ordersList as any[]).slice(0, 5).map((o: any) => {
          const firstItem = o.items?.[0];
          const product = firstItem?.product;
          return {
            id: o.id,
            productName: product?.title ?? 'Order',
            productImage: product?.images?.[0] ?? IMG_PLACEHOLDER,
            date: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '',
            status: o.status ?? 'PENDING',
          };
        });
        setOrders(dashboardOrders.length > 0 ? dashboardOrders : []);

        const quotesData = quotesRes.status === 'fulfilled' ? (quotesRes.value.data?.data ?? quotesRes.value.data) : null;
        const quotesList = Array.isArray(quotesData) ? quotesData : (quotesData?.quoteRequests ?? []);
        const pendingQuotes = quotesList.filter((q: { status: string }) =>
          ['PENDING', 'SUBMITTED', 'QUOTED'].includes(q.status)
        ).length;

        const wishlistPayload = wishlistRes.status === 'fulfilled' ? wishlistRes.value?.data : null;
        const wishlistData = wishlistPayload?.data ?? wishlistPayload;
        const savedLists = wishlistData?.total ?? (Array.isArray(wishlistData?.items) ? wishlistData.items.length : 0);

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        let monthlySpend = 0;
        let lastMonthSpend = 0;
        (ordersList as any[]).forEach((o: any) => {
          const total = o.totalAmount ?? o.totalAmountKobo ?? 0;
          const d = o.createdAt ? new Date(o.createdAt) : null;
          if (d && d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthlySpend += total;
          if (d && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) lastMonthSpend += total;
        });
        const spendTrend = lastMonthSpend === 0 ? (monthlySpend > 0 ? 'up' : 'neutral') : (monthlySpend >= lastMonthSpend ? 'up' : 'down');

        const reorderFromOrders = (ordersList as any[])
          .filter((o: any) => o.status === 'DELIVERED' && o.items?.length > 0)
          .flatMap((o: any) =>
            (o.items || []).map((item: any) => ({
              id: item.productId ?? item.product?.id,
              name: item.product?.title ?? 'Product',
              image: item.product?.images?.[0] ?? IMG_PLACEHOLDER,
              lastPrice: item.unitPrice ?? item.product?.price ?? 0,
            }))
          );
        const uniqueReorder = reorderFromOrders.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i).slice(0, 4);
        setReorderProducts(uniqueReorder.length > 0 ? uniqueReorder : []);

        const productsData = productsRes.status === 'fulfilled' ? (productsRes.value.data?.data || productsRes.value.data) : null;
        const productsList = productsData?.products ?? [];
        const rec: RecommendedProduct[] = (productsList as any[]).slice(0, 4).map((p: any) => ({
          id: p.id,
          name: p.title ?? 'Product',
          image: p.images?.[0] ?? IMG_PLACEHOLDER,
          price: p.price ?? 0,
        }));
        setRecommended(rec.length > 0 ? rec : []);

        setStats({
          activeOrders: activeOrders.length,
          pendingQuotes,
          savedLists,
          monthlySpend,
          spendTrend,
        });
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, [mounted]);

  const user = userManager.getUser();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const greeting = getGreeting();

  return (
    <>
      <Head>
        <title>Dashboard - Buyer | Carryofy</title>
        <meta name="description" content="Your Carryofy buyer dashboard." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div className="font-inter antialiased">
          {/* ZONE A — Smart Greeting Bar */}
          <div className="w-full rounded-xl bg-[#111111] border border-[#FF6B00]/20 px-4 py-6 sm:px-6 sm:py-8 mb-8">
            <h1 className="text-white text-2xl sm:text-3xl font-bold mb-1">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-[#ffcc99]/80 text-sm sm:text-base mb-6">
              Here&apos;s what&apos;s happening with your account today.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/buyer/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-black font-semibold rounded-lg hover:bg-[#ff8533] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Products
              </Link>
              <Link
                href="/buyer/bulk-order"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-[#FF6B00]/60 text-[#FF6B00] font-semibold rounded-lg hover:bg-[#FF6B00]/10 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Request a Quote
              </Link>
            </div>
          </div>

          {/* ZONE B — Activity Snapshot */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Link
              href="/buyer/orders"
              className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-4 sm:p-5 hover:border-[#FF6B00]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-[#FF6B00]" />
                <span className="text-[#FF6B00] text-sm font-medium">View →</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardLoading ? '—' : stats.activeOrders}</p>
              <p className="text-[#ffcc99]/70 text-sm">Active Orders</p>
            </Link>

            <Link
              href="/buyer/quotes"
              className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-4 sm:p-5 hover:border-[#FF6B00]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-[#FF6B00]" />
                <span className="text-[#FF6B00] text-sm font-medium">Review →</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardLoading ? '—' : stats.pendingQuotes}</p>
              <p className="text-[#ffcc99]/70 text-sm">Pending Quotes</p>
            </Link>

            <Link
              href="/buyer/wishlist"
              className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-4 sm:p-5 hover:border-[#FF6B00]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Bookmark className="w-5 h-5 text-[#FF6B00]" />
                <span className="text-[#FF6B00] text-sm font-medium">View →</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardLoading ? '—' : stats.savedLists}</p>
              <p className="text-[#ffcc99]/70 text-sm">Saved Lists</p>
            </Link>

            <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-[#FF6B00]" />
                {stats.spendTrend === 'up' && (
                  <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                )}
                {stats.spendTrend === 'down' && (
                  <span className="flex items-center gap-0.5 text-red-400 text-xs font-medium">
                    <ArrowDownRight className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardLoading ? '—' : formatNgn(stats.monthlySpend)}</p>
              <p className="text-[#ffcc99]/70 text-sm">Monthly Spend</p>
            </div>
          </div>

          {/* ZONE C — Recent Orders */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Recent Orders</h2>
              <Link
                href="/buyer/orders"
                className="text-[#FF6B00] text-sm font-medium hover:underline flex items-center gap-1"
              >
                View All Orders <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-8 sm:p-12 text-center">
                <Package className="w-14 h-14 text-[#FF6B00]/50 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">No orders yet</p>
                <p className="text-[#ffcc99]/70 text-sm mb-4">Start shopping to see your orders here.</p>
                <Link
                  href="/buyer/products"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-black font-semibold rounded-lg"
                >
                  <ShoppingBag className="w-4 h-4" /> Browse Products
                </Link>
              </div>
            ) : (
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] overflow-hidden">
                <div className="divide-y divide-[#2a2a2a]">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 hover:bg-[#1a1a1a]/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                          <Image
                            src={order.productImage}
                            alt={order.productName}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{order.productName}</p>
                          <p className="text-[#ffcc99]/60 text-sm">Order {order.id} · {order.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${
                            STATUS_COLORS[order.status] || STATUS_COLORS.Pending
                          }`}
                        >
                          {order.status}
                        </span>
                        <Link
                          href={`/buyer/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/10 rounded-lg transition-colors"
                        >
                          {['SHIPPED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'Shipped', 'Processing'].includes(order.status) ? 'Track' : 'View'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ZONE D — Quick Reorder */}
          <div className="mb-10">
            <h2 className="text-white text-xl font-bold mb-4">Order Again</h2>
            {reorderProducts.length === 0 ? (
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-8 text-center">
                <RotateCcw className="w-12 h-12 text-[#FF6B00]/50 mx-auto mb-3" />
                <p className="text-[#ffcc99]/70 text-sm">No previous orders to reorder from</p>
                <Link href="/buyer/products" className="inline-block mt-3 text-[#FF6B00] text-sm font-medium hover:underline">Browse Products</Link>
              </div>
            ) : (
            <div className="overflow-x-auto scrollbar-hide -mx-1">
              <div className="flex gap-4 pb-2 min-w-max">
                {reorderProducts.map((product) => (
                  <div
                    key={product.id}
                    className="w-[180px] sm:w-[200px] shrink-0 rounded-xl bg-[#111111] border border-[#2a2a2a] overflow-hidden hover:border-[#FF6B00]/40 transition-colors"
                  >
                    <div className="aspect-square relative bg-[#1a1a1a]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-2">{product.name}</p>
                      <p className="text-[#FF6B00] font-bold text-sm mb-3">{formatNgn(product.lastPrice)}</p>
                      <div className="flex gap-2">
                        <Link
                          href={`/buyer/products/${product.id}`}
                          className="flex-1 py-2 bg-[#FF6B00] text-black text-xs font-semibold rounded-lg hover:bg-[#ff8533] transition-colors text-center"
                        >
                          Reorder
                        </Link>
                        <Link
                          href="/buyer/bulk-order"
                          className="flex-1 py-2 border border-[#FF6B00]/60 text-[#FF6B00] text-xs font-semibold rounded-lg hover:bg-[#FF6B00]/10 transition-colors flex items-center justify-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" /> Add to Bulk
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* ZONE E — Browse Categories */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Browse Categories</h2>
              <Link
                href="/buyer/products"
                className="text-[#FF6B00] text-sm font-medium hover:underline flex items-center gap-1"
              >
                See All Categories <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-[#ffcc99]/60">Loading categories...</div>
              </div>
            ) : displayCategories.length === 0 ? (
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-8 text-center">
                <Package className="w-12 h-12 text-[#FF6B00]/50 mx-auto mb-3" />
                <p className="text-[#ffcc99]/70">No categories available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {displayCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.slug);
                  return (
                    <Link
                      key={cat.id}
                      href={`/buyer/products?category=${cat.slug}`}
                      className="group flex flex-col items-center rounded-xl bg-[#111111] border border-[#2a2a2a] p-4 hover:border-[#FF6B00]/40 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center mb-2 group-hover:bg-[#FF6B00]/20 transition-colors overflow-hidden shrink-0">
                        {cat.icon ? (
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${cat.icon})` }}
                          />
                        ) : (
                          <Icon className="w-6 h-6 text-[#FF6B00] shrink-0" />
                        )}
                      </div>
                      <span className="text-white text-xs font-medium text-center line-clamp-2">
                        {categoryDisplayName(cat.slug, cat.name)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ZONE F — Recommended For You */}
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Recommended For You</h2>
            <p className="text-[#ffcc99]/60 text-sm mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
              Based on your activity
            </p>
            {recommended.length === 0 ? (
              <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-8 text-center">
                <Sparkles className="w-12 h-12 text-[#FF6B00]/50 mx-auto mb-3" />
                <p className="text-[#ffcc99]/70 text-sm">Start shopping to get recommendations</p>
                <Link href="/buyer/products" className="inline-block mt-3 text-[#FF6B00] text-sm font-medium hover:underline">Browse Products</Link>
              </div>
            ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {recommended.map((p) => (
                <Link
                  key={p.id}
                  href={`/buyer/products/${p.id}`}
                  className="rounded-xl bg-[#111111] border border-[#2a2a2a] overflow-hidden hover:border-[#FF6B00]/40 transition-colors group"
                >
                  <div className="aspect-square relative bg-[#1a1a1a]">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-[#FF6B00] transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[#FF6B00] font-bold">{formatNgn(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}
