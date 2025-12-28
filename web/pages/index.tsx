import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import ProblemSection from '../components/landing/ProblemSection';
import WhyChooseCarryofy from '../components/landing/WhyChooseCarryofy';
import FeaturedProducts from '../components/landing/FeaturedProducts';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';
import SEO, { PAGE_SEO, generateKeywords } from '../components/seo/SEO';
import { CombinedSchema } from '../components/seo/JsonLd';
import { Product } from '../types/product';
import { GetServerSideProps } from 'next';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

interface HomeProps {
  products: Product[];
  productsError?: string;
}

export default function Home({ products, productsError }: HomeProps) {
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
    'Lagos marketplace',
    'local sellers Lagos',

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

    // Buyer-focused keywords
    'shop from local sellers Lagos',
    'trusted sellers Lagos',
    'buyer protection Lagos',
    'reliable delivery Lagos',

    // Location variations - Lagos focus
    'ecommerce Lagos',
    'online shopping Lagos',
    'delivery service Lagos',
    'marketplace Lagos',
    'online store Lagos',
    'local delivery Lagos',
    'Lagos ecommerce platform',

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
        title="Carryofy - Same-Day Delivery from Trusted Local Sellers in Lagos"
        description="Carryofy enables same-day delivery for trusted local sellers in Lagos. Shop from verified sellers and get fast, reliable delivery without WhatsApp stress. Order today, receive today."
        keywords={fullKeywords}
        canonical="https://carryofy.com"
        ogType="website"
        ogImage="https://carryofy.com/og/home.png"
        ogImageAlt="Carryofy - Same-Day Delivery from Trusted Local Sellers in Lagos"
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
            answer: 'Carryofy helps urban customers in Lagos get same-day delivery from trusted local sellers, without WhatsApp stress. We connect you with verified sellers and handle reliable delivery.',
          },
          {
            question: 'How fast is delivery on Carryofy?',
            answer: 'Carryofy offers same-day delivery in Lagos. Order today, receive today. Or your money back.',
          },
          {
            question: 'How do I become a seller on Carryofy?',
            answer: 'Simply click "Become a Seller" on our homepage, create an account, and follow the onboarding process. Our team will review your application and guide you through the setup.',
          },
          {
            question: 'Is Carryofy available outside Lagos?',
            answer: 'Carryofy is currently focused on Lagos. We\'re building our delivery network to serve Lagos reliably first before expanding to other cities.',
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
          <WhyChooseCarryofy />
          <HowItWorks />
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
    // Fetch featured products
    const [productsResponse] = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/products`, {
        params: {
          status: 'ACTIVE',
          limit: 8,
          page: 1,
        },
        timeout: 15000, // Increased timeout for server-side rendering (15 seconds)
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
      
      // Only log non-connection errors (connection refused is expected if backend isn't running)
      if (error?.code !== 'ECONNREFUSED') {
        console.error('Error fetching products for homepage:', error);
        console.error('Error details:', {
          code: error?.code,
          message: error?.message,
          response: error?.response?.status,
        });
      } else {
        // Quietly handle connection refused - backend likely not running
        console.warn('API server not available. Make sure the backend is running on port 3000.');
      }
      
      // Only set error if it's a real connection issue
      if (error?.code === 'ECONNREFUSED' || error?.response?.status >= 500) {
        productsError = 'Unable to load products at this time';
      }
      // If it's a 404 or empty, don't show error - just empty products
    }

    return {
      props: {
        products, // Always an array, even if empty
        ...(productsError && products.length === 0 && { productsError }), // Only show error if no products AND there's an error
      },
    };
  } catch (error: any) {
    console.error('Error in getServerSideProps:', error.message);

    // Return empty arrays on failure
    return {
      props: {
        products: [],
        productsError: 'Unable to load products at this time',
      },
    };
  }
};

