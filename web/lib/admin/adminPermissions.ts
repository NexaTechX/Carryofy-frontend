/** Admin permission tiers — must match Prisma AdminRole enum on the API. */
export type AdminTier = 'SUPER_ADMIN' | 'OPS' | 'FINANCE' | 'SUPPORT';

const ALL_ADMIN_TIERS: AdminTier[] = ['SUPER_ADMIN', 'OPS', 'FINANCE', 'SUPPORT'];
const OPS_TIERS: AdminTier[] = ['SUPER_ADMIN', 'OPS'];
const FINANCE_TIERS: AdminTier[] = ['SUPER_ADMIN', 'FINANCE'];
const SUPPORT_TIERS: AdminTier[] = ['SUPER_ADMIN', 'SUPPORT'];
const OPS_SUPPORT_TIERS: AdminTier[] = ['SUPER_ADMIN', 'OPS', 'SUPPORT'];
const OPS_FINANCE_TIERS: AdminTier[] = ['SUPER_ADMIN', 'OPS', 'FINANCE'];

/**
 * Admin route permissions. Keep every admin route explicit so newly added pages
 * cannot accidentally become visible to all non-super-admin tiers.
 */
const ROUTE_TIER_REQUIREMENTS: Record<string, AdminTier[]> = {
  '/admin': ALL_ADMIN_TIERS,
  '/admin/analytics': OPS_FINANCE_TIERS,
  '/admin/sharing/analytics': OPS_FINANCE_TIERS,
  '/admin/customers': OPS_SUPPORT_TIERS,
  '/admin/settings': ['SUPER_ADMIN'],
  '/admin/payouts': FINANCE_TIERS,
  '/admin/finance': FINANCE_TIERS,
  '/admin/reports': FINANCE_TIERS,
  '/admin/refunds': FINANCE_TIERS,
  '/admin/orders': ALL_ADMIN_TIERS,
  '/admin/sellers': OPS_SUPPORT_TIERS,
  '/admin/products': OPS_TIERS,
  '/admin/categories': OPS_TIERS,
  '/admin/quote-requests': OPS_SUPPORT_TIERS,
  '/admin/riders-kyc': OPS_TIERS,
  '/admin/rider-break-requests': OPS_TIERS,
  '/admin/deliveries': OPS_TIERS,
  '/admin/delivery': OPS_TIERS,
  '/admin/dispatch': OPS_TIERS,
  '/admin/delivery-exceptions': OPS_TIERS,
  '/admin/warehouse': OPS_TIERS,
  '/admin/fleet': OPS_FINANCE_TIERS,
  '/admin/safety': OPS_SUPPORT_TIERS,
  '/admin/locations': OPS_TIERS,
  '/admin/disputes': SUPPORT_TIERS,
  '/admin/support': SUPPORT_TIERS,
  '/admin/reviews': SUPPORT_TIERS,
  '/admin/feedback': SUPPORT_TIERS,
  '/admin/notifications': ALL_ADMIN_TIERS,
  '/admin/audit-log': ['SUPER_ADMIN'],
  '/admin/banners': ['SUPER_ADMIN'],
  '/admin/broadcast': ['SUPER_ADMIN'],
  '/admin/broadcast-history': ['SUPER_ADMIN'],
};

export function normalizeAdminTier(value: string | null | undefined): AdminTier {
  const v = (value ?? '').toUpperCase();
  if (v === 'OPS' || v === 'FINANCE' || v === 'SUPPORT' || v === 'SUPER_ADMIN') {
    return v;
  }
  // Fail safe: unknown/missing roles get the most restrictive tier so a loading
  // profile or an unrecognized backend role never grants super-admin access.
  return 'SUPPORT';
}

export function canAccessAdminRoute(
  href: string,
  tier: AdminTier | null | undefined,
): boolean {
  const normalized = normalizeAdminTier(tier);
  if (normalized === 'SUPER_ADMIN') return true;

  // Match exact route or longest registered prefix (e.g. /admin/orders/abc → /admin/orders)
  const path = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  let required = ROUTE_TIER_REQUIREMENTS[path];
  if (!required) {
    const prefix = Object.keys(ROUTE_TIER_REQUIREMENTS)
      .filter((route) => route !== '/admin' && (path === route || path.startsWith(`${route}/`)))
      .sort((a, b) => b.length - a.length)[0];
    if (prefix) required = ROUTE_TIER_REQUIREMENTS[prefix];
  }
  if (!required) return false;
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
