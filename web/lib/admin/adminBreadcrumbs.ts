import type { ParsedUrlQuery } from 'querystring';

export type BreadcrumbItem = { label: string; href?: string };

const STATIC_LABELS: Record<string, string> = {
  analytics: 'Analytics',
  sharing: 'Sharing',
  customers: 'Customers',
  sellers: 'Sellers',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  'quote-requests': 'Quote requests',
  reviews: 'Reviews',
  refunds: 'Refunds',
  disputes: 'Disputes',
  deliveries: 'Deliveries',
  delivery: 'Deliveries',
  'riders-kyc': 'Rider KYC',
  'rider-break-requests': 'Rider break requests',
  fleet: 'Fleet operators',
  safety: 'Safety Center',
  dispatch: 'Dispatch',
  'delivery-exceptions': 'Delivery exceptions',
  locations: 'Locations',
  warehouse: 'Warehouse',
  payouts: 'Payouts',
  finance: 'Finance',
  reports: 'Reports',
  banners: 'Banners',
  broadcast: 'Broadcast',
  'broadcast-history': 'Broadcast history',
  settings: 'Settings',
  'audit-log': 'Audit log',
  feedback: 'Feedback',
  support: 'Support Center',
};

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function labelForSegment(seg: string, parentSeg: string | undefined): string {
  if (STATIC_LABELS[seg]) return STATIC_LABELS[seg];
  if (isUuidLike(seg) || (seg.length >= 8 && /^[a-z0-9-]+$/i.test(seg))) {
    if (parentSeg === 'quote-requests') return 'Quote detail';
    if (parentSeg === 'fleet') return 'Operator detail';
    return 'Details';
  }
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Builds breadcrumbs for admin routes. Dashboard (`/admin` only) returns [].
 */
export function getAdminBreadcrumbs(pathname: string, query: ParsedUrlQuery): BreadcrumbItem[] {
  const norm = pathname.replace(/\/$/, '') || '/admin';
  if (norm === '/admin') {
    return [];
  }

  const crumbs: BreadcrumbItem[] = [{ label: 'Overview', href: '/admin' }];
  const rest = norm.replace(/^\/admin\/?/, '').split('/').filter(Boolean);

  if (rest.length === 0) {
    return crumbs;
  }

  /** Combined segments for a single crumb (e.g. sharing/analytics). */
  let i = 0;
  while (i < rest.length) {
    if (rest[i] === 'sharing' && rest[i + 1] === 'analytics') {
      crumbs.push({ label: 'Sharing analytics' });
      i += 2;
      continue;
    }

    const seg = rest[i];
    const parentSeg = i > 0 ? rest[i - 1] : undefined;
    const built = `/admin/${rest.slice(0, i + 1).join('/')}`;
    const isLast = i === rest.length - 1;
    let label = labelForSegment(seg, parentSeg);

    crumbs.push({
      label,
      href: isLast ? undefined : built,
    });
    i += 1;
  }

  const id = typeof query.id === 'string' ? query.id : undefined;
  if (id && norm.includes('/quote-requests/')) {
    const last = crumbs[crumbs.length - 1];
    if (last && (last.label === 'Quote detail' || last.label === 'Details')) {
      crumbs[crumbs.length - 1] = { label: `Quote ${id.slice(0, 8)}…` };
    }
  }

  return crumbs;
}
