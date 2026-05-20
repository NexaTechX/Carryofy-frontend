import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from './lib/auth/token';

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

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
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

function decodeJwtRole(token: string): string | null {
  return decodeJwtPayload(token)?.role ?? null;
}

function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = token ? decodeJwtRole(token) : null;
  const expired = !!token && isJwtExpired(token);
  const tokenInvalid = !token || !role || expired;

  if (pathname.startsWith('/buyer')) {
    if (isPublicBuyerRoute(pathname)) return NextResponse.next();
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'BUYER' && role !== 'ADMIN') return loginRedirect(request, pathname);
  }

  if (pathname.startsWith('/seller')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'SELLER' && role !== 'ADMIN') return loginRedirect(request, pathname);
  }

  if (pathname.startsWith('/admin')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'ADMIN') return loginRedirect(request, pathname);
  }

  if (pathname.startsWith('/fleet')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (!isFleetRole(role)) return loginRedirect(request, pathname);
  }

  if (pathname.startsWith('/rider')) {
    if (tokenInvalid) return loginRedirect(request, pathname, expired);
    if (role !== 'RIDER') return loginRedirect(request, pathname);
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
