import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from './lib/auth/token';

function decodeJwtRole(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const p = parts[1];
    const b64 = p.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function loginRedirect(request: NextRequest, pathname: string) {
  const url = new URL('/auth/login', request.url);
  const redirectTarget = pathname + request.nextUrl.search;
  url.searchParams.set('redirect', redirectTarget);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = token ? decodeJwtRole(token) : null;

  if (pathname.startsWith('/buyer')) {
    if (!token || !role) return loginRedirect(request, pathname);
    if (role !== 'BUYER' && role !== 'ADMIN') return loginRedirect(request, pathname);
  }

  if (pathname.startsWith('/seller')) {
    if (!token || !role) return loginRedirect(request, pathname);
    if (role !== 'SELLER' && role !== 'ADMIN') return loginRedirect(request, pathname);
  }

  if (pathname.startsWith('/admin')) {
    if (!token || !role) return loginRedirect(request, pathname);
    if (role !== 'ADMIN') return loginRedirect(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/buyer/:path*', '/seller/:path*', '/admin/:path*'],
};
