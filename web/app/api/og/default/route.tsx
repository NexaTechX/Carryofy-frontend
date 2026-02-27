// CF/web/app/api/og/default/route.tsx
// Fallback OG image when product is not found or for default shares

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 24,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#F97316',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 900,
              color: 'white',
            }}
          >
            C
          </div>
          <span style={{ fontSize: 64, fontWeight: 900, color: 'white' }}>
            Carryofy
          </span>
        </div>
        <span style={{ fontSize: 28, color: '#94A3B8' }}>
          Fast Delivery Across Lagos 🚚
        </span>
        <span style={{ fontSize: 22, color: '#F97316' }}>
          carryofy.com
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
