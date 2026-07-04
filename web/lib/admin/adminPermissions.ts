/** Admin permission tiers — must match Prisma AdminRole enum on the API. */
export type AdminTier = 'SUPER_ADMIN' | 'OPS' | 'FINANCE' | 'SUPPORT';

/** Nav routes restricted to these tiers. SUPER_ADMIN always passes. Unlisted routes: all tiers. */
const ROUTE_TIER_REQUIREMENTS: Record<string, AdminTier[]> = {
  '/admin/settings': ['SUPER_ADMIN'],
  '/admin/payouts': ['SUPER_ADMIN', 'FINANCE'],
  '/admin/finance': ['SUPER_ADMIN', 'FINANCE'],
  '/admin/reports': ['SUPER_ADMIN', 'FINANCE'],
  '/admin/refunds': ['SUPER_ADMIN', 'FINANCE'],
  '/admin/orders': ['SUPER_ADMIN', 'OPS', 'FINANCE', 'SUPPORT'],
  '/admin/sellers': ['SUPER_ADMIN', 'OPS', 'SUPPORT'],
  '/admin/products': ['SUPER_ADMIN', 'OPS'],
  '/admin/riders-kyc': ['SUPER_ADMIN', 'OPS'],
  '/admin/deliveries': ['SUPER_ADMIN', 'OPS'],
  '/admin/dispatch': ['SUPER_ADMIN', 'OPS'],
  '/admin/delivery-exceptions': ['SUPER_ADMIN', 'OPS'],
  '/admin/warehouse': ['SUPER_ADMIN', 'OPS'],
  '/admin/fleet': ['SUPER_ADMIN', 'OPS', 'FINANCE'],
  '/admin/disputes': ['SUPER_ADMIN', 'SUPPORT'],
  '/admin/support': ['SUPER_ADMIN', 'SUPPORT'],
  '/admin/reviews': ['SUPER_ADMIN', 'SUPPORT'],
  '/admin/feedback': ['SUPER_ADMIN', 'SUPPORT'],
  '/admin/banners': ['SUPER_ADMIN'],
  '/admin/broadcast': ['SUPER_ADMIN'],
  '/admin/broadcast-history': ['SUPER_ADMIN'],
};

export function normalizeAdminTier(value: string | null | undefined): AdminTier {
  const v = (value ?? 'SUPER_ADMIN').toUpperCase();
  if (v === 'OPS' || v === 'FINANCE' || v === 'SUPPORT' || v === 'SUPER_ADMIN') {
    return v;
  }
  return 'SUPER_ADMIN';
}

export function canAccessAdminRoute(
  href: string,
  tier: AdminTier | null | undefined,
): boolean {
  const normalized = normalizeAdminTier(tier ?? 'SUPER_ADMIN');
  if (normalized === 'SUPER_ADMIN') return true;

  // Match exact route or longest registered prefix (e.g. /admin/orders/abc → /admin/orders)
  const path = href.split('?')[0];
  let required = ROUTE_TIER_REQUIREMENTS[path];
  if (!required) {
    const prefix = Object.keys(ROUTE_TIER_REQUIREMENTS)
      .filter((route) => path === route || path.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length)[0];
    if (prefix) required = ROUTE_TIER_REQUIREMENTS[prefix];
  }
  if (!required) return true;
  return required.includes(normalized);
}

export const ADMIN_TIER_LABELS: Record<AdminTier, string> = {
  SUPER_ADMIN: 'Super Admin',
  OPS: 'Ops',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
};

export const TEAM_TIER_OPTIONS: AdminTier[] = [
  'SUPER_ADMIN',
  'OPS',
  'FINANCE',
  'SUPPORT',
];
