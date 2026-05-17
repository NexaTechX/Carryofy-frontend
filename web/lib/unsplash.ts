export type UnsplashSize = { w?: number; h?: number; q?: number };

/** Stable Unsplash CDN URLs (`ixlib` reduces intermittent fetch/optimizer failures). */
export function unsplashPhoto(path: string, size: UnsplashSize = {}): string {
  const { w = 1200, h, q = 85 } = size;
  const params = new URLSearchParams({
    ixlib: 'rb-4.0.3',
    auto: 'format',
    fit: 'crop',
    q: String(q),
    w: String(w),
  });
  if (h != null) params.set('h', String(h));
  const id = path.replace(/^\//, '');
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}
