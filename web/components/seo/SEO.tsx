import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  nofollow?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
  alternateLocales?: string[];
}

const SITE_URL = 'https://carryofy.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
const SITE_NAME = 'Carryofy';
const TWITTER_HANDLE = '@carryofy';

// Comprehensive keyword sets for maximum SEO coverage
export const SEO_KEYWORDS = {
  // Primary high-intent keywords
  primary: [
    'Carryofy same day delivery',
    'Carryofy Lagos delivery',
    'online shopping Carryofy',
    'trusted sellers Carryofy',
    'same day delivery Lagos',
    'online shopping Lagos',
    'buy products Lagos',
    'trusted sellers Lagos',
    'delivery service Lagos',
    'local sellers Lagos',
    'ecommerce Lagos',
    'online marketplace Lagos',
    'reliable delivery Lagos',
    'fast delivery Lagos',
    'shop online Lagos',
    'Lagos delivery service',
  ],

  // Problem-aware keywords
  problemAware: [
    'best delivery service Lagos',
    'reliable delivery Lagos',
    'fast delivery Lagos',
    'same day delivery Lagos',
    'trusted sellers Lagos',
    'buyer protection Lagos',
    'order tracking Lagos',
    'local delivery Lagos',
    'quick delivery Lagos',
    'trusted marketplace Lagos',
    'reliable sellers Lagos',
    'same day shipping Lagos',
  ],

  // Solution-aware long-tail keywords
  longTail: [
    'Carryofy marketplace Nigeria',
    'Carryofy logistics solutions',
    'same day delivery platform Lagos',
    'trusted local sellers Lagos',
    'reliable same day delivery Lagos',
    'buy from verified sellers Lagos',
    'fast delivery from local sellers',
    'order tracking Lagos',
    'buyer protection same day delivery',
    'trusted marketplace Lagos',
    'reliable delivery service Lagos',
    'same day shipping Lagos',
    'fast reliable delivery Lagos',
    'trusted online sellers Lagos',
  ],

  // Location-specific keywords
  locations: [
    'Lagos',
    'Lagos Nigeria',
    'Lagos State',
    'Nigeria',
    'West Africa',
  ],

  // Industry-specific keywords
  industry: [
    'African e-commerce',
    'Nigerian logistics',
    'online shopping Lagos',
    'retail delivery Lagos',
    'food delivery Lagos',
    'fashion delivery Lagos',
    'electronics delivery Lagos',
    'grocery delivery Lagos',
    'home goods delivery Lagos',
    'local delivery Lagos',
    'same day shopping Lagos',
    'quick delivery Lagos',
  ],

  // Brand and product keywords
  brand: [
    'Carryofy',
    'Carryofy.com',
    'Carryofy marketplace',
    'Carryofy delivery',
    'Carryofy Lagos',
    'Carryofy Nigeria',
    'Carryofy seller',
    'Carryofy buyer',
    'Carryofy app',
    'Carryofy logistics',
  ],
};

// Helper to generate keyword string
export function generateKeywords(categories: (keyof typeof SEO_KEYWORDS)[]): string {
  const keywords: string[] = [];
  categories.forEach(cat => {
    keywords.push(...SEO_KEYWORDS[cat]);
  });
  return Array.from(new Set(keywords)).join(', ');
}

// Default keywords for all pages
export const DEFAULT_KEYWORDS = generateKeywords(['brand', 'primary', 'locations']);

export default function SEO({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = 'Carryofy - The Trusted Marketplace for Modern African Commerce',
  twitterCard = 'summary_large_image',
  noindex = false,
  nofollow = false,
  author = 'Carryofy',
  publishedTime,
  modifiedTime,
  locale = 'en_NG',
  alternateLocales = ['en_US', 'en_GB'],
}: SEOProps) {
  // Ensure "Carryofy" is at the start of the title for brand recognition
  const fullTitle = title.startsWith('Carryofy') ? title : `Carryofy | ${title}`;
  const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`;
  const canonicalUrl = canonical || SITE_URL;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Carryofy" />

      {/* Geo Meta Tags for Local SEO - Essential for Lagos ranking */}
      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Lagos, Nigeria" />
      <meta name="geo.position" content="6.5244;3.3792" />
      <meta name="ICBM" content="6.5244, 3.3792" />

      {/* Language and Locale */}
      <meta httpEquiv="content-language" content="en-NG" />
      <meta name="language" content="English" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(loc => (
        <meta key={loc} property="og:locale:alternate" content={loc} />
      ))}

      {/* Article specific OG tags */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

      {/* Additional SEO Tags */}
      <meta name="application-name" content="Carryofy" />
      <meta name="msapplication-TileColor" content="#ff6600" />
      <meta name="theme-color" content="#ff6600" />

      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* DNS Prefetch for external resources */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
    </Head>
  );
}

// Page-specific SEO configurations
export const PAGE_SEO = {
  home: {
    title: 'Carryofy | Verified Marketplace for Modern African Commerce',
    description: 'Carryofy is the leading same-day delivery platform for trusted local sellers in Lagos. Shop safely from verified merchants with real-time tracking and buyer protection.',
    keywords: generateKeywords(['brand', 'primary', 'problemAware', 'longTail', 'locations']),
  },
  about: {
    title: 'About Carryofy | Lagos\' Trusted Same-Day Delivery Platform',
    description: 'Learn how Carryofy is revolutionizing e-commerce in Lagos by connecting buyers with verified local sellers through reliable same-day logistics and secure infrastructure.',
    keywords: generateKeywords(['brand', 'industry', 'locations']),
  },
  contact: {
    title: 'Contact Carryofy | Support & Business Inquiries in Lagos',
    description: 'Get in touch with the Carryofy team for customer support, seller on-boarding, or business partnerships. We are here to help you navigate African e-commerce.',
    keywords: 'contact Carryofy, Carryofy support Lagos, delivery help Lagos, seller support Lagos, buyer help Lagos, Carryofy customer service, business inquiries Lagos',
  },
  blog: {
    title: 'Carryofy Blog | E-Commerce Tips & Delivery Insights for Nigeria',
    description: 'Stay ahead with the latest e-commerce trends, delivery optimization tips, and business growth insights from the Carryofy team in Lagos, Nigeria.',
    keywords: 'ecommerce blog Lagos, delivery tips Lagos, online shopping tips Lagos, business growth Lagos, delivery insights Lagos, Lagos commerce trends',
  },
  careers: {
    title: 'Careers at Carryofy | Join the Team Building Africa\'s Commerce',
    description: 'Join Carryofy in Lagos and help us build the infrastructure for modern African commerce. We are hiring engineers, logistics experts, and business leaders.',
    keywords: 'jobs at Carryofy, careers Lagos ecommerce, delivery jobs Lagos, tech jobs Lagos, startup jobs Lagos, Carryofy hiring, work at Carryofy',
  },
  help: {
    title: 'Help Center | Carryofy Support & Buyer Guides',
    description: 'Find answers to common questions about buying, selling, and same-day delivery on Carryofy. Get the support you need to shop and sell with confidence.',
    keywords: 'Carryofy help, ecommerce FAQ Nigeria, shipping help Lagos, seller guide Africa, buyer support Nigeria, how to sell on Carryofy, order tracking help',
  },
  merchantOnboarding: {
    title: 'Sell on Carryofy | Grow Your Business with Same-Day Delivery',
    description: 'Join trusted sellers on Carryofy. List your products, reach more buyers in Lagos, and leverage our reliable same-day delivery network to grow your business.',
    keywords: generateKeywords(['brand', 'problemAware', 'longTail']) + ', become a seller Lagos, start online store Lagos, merchant registration Lagos, sell products online Lagos, join marketplace Lagos',
  },
  buyerProducts: {
    title: 'Shop Products | Same-Day Delivery in Lagos from Verified Sellers',
    description: 'Browse a wide range of products from trusted local sellers in Lagos. Enjoy guaranteed same-day delivery, secure payments, and total peace of mind with Carryofy.',
    keywords: 'buy online Carryofy, shop products Lagos, online shopping Nigeria, same day delivery Lagos, quality products Lagos, verified sellers Lagos',
  },
  sellerDashboard: {
    title: 'Seller Dashboard | Manage Your Carryofy Store',
    description: 'Keep track of your orders, manage your inventory, and scale your business using the Carryofy seller dashboard. Optimized for Nigerian merchants.',
    keywords: 'seller dashboard Carryofy, manage online store Lagos, ecommerce analytics Lagos, order management Lagos, seller tools Lagos',
  },
};
