import { NextApiRequest, NextApiResponse } from 'next';

const SITE_URL = 'https://carryofy.com';

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact', priority: 0.8, changefreq: 'monthly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/careers', priority: 0.6, changefreq: 'weekly' },
  { path: '/help', priority: 0.7, changefreq: 'monthly' },
  { path: '/merchant-onboarding', priority: 0.9, changefreq: 'weekly' },
  { path: '/auth/signup', priority: 0.8, changefreq: 'monthly' },
  { path: '/auth/login', priority: 0.7, changefreq: 'monthly' },
  { path: '/buyer/products', priority: 0.9, changefreq: 'daily' },
  { path: '/buyer/categories', priority: 0.8, changefreq: 'weekly' },
  { path: '/seller/onboard', priority: 0.8, changefreq: 'monthly' },
];

function generateSitemapXml(urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number }>) {
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
    <priority>${url.priority}</priority>
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
    const urls = staticPages.map(page => ({
      loc: `${SITE_URL}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    }));

    // Here you could also fetch dynamic product URLs from your database
    // Example (commented out - implement when API is available):
    // try {
    //   const productsResponse = await fetch(`${process.env.API_URL}/products?limit=1000`);
    //   const products = await productsResponse.json();
    //   products.forEach((product: { id: string; updatedAt: string }) => {
    //     urls.push({
    //       loc: `${SITE_URL}/buyer/products/${product.id}`,
    //       lastmod: product.updatedAt?.split('T')[0] || today,
    //       changefreq: 'weekly',
    //       priority: 0.6,
    //     });
    //   });
    // } catch (error) {
    //   console.error('Error fetching products for sitemap:', error);
    // }

    const sitemap = generateSitemapXml(urls);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ error: 'Error generating sitemap' });
  }
}

