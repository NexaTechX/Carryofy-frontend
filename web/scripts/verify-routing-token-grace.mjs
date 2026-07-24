/**
 * Smoke-check for routing JWT grace behavior used by lib/auth/sessionToken.ts:
 * signed-but-expired tokens must be distinguishable from bad signatures so
 * middleware can apply its refresh-token grace window.
 *
 * Run from web/: node scripts/verify-routing-token-grace.mjs
 */
import { SignJWT, decodeJwt, errors, jwtVerify } from 'jose';

async function verifyLikeProduction(token, secret) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      return decodeJwt(token);
    }
    return null;
  }
}

const secret = 'test-secret-key-for-routing-grace!!';
const key = new TextEncoder().encode(secret);

const expired = await new SignJWT({ role: 'SELLER' })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(Math.floor(Date.now() / 1000) - 120)
  .sign(key);

const expiredPayload = await verifyLikeProduction(expired, secret);
if (!expiredPayload?.role || String(expiredPayload.role).toUpperCase() !== 'SELLER') {
  console.error('FAIL: expired signed token should return role for refresh grace', expiredPayload);
  process.exit(1);
}
if (!expiredPayload.exp) {
  console.error('FAIL: expired signed token should still expose exp', expiredPayload);
  process.exit(1);
}

const tampered = `${expired.slice(0, -6)}AAAAAA`;
const tamperedPayload = await verifyLikeProduction(tampered, secret);
if (tamperedPayload !== null) {
  console.error('FAIL: tampered signature must fail closed', tamperedPayload);
  process.exit(1);
}

console.log('PASS: routing token grace + fail-closed signature checks');
