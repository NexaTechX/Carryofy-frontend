import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShieldOff } from 'lucide-react';
import { LoadingState } from './ui';
import {
  canAccessAdminRoute,
  normalizeAdminTier,
  type AdminTier,
} from '../../lib/admin/adminPermissions';

interface AdminPermissionGateProps {
  adminRole?: string | null;
  /** While the admin profile is loading, show a spinner instead of assuming a tier. */
  isRoleLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Blocks page content when the signed-in admin's tier cannot access this route.
 * Backend still enforces write permissions; this is UX-only for direct URL access.
 */
export default function AdminPermissionGate({
  adminRole,
  isRoleLoading = false,
  children,
}: AdminPermissionGateProps) {
  const router = useRouter();
  const tier = normalizeAdminTier(adminRole);
  const path = router.pathname ?? '/admin';

  if (isRoleLoading && !adminRole) {
    return <LoadingState fullscreen label="Checking permissions…" />;
  }

  if (canAccessAdminRoute(path, tier)) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
      <ShieldOff className="mx-auto mb-4 h-10 w-10 text-amber-400" />
      <h2 className="mb-2 text-lg font-semibold text-white">No permission</h2>
      <p className="mb-4 text-sm text-gray-400">
        Your role ({tier.replace(/_/g, ' ')}) cannot access this section. Contact a super admin if
        you need access.
      </p>
      <Link
        href="/admin"
        className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90"
      >
        Back to overview
      </Link>
    </div>
  );
}

export function useAdminTier(adminRole?: string | null): AdminTier {
  return normalizeAdminTier(adminRole);
}
