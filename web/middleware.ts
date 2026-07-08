import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyRoutingAccessToken } from './lib/auth/sessionToken';
import { ACCESS_TOKEN_COOKIE } from './lib/auth/token';
import { getRoleRedirect } from './lib/auth/utils';

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
  const payload = token ? await verifyRoutingAccessToken(token) : null;
  const role = payload?.role ? String(payload.role).toUpperCase() : null;
  // An expired-but-present token is allowed through within the refresh-token
  // window: the client silently refreshes (AuthProvider timer + axios 401
  // interceptor) and the API enforces real auth on every request. Redirecting
  // here would boot actively-browsing users to login the instant the short
  // access token lapses. Only force login once the refresh token itself must
  // be dead (grace matches JWT_REFRESH_EXPIRES_IN).
  const REFRESH_GRACE_MS = 30 * 24 * 60 * 60 * 1000;
  const expMs = payload?.exp ? payload.exp * 1000 : null;
  const expired = !!token && !!expMs && expMs + REFRESH_GRACE_MS <= Date.now();
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
