import { getRoleRedirect } from './utils';

/** Whether a post-login redirect path is allowed for this role (matches edge middleware). */
export function isRedirectAllowedForRole(
  path: string,
  role: string | undefined | null,
): boolean {
  if (!role) return false;

  const normalized = role.toUpperCase();
  const pathname = path.split('?')[0]?.split('#')[0] ?? path;

  if (normalized === 'ADMIN') return true;
  if (pathname.startsWith('/seller')) return normalized === 'SELLER';
  if (pathname.startsWith('/buyer')) return normalized === 'BUYER';
  if (pathname.startsWith('/admin')) return normalized === 'ADMIN';
  if (pathname.startsWith('/fleet')) {
    return normalized === 'FLEET' || normalized === 'FLEET_OPERATOR';
  }
  if (pathname.startsWith('/rider')) return normalized === 'RIDER';

  return false;
}

export function resolvePostLoginPath(
  redirect: string | string[] | undefined,
  role: string | undefined | null,
): string {
  if (typeof redirect === 'string') {
    const trimmed = redirect.trim();
    if (trimmed.startsWith('/') && isRedirectAllowedForRole(trimmed, role)) {
      return trimmed;
    }
  }
  return getRoleRedirect(role);
}
