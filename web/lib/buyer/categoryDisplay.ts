/**
 * Supply-oriented category display names for buyer-facing UI.
 * Maps slugs to professional, capitalized names. Unknown slugs use capitalized fallback.
 */

const SUPPLY_NAMES: Record<string, string> = {
  cream: 'Beauty & Personal Care',
  'beauty-personal-care': 'Beauty & Personal Care',
  grains: 'Food & Agriculture',
  'grain-and-rice': 'Food & Agriculture',
  'grains-rice': 'Food & Agriculture',
  oils: 'Oils & Fats',
  packaged: 'Packaged Goods',
  spices: 'Spices & Seasonings',
  beverages: 'Beverages',
  'personal-care': 'Beauty & Personal Care',
  electronics: 'Electronics',
  fashion: 'Fashion & Apparel',
  groceries: 'Food & Agriculture',
};

function capitalizeWords(value: string): string {
  return value
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns a supply-oriented display name for a category.
 * @param slug - Category slug (e.g. "cream", "grains-rice")
 * @param fallbackName - Optional name from API (e.g. category.name) used when slug has no mapping
 */
export function categoryDisplayName(slug: string, fallbackName?: string): string {
  const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
  if (SUPPLY_NAMES[normalizedSlug]) {
    return SUPPLY_NAMES[normalizedSlug];
  }
  const fallback = (fallbackName || slug).trim();
  return fallback ? capitalizeWords(fallback.replace(/-/g, ' ')) : slug;
}
