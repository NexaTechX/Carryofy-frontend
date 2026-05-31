import type { NextApiRequest, NextApiResponse } from 'next';
import { ACCESS_TOKEN_COOKIE } from '../../../lib/auth/token';

const ACCESS_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function buildSetCookie(name: string, value: string, maxAgeSeconds: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

function buildClearCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const accessToken = req.body?.accessToken;
    if (typeof accessToken !== 'string' || !accessToken.includes('.')) {
      return res.status(400).json({ message: 'Valid accessToken required' });
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
