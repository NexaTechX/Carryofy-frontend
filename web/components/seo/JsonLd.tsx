import Head from 'next/head';

const SITE_URL = 'https://carryofy.com';
const SITE_NAME = 'Carryofy';
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
  description = 'Carryofy enables same-day delivery for trusted local sellers in Lagos. Shop from verified sellers and get fast, reliable delivery with real-time tracking.',
  email = 'support@carryofy.com',
  // TODO: Replace with actual contact phone number
  telephone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+234-XXX-XXX-XXXX',
  address = {
    addressLocality: 'Lagos',
    addressRegion: 'Lagos State',
    addressCountry: 'NG',
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
    areaServed: [
      { '@type': 'City', name: 'Lagos' },
      { '@type': 'State', name: 'Lagos State' },
      { '@type': 'Country', name: 'Nigeria' },
    ],
    serviceType: [
      'E-commerce Platform',
      'Logistics Services',
      'Warehouse Storage',
      'Same-Day Delivery',
      'Order Fulfillment',
    ],
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
  description = 'Same-day delivery platform for trusted local sellers in Lagos',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
  description = 'Same-day delivery platform for trusted local sellers in Lagos, Nigeria.',
  telephone = '+234-XXX-XXX-XXXX',
  email = 'support@carryofy.com',
  address = {
    addressLocality: 'Lagos',
    addressRegion: 'Lagos State',
    addressCountry: 'NG',
  },
  geo = {
    latitude: 6.5244,
    longitude: 3.3792,
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
    areaServed: [
      { '@type': 'City', name: 'Lagos' },
      { '@type': 'State', name: 'Lagos State' },
    ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
    description: 'Same-day delivery platform for trusted local sellers in Lagos',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NGN',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '12450',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Online Marketplace',
      'Same-Day Delivery',
      'Real-Time Tracking',
      'Secure Payments',
      'Buyer Protection',
      'Verified Sellers',
      'Lagos Coverage',
    ],
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
      {includeSoftwareApp && <SoftwareApplicationSchema />}
      {breadcrumbs && breadcrumbs.length > 0 && <BreadcrumbSchema items={breadcrumbs} />}
      {faqs && faqs.length > 0 && <FAQSchema faqs={faqs} />}
      {product && <ProductSchema {...product} />}
      {article && <ArticleSchema {...article} />}
      {howTo && <HowToSchema {...howTo} />}
    </>
  );
}

export default CombinedSchema;

