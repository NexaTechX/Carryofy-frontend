import { NextApiRequest, NextApiResponse } from 'next';

const SITE_URL = 'https://carryofy.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Product {
  id: string;
  title: string;
  updatedAt: string;
  images?: string[];
}

function generateProductSitemapXml(products: Product[]) {
  const today = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${products.map(product => {
  const lastmod = product.updatedAt ? product.updatedAt.split('T')[0] : today;
  const imageTag = product.images && product.images.length > 0 
    ? `
    <image:image>
      <image:loc>${product.images[0]}</image:loc>
      <image:title>${escapeXml(product.title)}</image:title>
    </image:image>` 
    : '';
  
  return `  <url>
    <loc>${SITE_URL}/buyer/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>${imageTag}
  </url>`;
}).join('\n')}
</urlset>`;
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Fetch products from API
    let products: Product[] = [];
    
    try {
      const response = await fetch(`${API_URL}/products?limit=1000&status=active`);
      if (response.ok) {
        const data = await response.json();
        products = data.data || data || [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return empty sitemap if API fails
    }

    const sitemap = generateProductSitemapXml(products);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating product sitemap:', error);
    return res.status(500).json({ error: 'Error generating sitemap' });
  }
}

