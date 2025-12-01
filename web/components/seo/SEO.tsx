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
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png`;
const SITE_NAME = 'Carryofy';
const TWITTER_HANDLE = '@carryofy';

// Comprehensive keyword sets for maximum SEO coverage
export const SEO_KEYWORDS = {
  // Primary high-intent keywords
  primary: [
    'ecommerce platform Nigeria',
    'online marketplace Africa',
    'buy products Nigeria',
    'sell products online Africa',
    'same day delivery Lagos',
    'logistics company Nigeria',
    'fulfillment service Africa',
    'warehouse storage Lagos',
    'delivery service Nigeria',
    'African ecommerce platform',
    'buy and sell Nigeria',
    'online store Nigeria',
  ],
  
  // Problem-aware keywords
  problemAware: [
    'how to sell online Nigeria',
    'best delivery service Lagos',
    'cheap logistics Nigeria',
    'reliable courier Africa',
    'fast delivery Nigeria',
    'merchant platform Africa',
    'dropshipping Nigeria',
    'online store Nigeria',
    'African business platform',
    'ecommerce solution Africa',
    'delivery tracking Nigeria',
    'order fulfillment Lagos',
  ],
  
  // Solution-aware long-tail keywords
  longTail: [
    'AI powered ecommerce Nigeria',
    'integrated logistics marketplace Africa',
    'same day delivery platform Lagos',
    'merchant fulfillment service Nigeria',
    'how to start selling online Africa',
    'best ecommerce for African sellers',
    'warehouse and delivery service Nigeria',
    'all in one commerce platform Africa',
    'trusted online marketplace Nigeria',
    'secure payment ecommerce Africa',
    'real time delivery tracking Lagos',
    'multi vendor marketplace Nigeria',
  ],
  
  // Location-specific keywords
  locations: [
    'Lagos Nigeria',
    'Abuja Nigeria',
    'Port Harcourt Nigeria',
    'Ibadan Nigeria',
    'Kano Nigeria',
    'West Africa',
    'East Africa',
    'South Africa',
    'Ghana',
    'Kenya',
    'African continent',
  ],
  
  // Industry-specific keywords
  industry: [
    'B2B marketplace Africa',
    'B2C ecommerce Nigeria',
    'wholesale marketplace Lagos',
    'retail delivery service Nigeria',
    'food delivery Lagos',
    'fashion ecommerce Nigeria',
    'electronics marketplace Africa',
    'grocery delivery Nigeria',
    'home goods delivery Lagos',
    'last mile delivery Nigeria',
  ],
  
  // Brand and product keywords
  brand: [
    'Carryofy',
    'Carryofy marketplace',
    'Carryofy delivery',
    'Carryofy logistics',
    'Carryofy Nigeria',
    'Carryofy Africa',
    'Carryofy seller',
    'Carryofy merchant',
    'Carryofy buyer',
    'Carryofy app',
  ],
};

// Helper to generate keyword string
export function generateKeywords(categories: (keyof typeof SEO_KEYWORDS)[]): string {
  const keywords: string[] = [];
  categories.forEach(cat => {
    keywords.push(...SEO_KEYWORDS[cat]);
  });
  return keywords.join(', ');
}

// Default keywords for all pages
export const DEFAULT_KEYWORDS = generateKeywords(['primary', 'brand', 'locations']);

export default function SEO({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = 'Carryofy - AI-Powered Commerce Platform for Africa',
  twitterCard = 'summary_large_image',
  noindex = false,
  nofollow = false,
  author = 'Carryofy',
  publishedTime,
  modifiedTime,
  locale = 'en_NG',
  alternateLocales = ['en_US', 'en_GB'],
}: SEOProps) {
  const fullTitle = title.includes('Carryofy') ? title : `${title} | Carryofy`;
  const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
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
      
      {/* Geo Meta Tags for Local SEO */}
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
    title: 'Carryofy - AI-Powered E-Commerce & Logistics Platform for Africa',
    description: 'Carryofy unifies marketplace, logistics, warehousing, and same-day delivery into one intelligent platform. Buy and sell online in Nigeria with fast, reliable delivery across Africa. Join thousands of merchants growing their business.',
    keywords: generateKeywords(['primary', 'problemAware', 'longTail', 'brand', 'locations']),
  },
  about: {
    title: 'About Carryofy - Leading African E-Commerce & Logistics Company',
    description: 'Learn about Carryofy, Nigeria\'s trusted AI-powered e-commerce fulfillment platform. We connect sellers and buyers across Africa with integrated marketplace, logistics, and warehouse solutions. Based in Lagos, serving all of Africa.',
    keywords: generateKeywords(['primary', 'brand', 'locations', 'industry']),
  },
  contact: {
    title: 'Contact Carryofy - Customer Support & Business Inquiries Nigeria',
    description: 'Get in touch with Carryofy for customer support, seller inquiries, logistics partnerships, or business opportunities. We\'re here to help grow your e-commerce business in Nigeria and across Africa.',
    keywords: 'contact Carryofy, Carryofy support Nigeria, ecommerce help Lagos, logistics partnership Africa, seller support Nigeria, buyer help Africa, Carryofy customer service, business inquiries Nigeria',
  },
  blog: {
    title: 'Carryofy Blog - E-Commerce Tips, Logistics Insights & African Business News',
    description: 'Stay updated with the latest e-commerce trends, logistics innovations, and business tips for African entrepreneurs. Expert insights on selling online, delivery optimization, and growing your business in Nigeria.',
    keywords: 'ecommerce blog Nigeria, logistics news Africa, online selling tips Lagos, business growth Africa, merchant success stories, delivery industry insights, African commerce trends',
  },
  careers: {
    title: 'Careers at Carryofy - Join Africa\'s Leading Commerce Platform',
    description: 'Join the Carryofy team and help transform commerce in Africa. We\'re hiring engineers, logistics experts, and business professionals in Lagos, Nigeria. Build your career with Africa\'s fastest-growing e-commerce platform.',
    keywords: 'jobs at Carryofy, careers Nigeria ecommerce, logistics jobs Lagos, tech jobs Africa, startup jobs Nigeria, Carryofy hiring, work at Carryofy',
  },
  help: {
    title: 'Help Center - Carryofy Support & FAQs',
    description: 'Find answers to your questions about buying, selling, shipping, and payments on Carryofy. Comprehensive guides for Nigerian merchants and buyers. Get help with orders, deliveries, and account issues.',
    keywords: 'Carryofy help, ecommerce FAQ Nigeria, shipping help Lagos, seller guide Africa, buyer support Nigeria, how to sell on Carryofy, order tracking help',
  },
  merchantOnboarding: {
    title: 'Become a Seller on Carryofy - Start Selling Online in Nigeria Today',
    description: 'Join thousands of successful merchants on Carryofy. List your products, reach millions of buyers, and enjoy seamless logistics with same-day delivery. Start your online business in Nigeria with zero upfront costs.',
    keywords: generateKeywords(['problemAware', 'longTail', 'brand']) + ', become a seller Nigeria, start online store Africa, merchant registration Lagos, sell products online Nigeria, join marketplace Africa',
  },
  buyerProducts: {
    title: 'Shop Products Online - Best Deals in Nigeria | Carryofy',
    description: 'Discover thousands of quality products from verified Nigerian sellers. Shop electronics, fashion, groceries, and more with same-day delivery in Lagos. Secure payments and buyer protection guaranteed.',
    keywords: 'buy online Nigeria, shop products Lagos, best deals Africa, online shopping Nigeria, same day delivery Lagos, quality products Nigeria, verified sellers Africa',
  },
  sellerDashboard: {
    title: 'Seller Dashboard - Manage Your Store | Carryofy',
    description: 'Manage your products, orders, and earnings on Carryofy\'s powerful seller dashboard. Track sales, fulfill orders, and grow your business with real-time analytics and AI-powered insights.',
    keywords: 'seller dashboard Nigeria, manage online store Africa, ecommerce analytics Lagos, order management Nigeria, seller tools Africa',
  },
};

