/**
 * Category hero/cover images for buyer UI.
 * Uses admin `icon` when it is already an image URL; otherwise maps slug/name to curated stock photography.
 */

const unsplash = (path: string) =>
  `https://images.unsplash.com/${path}?auto=format&fit=crop&w=560&h=640&q=82`;

const COVERS = {
  watches: unsplash('photo-1523170335258-fcd31818e03f'),
  jewelry: unsplash('photo-1515562141207-7a168fb98a02'),
  baby: unsplash('photo-1515488042361-ee00e0ddd4e4'),
  pet: unsplash('photo-1450778869180-41d573580173'),
  automotive: unsplash('photo-1492144534655-ae79c964c9d7'),
  office: unsplash('photo-1497366216548-37526070297c'),
  sports: unsplash('photo-1571019613454-1cb2f99b2d8b'),
  health: unsplash('photo-1576091160399-112ba8d25d1d'),
  beauty: unsplash('photo-1596462502278-27bfd403ccb2'),
  toys: unsplash('photo-1558064944-ff56791837e8'),
  home: unsplash('photo-1556911220-bff31c812dba'),
  computers: unsplash('photo-1517336714731-489689fd1ca8'),
  electronics: unsplash('photo-1498049794561-7780e7231661'),
  fashion: unsplash('photo-1441986300917-64674bd600d8'),
  pantry: unsplash('photo-1542838132-92c53300491e'),
  default: unsplash('photo-1472851294608-062f824d29cc'),
} as const;

const RULES: { re: RegExp; src: string }[] = [
  { re: /watches|timepiece/i, src: COVERS.watches },
  { re: /jewelry|luxury/i, src: COVERS.jewelry },
  { re: /\bbaby\b|baby[\s-]product/i, src: COVERS.baby },
  { re: /pet[\s-]suppl|\bpets?\b/i, src: COVERS.pet },
  { re: /automotive|\bauto\b|car\s*&\s*tool/i, src: COVERS.automotive },
  { re: /office|school\s*suppl/i, src: COVERS.office },
  { re: /sports|fitness/i, src: COVERS.sports },
  { re: /health|household/i, src: COVERS.health },
  { re: /beauty|personal\s*care|cosmetic|skincare|\bcream\b/i, src: COVERS.beauty },
  { re: /toys|games/i, src: COVERS.toys },
  { re: /home|kitchen|furniture/i, src: COVERS.home },
  { re: /computers?\b|laptop|\bpc\b/i, src: COVERS.computers },
  { re: /electronics|gadget|smartphone|phone/i, src: COVERS.electronics },
  { re: /fashion|apparel|clothing|textile/i, src: COVERS.fashion },
  {
    re: /grocery|gourmet|grain|rice|wheat|oils|spices|beverages|packaged|groceries/i,
    src: COVERS.pantry,
  },
];

function parseIconFieldAsUrl(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const t = icon.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/') && /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(t)) return t;
  if (t.startsWith('/') && (t.includes('/storage/') || t.includes('/uploads/'))) return t;
  return null;
}

function curatedCoverForText(haystack: string): string {
  const h = haystack.toLowerCase();
  for (const { re, src } of RULES) {
    if (re.test(h)) return src;
  }
  return COVERS.default;
}

/**
 * Returns a cover image URL for category cards (hero photo or admin-provided image).
 */
export function getCategoryCoverImageUrl(
  slug: string,
  name: string,
  icon: string | null | undefined,
): string {
  return parseIconFieldAsUrl(icon) ?? curatedCoverForText(`${slug} ${name}`);
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
