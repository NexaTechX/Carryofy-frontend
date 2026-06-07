import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRoutingAccessToken } from '../../../lib/auth/sessionToken';
import { ACCESS_TOKEN_COOKIE } from '../../../lib/auth/token';

const ACCESS_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function buildSetCookie(name: string, value: string, maxAgeSeconds: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
    'HttpOnly',
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

function buildClearCookie(name: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax', 'HttpOnly'];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

function getRequestOrigin(req: NextApiRequest): string {
  const proto = req.headers['x-forwarded-proto'] ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const firstProto = Array.isArray(proto) ? proto[0] : proto.split(',')[0];
  const firstHost = Array.isArray(host) ? host[0] : host?.split(',')[0];
  return `${firstProto}://${firstHost}`;
}

function isSameOriginRequest(req: NextApiRequest): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  return origin === getRequestOrigin(req);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if ((req.method === 'POST' || req.method === 'DELETE') && !isSameOriginRequest(req)) {
    return res.status(403).json({ message: 'Cross-origin session request rejected' });
  }

  if (req.method === 'POST') {
    const accessToken = req.body?.accessToken;
    if (typeof accessToken !== 'string' || !accessToken.includes('.')) {
      return res.status(400).json({ message: 'Valid accessToken required' });
    }
    const payload = await verifyRoutingAccessToken(accessToken);
    if (!payload?.role) {
      return res.status(401).json({ message: 'Invalid accessToken' });
    }
    res.setHeader(
      'Set-Cookie',
      buildSetCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_COOKIE_MAX_AGE_SEC),
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', buildClearCookie(ACCESS_TOKEN_COOKIE));
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ message: 'Method not allowed' });
}
