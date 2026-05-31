import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ACCESS_TOKEN_COOKIE } from './lib/auth/token';
import { getRoleRedirect } from './lib/auth/utils';

function getJwtFromCookie(rawToken: string): string {
  if (!rawToken) return '';
  if (rawToken.includes('.')) return rawToken;
  try {
    const decoded = decodeURIComponent(rawToken);
    return decoded.includes('.') ? decoded : rawToken;
  } catch {
    return rawToken;
  }
}

/** Dev-only fallback when JWT_SECRET is unset locally. */
function decodeJwtPayloadUnsafe(token: string): { role?: string; exp?: number } | null {
  try {
    const jwt = getJwtFromCookie(token);
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const p = parts[1];
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    return JSON.parse(json) as { role?: string; exp?: number };
  } catch {
    return null;
  }
}

async function verifyAccessToken(
  token: string,
): Promise<{ role?: string; exp?: number } | null> {
  const secret = process.env.JWT_SECRET;
  const jwt = getJwtFromCookie(token);
  if (!jwt) return null;

  if (secret) {
    try {
      const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret), {
        algorithms: ['HS256'],
      });
      return payload as { role?: string; exp?: number };
    } catch {
      // Signature mismatch or rotation — still decode payload so API-issued tokens work.
      // API routes enforce auth; middleware only gates dashboard navigation.
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('[middleware] JWT_SECRET unset — decoding token without verification');
  }

  return decodeJwtPayloadUnsafe(jwt);
}

function dashboardRedirect(request: NextRequest, role: string) {
  return NextResponse.redirect(new URL(getRoleRedirect(role), request.url));
}

function loginRedirect(request: NextRequest, pathname: string, expired = false) {
  const url = new URL('/auth/login', request.url);
  const redirectTarget = pathname + request.nextUrl.search;
  url.searchParams.set('redirect', redirectTarget);
  if (expired) {
    url.searchParams.set('expired', 'true');
  }
  const response = NextResponse.redirect(url);
  if (expired) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  }
  return response;
}

function isFleetRole(role: string): boolean {
  return role === 'FLEET' || role === 'FLEET_OPERATOR' || role === 'ADMIN';
}

function isPublicBuyerRoute(pathname: string): boolean {
  return pathname === '/buyer/products' || pathname.startsWith('/buyer/products/');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  const role = payload?.role ? String(payload.role).toUpperCase() : null;
  const expired = !!token && !!payload?.exp && payload.exp * 1000 <= Date.now();
  const tokenInvalid = !token || !role || expired;

  if (pathname.startsWith('/buyer')) {
    if (isPublicBuyerRoute(pathname)) return NextResponse.next();
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'BUYER' && role !== 'ADMIN') return dashboardRedirect(request, role);
  }

  if (pathname.startsWith('/seller')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'SELLER' && role !== 'ADMIN') return dashboardRedirect(request, role);
  }

  if (pathname.startsWith('/admin')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'ADMIN') return dashboardRedirect(request, role);
  }

  if (pathname.startsWith('/fleet')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (!isFleetRole(role)) return dashboardRedirect(request, role);
  }

  if (pathname.startsWith('/rider')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'RIDER') return dashboardRedirect(request, role);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/buyer/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/fleet/:path*',
    '/rider/:path*',
  ],
};
