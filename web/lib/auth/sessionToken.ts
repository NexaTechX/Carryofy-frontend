import { decodeJwt, errors, jwtVerify, type JWTPayload } from 'jose';

export type RoutingTokenPayload = JWTPayload & {
  role?: string;
};

export function getJwtFromCookie(rawToken: string): string {
  if (!rawToken) return '';
  if (rawToken.includes('.')) return rawToken;
  try {
    const decoded = decodeURIComponent(rawToken);
    return decoded.includes('.') ? decoded : rawToken;
  } catch {
    return rawToken;
  }
}

function decodeJwtPayloadUnsafe(token: string): RoutingTokenPayload | null {
  try {
    return decodeJwt(getJwtFromCookie(token)) as RoutingTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify the access token used by routing middleware.
 * Local development may decode unsigned payloads when JWT_SECRET is absent, but
 * configured environments must fail closed on missing or invalid signatures.
 *
 * Signed-but-expired tokens are returned so middleware can apply its refresh-token
 * grace window (AuthProvider / axios refresh the session after the page loads).
 * JWTExpired is only thrown after signature verification succeeds.
 */
export async function verifyRoutingAccessToken(
  token: string,
): Promise<RoutingTokenPayload | null> {
  const jwt = getJwtFromCookie(token);
  if (!jwt) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[auth] JWT_SECRET is required to verify routing access tokens');
      return null;
    }
    return decodeJwtPayloadUnsafe(jwt);
  }

  try {
    const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return payload as RoutingTokenPayload;
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      return decodeJwtPayloadUnsafe(jwt);
    }
    return null;
  }
}
