import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import FeaturedProducts from '../components/landing/FeaturedProducts';
import ProductCategories from '../components/landing/ProductCategories';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';
import SEO, { PAGE_SEO, generateKeywords } from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';
import { Product } from '../types/product';
import { GetServerSideProps } from 'next';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  productCount?: number;
}

interface HomeProps {
  products: Product[];
  productsError?: string;
  categories: Category[];
  categoriesError?: string;
}

export default function Home({ products, productsError, categories, categoriesError }: HomeProps) {
  // Comprehensive keywords for maximum SEO coverage
  const homeKeywords = generateKeywords(['primary', 'problemAware', 'longTail', 'brand', 'locations', 'industry']);

  // Additional long-tail keywords specifically for homepage
  const additionalKeywords = [
    // E-commerce intent keywords
    'buy online Nigeria',
    'sell online Nigeria',
    'online shopping Nigeria',
    'ecommerce Nigeria',
    'online marketplace Nigeria',
    'buy and sell Nigeria',
    'online store Nigeria',
    'shop online Lagos',
    'Nigerian marketplace',
    'African ecommerce',

    // Delivery and logistics keywords
    'same day delivery Nigeria',
    'same day delivery Lagos',
    'fast delivery Nigeria',
    'express delivery Lagos',
    'delivery service Nigeria',
    'courier service Lagos',
    'logistics Nigeria',
    'shipping Nigeria',
    'order delivery Nigeria',
    'parcel delivery Lagos',

    // Business and merchant keywords
    'start online business Nigeria',
    'sell products online Africa',
    'merchant platform Nigeria',
    'vendor marketplace Africa',
    'business platform Nigeria',
    'dropshipping Nigeria',
    'fulfillment service Nigeria',
    'warehouse Nigeria',
    'inventory management Nigeria',

    // AI and technology keywords
    'AI ecommerce Nigeria',
    'AI commerce platform',
    'intelligent commerce',
    'smart logistics Nigeria',
    'automated delivery',
    'AI powered marketplace',

    // Location variations
    'ecommerce Lagos',
    'online shopping Abuja',
    'delivery service Port Harcourt',
    'marketplace Ibadan',
    'online store Kano',
    'West Africa ecommerce',
    'African online marketplace',

    // Problem/Solution keywords
    'reliable delivery Nigeria',
    'trusted marketplace Nigeria',
    'secure online shopping Nigeria',
    'best ecommerce platform Nigeria',
    'top delivery service Lagos',
    'affordable shipping Nigeria',
    'quick delivery Nigeria',

    // Competitor alternative keywords
    'jumia alternative',
    'konga alternative',
    'better than jumia',
    'Nigerian amazon',
    'local ecommerce Nigeria',
  ].join(', ');

  const fullKeywords = `${homeKeywords}, ${additionalKeywords}`;

  return (
    <>
      <SEO
        title="Carryofy - #1 AI-Powered E-Commerce & Logistics Platform in Nigeria | Same-Day Delivery Africa"
        description="Carryofy is Africa's leading AI-powered commerce platform. Buy and sell online in Nigeria with same-day delivery in Lagos. Integrated marketplace, logistics, warehousing, and fulfillment for African merchants. Join 12,000+ sellers. 99.8% satisfaction rate."
        keywords={fullKeywords}
        canonical="https://carryofy.com"
        ogType="website"
        ogImage="https://carryofy.com/og/home.png"
        ogImageAlt="Carryofy - AI-Powered E-Commerce Platform for Africa with Same-Day Delivery"
      />

      <CombinedSchema
        includeOrganization
        includeWebsite
        includeSoftwareApp
        breadcrumbs={[
          { name: 'Home', url: '/' },
        ]}
        faqs={[
          {
            question: 'What is Carryofy?',
            answer: 'Carryofy is an AI-powered e-commerce platform that unifies marketplace, logistics, warehousing, and delivery into one intelligent platform, built specifically for African merchants and buyers.',
          },
          {
            question: 'How fast is delivery on Carryofy?',
            answer: 'Carryofy offers same-day delivery in Lagos and major Nigerian cities, with 2-5 business day delivery for other areas across Nigeria.',
          },
          {
            question: 'How do I become a seller on Carryofy?',
            answer: 'Simply click "Become a Merchant" on our homepage, create an account, and follow the onboarding process. Our team will review your application and guide you through the setup with zero upfront costs.',
          },
          {
            question: 'Is Carryofy available outside Nigeria?',
            answer: 'Carryofy is currently focused on Nigeria but is expanding to other African countries including Ghana, Kenya, and South Africa. Sign up for updates on our expansion.',
          },
          {
            question: 'What payment methods does Carryofy accept?',
            answer: 'Carryofy accepts various payment methods including bank transfers, debit/credit cards (Visa, Mastercard), and mobile money. All transactions are secure and encrypted.',
          },
        ]}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <ProblemSection />
          <SolutionSection />
          <WhyChooseCarryofy />
          <HowItWorks />
          <ProductCategories categories={categories} products={products} />
          <FeaturedProducts products={products} error={productsError} />
          <Testimonials />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    // Fetch featured products and categories in parallel
    const [productsResponse, categoriesResponse] = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/products`, {
        params: {
          status: 'ACTIVE',
          limit: 8,
          page: 1,
        },
        timeout: 5000,
      }),
      axios.get(`${API_BASE_URL}/categories`, {
        timeout: 5000,
      }),
    ]);

    // Handle products
    let products: Product[] = [];
    let productsError: string | undefined;

    if (productsResponse.status === 'fulfilled') {
      try {
        const response = productsResponse.value;
        const status = response.status;
        
        // Check if response is successful
        if (status >= 200 && status < 300) {
          // Handle different response structures
          // API returns: { products: [], total: 0, page: 1, limit: 20, totalPages: 0 }
          // Or wrapped: { data: { products: [], ... } }
          let responseData = response.data;
          
          // Log for debugging
          console.log('Products API Response Status:', status);
          console.log('Products API Response Data Keys:', Object.keys(responseData || {}));
          
          // Unwrap if wrapped by TransformInterceptor or NestJS response wrapper
          if (responseData?.data && typeof responseData.data === 'object' && 'products' in responseData.data) {
            responseData = responseData.data;
          }
          
          // Extract products array - API returns ProductListResponseDto with products array
          const productsArray = Array.isArray(responseData?.products) 
            ? responseData.products 
            : Array.isArray(responseData) 
              ? responseData 
              : [];
          
          console.log('Extracted products count:', productsArray.length);
          
          if (productsArray.length > 0) {
            products = productsArray.map((product: any) => ({
              ...product,
              name: product.title || product.name,
              stockQuantity: product.quantity ?? product.stockQuantity ?? 0,
              // Ensure all required fields are present
              id: product.id,
              price: product.price || 0,
              images: product.images || [],
              category: product.category || '',
              createdAt: product.createdAt || new Date().toISOString(),
              updatedAt: product.updatedAt || new Date().toISOString(),
            }));
            console.log('Successfully mapped products:', products.length);
          } else {
            // No products found, but not an error - just empty
            console.log('No products found in response - this is normal if no products exist');
          }
        } else {
          console.error('Products API returned non-2xx status:', status);
          productsError = 'Unable to load products at this time';
        }
      } catch (parseError: any) {
        console.error('Error parsing products response:', parseError);
        console.error('Response data:', productsResponse.value?.data);
        productsError = 'Unable to parse products data';
      }
    } else {
      const error = productsResponse.reason;
      console.error('Error fetching products for homepage:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        response: error?.response?.status,
      });
      
      // Only set error if it's a real connection issue
      if (error?.code === 'ECONNREFUSED' || error?.response?.status >= 500) {
        productsError = 'Unable to load products at this time';
      }
      // If it's a 404 or empty, don't show error - just empty products
    }

    // Handle categories - always ensure it's an array, never undefined or null
    let categories: Category[] = [];
    let categoriesError: string | undefined;

    if (categoriesResponse.status === 'fulfilled') {
      const responseData = categoriesResponse.value.data?.data || categoriesResponse.value.data;
      categories = Array.isArray(responseData?.categories) ? responseData.categories : [];
    } else {
      console.error('Error fetching categories for homepage:', categoriesResponse.reason);
      categoriesError = 'Unable to load categories at this time';
      // categories is already initialized as empty array, so no need to reassign
    }

    return {
      props: {
        products, // Always an array, even if empty
        ...(productsError && products.length === 0 && { productsError }), // Only show error if no products AND there's an error
        categories, // Always an array, never undefined or null
        ...(categoriesError && categories.length === 0 && { categoriesError }), // Only show error if no categories AND there's an error
      },
    };
  } catch (error: any) {
    console.error('Error in getServerSideProps:', error.message);

    // Return empty arrays on failure
    return {
      props: {
        products: [],
        productsError: 'Unable to load products at this time',
        categories: [], // Always return an array, never undefined
        categoriesError: 'Unable to load categories at this time',
      },
    };
  }
};

