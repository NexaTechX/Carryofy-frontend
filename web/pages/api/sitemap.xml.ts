import { NextApiRequest, NextApiResponse } from 'next';

const SITE_URL = 'https://carryofy.com';
const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

interface Product {
  id: string;
  title: string;
  updatedAt: string;
  images?: string[];
}

interface Category {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/products', priority: 1.0, changefreq: 'hourly' },
  { path: '/about', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact', priority: 0.8, changefreq: 'monthly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/careers', priority: 0.6, changefreq: 'weekly' },
  { path: '/help', priority: 0.7, changefreq: 'monthly' },
  { path: '/merchant-onboarding', priority: 0.9, changefreq: 'weekly' },
  { path: '/auth/signup', priority: 0.8, changefreq: 'monthly' },
  { path: '/auth/login', priority: 0.7, changefreq: 'monthly' },
];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateSitemapXml(urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number; image?: string; imageTitle?: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.image ? `
    <image:image>
      <image:loc>${url.image}</image:loc>
      <image:title>${escapeXml(url.imageTitle || 'Carryofy')}</image:title>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Generate URLs for static pages
    const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number; image?: string; imageTitle?: string }> = staticPages.map(page => ({
      loc: `${SITE_URL}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    }));

    // Fetch categories for category listing pages
    try {
      const categoriesResponse = await fetch(`${API_URL}/categories`);
      if (categoriesResponse.ok) {
        const catData = await categoriesResponse.json();
        const categories: Category[] = catData.data?.categories || catData.categories || [];
        
        categories
          .filter(cat => cat.isActive)
          .forEach(category => {
            urls.push({
              loc: `${SITE_URL}/products?category=${category.slug}`,
              lastmod: today,
              changefreq: 'daily',
              priority: 0.85,
            });
          });
      }
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error);
    }

    // Fetch products - prioritize recent and popular
    try {
      const productsResponse = await fetch(`${API_URL}/products?limit=500&status=ACTIVE&sortBy=updatedAt&sortOrder=desc`);
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        const products: Product[] = data.data?.products || data.products || [];
        
        products.forEach((product) => {
          urls.push({
            loc: `${SITE_URL}/products/${product.id}`,
            lastmod: product.updatedAt?.split('T')[0] || today,
            changefreq: 'weekly',
            priority: 0.7,
            image: product.images?.[0],
            imageTitle: product.title,
          });
        });
      }
    } catch (error) {
      console.error('Error fetching products for sitemap:', error);
    }

    const sitemap = generateSitemapXml(urls);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ error: 'Error generating sitemap' });
  }
}
