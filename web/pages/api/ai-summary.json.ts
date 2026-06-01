import { NextApiRequest, NextApiResponse } from 'next';
import {
  BRAND_TAGLINE,
  CARRYOFY_GEO,
  DEFAULT_CONTACT_PHONE,
  GEO_ABSTRACT,
  LAGOS_SERVICE_CORRIDORS,
} from '../../components/seo/geo';

const SITE_URL = 'https://carryofy.com';
const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  category?: string;
  quantity: number;
  seller: {
    businessName: string;
  };
}

interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface SiteSummary {
  name: string;
  tagline: string;
  description: string;
  url: string;
  type: string;
  location: {
    country: string;
    countryCode: string;
    city: string;
    region: string;
    coordinates: { latitude: number; longitude: number };
    timezone: string;
    serviceCorridors: string[];
  };
  contact: {
    email: string;
    phone: string;
    supportUrl: string;
    helpUrl: string;
  };
  abstract: string;
  llmsTxtUrl: string;
  services: string[];
  features: string[];
  statistics: {
    totalProducts: number;
    totalCategories: number;
    averageProductPrice: string;
  };
  categories: Array<{
    name: string;
    slug: string;
    url: string;
    productCount?: number;
  }>;
  featuredProducts: Array<{
    id: string;
    title: string;
    price: string;
    priceNumeric: number;
    description: string;
    url: string;
    image?: string;
    seller: string;
    inStock: boolean;
    category?: string;
  }>;
  pages: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  lastUpdated: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const today = new Date().toISOString();

    // Fetch products and categories
    let products: Product[] = [];
    let categories: Category[] = [];
    let totalProducts = 0;

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/products?limit=50&status=ACTIVE&sortBy=newest`),
        fetch(`${API_URL}/categories`),
      ]);

      if (productsRes.ok) {
        const prodData = await productsRes.json();
        const responseData = prodData.data || prodData;
        products = responseData.products || [];
        totalProducts = responseData.total || products.length;
      }

      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        categories = (catData.data?.categories || catData.categories || []).filter((c: Category) => c.isActive);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    // Calculate average price
    const avgPrice = products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length / 100
      : 0;

    const formatPrice = (priceInKobo: number) => {
      return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    const summary: SiteSummary = {
      name: 'Carryofy',
      tagline: BRAND_TAGLINE,
      description: GEO_ABSTRACT,
      abstract: GEO_ABSTRACT,
      url: SITE_URL,
      llmsTxtUrl: `${SITE_URL}/llms.txt`,
      type: 'Best B2B Wholesaler E-Commerce — Nigeria & Africa',
      location: {
        country: CARRYOFY_GEO.country,
        countryCode: CARRYOFY_GEO.countryCode,
        city: CARRYOFY_GEO.city,
        region: CARRYOFY_GEO.region,
        coordinates: {
          latitude: CARRYOFY_GEO.latitude,
          longitude: CARRYOFY_GEO.longitude,
        },
        timezone: CARRYOFY_GEO.timezone,
        serviceCorridors: [...LAGOS_SERVICE_CORRIDORS],
      },
      contact: {
        email: 'support@carryofy.com',
        phone: DEFAULT_CONTACT_PHONE,
        supportUrl: `${SITE_URL}/contact`,
        helpUrl: `${SITE_URL}/help`,
      },
      services: [
        'B2B Wholesale Marketplace',
        'Verified Vendor Network',
        'Coordinated Lagos Delivery',
        'Retail Sourcing',
        'Vendor Onboarding',
        'Order Support',
      ],
      features: [
        'Verified wholesale vendors',
        'Unit price comparison',
        'Category browse',
        'Coordinated corridor delivery',
        'Secure payments',
        'Order status updates',
      ],
      statistics: {
        totalProducts,
        totalCategories: categories.length,
        averageProductPrice: `₦${avgPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      },
      categories: categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        url: `${SITE_URL}/buyer/products?category=${cat.slug}`,
      })),
      featuredProducts: products.slice(0, 20).map(product => ({
        id: product.id,
        title: product.title,
        price: formatPrice(product.price),
        priceNumeric: product.price / 100,
        description: product.description?.slice(0, 200) || `Quality ${product.title} available on Carryofy`,
        url: `${SITE_URL}/buyer/products/${product.id}`,
        image: product.images?.[0],
        seller: product.seller?.businessName || 'Carryofy Seller',
        inStock: product.quantity > 0,
        category: product.category,
      })),
      pages: [
        {
          title: 'Home',
          url: SITE_URL,
          description: GEO_ABSTRACT,
        },
        {
          title: 'Wholesale Products',
          url: `${SITE_URL}/buyer/products`,
          description: 'Browse verified wholesale suppliers and compare unit prices for Lagos retailers',
        },
        {
          title: 'About Us',
          url: `${SITE_URL}/about`,
          description: 'Mission and story — B2B sourcing network for Lagos retailers',
        },
        {
          title: 'Become a Vendor',
          url: `${SITE_URL}/merchant-onboarding`,
          description: 'Apply to sell wholesale on Carryofy and reach Lagos retailers',
        },
        {
          title: 'Help Center',
          url: `${SITE_URL}/help`,
          description: 'Find answers to common questions about shopping, shipping, and selling',
        },
        {
          title: 'Contact',
          url: `${SITE_URL}/contact`,
          description: 'Get in touch with Carryofy support for any inquiries',
        },
        {
          title: 'Careers',
          url: `${SITE_URL}/careers`,
          description: 'Join the Carryofy team and help transform commerce in Africa',
        },
      ],
      lastUpdated: today,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return res.status(500).json({ error: 'Error generating site summary' });
  }
}

