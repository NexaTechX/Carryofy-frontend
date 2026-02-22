import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Link from 'next/link';
import SellerLayout from '../../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../../lib/auth';
import { apiClient } from '../../../../lib/api/client';
import { useCategories } from '../../../../lib/buyer/hooks/useCategories';
import { X, Plus, AlertCircle, Sparkles, Wand2, Loader2, Layers, Check } from 'lucide-react';

type SellingMode = 'B2C_ONLY' | 'B2B_ONLY' | 'B2C_AND_B2B';
type B2bProductType = 'WHOLESALE' | 'DISTRIBUTOR' | 'MANUFACTURER_DIRECT';

interface PriceTier {
  minQuantity: number;
  maxQuantity: number;
  priceKobo: number;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  categoryId: string;
  categoryIds: string[];
  quantity: string;
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  sellingMode?: SellingMode;
  moq?: string;
  leadTimeDays?: string;
  b2bProductType?: B2bProductType;
  requestQuoteOnly?: boolean;
  priceTiers?: { minQuantity: string; maxQuantity: string; priceKobo: string }[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  status: string;
  category?: string;
  categoryId?: string;
  categoryIds?: string[];
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  sellingMode?: SellingMode;
  moq?: number;
  leadTimeDays?: number;
  b2bProductType?: B2bProductType;
  requestQuoteOnly?: boolean;
  priceTiers?: PriceTier[];
}

export default function EditProductPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    categoryId: '',
    categoryIds: [],
    quantity: '',
    material: '',
    careInfo: '',
    keyFeatures: [],
    sellingMode: 'B2C_ONLY',
    moq: '',
    leadTimeDays: '',
    b2bProductType: undefined,
    requestQuoteOnly: false,
    priceTiers: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [aiGeneratingField, setAiGeneratingField] = useState<'description' | 'keyFeatures' | 'material' | 'careInfo' | null>(null);

  // Resolve category for commission display (primary = first in categoryIds, else legacy categoryId/category)
  const selectedCategory = formData.categoryIds?.length
    ? categories.find((c) => c.id === formData.categoryIds[0])
    : formData.categoryId
      ? categories.find((c) => c.id === formData.categoryId)
      : formData.category
        ? categories.find((c) => c.slug === formData.category || c.name === formData.category)
        : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch product data
    if (id) {
      fetchProduct();
    }
  }, [router, id, authLoading, isAuthenticated, user]);

  const fetchProduct = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const product: Product = result.data || result;

        // Populate form with product data
        setFormData({
          title: product.title,
          description: product.description || '',
          price: (product.price / 100).toFixed(2),
          category: product.category || '',
          categoryId: product.categoryId || '',
          categoryIds: product.categoryIds?.length ? product.categoryIds : (product.categoryId ? [product.categoryId] : []),
          quantity: product.quantity.toString(),
          material: product.material || '',
          careInfo: product.careInfo || '',
          keyFeatures: product.keyFeatures || [],
          sellingMode: product.sellingMode || 'B2C_ONLY',
          moq: product.moq != null ? String(product.moq) : '',
          leadTimeDays: product.leadTimeDays != null ? String(product.leadTimeDays) : '',
          b2bProductType: product.b2bProductType,
          requestQuoteOnly: product.requestQuoteOnly ?? false,
          priceTiers: (product.priceTiers || []).map(t => ({
            minQuantity: String(t.minQuantity),
            maxQuantity: String(t.maxQuantity),
            priceKobo: (t.priceKobo / 100).toFixed(2),
          })),
        });

        if (product.images && product.images.length > 0) {
          setImagePreview(product.images[0]);
        }
      } else {
        toast.error('Failed to load product');
        router.push('/seller/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/seller/products');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateKeyFeatures = (features: string[]): string => {
    if (features.length > 3) {
      return 'Maximum 3 key features allowed';
    }
    for (const feature of features) {
      if (!feature.trim()) {
        return 'Key features cannot be empty';
      }
      if (feature.length > 30) {
        return 'Each key feature must be 30 characters or less';
      }
    }
    return '';
  };

  const handleAddKeyFeature = () => {
    const currentFeatures = formData.keyFeatures || [];
    if (currentFeatures.length < 3) {
      setFormData((prev) => ({
        ...prev,
        keyFeatures: [...(prev.keyFeatures || []), ''],
      }));
    }
  };

  const handleRemoveKeyFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keyFeatures: (prev.keyFeatures || []).filter((_, i) => i !== index),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.keyFeatures;
      return newErrors;
    });
  };

  const handleKeyFeatureChange = (index: number, value: string) => {
    const updatedFeatures = [...(formData.keyFeatures || [])];
    updatedFeatures[index] = value;
    setFormData((prev) => ({
      ...prev,
      keyFeatures: updatedFeatures,
    }));

    // Validate on change
    const error = validateKeyFeatures(updatedFeatures);
    setErrors((prev) => ({
      ...prev,
      keyFeatures: error || undefined,
    }));
  };


  type AIGenerateField = 'description' | 'keyFeatures' | 'material' | 'careInfo';

  const handleGenerateAIField = async (field: AIGenerateField) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    setAiGeneratingField(field);
    try {
      const materialCareCategories = ['clothing', 'home', 'fashion', 'beauty', 'sports'];
      const needsMaterialCare = formData.category && materialCareCategories.includes(formData.category);

      const response = await apiClient.post('/products/ai/generate-content', {
        title: formData.title,
        category: formData.category || undefined,
        categoryName: formData.category || undefined,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : undefined,
        existingDescription: formData.description || undefined,
        needsMaterial: needsMaterialCare || false,
        needsCareInfo: needsMaterialCare || false,
      });

      const payload = response.data?.data ?? response.data;

      if (field === 'description' && payload.description) {
        setFormData(prev => ({ ...prev, description: payload.description }));
        toast.success('Description generated');
      } else if (field === 'keyFeatures' && payload.keyFeatures?.length) {
        setFormData(prev => ({ ...prev, keyFeatures: payload.keyFeatures }));
        toast.success('Key features generated');
      } else if (field === 'material' && payload.material) {
        setFormData(prev => ({ ...prev, material: payload.material }));
        toast.success('Material information generated');
      } else if (field === 'careInfo' && payload.careInfo) {
        setFormData(prev => ({ ...prev, careInfo: payload.careInfo }));
        toast.success('Care instructions generated');
      } else {
        toast.error(`No ${field} generated. Try again.`);
      }
    } catch (error: any) {
      console.error('Error generating AI content:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate. Try again.';
      toast.error(errorMessage);
    } finally {
      setAiGeneratingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }


    setLoading(true);
    try {
      const token = tokenManager.getAccessToken();

      // Convert price from naira to kobo (multiply by 100)
      const priceInKobo = Math.round(parseFloat(formData.price) * 100);

      // Validate keyFeatures
      if (formData.keyFeatures) {
        const keyFeaturesError = validateKeyFeatures(formData.keyFeatures);
        if (keyFeaturesError) {
          setErrors({ keyFeatures: keyFeaturesError });
          toast.error(keyFeaturesError);
          setLoading(false);
          return;
        }
      }

      const sellingMode = formData.sellingMode || 'B2C_ONLY';
      const isB2bEnabled = sellingMode === 'B2B_ONLY' || sellingMode === 'B2C_AND_B2B';

      if (!formData.categoryIds?.length) {
        toast.error('Select at least one category');
        setLoading(false);
        return;
      }
      if (formData.categoryIds.length > 10) {
        toast.error('Maximum 10 categories allowed');
        setLoading(false);
        return;
      }

      const productData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: [],
        quantity: parseInt(formData.quantity),
        categoryIds: formData.categoryIds,
        material: formData.material || undefined,
        careInfo: formData.careInfo || undefined,
        sellingMode,
        keyFeatures: formData.keyFeatures && formData.keyFeatures.length > 0
          ? formData.keyFeatures.filter(f => f.trim()).map(f => f.trim())
          : undefined,
      };

      if (isB2bEnabled) {
        if (formData.moq) productData.moq = parseInt(formData.moq, 10);
        if (formData.leadTimeDays) productData.leadTimeDays = parseInt(formData.leadTimeDays, 10);
        if (formData.b2bProductType) productData.b2bProductType = formData.b2bProductType;
        productData.requestQuoteOnly = formData.requestQuoteOnly ?? false;
        if (formData.priceTiers && formData.priceTiers.length > 0 && !formData.requestQuoteOnly) {
          productData.priceTiers = formData.priceTiers
            .filter(t => t.minQuantity && t.maxQuantity && t.priceKobo)
            .map(t => ({
              minQuantity: parseInt(t.minQuantity, 10),
              maxQuantity: parseInt(t.maxQuantity, 10),
              priceKobo: Math.round(parseFloat(t.priceKobo) * 100),
            }));
        }
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(
        `${apiUrl}/products/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );

      if (response.ok) {
        toast.success('Product updated successfully!');
        // Redirect to products page
        router.push('/seller/products');
      } else {
        const error = await response.json();
        toast.error(`Failed to update product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is initializing
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

  // Don't render until auth check is complete
  if (!isAuthenticated || !user) {
    return null;
  }

  if (fetching) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#ffcc99]">Loading product...</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Product - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Edit your product on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div className="bg-black rounded-xl p-4 min-h-full">
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Edit Product
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Product Images Section */}
            <div className="p-4">
              <div className="flex flex-col items-stretch justify-start rounded-xl">
                <div className="w-full">
                  <div className="w-full aspect-video rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30 flex items-center justify-center min-h-[200px] relative overflow-hidden">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 80vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-[#ffcc99] mb-2">No image uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Product Details Form */}
            <div className="p-4">
              <div className="flex flex-col gap-6">
                {/* Product Title */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                    className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                  />
                </div>

                {/* Categories (multi-select) */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Categories <span className="text-red-400">*</span>
                  </label>
                  <p className="text-[#ffcc99]/60 text-xs mb-3">
                    Select one or more categories (up to 10). First selected is primary for commission.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {categories.map((cat) => {
                      const isSelected = (formData.categoryIds || []).includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              const ids = prev.categoryIds || [];
                              if (ids.includes(cat.id)) {
                                return { ...prev, categoryIds: ids.filter(id => id !== cat.id) };
                              }
                              if (ids.length >= 10) return prev;
                              return { ...prev, categoryIds: [...ids, cat.id] };
                            });
                          }}
                          className={`relative p-4 rounded-xl border text-center transition-all ${isSelected
                            ? 'bg-[#ff6600] border-[#ff6600] text-black shadow-lg shadow-[#ff6600]/30'
                            : (formData.categoryIds?.length ?? 0) >= 10 ? 'opacity-60 cursor-not-allowed bg-black border-[#ff6600]/20 text-[#ffcc99]/60'
                            : 'bg-black border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600]/60 hover:bg-[#1a1a1a]'
                            }`}
                          disabled={!formData.categoryIds?.includes(cat.id) && (formData.categoryIds?.length ?? 0) >= 10}
                        >
                          {cat.icon && (
                            <span className="text-2xl block mb-2">{cat.icon}</span>
                          )}
                          <span className="text-sm font-medium block">{cat.name}</span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {(formData.categoryIds?.length ?? 0) > 0 && (
                    <p className="mt-2 text-[#ffcc99]/70 text-xs">
                      Selected: {formData.categoryIds?.length ?? 0}/10
                    </p>
                  )}
                </div>

                {/* AI hint: per-field buttons are next to each section below */}
                {/* <div className="flex items-center gap-2 text-[#ffcc99]/70 text-xs">
                  <Wand2 className="w-4 h-4 text-[#ff6600] shrink-0" />
                  <span>Use &quot;Generate with AI&quot; next to each field below to fill it. Enter a product title first.</span>
                </div> */}

                {/* Key Features */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-white text-sm font-medium">
                      Key Features
                    </label>
                    {/* AI Generate Button - Commented out (no API key yet) */}
                    {/* <button
                      type="button"
                      onClick={() => handleGenerateAIField('keyFeatures')}
                      disabled={!!aiGeneratingField || !formData.title.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#ff6600]/20 border border-[#ff6600]/40 text-[#ff6600] text-xs font-medium hover:bg-[#ff6600]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                    >
                      {aiGeneratingField === 'keyFeatures' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>Generate with AI</span>
                    </button> */}
                  </div>
                  <p className="text-[#ffcc99]/60 text-xs mb-3">
                    Highlight 1-3 key features that appear in the product headline
                  </p>

                  <div className="space-y-2">
                    {(formData.keyFeatures || []).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Feature ${index + 1} (e.g., Wireless, Noise Cancelling)`}
                          value={feature}
                          onChange={(e) => handleKeyFeatureChange(index, e.target.value)}
                          maxLength={30}
                          className={`flex-1 px-4 py-2 rounded-xl bg-[#1a1a1a] border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.keyFeatures ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
                            }`}
                        />
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyFeature(index)}
                            className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                    ))}

                    {(formData.keyFeatures || []).length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddKeyFeature}
                        className="w-full px-4 py-2 rounded-xl border-2 border-dashed border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600]/60 hover:bg-[#ff6600]/5 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Add Key Feature</span>
                      </button>
                    )}
                  </div>

                  {errors.keyFeatures && (
                    <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.keyFeatures}
                    </p>
                  )}

                  {(formData.keyFeatures || []).length > 0 && !errors.keyFeatures && (
                    <div className="mt-3 p-3 bg-[#ff6600]/5 rounded-lg border border-[#ff6600]/10">
                      <p className="text-[#ff6600] text-xs font-medium mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Preview: These features will appear as badges in the product headline
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(formData.keyFeatures || []).filter(f => f.trim()).map((feature, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#ff6600]/20 text-[#ff6600] rounded-full text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Description */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-white text-sm font-medium">
                      Product Description
                    </label>
                    {/* <button
                      type="button"
                      onClick={() => handleGenerateAIField('description')}
                      disabled={!!aiGeneratingField || !formData.title.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#ff6600]/20 border border-[#ff6600]/40 text-[#ff6600] text-xs font-medium hover:bg-[#ff6600]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                    >
                      {aiGeneratingField === 'description' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>Generate with AI</span>
                    </button> */}
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows={4}
                    className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                  />
                </div>

                {/* Commission for this category (read-only) */}
                {selectedCategory && (
                  <div className="p-4 rounded-xl border border-[#ff6600]/30 bg-[#ff6600]/5">
                    <p className="text-[#ffcc99] text-sm font-medium mb-2">Commission for this category</p>
                    <p className="text-white text-lg font-semibold">
                      B2C: {selectedCategory.commissionB2C ?? 15}%
                      {selectedCategory.commissionB2B != null && (
                        <span className="ml-2 text-gray-300">
                          | B2B: {selectedCategory.commissionB2B}%
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-gray-400 text-xs">
                      Platform commission is deducted from each sale. You receive (100 − commission)% after each order.
                    </p>
                  </div>
                )}

                {/* Price and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                      className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                    />
                  </div>
                </div>

                {/* Selling mode & B2B */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Layers className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white font-semibold">Selling Mode & B2B</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">Selling mode</label>
                      <select
                        name="sellingMode"
                        value={formData.sellingMode || 'B2C_ONLY'}
                        onChange={(e) => setFormData(prev => ({ ...prev, sellingMode: e.target.value as SellingMode }))}
                        className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
                      >
                        <option value="B2C_ONLY">B2C only (consumers)</option>
                        <option value="B2B_ONLY">B2B only (buyer business details required)</option>
                        <option value="B2C_AND_B2B">B2C + B2B</option>
                      </select>
                    </div>
                    {(formData.sellingMode === 'B2B_ONLY' || formData.sellingMode === 'B2C_AND_B2B') && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#ffcc99] text-sm font-medium mb-2">Minimum order quantity (MOQ)</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="e.g. 10"
                              value={formData.moq || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#ffcc99] text-sm font-medium mb-2">Lead time (days)</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="e.g. 5"
                              value={formData.leadTimeDays || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, leadTimeDays: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[#ffcc99] text-sm font-medium mb-2">B2B product type</label>
                          <select
                            value={formData.b2bProductType || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, b2bProductType: (e.target.value || undefined) as B2bProductType | undefined }))}
                            className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
                          >
                            <option value="">Select type</option>
                            <option value="WHOLESALE">Wholesale</option>
                            <option value="DISTRIBUTOR">Distributor</option>
                            <option value="MANUFACTURER_DIRECT">Manufacturer-direct</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requestQuoteOnly ?? false}
                            onChange={(e) => setFormData(prev => ({ ...prev, requestQuoteOnly: e.target.checked }))}
                            className="rounded border-[#ff6600]/50 text-[#ff6600] focus:ring-[#ff6600]"
                          />
                          <span className="text-[#ffcc99] text-sm">Request a quote only (no fixed B2B price)</span>
                        </label>
                        {!(formData.requestQuoteOnly ?? false) && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-[#ffcc99] text-sm font-medium">Tiered pricing (B2B)</label>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  priceTiers: [...(prev.priceTiers || []), { minQuantity: '', maxQuantity: '999999', priceKobo: '' }],
                                }))}
                                className="px-3 py-1.5 rounded-lg bg-[#ff6600]/20 text-[#ff6600] text-xs font-medium hover:bg-[#ff6600]/30"
                              >
                                <Plus className="w-3 h-3 inline mr-1" /> Add tier
                              </button>
                            </div>
                            <p className="text-[#ffcc99]/60 text-xs mb-2">Min qty – Max qty → Price (₦). Use 999999 for open-ended.</p>
                            {(formData.priceTiers || []).map((tier, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-2">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Min"
                                  value={tier.minQuantity}
                                  onChange={(e) => {
                                    const next = [...(formData.priceTiers || [])];
                                    next[idx] = { ...next[idx], minQuantity: e.target.value };
                                    setFormData(prev => ({ ...prev, priceTiers: next }));
                                  }}
                                  className="w-20 px-2 py-2 rounded-lg bg-black border border-[#ff6600]/30 text-white text-sm"
                                />
                                <span className="text-[#ffcc99]">–</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Max"
                                  value={tier.maxQuantity}
                                  onChange={(e) => {
                                    const next = [...(formData.priceTiers || [])];
                                    next[idx] = { ...next[idx], maxQuantity: e.target.value };
                                    setFormData(prev => ({ ...prev, priceTiers: next }));
                                  }}
                                  className="w-24 px-2 py-2 rounded-lg bg-black border border-[#ff6600]/30 text-white text-sm"
                                />
                                <span className="text-[#ffcc99]">→ ₦</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={tier.priceKobo}
                                  onChange={(e) => {
                                    const next = [...(formData.priceTiers || [])];
                                    next[idx] = { ...next[idx], priceKobo: e.target.value };
                                    setFormData(prev => ({ ...prev, priceTiers: next }));
                                  }}
                                  className="flex-1 px-2 py-2 rounded-lg bg-black border border-[#ff6600]/30 text-white text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    priceTiers: (prev.priceTiers || []).filter((_, i) => i !== idx),
                                  }))}
                                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#ff6600] hover:bg-[#cc5200] disabled:bg-[#ff6600]/50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-xl font-semibold transition"
                  >
                    {loading ? 'Updating Product...' : 'Update Product'}
                  </button>
                  <Link
                    href="/seller/products"
                    className="flex items-center justify-center px-6 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl font-semibold hover:bg-[#ff6600]/10 transition"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </SellerLayout>
    </>
  );
}

