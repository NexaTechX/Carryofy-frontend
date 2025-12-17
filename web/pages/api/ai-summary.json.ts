import { NextApiRequest, NextApiResponse } from 'next';

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
  description: string;
  url: string;
  type: string;
  location: {
    country: string;
    city: string;
    region: string;
  };
  contact: {
    email: string;
    supportUrl: string;
    helpUrl: string;
  };
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
        fetch(`${API_URL}/products?limit=50&status=ACTIVE&sortBy=createdAt&sortOrder=desc`),
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
      description: "Carryofy is Nigeria's leading AI-powered e-commerce platform that unifies marketplace, logistics, warehousing, and same-day delivery. Connect with verified sellers, shop quality products, and enjoy fast delivery across Nigeria.",
      url: SITE_URL,
      type: 'E-commerce Marketplace',
      location: {
        country: 'Nigeria',
        city: 'Lagos',
        region: 'West Africa',
      },
      contact: {
        email: 'support@carryofy.com',
        supportUrl: `${SITE_URL}/contact`,
        helpUrl: `${SITE_URL}/help`,
      },
      services: [
        'Online Marketplace',
        'Same-Day Delivery in Lagos',
        'Express Shipping Nationwide',
        'Warehouse & Fulfillment',
        'Merchant Services',
        'Buyer Protection',
        'Secure Payments',
      ],
      features: [
        'AI-Powered Recommendations',
        'Verified Sellers',
        'Quality-Checked Products',
        'Real-Time Order Tracking',
        'Multiple Payment Options',
        '7-Day Return Policy',
        '24/7 Customer Support',
      ],
      statistics: {
        totalProducts,
        totalCategories: categories.length,
        averageProductPrice: `₦${avgPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      },
      categories: categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        url: `${SITE_URL}/products?category=${cat.slug}`,
      })),
      featuredProducts: products.slice(0, 20).map(product => ({
        id: product.id,
        title: product.title,
        price: formatPrice(product.price),
        priceNumeric: product.price / 100,
        description: product.description?.slice(0, 200) || `Quality ${product.title} available on Carryofy`,
        url: `${SITE_URL}/products/${product.id}`,
        image: product.images?.[0],
        seller: product.seller?.businessName || 'Carryofy Seller',
        inStock: product.quantity > 0,
        category: product.category,
      })),
      pages: [
        {
          title: 'Home',
          url: SITE_URL,
          description: 'AI-powered e-commerce platform for Nigeria with same-day delivery in Lagos',
        },
        {
          title: 'All Products',
          url: `${SITE_URL}/products`,
          description: 'Browse thousands of products from verified Nigerian sellers with fast delivery',
        },
        {
          title: 'About Us',
          url: `${SITE_URL}/about`,
          description: 'Learn about Carryofy, Nigeria\'s trusted e-commerce and logistics platform',
        },
        {
          title: 'Become a Seller',
          url: `${SITE_URL}/merchant-onboarding`,
          description: 'Join thousands of merchants selling on Carryofy with zero upfront costs',
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

