import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import BuyerDashboardPromoCarousel from '../../components/buyer/BuyerDashboardPromoCarousel';
import ShopProductCard, { ShopProductCardProduct } from '../../components/buyer/shop/ShopProductCard';
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
  Wallet,
  Laptop,
  Home,
  Gamepad2,
  HeartPulse,
  Dumbbell,
  PawPrint,
  Car,
  Briefcase,
  ShoppingBasket,
  Baby,
  Gem,
  Watch,
  ChevronDown,
  Store,
  Zap,
} from 'lucide-react';

type CategoryIcon = React.ComponentType<{ className?: string }>;

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
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
  fashion: Shirt,
  clothing: Shirt,
  apparel: Shirt,
  'electronics-gadgets': Smartphone,
  electronics: Smartphone,
  'computers-accessories': Laptop,
  computers: Laptop,
  'clothing-accessories': Shirt,
  'home-kitchen': Home,
  home: Home,
  kitchen: Home,
  'toys-games': Gamepad2,
  toys: Gamepad2,
  'health-household': HeartPulse,
  health: HeartPulse,
  household: HeartPulse,
  'sports-fitness': Dumbbell,
  sports: Dumbbell,
  fitness: Dumbbell,
  'pet-supplies': PawPrint,
  pets: PawPrint,
  pet: PawPrint,
  'automotive-tools': Car,
  automotive: Car,
  'office-school-supplies': Briefcase,
  office: Briefcase,
  school: Briefcase,
  'grocery-gourmet-food': ShoppingBasket,
  'grocery-gourmet': ShoppingBasket,
  gourmet: ShoppingBasket,
  'baby-products': Baby,
  baby: Baby,
  'jewelry-luxury-accessories': Gem,
  jewelry: Gem,
  luxury: Gem,
  'watches-premium-timepieces': Watch,
  watches: Watch,
  timepieces: Watch,
};

function getCategoryIconByText(haystack: string): CategoryIcon | null {
  const s = haystack.toLowerCase();
  if (/watches|timepiece/.test(s)) return Watch;
  if (/jewelry|luxury/.test(s)) return Gem;
  if (/\bbaby\b/.test(s) || /baby\s+product/.test(s)) return Baby;
  if (/grocery|gourmet/.test(s)) return ShoppingBasket;
  if (/office|school\s+suppl/.test(s) || /\boffice\b.*\bschool\b/.test(s)) return Briefcase;
  if (/automotive|car\s*&\s*tool|\btools?\b.*auto/.test(s)) return Car;
  if (/pet\s+suppl|\bpet\b/.test(s)) return PawPrint;
  if (/sports|fitness/.test(s)) return Dumbbell;
  if (/health|household/.test(s)) return HeartPulse;
  if (/beauty|personal\s+care|cosmetic/.test(s)) return Sparkles;
  if (/toys|games/.test(s)) return Gamepad2;
  if (/home|kitchen/.test(s)) return Home;
  if (/computers|computer|laptop|pc\b/.test(s)) return Laptop;
  if (/electronics|gadget/.test(s)) return Smartphone;
  if (/clothing|apparel|fashion/.test(s)) return Shirt;
  return null;
}

function getCategoryIcon(slug: string, name?: string): CategoryIcon {
  const key = (slug || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (key && CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  const fromName = getCategoryIconByText(`${key} ${name || ''}`);
  if (fromName) return fromName;
  return Package;
}

const ACTIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'];

const IMG_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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

function mapApiProductToShopCard(p: Record<string, unknown>): ShopProductCardProduct {
  const seller = (p.seller as Record<string, unknown>) || {};
  return {
    id: String(p.id),
    title: String(p.title ?? 'Product'),
    price: Number(p.price ?? 0),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    quantity: Number(p.quantity ?? 0),
    seller: {
      id: String(seller.id ?? ''),
      businessName: String(seller.businessName ?? ''),
      isVerified: seller.isVerified !== false,
    },
    keyFeatures: p.keyFeatures as string[] | undefined,
    moq: p.moq as number | undefined,
    requestQuoteOnly: p.requestQuoteOnly as boolean | undefined,
    priceTiers: p.priceTiers as ShopProductCardProduct['priceTiers'],
    fulfilledByCarryofy: true,
  };
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingQuotes: 0,
    savedLists: 0,
    monthlySpend: 0,
    spendTrend: 'neutral' as 'up' | 'down' | 'neutral',
  });
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [reorderProducts, setReorderProducts] = useState<ReorderProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ShopProductCardProduct[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<{ id: string; businessName: string }[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];
  const categoryStrip = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

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
        const [ordersRes, quotesRes, wishlistRes, productsRes, vendorsRes] = await Promise.allSettled([
          apiClient.get('/orders'),
          apiClient.get('/quote-requests'),
          apiClient.get('/wishlist'),
          apiClient.get('/products?limit=40&sortBy=popular'),
          apiClient.get('/sellers/vendors-for-shop'),
        ]);

        const ordersData =
          ordersRes.status === 'fulfilled' ? ordersRes.value.data?.data || ordersRes.value.data : null;
        const ordersList = ordersData?.orders ?? (Array.isArray(ordersData) ? ordersData : []);
        const activeOrders = ordersList.filter((o: { status: string }) =>
          ACTIVE_ORDER_STATUSES.includes(o.status)
        );
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

        const quotesData =
          quotesRes.status === 'fulfilled' ? quotesRes.value.data?.data ?? quotesRes.value.data : null;
        const quotesList = Array.isArray(quotesData) ? quotesData : quotesData?.quoteRequests ?? [];
        const pendingQuotes = quotesList.filter((q: { status: string }) =>
          ['PENDING', 'SUBMITTED', 'QUOTED'].includes(q.status)
        ).length;

        const wishlistPayload = wishlistRes.status === 'fulfilled' ? wishlistRes.value?.data : null;
        const wishlistData = wishlistPayload?.data ?? wishlistPayload;
        const savedLists =
          wishlistData?.total ?? (Array.isArray(wishlistData?.items) ? wishlistData.items.length : 0);

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
        const spendTrend =
          lastMonthSpend === 0
            ? monthlySpend > 0
              ? 'up'
              : 'neutral'
            : monthlySpend >= lastMonthSpend
              ? 'up'
              : 'down';

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
        const uniqueReorder = reorderFromOrders
          .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
          .slice(0, 4);
        setReorderProducts(uniqueReorder.length > 0 ? uniqueReorder : []);

        const productsData =
          productsRes.status === 'fulfilled' ? productsRes.value.data?.data || productsRes.value.data : null;
        const productsList = (productsData?.products ?? []) as Record<string, unknown>[];
        const featuredRaw = productsList.slice(0, 12);
        const recRaw = productsList.slice(12, 40);
        setFeaturedProducts(featuredRaw.map(mapApiProductToShopCard));
        const rec: RecommendedProduct[] = recRaw.map((p: any) => ({
          id: p.id,
          name: p.title ?? 'Product',
          image: p.images?.[0] ?? IMG_PLACEHOLDER,
          price: p.price ?? 0,
        }));
        setRecommended(rec.length > 0 ? rec : []);

        if (vendorsRes.status === 'fulfilled') {
          const raw = (vendorsRes.value.data as { data?: unknown })?.data ?? vendorsRes.value.data;
          const list = Array.isArray(raw) ? raw : [];
          setFeaturedVendors(
            (list as { id: string; businessName: string }[]).filter((v) => v.id && v.businessName).slice(0, 16)
          );
        } else {
          setFeaturedVendors([]);
        }

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

  const user = mounted ? userManager.getUser() : null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Shop Home | Carryofy Buyer</title>
        <meta name="description" content="Browse categories, deals, and vendors on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div className="font-inter antialiased">
          {/* 1 — Hero: admin promos or default brand banner */}
          <BuyerDashboardPromoCarousel />

          {/* 2 — Category strip */}
          <section className="mb-8" aria-label="Shop by category">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Categories</h2>
              <Link
                href="/buyer/products"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {categoriesLoading ? (
              <div className="py-6 text-center text-sm text-[#ffcc99]/60">Loading categories…</div>
            ) : categoryStrip.length === 0 ? (
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] py-8 text-center text-sm text-[#ffcc99]/70">
                Categories coming soon
              </div>
            ) : (
              <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                {categoryStrip.map((cat) => {
                  const Icon = getCategoryIcon(cat.slug, cat.name);
                  return (
                    <Link
                      key={cat.id}
                      href={`/buyer/products?category=${cat.slug}`}
                      className="group flex min-w-[76px] max-w-[88px] shrink-0 flex-col items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#111111] px-3 py-3 transition hover:border-primary/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a] transition group-hover:bg-primary/15">
                        <Icon className="h-6 w-6 text-primary" aria-hidden />
                      </div>
                      <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-white">
                        {categoryDisplayName(cat.slug, cat.name)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3 — Flash deals / featured products */}
          <section className="mb-10" aria-label="Featured products">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-xl font-bold text-white">Flash deals & featured</h2>
              </div>
              <Link href="/buyer/products?sortBy=popular" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {dashboardLoading ? (
              <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`sk-${i}`}
                    className="h-[280px] w-[200px] shrink-0 animate-pulse rounded-xl bg-[#1a1a1a] sm:w-[220px]"
                  />
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <p className="text-sm text-[#ffcc99]/60">No products to show yet.</p>
            ) : (
              <div className="-mx-1 overflow-x-auto pb-2 scrollbar-hide px-1">
                <div className="flex min-w-min gap-4">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="w-[200px] shrink-0 sm:w-[220px]">
                      <ShopProductCard product={product} href={`/buyer/products/${product.id}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 4 — Featured vendors */}
          {featuredVendors.length > 0 && (
            <section className="mb-10" aria-label="Featured vendors">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="text-xl font-bold text-white">Featured vendors</h2>
                </div>
                <Link href="/buyer/products" className="text-sm font-medium text-primary hover:underline">
                  Browse catalog
                </Link>
              </div>
              <div className="-mx-1 overflow-x-auto pb-2 scrollbar-hide px-1">
                <div className="flex min-w-min gap-3">
                  {featuredVendors.map((v) => (
                    <Link
                      key={v.id}
                      href={`/buyer/products?sellerId=${encodeURIComponent(v.id)}`}
                      className="flex min-w-[200px] max-w-[240px] shrink-0 flex-col rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 transition hover:border-primary/40"
                    >
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1a1a1a]">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <p className="line-clamp-2 font-semibold text-white">{v.businessName}</p>
                      <span className="mt-2 text-xs font-medium text-primary">Shop this vendor →</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 5 — Recommended for you */}
          <section className="mb-10" aria-label="Recommended products">
            <h2 className="mb-1 text-xl font-bold text-white">Recommended for you</h2>
            <p className="mb-4 flex items-center gap-2 text-sm text-[#ffcc99]/60">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Popular picks on Carryofy
            </p>
            {dashboardLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`rec-sk-${i}`} className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111]">
                    <div className="aspect-square animate-pulse bg-[#1a1a1a]" />
                    <div className="space-y-2 p-3 sm:p-4">
                      <div className="h-4 animate-pulse rounded bg-[#1a1a1a]" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-[#1a1a1a]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] py-12 text-center">
                <p className="text-[#ffcc99]/70">No recommendations yet.</p>
                <Link href="/buyer/products" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {recommended.map((p) => (
                  <Link
                    key={p.id}
                    href={`/buyer/products/${p.id}`}
                    className="group overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111] transition hover:border-primary/40"
                  >
                    <div className="relative aspect-square bg-[#1a1a1a]">
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="line-clamp-2 text-sm font-medium text-white group-hover:text-primary">{p.name}</p>
                      <p className="mt-1 font-bold text-primary">{formatNgn(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 6 — My activity (collapsible): stats, orders, reorder */}
          <section className="mb-8 rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d]" aria-label="My activity">
            <button
              type="button"
              onClick={() => setActivityOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6"
              aria-expanded={activityOpen}
            >
              <div>
                <h2 className="text-lg font-bold text-white">My activity</h2>
                <p className="mt-0.5 text-sm text-[#ffcc99]/70">
                  Orders, quotes, saved lists & spend — welcome back, {firstName}
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[#ffcc99] transition ${activityOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>

            {activityOpen && (
              <div className="space-y-10 border-t border-[#2a2a2a] px-4 pb-8 pt-6 sm:px-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="group flex min-h-[180px] flex-col rounded-xl border border-[#2a2a2a] bg-[#111111] transition-colors hover:border-primary/40">
                    <Link href="/buyer/orders" className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">View →</span>
                      </div>
                      <p className="mb-1 text-2xl font-bold text-white sm:text-3xl">
                        {dashboardLoading ? '—' : stats.activeOrders}
                      </p>
                      <p className="text-sm text-[#ffcc99]/70">Active orders</p>
                    </Link>
                    {!dashboardLoading && stats.activeOrders === 0 && (
                      <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3 sm:px-5">
                        <p className="text-xs text-[#ffcc99]/65">
                          No active orders —{' '}
                          <Link href="/buyer/products" className="font-medium text-primary hover:underline">
                            Browse products
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="group flex min-h-[180px] flex-col rounded-xl border border-[#2a2a2a] bg-[#111111] transition-colors hover:border-primary/40">
                    <Link href="/buyer/quotes" className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">Review →</span>
                      </div>
                      <p className="mb-1 text-2xl font-bold text-white sm:text-3xl">
                        {dashboardLoading ? '—' : stats.pendingQuotes}
                      </p>
                      <p className="text-sm text-[#ffcc99]/70">Pending quotes</p>
                    </Link>
                    {!dashboardLoading && stats.pendingQuotes === 0 && (
                      <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3 sm:px-5">
                        <p className="text-xs text-[#ffcc99]/65">
                          No pending quotes —{' '}
                          <Link href="/buyer/bulk-order" className="font-medium text-primary hover:underline">
                            Request a quote
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="group flex min-h-[180px] flex-col rounded-xl border border-[#2a2a2a] bg-[#111111] transition-colors hover:border-primary/40">
                    <Link href="/buyer/wishlist" className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <Bookmark className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">View →</span>
                      </div>
                      <p className="mb-1 text-2xl font-bold text-white sm:text-3xl">
                        {dashboardLoading ? '—' : stats.savedLists}
                      </p>
                      <p className="text-sm text-[#ffcc99]/70">Saved lists</p>
                    </Link>
                    {!dashboardLoading && stats.savedLists === 0 && (
                      <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3 sm:px-5">
                        <p className="text-xs text-[#ffcc99]/65">
                          Nothing saved —{' '}
                          <Link href="/buyer/products" className="font-medium text-primary hover:underline">
                            Browse products
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-[180px] flex-col rounded-xl border border-[#2a2a2a] bg-[#111111] transition-colors hover:border-primary/40">
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {!dashboardLoading && stats.monthlySpend > 0 && stats.spendTrend === 'up' && (
                          <span className="flex items-center gap-0.5 text-xs font-medium text-green-400">
                            <ArrowUpRight className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                        {!dashboardLoading && stats.monthlySpend > 0 && stats.spendTrend === 'down' && (
                          <span className="flex items-center gap-0.5 text-xs font-medium text-red-400">
                            <ArrowDownRight className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </div>
                      <p className="mb-1 text-2xl font-bold text-white sm:text-3xl">
                        {dashboardLoading ? '—' : formatNgn(stats.monthlySpend)}
                      </p>
                      <p className="text-sm text-[#ffcc99]/70">Monthly spend</p>
                    </div>
                    {!dashboardLoading && stats.monthlySpend === 0 && (
                      <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-3 sm:px-5">
                        <p className="text-xs text-[#ffcc99]/65">
                          Spend appears after you order —{' '}
                          <Link href="/buyer/products" className="font-medium text-primary hover:underline">
                            Browse products
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Recent orders</h3>
                    <Link
                      href="/buyer/orders"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      View all <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                  {orders.length === 0 ? (
                    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] py-8 text-center">
                      <Package className="mx-auto mb-3 h-12 w-12 text-primary/40" />
                      <p className="text-sm text-[#ffcc99]/70">No orders yet</p>
                      <Link
                        href="/buyer/products"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black"
                      >
                        <ShoppingBag className="h-4 w-4" /> Browse products
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111]">
                      <div className="divide-y divide-[#2a2a2a]">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="flex flex-col gap-4 p-4 transition hover:bg-[#1a1a1a]/50 sm:flex-row sm:items-center"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
                                <Image
                                  src={order.productImage}
                                  alt=""
                                  width={56}
                                  height={56}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">{order.productName}</p>
                                <p className="text-sm text-[#ffcc99]/60">
                                  Order {order.id} · {order.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                              <span
                                className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${
                                  STATUS_COLORS[order.status] || STATUS_COLORS.Pending
                                }`}
                              >
                                {order.status}
                              </span>
                              <Link
                                href={`/buyer/orders/${order.id}`}
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {['SHIPPED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'Shipped', 'Processing'].includes(
                                  order.status
                                )
                                  ? 'Track'
                                  : 'View'}
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {reorderProducts.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-white">Order again</h3>
                    <div className="-mx-1 overflow-x-auto pb-2 scrollbar-hide px-1">
                      <div className="flex min-w-min gap-4">
                        {reorderProducts.map((product) => (
                          <div
                            key={product.id}
                            className="w-[180px] shrink-0 sm:w-[200px]"
                          >
                            <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111] transition hover:border-primary/40">
                              <div className="relative aspect-square bg-[#1a1a1a]">
                                <Image
                                  src={product.image}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="200px"
                                />
                              </div>
                              <div className="p-3">
                                <p className="mb-2 line-clamp-2 text-sm font-medium text-white">{product.name}</p>
                                <p className="mb-3 text-sm font-bold text-primary">{formatNgn(product.lastPrice)}</p>
                                <div className="flex gap-2">
                                  <Link
                                    href={`/buyer/products/${product.id}`}
                                    className="flex-1 rounded-lg bg-primary py-2 text-center text-xs font-semibold text-black hover:opacity-90"
                                  >
                                    Reorder
                                  </Link>
                                  <Link
                                    href="/buyer/bulk-order"
                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-primary/60 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                                  >
                                    <Layers className="h-3.5 w-3.5" /> Bulk
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-wrap justify-center gap-4 pb-4">
            <Link
              href="/buyer/products"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-bold text-black shadow-lg transition hover:opacity-95"
            >
              <ShoppingBag className="h-5 w-5 shrink-0" />
              Browse all products
            </Link>
            <Link
              href="/buyer/bulk-order"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#2a2a2a] bg-[#111111] px-6 py-3 text-base font-bold text-white transition hover:border-primary/50"
            >
              <FileText className="h-5 w-5 shrink-0" />
              Request a quote
            </Link>
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}
