/**
 * Smoke-check: signed-but-expired access tokens must verify for middleware grace;
 * tampered signatures must fail closed.
 *
 * Run: node --experimental-strip-types scripts/verify-routing-token-grace.ts
 */
import { SignJWT } from 'jose';
import { verifyRoutingAccessToken } from '../lib/auth/sessionToken';

const secret = 'test-secret-key-for-routing-grace!!';
process.env.JWT_SECRET = secret;
process.env.NODE_ENV = 'production';

const key = new TextEncoder().encode(secret);

const expired = await new SignJWT({ role: 'SELLER' })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(Math.floor(Date.now() / 1000) - 120)
  .sign(key);

const expiredPayload = await verifyRoutingAccessToken(expired);
if (!expiredPayload?.role || String(expiredPayload.role).toUpperCase() !== 'SELLER') {
  console.error('FAIL: expired signed token should return role for refresh grace', expiredPayload);
  process.exit(1);
}
if (!expiredPayload.exp) {
  console.error('FAIL: expired signed token should still expose exp', expiredPayload);
  process.exit(1);
}

const tampered = `${expired.slice(0, -6)}AAAAAA`;
const tamperedPayload = await verifyRoutingAccessToken(tampered);
if (tamperedPayload !== null) {
  console.error('FAIL: tampered signature must fail closed', tamperedPayload);
  process.exit(1);
}

const missing = await verifyRoutingAccessToken('');
if (missing !== null) {
  console.error('FAIL: empty token must fail closed');
  process.exit(1);
}

console.log('PASS: routing token grace + fail-closed signature checks');
