import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import { useCategories, Category } from '../../../lib/buyer/hooks/useCategories';
import {
  Package,
  Upload,
  X,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Layers,
  FileText,
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  Wand2,
  Loader2,
  ShieldAlert,
  ShieldX,
  Clock,
  ShieldCheck
} from 'lucide-react';

type SellingMode = 'B2C_ONLY' | 'B2B_ONLY' | 'B2C_AND_B2B';
type B2bProductType = 'WHOLESALE' | 'DISTRIBUTOR' | 'MANUFACTURER_DIRECT';

interface PriceTier {
  minQuantity: string;
  maxQuantity: string;
  priceKobo: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  quantity: string;
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  sellingMode?: SellingMode;
  moq?: string;
  leadTimeDays?: string;
  b2bProductType?: B2bProductType;
  requestQuoteOnly?: boolean;
  priceTiers?: PriceTier[];
}

interface UploadedImage {
  url: string;
  preview: string;
}

// Categories that strongly benefit from material and care information (by slug)
const MATERIAL_CARE_REQUIRED_CATEGORIES = ['clothing', 'home', 'fashion'];
const MATERIAL_CARE_RECOMMENDED_CATEGORIES = ['beauty', 'sports'];

// Helper function to check if category requires/recommends material/care info
const shouldShowMaterialCarePrompt = (category: string): { required: boolean; recommended: boolean } => {
  return {
    required: MATERIAL_CARE_REQUIRED_CATEGORIES.includes(category),
    recommended: MATERIAL_CARE_RECOMMENDED_CATEGORIES.includes(category),
  };
};

// Category-specific examples for material and care info
const getCategoryExamples = (category: string) => {
  switch (category) {
    case 'clothing':
      return {
        material: '100% Organic Cotton, Linen blend, Polyester lining\nSize: Available in S, M, L, XL\nColor: Navy Blue, Black, White',
        careInfo: 'Machine wash cold with like colors\nTumble dry low or hang to dry\nDo not bleach\nIron on low heat (synthetic setting)\nDry clean recommended for best results',
      };
    case 'home':
      return {
        material: 'Solid wood frame (Mango wood)\nUpholstery: 100% Polyester fabric\nCushion filling: High-density foam\nFinish: Natural wood stain\nDimensions: 120cm x 80cm x 85cm',
        careInfo: 'Wipe clean with damp cloth\nAvoid harsh chemicals\nDo not expose to direct sunlight\nRotate cushions regularly\nProfessional cleaning recommended annually',
      };
    case 'beauty':
      return {
        material: 'Organic Shea Butter, Cocoa Butter, Jojoba Oil, Vitamin E\nCruelty-free, Paraben-free, Fragrance-free\nNet weight: 200g',
        careInfo: 'Store in a cool, dry place\nAvoid direct sunlight\nUse within 12 months of opening\nKeep lid tightly closed when not in use',
      };
    default:
      return {
        material: 'Specify the main materials used (e.g., fabric type, wood species, metal type, etc.)',
        careInfo: 'Include washing instructions, storage recommendations, maintenance tips, or any special care requirements',
      };
  }
};

export default function AddProductPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [enhancingImageIndex, setEnhancingImageIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    categoryId: '',
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    fetchKycStatus();
  }, [router, authLoading, isAuthenticated, user]);

  const fetchKycStatus = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
      const response = await fetch(`${apiUrl}/sellers/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        setKycStatus(responseData.status);
      }
    } catch (err) {
      console.error('Error fetching KYC status:', err);
    } finally {
      setKycLoading(false);
    }
  };


  // Helper to get selected category
  const getSelectedCategory = () => {
    return categories.find(c => c.id === formData.categoryId);
  };

  // Helper to get category slug
  const getCategorySlug = () => {
    const category = getSelectedCategory();
    return category?.slug || '';
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Product title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        if (value.length > 100) return 'Title must be less than 100 characters';
        break;
      case 'categoryId':
        if (!value) return 'Category is required';
        break;
      case 'price':
        if (!value) return 'Price is required';
        if (parseFloat(value) <= 0) return 'Price must be greater than 0';
        break;
      case 'quantity':
        if (!value) return 'Stock quantity is required';
        if (parseInt(value) < 0) return 'Quantity cannot be negative';
        break;
      case 'material':
      case 'careInfo':
        // Warn if category requires material/care but field is empty
        const categorySlug = getCategorySlug();
        if (categorySlug) {
          const categoryInfo = shouldShowMaterialCarePrompt(categorySlug);
          if (categoryInfo.required && !value.trim()) {
            return 'This information is highly recommended for this product category. 88% of customers look for this information.';
          }
        }
        break;
    }
    return '';
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
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
    // Clear error when removing
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFiles(Array.from(files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFiles(Array.from(files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (uploadedImages.length + validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    for (const file of validFiles) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    // Create preview
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setUploadingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('images', file);

      // Use apiClient which handles token refresh automatically
      // Increased timeout for file uploads (60 seconds)
      const response = await apiClient.post('/products/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });

      const urls = response.data?.urls || response.data?.data?.urls || [];
      if (urls.length > 0) {
        setUploadedImages(prev => [...prev, { url: urls[0], preview }]);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Upload succeeded but no URL returned');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Upload timed out. Please check your connection and try again.');
        return;
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network error. Please check your connection and try again.');
        return;
      }
      
      // Handle API errors
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to upload image. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhanceImage = async (index: number) => {
    const image = uploadedImages[index];
    if (!image?.url) return;
    setEnhancingImageIndex(index);
    try {
      const response = await apiClient.post<{ enhancedUrl: string }>('/products/ai/enhance-image', {
        imageUrl: image.url,
      });
      const payload = response.data;
      const enhancedUrl = payload?.enhancedUrl;
      if (enhancedUrl) {
        setUploadedImages(prev =>
          prev.map((img, i) =>
            i === index ? { ...img, url: enhancedUrl, preview: enhancedUrl } : img
          )
        );
        toast.success('Image enhanced for better presentation');
      } else {
        toast.error('Could not get enhanced image');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to enhance image';
      toast.error(msg);
    } finally {
      setEnhancingImageIndex(null);
    }
  };

  type AIGenerateField = 'description' | 'keyFeatures' | 'material' | 'careInfo';

  const handleGenerateAIField = async (field: AIGenerateField) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    setAiGeneratingField(field);
    try {
      const selectedCategory = getSelectedCategory();
      const categorySlug = getCategorySlug();
      const categoryInfo = categorySlug ? shouldShowMaterialCarePrompt(categorySlug) : { required: false, recommended: false };

      const response = await apiClient.post('/products/ai/generate-content', {
        title: formData.title,
        category: categorySlug || undefined,
        categoryName: selectedCategory?.name || undefined,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : undefined,
        existingDescription: formData.description || undefined,
        needsMaterial: categoryInfo.required || categoryInfo.recommended,
        needsCareInfo: categoryInfo.required || categoryInfo.recommended,
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

    // Validate all fields
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Validate categoryId first
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'keyFeatures') {
        const error = validateField(key, value as string);
        if (error) newErrors[key as keyof FormData] = error;
      }
    });

    // Validate keyFeatures separately
    if (formData.keyFeatures) {
      const keyFeaturesError = validateKeyFeatures(formData.keyFeatures);
      if (keyFeaturesError) {
        newErrors.keyFeatures = keyFeaturesError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setLoading(true);
    try {
      const priceInKobo = Math.round(parseFloat(formData.price) * 100);

      if (!formData.categoryId) {
        toast.error('Please select a category');
        setLoading(false);
        return;
      }

      const sellingMode = formData.sellingMode || 'B2C_ONLY';
      const isB2bEnabled = sellingMode === 'B2B_ONLY' || sellingMode === 'B2C_AND_B2B';

      const productData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: uploadedImages.map(img => img.url),
        quantity: parseInt(formData.quantity),
        categoryId: formData.categoryId,
        material: formData.material || undefined,
        careInfo: formData.careInfo || undefined,
        keyFeatures: formData.keyFeatures && formData.keyFeatures.length > 0
          ? formData.keyFeatures.filter(f => f.trim()).map(f => f.trim())
          : undefined,
        sellingMode,
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

      // Use apiClient which handles token refresh automatically
      await apiClient.post('/products', productData);

      toast.success('Product created successfully!');
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create product';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.categoryId &&
      formData.price &&
      parseFloat(formData.price) > 0 &&
      formData.quantity &&
      parseInt(formData.quantity) >= 0 &&
      uploadedImages.length > 0
    );
  };

  if (authLoading || kycLoading) {
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

  // KYC Gate — block the form entirely for non-approved sellers
  if (kycStatus !== 'APPROVED') {
    const isPending = kycStatus === 'PENDING';
    const isRejected = kycStatus === 'REJECTED';

    return (
      <>
        <Head>
          <title>KYC Required - Seller Portal | Carryofy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <SellerLayout>
          <div className="min-h-full flex items-center justify-center py-16 px-4">
            <div className="max-w-lg w-full">
              {/* Icon */}
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 ${isPending ? 'bg-yellow-500/15 border border-yellow-500/30'
                  : isRejected ? 'bg-red-500/15 border border-red-500/30'
                    : 'bg-blue-500/15 border border-blue-500/30'
                }`}>
                {isPending ? (
                  <Clock className="w-12 h-12 text-yellow-400" />
                ) : isRejected ? (
                  <ShieldX className="w-12 h-12 text-red-400" />
                ) : (
                  <ShieldAlert className="w-12 h-12 text-blue-400" />
                )}
              </div>

              {/* Title */}
              <h1 className={`text-3xl font-bold text-center mb-3 ${isPending ? 'text-yellow-300'
                  : isRejected ? 'text-red-300'
                    : 'text-blue-300'
                }`}>
                {isPending ? 'Verification In Progress' : isRejected ? 'Verification Rejected' : 'Identity Verification Required'}
              </h1>

              {/* Description */}
              <p className="text-[#ffcc99]/80 text-center text-sm leading-relaxed mb-8">
                {isPending
                  ? 'Your KYC documents are currently being reviewed by our compliance team. Product uploads will be unlocked as soon as your verification is approved — typically within 1–2 business days.'
                  : isRejected
                    ? 'Your KYC submission was not approved. Please review the rejection reason in your settings, correct your documents, and resubmit. Product uploads will be enabled once your verification is approved.'
                    : 'To protect buyers and sellers on Carryofy, all sellers must complete a one-time identity verification (KYC) before listing products. This process is quick and your verification never expires once approved.'}
              </p>

              {/* Steps (only for NOT_SUBMITTED) */}
              {!isPending && !isRejected && (
                <div className="bg-[#1a1a1a] border border-blue-500/20 rounded-2xl p-5 mb-8">
                  <p className="text-white font-semibold text-sm mb-4">How to get verified:</p>
                  <div className="space-y-3">
                    {[
                      { step: '1', text: 'Go to Settings → KYC Verification tab' },
                      { step: '2', text: 'Upload your government-issued ID and proof of address' },
                      { step: '3', text: 'Submit and wait for approval (1–2 business days)' },
                      { step: '4', text: 'Start listing products — your KYC never expires!' },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-xs font-bold">{step}</span>
                        </div>
                        <p className="text-[#ffcc99]/80 text-sm">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection info box */}
              {isRejected && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 mb-8">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 font-semibold text-sm mb-1">What to do next</p>
                      <p className="text-red-200/70 text-sm">Open your KYC settings to see the rejection reason, fix the issue with your documents, and resubmit. Our team will review your updated submission promptly.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/seller/products')}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl font-medium hover:bg-[#ff6600]/10 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Products
                </button>
                <a
                  href="/seller/settings?tab=kyc"
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all ${isPending
                      ? 'bg-yellow-600 hover:bg-yellow-500'
                      : isRejected
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                >
                  {isPending ? (
                    <><Clock className="w-4 h-4" /> View KYC Status</>
                  ) : isRejected ? (
                    <><ShieldX className="w-4 h-4" /> Resubmit KYC</>
                  ) : (
                    <><ShieldAlert className="w-4 h-4" /> Start KYC Verification</>
                  )}
                </a>
              </div>
            </div>
          </div>
        </SellerLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Add Product - Seller Portal | Carryofy</title>
        <meta name="description" content="Add a new product to your inventory on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div className="min-h-full pb-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/seller/products')}
              className="flex items-center gap-2 text-[#ffcc99] hover:text-[#ff6600] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Products</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#ff6600] to-[#cc5200] flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Add New Product</h1>
                <p className="text-[#ffcc99] text-sm">Fill in the details to list your product</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Images */}
              <div className="lg:col-span-1 space-y-4">
                {/* Image Upload Card */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white font-semibold">Product Images</h2>
                    <span className="text-xs text-[#ffcc99] ml-auto">{uploadedImages.length}/5</span>
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                      ${dragActive
                        ? 'border-[#ff6600] bg-[#ff6600]/10'
                        : 'border-[#ff6600]/30 hover:border-[#ff6600]/60 hover:bg-[#ff6600]/5'
                      }
                      ${uploadingImage ? 'pointer-events-none opacity-60' : ''}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />

                    {uploadingImage ? (
                      <div className="py-4">
                        <div className="w-10 h-10 border-3 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-[#ffcc99] text-sm">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-[#ff6600]/10 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 text-[#ff6600]" />
                        </div>
                        <p className="text-white font-medium mb-1">
                          Drop images here or click to upload
                        </p>
                        <p className="text-[#ffcc99] text-xs">
                          PNG, JPG up to 5MB • Max 5 images
                        </p>
                      </>
                    )}
                  </div>

                  {/* Uploaded Images Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden group border border-[#ff6600]/20"
                        >
                          {image.url ? (
                            <Image
                              src={image.url}
                              alt={`Product ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 33vw, 20vw"
                              className="object-cover"
                            />
                          ) : (
                            <img
                              src={image.preview}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {index === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#ff6600] text-black text-[10px] font-bold rounded">
                              Main
                            </span>
                          )}
                          <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* AI Enhance Image Button - Commented out (no API key yet) */}
                            {/* <button
                              type="button"
                              onClick={() => handleEnhanceImage(index)}
                              disabled={enhancingImageIndex !== null}
                              title="Enhance image for better selling"
                              className="w-6 h-6 bg-[#ff6600]/90 text-black rounded-full flex items-center justify-center hover:bg-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {enhancingImageIndex === index ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                            </button> */}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {/* <p className="absolute bottom-1 left-1 right-1 text-center text-[10px] text-white/90 bg-black/50 rounded py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            Enhance with AI
                          </p> */}
                        </div>
                      ))}

                      {/* Add More Button */}
                      {uploadedImages.length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-[#ff6600]/30 flex items-center justify-center hover:border-[#ff6600]/60 hover:bg-[#ff6600]/5 transition-all"
                        >
                          <Plus className="w-6 h-6 text-[#ffcc99]" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tips */}
                  <div className="mt-4 p-3 bg-[#ff6600]/5 rounded-lg border border-[#ff6600]/10">
                    <p className="text-[#ff6600] text-xs font-medium mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Tips for great photos
                    </p>
                    <ul className="text-[#ffcc99] text-xs space-y-0.5">
                      <li>• Use natural lighting</li>
                      <li>• Show multiple angles</li>
                      <li>• Keep background clean</li>
                      {/* <li>• Hover an image and click the sparkle icon to enhance it with AI for better selling</li> */}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:col-span-2 space-y-4">
                {/* Basic Information */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white font-semibold">Basic Information</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Product Title */}
                    <div>
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                        Product Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="title"
                        type="text"
                        placeholder="e.g., Premium Wireless Bluetooth Headphones"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.title ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
                          }`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
                        </p>
                      )}
                      <p className="mt-1 text-[#ffcc99]/60 text-xs">
                        {formData.title.length}/100 characters
                      </p>
                    </div>

                    {/* AI hint: per-field buttons are next to each section below */}
                    {/* <div className="flex items-center gap-2 text-[#ffcc99]/70 text-xs">
                      <Wand2 className="w-4 h-4 text-[#ff6600] shrink-0" />
                      <span>Use &quot;Generate with AI&quot; next to each field below to fill it. Enter a product title first.</span>
                    </div> */}

                    {/* Key Features */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="block text-[#ffcc99] text-sm font-medium">
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
                              className={`flex-1 px-4 py-2 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.keyFeatures ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
                                }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyFeature(index)}
                              className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <span className="text-[#ffcc99]/60 text-xs w-12 text-right">
                              {feature.length}/30
                            </span>
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
                        <label className="block text-[#ffcc99] text-sm font-medium">
                          Description
                        </label>
                        {/* AI Generate Button - Commented out (no API key yet) */}
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
                        placeholder="Describe your product in detail. Include features, specifications, etc."
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none"
                      />
                      <p className="mt-1 text-[#ffcc99]/60 text-xs">
                        A good description helps customers make informed decisions
                      </p>
                    </div>

                    {/* Material Information */}
                    {(() => {
                      const categorySlug = getCategorySlug();
                      const categoryInfo = categorySlug ? shouldShowMaterialCarePrompt(categorySlug) : { required: false, recommended: false };
                      const examples = categorySlug ? getCategoryExamples(categorySlug) : null;
                      const selectedCategory = getSelectedCategory();
                      const needsMaterial = categoryInfo.required || categoryInfo.recommended;

                      return (
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <label className="block text-[#ffcc99] text-sm font-medium">
                              Materials & Composition
                              {categoryInfo.required && <span className="text-yellow-400 ml-1">*</span>}
                            </label>
                            <div className="flex items-center gap-2">
                              {needsMaterial && !formData.material && examples && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, material: examples.material }));
                                  }}
                                  className="text-xs text-[#ff6600] hover:text-[#ff8800] underline"
                                >
                                  Use example
                                </button>
                              )}
                              {/* AI Generate Button - Commented out (no API key yet) */}
                              {/* <button
                                type="button"
                                onClick={() => handleGenerateAIField('material')}
                                disabled={!!aiGeneratingField || !formData.title.trim()}
                                className="px-3 py-1.5 rounded-lg bg-[#ff6600]/20 border border-[#ff6600]/40 text-[#ff6600] text-xs font-medium hover:bg-[#ff6600]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                              >
                                {aiGeneratingField === 'material' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Wand2 className="w-3.5 h-3.5" />
                                )}
                                <span>Generate with AI</span>
                              </button> */}
                            </div>
                          </div>
                          <textarea
                            name="material"
                            placeholder={examples?.material || "e.g., 100% Cotton, Linen blend, Polyester, etc. Include specific materials, blends, dimensions, or composition details."}
                            value={formData.material || ''}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none ${categoryInfo.required && !formData.material
                              ? 'border-yellow-400/50'
                              : errors.material
                                ? 'border-red-500'
                                : 'border-[#ff6600]/30'
                              }`}
                          />
                          {categoryInfo.required && !formData.material && selectedCategory && (
                            <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                              <p className="text-yellow-400 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>88% of customers actively look for material information for {selectedCategory.name.toLowerCase()} products. Adding this information improves customer confidence and reduces product returns.</span>
                              </p>
                            </div>
                          )}
                          {categoryInfo.recommended && !formData.material && (
                            <p className="mt-1 text-yellow-400/80 text-xs">
                              ⭐ Recommended: Material information is highly valued by customers in this category
                            </p>
                          )}
                          {errors.material && (
                            <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.material}
                            </p>
                          )}
                          {!errors.material && formData.material && (
                            <p className="mt-1 text-green-400/80 text-xs">
                              ✓ Material information added - customers will see this on the product page
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Care Instructions */}
                    {(() => {
                      const categorySlug = getCategorySlug();
                      const categoryInfo = categorySlug ? shouldShowMaterialCarePrompt(categorySlug) : { required: false, recommended: false };
                      const examples = categorySlug ? getCategoryExamples(categorySlug) : null;
                      const selectedCategory = getSelectedCategory();
                      const needsCareInfo = categoryInfo.required || categoryInfo.recommended;

                      return (
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <label className="block text-[#ffcc99] text-sm font-medium">
                              Care Instructions
                              {categoryInfo.required && <span className="text-yellow-400 ml-1">*</span>}
                            </label>
                            <div className="flex items-center gap-2">
                              {needsCareInfo && !formData.careInfo && examples && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, careInfo: examples.careInfo }));
                                  }}
                                  className="text-xs text-[#ff6600] hover:text-[#ff8800] underline"
                                >
                                  Use example
                                </button>
                              )}
                              {/* AI Generate Button - Commented out (no API key yet) */}
                              {/* <button
                                type="button"
                                onClick={() => handleGenerateAIField('careInfo')}
                                disabled={!!aiGeneratingField || !formData.title.trim()}
                                className="px-3 py-1.5 rounded-lg bg-[#ff6600]/20 border border-[#ff6600]/40 text-[#ff6600] text-xs font-medium hover:bg-[#ff6600]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                              >
                                {aiGeneratingField === 'careInfo' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Wand2 className="w-3.5 h-3.5" />
                                )}
                                <span>Generate with AI</span>
                              </button> */}
                            </div>
                          </div>
                          <textarea
                            name="careInfo"
                            placeholder={examples?.careInfo || "e.g., Machine wash cold, tumble dry low, do not bleach, iron on low heat. Include washing, cleaning, storage, or maintenance instructions."}
                            value={formData.careInfo || ''}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none ${categoryInfo.required && !formData.careInfo
                              ? 'border-yellow-400/50'
                              : errors.careInfo
                                ? 'border-red-500'
                                : 'border-[#ff6600]/30'
                              }`}
                          />
                          {categoryInfo.required && !formData.careInfo && selectedCategory && (
                            <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                              <p className="text-yellow-400 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>88% of customers need care instructions for {selectedCategory.name.toLowerCase()} products. Without this, customers may skip your product or make returns due to improper care.</span>
                              </p>
                            </div>
                          )}
                          {categoryInfo.recommended && !formData.careInfo && (
                            <p className="mt-1 text-yellow-400/80 text-xs">
                              ⭐ Recommended: Care instructions help customers properly maintain the product
                            </p>
                          )}
                          {errors.careInfo && (
                            <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.careInfo}
                            </p>
                          )}
                          {!errors.careInfo && formData.careInfo && (
                            <p className="mt-1 text-green-400/80 text-xs">
                              ✓ Care instructions added - helps customers maintain the product properly
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Category */}
                    <div>
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                        Category <span className="text-red-400">*</span>
                      </label>
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="w-8 h-8 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin"></div>
                          <span className="ml-3 text-[#ffcc99]">Loading categories...</span>
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                          <p className="text-yellow-400 text-sm">No categories available. Please contact support.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {categories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, categoryId: cat.id }));
                                  // Clear category error when selecting
                                  setErrors(prev => ({ ...prev, categoryId: undefined }));
                                }}
                                className={`p-4 rounded-xl border text-center transition-all ${formData.categoryId === cat.id
                                  ? 'bg-[#ff6600] border-[#ff6600] text-black shadow-lg shadow-[#ff6600]/30'
                                  : 'bg-black border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600]/60 hover:bg-[#1a1a1a]'
                                  } ${errors.categoryId ? 'border-red-500' : ''}`}
                              >
                                {cat.icon && (
                                  <span className="text-2xl block mb-2">{cat.icon}</span>
                                )}
                                <span className="text-sm font-medium block">{cat.name}</span>
                              </button>
                            ))}
                          </div>
                          {errors.categoryId && (
                            <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.categoryId}
                            </p>
                          )}
                          {formData.categoryId && getSelectedCategory() && (
                            <div className="mt-4 p-4 rounded-xl border border-[#ff6600]/30 bg-[#ff6600]/5">
                              <p className="text-[#ffcc99] text-sm font-medium mb-2">Commission for this category</p>
                              <p className="text-white text-lg font-semibold">
                                B2C: {(getSelectedCategory() as Category & { commissionB2C?: number }).commissionB2C ?? 15}%
                                {(getSelectedCategory() as Category & { commissionB2B?: number | null }).commissionB2B != null && (
                                  <span className="ml-2 text-gray-300">
                                    | B2B: {(getSelectedCategory() as Category & { commissionB2B?: number | null }).commissionB2B}%
                                  </span>
                                )}
                              </p>
                              <p className="mt-2 text-gray-400 text-xs">
                                Platform commission is deducted from each sale. You receive (100 - commission)% after each order.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <DollarSign className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white font-semibold">Pricing & Inventory</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price */}
                    <div>
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                        Price (₦) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffcc99] font-medium">₦</span>
                        <input
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.price ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
                            }`}
                        />
                      </div>
                      {errors.price && (
                        <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.price}
                        </p>
                      )}
                    </div>

                    {/* Stock Quantity */}
                    <div>
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                        Stock Quantity <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Layers className="w-4 h-4 text-[#ffcc99]" />
                        </span>
                        <input
                          name="quantity"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.quantity ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
                            }`}
                        />
                      </div>
                      {errors.quantity && (
                        <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.quantity}
                        </p>
                      )}
                      {formData.quantity && parseInt(formData.quantity) > 0 && parseInt(formData.quantity) <= 5 && (
                        <p className="mt-1 text-yellow-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Low stock warning will be shown to buyers
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price Preview */}
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="mt-4 p-4 bg-[#ff6600]/5 rounded-xl border border-[#ff6600]/20">
                      <p className="text-[#ffcc99] text-xs mb-1">Preview</p>
                      <p className="text-white text-2xl font-bold">
                        ₦{parseFloat(formData.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
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
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push('/seller/products')}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] font-medium hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className="flex-1 px-6 py-3 rounded-xl bg-linear-to-r from-[#ff6600] to-[#cc5200] text-white font-bold hover:from-[#cc5200] hover:to-[#ff6600] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Add Product
                      </>
                    )}
                  </button>
                </div>

                {/* Form Completion Indicator */}
                <div className="bg-[#1a1a1a] rounded-xl border border-[#ff6600]/20 p-4">
                  <p className="text-[#ffcc99] text-xs mb-3">Form Completion</p>
                  <div className="flex gap-2">
                    <div className={`flex-1 h-1.5 rounded-full ${uploadedImages.length > 0 ? 'bg-[#ff6600]' : 'bg-[#ff6600]/20'}`}></div>
                    <div className={`flex-1 h-1.5 rounded-full ${formData.title.trim() ? 'bg-[#ff6600]' : 'bg-[#ff6600]/20'}`}></div>
                    <div className={`flex-1 h-1.5 rounded-full ${formData.price && parseFloat(formData.price) > 0 ? 'bg-[#ff6600]' : 'bg-[#ff6600]/20'}`}></div>
                    <div className={`flex-1 h-1.5 rounded-full ${formData.quantity && parseInt(formData.quantity) >= 0 ? 'bg-[#ff6600]' : 'bg-[#ff6600]/20'}`}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#ffcc99]/60 mt-1">
                    <span>Images</span>
                    <span>Title</span>
                    <span>Price</span>
                    <span>Stock</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </SellerLayout>
    </>
  );
}
