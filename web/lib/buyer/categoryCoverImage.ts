/**
 * Category hero/cover images for buyer UI and landing.
 * Uses Carryofy-curated photo URLs; admin image when set; Unsplash fallback on load failure.
 */

import { unsplashPhoto } from '../unsplash';

const unsplash = (path: string) => unsplashPhoto(path, { w: 800, h: 1000 });

export const CATEGORY_COVER_KEYS = [
  'electronics',
  'fashion',
  'home',
  'toys',
  'beauty',
  'health',
  'sports',
  'pet',
  'automotive',
  'grocery',
  'office',
  'baby',
  'jewelry',
  'watches',
  'computers',
  'default',
] as const;

export type CategoryCoverKey = (typeof CATEGORY_COVER_KEYS)[number];

/** Curated category photos (provided by Carryofy team) */
const CUSTOM_COVER_URLS: Partial<Record<CategoryCoverKey, string>> = {
  electronics:
    'https://sp-ao.shortpixel.ai/client/to_auto,q_glossy,ret_img,w_800,h_586/https://ikonic.com/wp-content/uploads/2023/10/industries-consumer-electronics.jpeg',
  fashion:
    'https://www.complianceandrisks.com/wp-content/uploads/2022/01/Fashion-Apparel-3.jpg',
  home: 'https://mccoymart.com/post/wp-content/uploads/2019/04/kitchen-items-List.jpg',
  toys: 'https://assets.blog.engoo.com/wp-content/uploads/sites/9/2023/06/02081603/toys_games_cover-1024x655.jpg',
  beauty:
    'https://media.licdn.com/dms/image/v2/D4D12AQEDGqFrM0o-wA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1715579150617?e=2147483647&v=beta&t=bo0FiTYyFSyqUUL5KBmLIg3HkjCShnBCLwGl4LOHTdw',
  health:
    'https://www.oecd.org/adobe/dynamicmedia/deliver/dm-aid--86dd3951-2028-41d1-b327-d0ecc4a0f17f/pharmaceuticals-2140717203.jpg?quality=80&preferwebp=true',
  sports: 'https://www.vanguardpkg.com/wp-content/uploads/2021/11/sports-and-outdoors-2.jpeg',
  automotive:
    'https://supplymaster.store/cdn/shop/collections/Car-Parts-2_20wide_1.jpg?v=1620901497&width=1296',
};

const RULES: { re: RegExp; key: CategoryCoverKey }[] = [
  { re: /watches|timepiece/i, key: 'watches' },
  { re: /jewelry|luxury/i, key: 'jewelry' },
  { re: /\bbaby\b|baby[\s-]product/i, key: 'baby' },
  { re: /pet[\s-]suppl|\bpets?\b/i, key: 'pet' },
  { re: /automotive|automobile|car\s*&|vehicle/i, key: 'automotive' },
  { re: /office|school\s*suppl/i, key: 'office' },
  { re: /sports|fitness|outdoor/i, key: 'sports' },
  { re: /health|pharma|pharmaceutical|household/i, key: 'health' },
  { re: /beauty|personal\s*care|cosmetic|skincare|\bcream\b/i, key: 'beauty' },
  { re: /toys|games/i, key: 'toys' },
  { re: /home|kitchen|furniture/i, key: 'home' },
  { re: /computers?\b|laptop|\bpc\b/i, key: 'computers' },
  { re: /electronics|gadget|smartphone|phone|consumer\s*electronic/i, key: 'electronics' },
  { re: /fashion|apparel|clothing|textile|garment/i, key: 'fashion' },
  {
    re: /grocery|gourmet|grain|rice|wheat|oils|spices|beverages|packaged|groceries|food/i,
    key: 'grocery',
  },
];

const REMOTE_FALLBACK: Record<CategoryCoverKey, string> = {
  watches: unsplash('photo-1523170335258-fcd31818e03f'),
  jewelry: unsplash('photo-1515562141207-7a168fb98a02'),
  baby: unsplash('photo-1515488042361-ee00e0ddd4e4'),
  pet: unsplash('photo-1450778869180-41d573580173'),
  automotive:
    CUSTOM_COVER_URLS.automotive ?? unsplash('photo-1492144534655-ae79c964c9d7'),
  office: unsplash('photo-1497366216548-37526070297c'),
  sports: CUSTOM_COVER_URLS.sports ?? unsplash('photo-1571019613454-1cb2f99b2d8b'),
  health: CUSTOM_COVER_URLS.health ?? unsplash('photo-1576091160399-112ba8d25d1d'),
  beauty: CUSTOM_COVER_URLS.beauty ?? unsplash('photo-1596462502278-27bfd403ccb2'),
  toys: CUSTOM_COVER_URLS.toys ?? unsplash('photo-1558618666-fcd25c85cd64'),
  home: CUSTOM_COVER_URLS.home ?? unsplash('photo-1556911220-bff31c812dba'),
  computers: unsplash('photo-1517336714731-489689fd1ca8'),
  electronics:
    CUSTOM_COVER_URLS.electronics ?? unsplash('photo-1498049794561-7780e7231661'),
  fashion: CUSTOM_COVER_URLS.fashion ?? unsplash('photo-1441986300917-64674bd600d8'),
  grocery: unsplash('photo-1542838132-92c53300491e'),
  default: unsplash('photo-1472851294608-062f824d29cc'),
};

function parseIconFieldAsUrl(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const t = icon.trim();
  if (!t) return null;
  if (/^[A-Za-z][a-zA-Z0-9]*$/.test(t) && t.length <= 32) {
    return null;
  }
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/') && /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(t)) return t;
  if (t.startsWith('/') && (t.includes('/storage/') || t.includes('/uploads/'))) return t;
  return null;
}

export function resolveCategoryCoverKey(slug: string, name: string): CategoryCoverKey {
  const hay = `${slug} ${name}`.toLowerCase();
  for (const { re, key } of RULES) {
    if (re.test(hay)) return key;
  }
  return 'default';
}

function curatedCoverForKey(key: CategoryCoverKey): string {
  return CUSTOM_COVER_URLS[key] ?? REMOTE_FALLBACK[key];
}

/** Last-resort cover when a URL fails to load (used by BuyerCategoryCoverMedia). */
export function getCategoryCoverFallbackUrl(slug?: string, name?: string): string {
  const key = slug ? resolveCategoryCoverKey(slug, name ?? '') : 'default';
  return REMOTE_FALLBACK[key];
}

export function getCategoryCoverRemoteFallback(slug: string, name: string): string {
  const key = resolveCategoryCoverKey(slug, name);
  return REMOTE_FALLBACK[key];
}

/**
 * Returns a cover image URL for category cards (hero photo or admin-provided image).
 */
export function getCategoryCoverImageUrl(
  slug: string,
  name: string,
  icon: string | null | undefined,
): string {
  const adminUrl = parseIconFieldAsUrl(icon);
  if (adminUrl) return adminUrl;
  const key = resolveCategoryCoverKey(slug, name);
  return curatedCoverForKey(key);
}

const OPTIMIZABLE_HOSTS = new Set(['images.unsplash.com', 'images.pexels.com', 'res.cloudinary.com']);

export function categoryCoverShouldUseNextImage(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return OPTIMIZABLE_HOSTS.has(host);
  } catch {
    return false;
  }
}
