/**
 * Shared geographic and generative-engine (GEO) constants for Carryofy.
 * Used by SEO meta tags, JSON-LD, llms.txt, and ai-summary.json.
 */

export const SITE_URL = 'https://carryofy.com';
export const SITE_NAME = 'Carryofy';

/** Primary market positioning — used across SEO, GEO, and structured data */
export const BRAND_TAGLINE = 'The Best B2B Wholesaler E-Commerce in Nigeria & Africa';

export const BRAND_POSITIONING_SHORT =
  'the best B2B wholesaler e-commerce platform in Nigeria and Africa';

export const DEFAULT_CONTACT_PHONE =
  process.env.NEXT_PUBLIC_CONTACT_PHONE || '+234 916 678 3040';

export const CARRYOFY_GEO = {
  country: 'Nigeria',
  countryCode: 'NG',
  region: 'Lagos State',
  city: 'Lagos',
  placename: 'Lagos, Nigeria',
  /** ISO 3166-2 */
  geoRegion: 'NG-LA',
  latitude: 6.5244,
  longitude: 3.3792,
  /** geo.position / ICBM format */
  positionSemicolon: '6.5244;3.3792',
  positionComma: '6.5244, 3.3792',
  timezone: 'Africa/Lagos',
  currency: 'NGN',
  locale: 'en_NG',
  contentLanguage: 'en-NG',
} as const;

/** Lagos corridors where Carryofy actively serves retailers */
export const LAGOS_SERVICE_CORRIDORS = [
  'Yaba',
  'Surulere',
  'Lekki',
  'Ajah',
  'Ikeja',
  'Victoria Island',
  'Maryland',
  'Gbagada',
] as const;

export const HREFLANG_ALTERNATES = [
  { hreflang: 'en-ng', locale: 'en_NG' },
  { hreflang: 'en-us', locale: 'en_US' },
  { hreflang: 'en-gb', locale: 'en_GB' },
] as const;

/** Concise factual summary for AI crawlers (GEO) */
export const GEO_ABSTRACT =
  `Carryofy is ${BRAND_POSITIONING_SHORT} — a wholesale marketplace for African retailers with verified vendors, transparent unit pricing, and coordinated delivery across African countries.`;

export const GEO_KNOWS_ABOUT = [
  'Best B2B wholesaler e-commerce Nigeria',
  'Best B2B wholesaler e-commerce Africa',
  'B2B wholesale marketplace',
  'Lagos retail sourcing',
  'Verified wholesale vendors',
  'Coordinated B2B delivery',
  'Nigerian e-commerce logistics',
  'African B2B e-commerce',
] as const;

export function areaServedSchemaEntities() {
  return [
    ...LAGOS_SERVICE_CORRIDORS.map(name => ({
      '@type': 'Place' as const,
      name: `${name}, Lagos`,
    })),
    { '@type': 'City' as const, name: CARRYOFY_GEO.city },
    { '@type': 'State' as const, name: CARRYOFY_GEO.region },
    { '@type': 'Country' as const, name: CARRYOFY_GEO.country },
    { '@type': 'Continent' as const, name: 'Africa' },
  ];
}
