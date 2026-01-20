import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en-NG">
      <Head>
        {/* Character Set */}
        <meta charSet="utf-8" />
        
        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Carryofy" />
        <meta name="application-name" content="Carryofy" />
        <meta name="HandheldFriendly" content="true" />
        
        {/* Google Search Console Verification - Replace with actual code */}
        <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
        
        {/* Bing Webmaster Verification - Replace with actual code */}
        <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
        
        {/* Theme Colors for all platforms */}
        <meta name="theme-color" content="#ff6600" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#ff6600" />
        <meta name="msapplication-TileImage" content="/android-chrome-192x192.png" />
        <meta name="msapplication-navbutton-color" content="#ff6600" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Comprehensive Favicon Setup for All Devices */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/logo.png" color="#ff6600" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        
        {/* Google Fonts - Preload critical fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="color-scheme" content="light dark" />
        
        {/* Content Security and Security Headers handled via next.config.ts */}
        
        {/* Structured Data - Global Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://carryofy.com/#organization',
              name: 'Carryofy',
              url: 'https://carryofy.com',
              logo: {
                '@type': 'ImageObject',
                url: 'https://carryofy.com/logo.png',
                width: 512,
                height: 512,
              },
              description: 'Carryofy enables same-day delivery for trusted local sellers in Lagos. Shop from verified sellers and get fast, reliable delivery with real-time tracking.',
              email: 'support@carryofy.com',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Lagos',
                addressRegion: 'Lagos State',
                addressCountry: 'NG',
              },
              sameAs: [
                'https://twitter.com/carryofy',
                'https://www.facebook.com/carryofy',
                'https://www.instagram.com/carryofy',
                'https://www.linkedin.com/company/carryofy',
                'https://www.tiktok.com/@carryofy',
              ],
              areaServed: [
                { '@type': 'City', name: 'Lagos' },
                { '@type': 'State', name: 'Lagos State' },
                { '@type': 'Country', name: 'Nigeria' },
              ],
            }),
          }}
        />
        
        {/* Structured Data - WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': 'https://carryofy.com/#website',
              url: 'https://carryofy.com',
              name: 'Carryofy',
              description: 'Same-day delivery platform for trusted local sellers in Lagos - Shop from verified sellers with same-day delivery',
              publisher: {
                '@id': 'https://carryofy.com/#organization',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://carryofy.com/buyer/products?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
              inLanguage: 'en-NG',
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
