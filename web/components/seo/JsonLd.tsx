import Head from 'next/head';
import {
  areaServedSchemaEntities,
  BRAND_POSITIONING_SHORT,
  CARRYOFY_GEO,
  DEFAULT_CONTACT_PHONE,
  GEO_ABSTRACT,
  GEO_KNOWS_ABOUT,
  SITE_NAME,
  SITE_URL,
} from './geo';

/** Prevent `</script>` breaking out of JSON-LD when embedding user-controlled strings. */
function jsonLdStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const LOGO_URL = `${SITE_URL}/logo.png`;

// Organization Schema - Global brand information
export interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

export function OrganizationSchema({
  name = SITE_NAME,
  url = SITE_URL,
  logo = LOGO_URL,
  description = GEO_ABSTRACT,
  email = 'support@carryofy.com',
  // SECTION 3.4 — resolved: real business phone for structured data
  telephone = DEFAULT_CONTACT_PHONE,
  address = {
    addressLocality: CARRYOFY_GEO.city,
    addressRegion: CARRYOFY_GEO.region,
    addressCountry: CARRYOFY_GEO.countryCode,
  },
  sameAs = [
    'https://twitter.com/carryofy',
    'https://www.facebook.com/carryofy',
    'https://www.instagram.com/carryofy',
    'https://www.linkedin.com/company/carryofy',
    'https://www.tiktok.com/@carryofy',
  ],
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512,
    },
    description,
    email,
    telephone,
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    sameAs,
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'Carryofy Founder',
      },
    ],
    areaServed: areaServedSchemaEntities(),
    knowsAbout: [...GEO_KNOWS_ABOUT],
    serviceType: [
      'B2B Wholesale Marketplace',
      'Coordinated B2B Delivery',
      'Vendor Verification',
      'Retail Sourcing',
      'Order Fulfillment',
    ],
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// Website Schema with SearchAction for sitelinks search box
export interface WebsiteSchemaProps {
  url?: string;
  name?: string;
  description?: string;
  searchUrlTemplate?: string;
}

export function WebsiteSchema({
  url = SITE_URL,
  name = SITE_NAME,
  description = `Carryofy — ${BRAND_POSITIONING_SHORT}`,
  searchUrlTemplate = `${SITE_URL}/buyer/products?search={search_term_string}`,
}: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name,
    description,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrlTemplate,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-NG',
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// LocalBusiness Schema for contact/location pages
export interface LocalBusinessSchemaProps {
  name?: string;
  description?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
}

export function LocalBusinessSchema({
  name = 'Carryofy',
  description = GEO_ABSTRACT,
  telephone = DEFAULT_CONTACT_PHONE,
  email = 'support@carryofy.com',
  address = {
    addressLocality: 'Lagos',
    addressRegion: 'Lagos State',
    addressCountry: 'NG',
  },
  geo = {
    latitude: CARRYOFY_GEO.latitude,
    longitude: CARRYOFY_GEO.longitude,
  },
  openingHours = ['Mo-Fr 08:00-18:00', 'Sa 09:00-15:00'],
  priceRange = '₦₦',
}: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name,
    description,
    url: SITE_URL,
    telephone,
    email,
    image: LOGO_URL,
    logo: LOGO_URL,
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      ...geo,
    },
    openingHoursSpecification: openingHours.map(hours => {
      const [days, time] = hours.split(' ');
      const [open, close] = time.split('-');
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days.split('-').map(d => {
          const dayMap: Record<string, string> = {
            Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday',
            Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday',
          };
          return dayMap[d] || d;
        }),
        opens: open,
        closes: close,
      };
    }),
    priceRange,
    areaServed: areaServedSchemaEntities(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Carryofy Services',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'E-commerce Marketplace',
          description: 'Buy and sell products online',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Logistics & Delivery',
          description: 'Same-day and express delivery services',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Warehouse & Fulfillment',
          description: 'Storage and order fulfillment solutions',
        },
      ],
    },
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// Product Schema for product detail pages
export interface ProductSchemaProps {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'LimitedAvailability';
  sku?: string;
  brand?: string;
  seller?: {
    name: string;
    url?: string;
  };
  category?: string;
  rating?: {
    value: number;
    count: number;
  };
  url: string;
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'NGN',
  availability = 'InStock',
  sku,
  brand,
  seller,
  category,
  rating,
  url,
}: ProductSchemaProps) {
  const availabilityMap: Record<string, string> = {
    InStock: 'https://schema.org/InStock',
    OutOfStock: 'https://schema.org/OutOfStock',
    PreOrder: 'https://schema.org/PreOrder',
    LimitedAvailability: 'https://schema.org/LimitedAvailability',
  };

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    url,
    offers: {
      '@type': 'Offer',
      price: price / 100, // Convert from kobo to naira
      priceCurrency: currency,
      availability: availabilityMap[availability],
      seller: seller ? {
        '@type': 'Organization',
        name: seller.name,
        url: seller.url || SITE_URL,
      } : {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: 'NGN',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'NG',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  if (sku) {
    schema.sku = sku;
  }

  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: brand,
    };
  }

  if (category) {
    schema.category = category;
  }

  if (rating && rating.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// BreadcrumbList Schema for navigation
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// FAQPage Schema for FAQ sections
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSchemaProps {
  faqs: FAQItem[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// HowTo Schema for guides and tutorials
export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format, e.g., "PT15M" for 15 minutes
  image?: string;
}

export function HowToSchema({
  name,
  description,
  steps,
  totalTime = 'PT10M',
  image,
}: HowToSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    totalTime,
    image: image || LOGO_URL,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
      ...(step.url && { url: step.url.startsWith('http') ? step.url : `${SITE_URL}${step.url}` }),
    })),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// Article Schema for blog posts
export interface ArticleSchemaProps {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author?: {
    name: string;
    url?: string;
  };
  url: string;
}

export function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author = { name: 'Carryofy Team' },
  url,
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: Array.isArray(image) ? image : [image],
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url || SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url.startsWith('http') ? url : `${SITE_URL}${url}`,
    },
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// OnlineStore — marketplace entity for product-rich SERP / AI citations
export function OnlineStoreSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#onlinestore`,
    name: SITE_NAME,
    url: SITE_URL,
    description: GEO_ABSTRACT,
    image: LOGO_URL,
    telephone: DEFAULT_CONTACT_PHONE,
    email: 'support@carryofy.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: CARRYOFY_GEO.city,
      addressRegion: CARRYOFY_GEO.region,
      addressCountry: CARRYOFY_GEO.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: CARRYOFY_GEO.latitude,
      longitude: CARRYOFY_GEO.longitude,
    },
    areaServed: areaServedSchemaEntities(),
    currenciesAccepted: CARRYOFY_GEO.currency,
    paymentAccepted: 'Bank Transfer, Debit Card, Credit Card, Mobile Money',
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// Service schema — clarifies what Carryofy offers (GEO + local SEO)
export interface ServiceSchemaProps {
  name?: string;
  description?: string;
}

export function ServiceSchema({
  name = 'B2B Wholesale Sourcing & Delivery',
  description = `Connect retailers across Nigeria and Africa to verified wholesale vendors — ${BRAND_POSITIONING_SHORT}.`,
}: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/#service`,
    name,
    description,
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: areaServedSchemaEntities(),
    serviceType: 'B2B Marketplace',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: SITE_URL,
      serviceType: 'Online ordering',
    },
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// WebPage — ties page content to site graph; supports AI/voice citation (GEO)
export interface WebPageSchemaProps {
  name: string;
  description: string;
  url: string;
  speakableSummary?: string;
}

export function WebPageSchema({
  name,
  description,
  url,
  speakableSummary,
}: WebPageSchemaProps) {
  const pageUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    description,
    inLanguage: CARRYOFY_GEO.contentLanguage,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og/home.png`,
    },
  };

  if (speakableSummary) {
    schema.abstract = speakableSummary;
    schema.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.geo-speakable'],
    };
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// SoftwareApplication Schema for the platform
export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Carryofy',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    description: GEO_ABSTRACT,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: CARRYOFY_GEO.currency,
    },
    featureList: [
      'B2B Wholesale Marketplace',
      'Verified Vendors',
      'Coordinated Delivery',
      'Real-Time Order Updates',
      'Secure Payments',
      'Lagos Corridor Coverage',
    ],
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStringify(schema) }}
      />
    </Head>
  );
}

// Combined schema component for common page setups
export interface CombinedSchemaProps {
  includeOrganization?: boolean;
  includeWebsite?: boolean;
  includeLocalBusiness?: boolean;
  includeSoftwareApp?: boolean;
  includeOnlineStore?: boolean;
  includeService?: boolean;
  webPage?: WebPageSchemaProps;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FAQItem[];
  product?: ProductSchemaProps;
  article?: ArticleSchemaProps;
  howTo?: HowToSchemaProps;
}

export function CombinedSchema({
  includeOrganization = false,
  includeWebsite = false,
  includeLocalBusiness = false,
  includeSoftwareApp = false,
  includeOnlineStore = false,
  includeService = false,
  webPage,
  breadcrumbs,
  faqs,
  product,
  article,
  howTo,
}: CombinedSchemaProps) {
  return (
    <>
      {includeOrganization && <OrganizationSchema />}
      {includeWebsite && <WebsiteSchema />}
      {includeLocalBusiness && <LocalBusinessSchema />}
      {includeOnlineStore && <OnlineStoreSchema />}
      {includeService && <ServiceSchema />}
      {includeSoftwareApp && <SoftwareApplicationSchema />}
      {webPage && <WebPageSchema {...webPage} />}
      {breadcrumbs && breadcrumbs.length > 0 && <BreadcrumbSchema items={breadcrumbs} />}
      {faqs && faqs.length > 0 && <FAQSchema faqs={faqs} />}
      {product && <ProductSchema {...product} />}
      {article && <ArticleSchema {...article} />}
      {howTo && <HowToSchema {...howTo} />}
    </>
  );
}

export default CombinedSchema;

