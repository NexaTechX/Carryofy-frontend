import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../../components/seller/SellerLayout';
import {
  ProductWizardForm,
  ProductWizardInitialProduct,
} from '../../../../components/seller/product/ProductWizardForm';
import { useAuth } from '../../../../lib/auth';
import { apiClient } from '../../../../lib/api/client';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const productId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [fetching, setFetching] = useState(true);
  const [initialProduct, setInitialProduct] = useState<ProductWizardInitialProduct | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [router, authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!productId || authLoading || !isAuthenticated) return;

    const load = async () => {
      setFetching(true);
      try {
        const res = await apiClient.get(`/products/${productId}`);
        const data = res.data?.data || res.data;
        setInitialProduct({
          title: data.title,
          description: data.description || '',
          price: data.price,
          images: data.images || [],
          quantity: data.quantity,
          categoryIds:
            data.categoryIds?.length > 0
              ? data.categoryIds
              : data.categoryId
                ? [data.categoryId]
                : [],
          material: data.material,
          careInfo: data.careInfo,
          keyFeatures: data.keyFeatures || [],
          sellingMode: data.sellingMode,
          moq: data.moq,
          priceTiers: data.priceTiers,
        });
      } catch (e) {
        console.error('Error fetching product:', e);
        toast.error('Failed to load product');
        router.push('/seller/products');
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [productId, authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (fetching || !initialProduct || !productId) {
    return (
      <>
        <Head>
          <title>Edit Product - Seller Portal | Carryofy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <SellerLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#ffcc99]">Loading product...</p>
            </div>
          </div>
        </SellerLayout>
      </>
    );
  }

  return <ProductWizardForm variant="edit" productId={productId} initialProduct={initialProduct} />;
}
