// CF/web/app/api/og/product/route.tsx
// Dynamic OG image for product shares (WhatsApp, Twitter, Facebook, etc.)

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import {
  truncateText,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from '@/lib/og';

export const runtime = 'edge';

export const revalidate = 3600;

async function fetchProduct(productId: string) {
  // Use the canonical production API if we're not local to avoid dev/prod environment mismatch
  let apiBase = process.env.NEXT_PUBLIC_API_BASE;

  if (!apiBase || apiBase.includes('localhost')) {
    // If we are on Carryofy production URLs, use the real API
    apiBase = 'https://api.carryofy.com/api/v1';
  }

  try {
    const res = await fetch(`${apiBase}/products/${productId}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch (e) {
    console.error('OG Image Fetch Error:', e);
    return null;
  }
}

/** Shrink Cloudinary delivery size so Edge OG fetch stays fast and within limits */
function optimizeCloudinaryOgUrl(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload')) {
    return url;
  }
  if (url.includes('w_600') || url.includes('c_fill')) return url;
  return url.replace(
    '/image/upload/',
    '/image/upload/w_600,h_630,c_fill,q_auto:good,f_auto/',
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Satori only reliably renders remote images when inlined as data URLs (or with explicit dimensions).
 * Fetching avoids broken previews for Cloudinary and API-hosted paths.
 */
async function fetchImageAsDataUrl(imageUrl: string): Promise<string | null> {
  const url = optimizeCloudinaryOgUrl(imageUrl);
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'image/*' },
    });
    if (!res.ok) return null;
    const mime =
      res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    if (!mime.startsWith('image/')) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 4_000_000) return null;
    return `data:${mime};base64,${arrayBufferToBase64(buf)}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('id');

  if (!productId) {
    return new Response('Missing product id', { status: 400 });
  }

  const product = await fetchProduct(productId);

  const name =
    product?.title ?? product?.name ?? 'Product on Carryofy';
  const description =
    product?.description ?? 'Shop on Carryofy — Fast Delivery in Lagos';
  const priceKobo = product?.price ?? 0;
  const firstImage = Array.isArray(product?.images) ? product.images[0] : undefined;

  let imageUrl = firstImage
    ? typeof firstImage === 'string'
      ? firstImage
      : (firstImage as { url?: string })?.url ?? null
    : product?.imageUrl ?? null;

  // Ensure imageUrl is absolute (API may return paths relative to API origin)
  if (imageUrl && imageUrl.startsWith('/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'https://api.carryofy.com/api/v1';
    const domain = apiBase.split('/api')[0];
    imageUrl = `${domain}${imageUrl}`;
  }

  const imageDataUrl = imageUrl ? await fetchImageAsDataUrl(imageUrl) : null;

  const category =
    product?.categoryRel?.name ?? product?.category ?? '';

  const formattedPrice = (priceKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
  const shortName = truncateText(name, 52);
  const shortDesc = truncateText(description, 100);

  const BRAND_ORANGE = '#F97316';
  const BRAND_DARK = '#1E293B';
  const BRAND_WHITE = '#FFFFFF';
  const BRAND_GRAY = '#94A3B8';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: BRAND_DARK,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* LEFT — Product image */}
        <div
          style={{
            width: '50%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            position: 'relative',
          }}
        >
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              width={600}
              height={630}
              src={imageDataUrl}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: BRAND_GRAY,
              }}
            >
              <div style={{ fontSize: 80 }}>📦</div>
              <div style={{ fontSize: 24, marginTop: 16 }}>No image</div>
            </div>
          )}

          {category && (
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: 24,
                backgroundColor: BRAND_ORANGE,
                color: BRAND_WHITE,
                fontSize: 20,
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: 8,
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* RIGHT — Product info */}
        <div
          style={{
            width: '50%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 48px 36px 48px',
            backgroundColor: BRAND_DARK,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: BRAND_ORANGE,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 900,
                color: BRAND_WHITE,
              }}
            >
              C
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: BRAND_WHITE,
                letterSpacing: '-0.5px',
              }}
            >
              Carryofy
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                fontSize: shortName.length > 30 ? 36 : 44,
                fontWeight: 800,
                color: BRAND_WHITE,
                lineHeight: 1.15,
                letterSpacing: '-0.5px',
              }}
            >
              {shortName}
            </div>

            <div
              style={{
                fontSize: 22,
                color: BRAND_GRAY,
                lineHeight: 1.5,
              }}
            >
              {shortDesc}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 18, color: BRAND_GRAY }}>Price</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Custom SVG Naira Symbol for guaranteed rendering */}
                <div style={{ display: 'flex', color: BRAND_ORANGE, marginTop: 8 }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 19V5L17 19V5M5 10H19M5 14H19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    color: BRAND_ORANGE,
                    lineHeight: 1,
                    letterSpacing: '-1px',
                  }}
                >
                  {formattedPrice}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: BRAND_ORANGE,
                color: BRAND_WHITE,
                fontSize: 24,
                fontWeight: 800,
                padding: '18px 32px',
                borderRadius: 14,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Buy on Carryofy
            </div>

            <div style={{ fontSize: 18, color: '#475569', textAlign: 'center' }}>
              carryofy.com · Fast Delivery in Lagos
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      headers: {
        'Cache-Control':
          'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
