import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import { useCategories, Category } from '../../../lib/buyer/hooks/useCategories';
import {
  Package,
  X,
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
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  Users,
  Building2,
  ShoppingBag,
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
  priceTiers?: PriceTier[];
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
  // 1. All hooks and state first
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ id: string; url: string; progress: number }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [draftKeyFeature, setDraftKeyFeature] = useState('');

  // 2. Function declarations (helpers - hoisted but kept here for clarity)
  async function fetchKycStatus() {
    try {
      const response = await apiClient.get('/sellers/kyc');
      const data = response.data?.data || response.data;
      setKycStatus(data.status);
    } catch (err) {
      console.error('Error fetching KYC status:', err);
    } finally {
      setKycLoading(false);
    }
  }

  function getSelectedCategory() {
    const primaryId = formData.categoryIds[0];
    return primaryId ? categories.find(c => c.id === primaryId) : undefined;
  }

  function getCategorySlug() {
    return getSelectedCategory()?.slug || '';
  }

  // 3. Derived state (recomputes when category or form data changes)
  const selectedCategory = getSelectedCategory();
  const categorySlug = getCategorySlug();
  const categoryInfo = categorySlug ? shouldShowMaterialCarePrompt(categorySlug) : null;
  const categoryExamples = categorySlug ? getCategoryExamples(categorySlug) : null;
  const needsMaterialCare = categoryInfo?.required || categoryInfo?.recommended;

  // 4. Effects
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


  function validateField(name: string, value: string) {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Product title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        if (value.length > 100) return 'Title must be less than 100 characters';
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
        if (categorySlug) {
          const catInfo = shouldShowMaterialCarePrompt(categorySlug);
          if (catInfo.required && !value.trim()) {
            return 'This information is highly recommended for this product category. 88% of customers look for this information.';
          }
        }
        break;
    }
    return '';
  }

  function validateKeyFeatures(features: string[]): string {
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
  }

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
    const trimmed = draftKeyFeature.trim();
    if (!trimmed) return;
    const currentFeatures = formData.keyFeatures || [];
    if (currentFeatures.length >= 3 || trimmed.length > 30) return;
    setFormData((prev) => ({
      ...prev,
      keyFeatures: [...(prev.keyFeatures || []), trimmed],
    }));
    setDraftKeyFeature('');
    setErrors((prev) => ({ ...prev, keyFeatures: undefined }));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed 5 images
    const currentTotal = productImages.length + pendingImages.length;
    if (currentTotal + files.length > 5) {
      toast.error('Maximum 5 images allowed. Please remove some images first.');
      e.target.value = ''; // Reset input
      return;
    }

    const selectedFiles = Array.from(files);
    const newPending = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      progress: 0,
      file,
    }));

    setPendingImages((prev) => [...prev, ...newPending]);
    setUploadingImages(true);

    // Upload images individually for faster single-task success and to avoid big batch timeouts
    const uploadTasks = newPending.map(async (pendingItem) => {
      try {
        const uploadData = new FormData();
        uploadData.append('images', pendingItem.file);

        console.log(`📤 Uploading image ${pendingItem.id}...`);
        const response = await apiClient.post('/products/images/upload', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60s per individual image is plenty
        });

        const data = response.data?.data || response.data;
        const uploadedUrls = data?.urls || (Array.isArray(data) ? data : []);

        if (uploadedUrls.length > 0) {
          console.log('✅ INSTANT CLOUDINARY URL RECEIVED:', uploadedUrls[0]);
          setProductImages((prev) => [...prev, ...uploadedUrls]);
        } else {
          throw new Error('No URL returned');
        }
      } catch (error: any) {
        console.error(`❌ Error uploading image ${pendingItem.id}:`, error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Upload failed';
        toast.error(`${pendingItem.file.name}: ${errorMessage}`);
      } finally {
        // Revoke URL and remove from pending
        URL.revokeObjectURL(pendingItem.url);
        setPendingImages((prev) => prev.filter(p => p.id !== pendingItem.id));
      }
    });

    try {
      await Promise.all(uploadTasks);
    } finally {
      setUploadingImages(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
      const dt = new DataTransfer();
      for (let i = 0; i < Math.min(files.length, 5 - productImages.length - pendingImages.length); i++) {
        dt.items.add(files[i]);
      }
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      }, {
        timeout: 60000, // 60 second timeout for AI generation
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

    // Validate categoryIds
    if (!formData.categoryIds?.length) {
      newErrors.categoryIds = 'Select at least one category';
    } else if (formData.categoryIds.length > 10) {
      newErrors.categoryIds = 'Maximum 10 categories allowed';
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'keyFeatures' && key !== 'categoryIds') {
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


    setLoading(true);
    try {
      // images validation
      if (productImages.length === 0) {
        toast.error('Please upload at least one product image');
        setLoading(false);
        return;
      }

      const priceInKobo = Math.round(parseFloat(formData.price) * 100);
      const sellingMode = formData.sellingMode || 'B2C_ONLY';
      const isB2bEnabled = sellingMode === 'B2B_ONLY' || sellingMode === 'B2C_AND_B2B';

      const productData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: productImages,
        quantity: parseInt(formData.quantity),
        categoryIds: formData.categoryIds,
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

      console.log('🚀 SUBMITTING PRODUCT DATA - Images:', productData.images);

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
      productImages.length > 0 &&
      formData.title.trim().length >= 10 &&
      formData.title.trim().length <= 100 &&
      formData.categoryIds?.length > 0 &&
      formData.price &&
      parseFloat(formData.price) > 0 &&
      formData.quantity &&
      parseInt(formData.quantity) >= 0 &&
      true
    );
  };

  const hasFormChanges = () => {
    return (
      productImages.length > 0 ||
      formData.title.trim() !== '' ||
      formData.description.trim() !== '' ||
      (formData.keyFeatures && formData.keyFeatures.some(f => f.trim() !== '')) ||
      formData.categoryIds?.length > 0 ||
      formData.price !== '' ||
      formData.quantity !== '' ||
      (formData.material && formData.material.trim() !== '') ||
      (formData.careInfo && formData.careInfo.trim() !== '') ||
      (formData.sellingMode && formData.sellingMode !== 'B2C_ONLY') ||
      (formData.moq && formData.moq !== '') ||
      (formData.leadTimeDays && formData.leadTimeDays !== '') ||
      !!formData.b2bProductType ||
      (formData.priceTiers && formData.priceTiers.length > 0)
    );
  };

  const step1Complete = productImages.length > 0;
  const step2Complete = formData.title.trim().length >= 10 && formData.title.trim().length <= 100 && (formData.categoryIds?.length ?? 0) > 0;
  const step3Complete = formData.price && parseFloat(formData.price) > 0 && formData.quantity && parseInt(formData.quantity) >= 0;
  const step4Complete = true; // Selling mode always has default
  const activeStep = step1Complete ? (step2Complete ? (step3Complete ? 4 : 3) : 2) : 1;

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
        <div className="min-h-full pb-8 -m-3 sm:-m-4 lg:-m-6 xl:-m-8">
          {/* Sticky Progress Bar */}
          <div
            className="sticky top-0 z-20 h-12 flex items-center px-4 sm:px-6 lg:px-8 border-b border-[#2A2A2A]"
            style={{ backgroundColor: '#111111', height: '48px' }}
          >
            <div className="flex items-center gap-0 w-full max-w-2xl">
              {[
                { label: 'Images', done: step1Complete, active: activeStep === 1 },
                { label: 'Details', done: step2Complete, active: activeStep === 2 },
                { label: 'Pricing', done: step3Complete, active: activeStep === 3 },
                { label: 'Selling Mode', done: step4Complete, active: activeStep === 4 },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${
                        step.done
                          ? 'bg-green-500/20 text-green-500'
                          : step.active
                            ? 'bg-[#FF6B00]/20 text-[#FF6B00]'
                            : 'bg-[#2A2A2A] text-[#6B6B6B]'
                      }`}
                    >
                      {step.done ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    <span
                      className={`text-sm font-medium truncate ${
                        step.done ? 'text-[#6B6B6B]' : step.active ? 'text-[#FF6B00]' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className="flex-shrink-0 w-6 h-px mx-1"
                      style={{ backgroundColor: step.done ? '#22c55e' : '#2A2A2A' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-4 lg:p-6 xl:p-8 pt-6">
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
            <div className="space-y-6">
              {/* Form */}
              <div className="space-y-4">
                {/* Product Images - 5-slot grid */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <ImageIcon className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white font-semibold">Product Images</h2>
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages || productImages.length >= 5}
                    className="hidden"
                    id="image-upload"
                  />

                  <div className="grid grid-cols-4 gap-3" style={{ gridTemplateRows: '240px 80px' }}>
                    {/* Primary slot (1) - spans 2 rows, 1 col */}
                    <div
                      className="row-span-2 col-span-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer group min-h-[240px]"
                      style={{
                        borderColor: productImages[0] ? 'transparent' : '#FF6B00',
                        backgroundColor: productImages[0] ? 'transparent' : 'transparent',
                      }}
                    >
                      {productImages[0] ? (
                        <label
                          htmlFor="image-upload"
                          className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer block group/img"
                        >
                          <Image
                            src={productImages[0]}
                            alt="Main product"
                            width={400}
                            height={400}
                            className="w-full h-full object-cover group-hover/img:scale-[1.01] transition-transform duration-200"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleRemoveImage(0); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500 border border-white/20 flex items-center justify-center text-white z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </label>
                      ) : (pendingImages.length > 0 && productImages.length === 0) ? (
                        <div className="w-full h-full rounded-xl overflow-hidden border-2 border-[#FF6B00]/30 bg-[#1a1a1a] flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
                            <span className="text-sm text-[#A0A0A0]">Uploading...</span>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="image-upload"
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="w-full h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer hover:bg-[#FF6B0008] hover:scale-[1.01] transition-all duration-200"
                          style={{ borderColor: '#FF6B00' }}
                        >
                          <Upload className="w-8 h-8 text-[#FF6B00] mb-2" style={{ width: 32, height: 32 }} />
                          <span className="font-bold text-white text-sm">Drop main image here</span>
                          <span className="text-xs mt-1" style={{ color: '#A0A0A0' }}>JPG, PNG, WebP · max 5MB</span>
                        </label>
                      )}
                    </div>

                    {/* Secondary slots 2, 3, 4, 5 - 80x80 each */}
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="w-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all min-h-[80px]"
                        style={{
                          borderColor: productImages[idx] ? 'transparent' : '#2A2A2A',
                          height: 80,
                        }}
                      >
                        {productImages[idx] ? (
                          <label
                            htmlFor="image-upload"
                            className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer block group/img"
                          >
                            <Image
                              src={productImages[idx]}
                              alt={`Product ${idx + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleRemoveImage(idx); }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </label>
                        ) : (pendingImages[idx - productImages.length]) ? (
                          <div className="w-full h-full rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#1a1a1a] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#FF6B00] animate-spin" />
                          </div>
                        ) : (
                          <label
                            htmlFor="image-upload"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="w-full h-full flex items-center justify-center rounded-xl border-2 border-dashed cursor-pointer hover:bg-[#222] transition-colors"
                            style={{ borderColor: '#2A2A2A' }}
                          >
                            <span className="text-sm font-medium" style={{ color: '#A0A0A0' }}>{idx + 1}</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>

                  {productImages.length === 0 && (
                    <p className="mt-3 text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      At least one product image is required
                    </p>
                  )}
                </div>

                {/* Basic Information */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white font-semibold">Basic Information</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Product Title */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[#ffcc99] text-sm font-medium">
                          Product Title <span className="text-red-400">*</span>
                        </label>
                        <span
                          className={`text-xs tabular-nums ${
                            formData.title.length > 80 ? 'text-[#FF6B00]' : 'text-[#A0A0A0]'
                          }`}
                        >
                          {formData.title.length}/100
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          name="title"
                          type="text"
                          placeholder="e.g., Premium Wireless Bluetooth Headphones"
                          value={formData.title}
                          onChange={handleInputChange}
                          maxLength={100}
                          className={`w-full px-4 py-3 pr-10 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.title ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
                            }`}
                        />
                        {formData.title.length >= 10 && formData.title.length <= 100 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      {errors.title && (
                        <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
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
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                        Key Features
                      </label>
                      <p className="text-[#ffcc99]/60 text-xs mb-3">
                        Highlight 1-3 key features that appear in the product headline
                      </p>

                      <div className="space-y-3">
                        {/* Tag chips */}
                        <div className="flex flex-wrap gap-2">
                          {(formData.keyFeatures || []).map((feature, index) =>
                            feature.trim() ? (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FF6B00]/30 text-[#FF6B00] text-sm font-medium bg-[#FF6B00]/5"
                              >
                                {feature}
                                <button type="button" onClick={() => handleRemoveKeyFeature(index)} className="p-0.5 rounded hover:bg-[#FF6B00]/20 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ) : null
                          )}
                        </div>

                        {(formData.keyFeatures || []).filter(f => f.trim()).length < 3 && (
                          <>
                            <input
                              type="text"
                              placeholder="Type a feature and click Add"
                              value={draftKeyFeature}
                              onChange={(e) => setDraftKeyFeature(e.target.value)}
                              maxLength={30}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyFeature())}
                              className={`w-full px-4 py-2 rounded-lg bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] mb-2 ${errors.keyFeatures ? 'border-red-500' : 'border-[#2A2A2A]'}`}
                            />
                            <button
                              type="button"
                              onClick={handleAddKeyFeature}
                              className="w-full px-4 py-3 rounded-lg border border-[#2A2A2A] text-[#ffcc99] hover:bg-[#222] hover:border-[#444444] transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm">Add Key Feature</span>
                            </button>
                          </>
                        )}
                      </div>

                      {errors.keyFeatures && (
                        <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.keyFeatures}
                        </p>
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
                    {needsMaterialCare && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <label className="block text-[#ffcc99] text-sm font-medium">
                            Materials & Composition
                            {categoryInfo?.required && <span className="text-yellow-400 ml-1">*</span>}
                          </label>
                          <div className="flex items-center gap-2">
                            {needsMaterialCare && !formData.material && categoryExamples && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, material: categoryExamples.material }));
                                }}
                                className="text-xs text-[#ff6600] hover:text-[#ff8800] underline"
                              >
                                Use example
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          name="material"
                          placeholder={categoryExamples?.material || "e.g., 100% Cotton, Linen blend, Polyester, etc. Include specific materials, blends, dimensions, or composition details."}
                          value={formData.material || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none ${categoryInfo?.required && !formData.material
                            ? 'border-yellow-400/50'
                            : errors.material
                              ? 'border-red-500'
                              : 'border-[#ff6600]/30'
                            }`}
                        />
                        {categoryInfo?.required && !formData.material && selectedCategory && (
                          <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                            <p className="text-yellow-400 text-xs font-medium flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>88% of customers actively look for material information for {selectedCategory.name.toLowerCase()} products. Adding this information improves customer confidence and reduces product returns.</span>
                            </p>
                          </div>
                        )}
                        {categoryInfo?.recommended && !formData.material && (
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
                    )}

                    {/* Care Instructions */}
                    {needsMaterialCare && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <label className="block text-[#ffcc99] text-sm font-medium">
                            Care Instructions
                            {categoryInfo?.required && <span className="text-yellow-400 ml-1">*</span>}
                          </label>
                          <div className="flex items-center gap-2">
                            {needsMaterialCare && !formData.careInfo && categoryExamples && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, careInfo: categoryExamples.careInfo }));
                                }}
                                className="text-xs text-[#ff6600] hover:text-[#ff8800] underline"
                              >
                                Use example
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          name="careInfo"
                          placeholder={categoryExamples?.careInfo || "e.g., Machine wash cold, tumble dry low, do not bleach, iron on low heat. Include washing, cleaning, storage, or maintenance instructions."}
                          value={formData.careInfo || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none ${categoryInfo?.required && !formData.careInfo
                            ? 'border-yellow-400/50'
                            : errors.careInfo
                              ? 'border-red-500'
                              : 'border-[#ff6600]/30'
                            }`}
                        />
                        {categoryInfo?.required && !formData.careInfo && selectedCategory && (
                          <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                            <p className="text-yellow-400 text-xs font-medium flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>88% of customers need care instructions for {selectedCategory.name.toLowerCase()} products. Without this, customers may skip your product or make returns due to improper care.</span>
                            </p>
                          </div>
                        )}
                        {categoryInfo?.recommended && !formData.careInfo && (
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
                    )}

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
                          <p className="text-[#ffcc99]/70 text-sm mb-2">Select one or more categories (up to 10). First selected is primary for commission.</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {categories.map((cat) => {
                              const isSelected = formData.categoryIds.includes(cat.id);
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
                                    setErrors(prev => ({ ...prev, categoryIds: undefined }));
                                  }}
                                  className={`relative p-4 rounded-xl border text-center transition-all flex items-center gap-2 justify-center ${
                                    isSelected
                                      ? 'bg-[#FF6B0020] border-[#FF6B00] text-[#FF6B00]'
                                      : (formData.categoryIds?.length ?? 0) >= 10
                                        ? 'opacity-60 cursor-not-allowed bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0]'
                                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#222] hover:border-[#444444]'
                                  } ${errors.categoryIds ? 'border-red-500' : ''}`}
                                  disabled={!formData.categoryIds.includes(cat.id) && (formData.categoryIds?.length ?? 0) >= 10}
                                >
                                  {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                  {cat.icon && <span className="text-2xl block">{cat.icon}</span>}
                                  <span className="text-sm font-medium block">{cat.name}</span>
                                </button>
                              );
                            })}
                          </div>
                          {formData.categoryIds?.length > 0 && (
                            <p className="mt-2 text-[#ffcc99]/70 text-xs">
                              Selected: {formData.categoryIds.length}/10
                            </p>
                          )}
                          {errors.categoryIds && (
                            <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.categoryIds}
                            </p>
                          )}
                          {formData.categoryIds?.length > 0 && getSelectedCategory() && (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="mt-1 text-[#A0A0A0] text-xs">
                        Platform commission: 8–15% depending on category
                      </p>
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

                  {/* Estimated Earnings */}
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="mt-4 p-4 bg-[#FF6B00]/10 rounded-xl border border-[#FF6B00]/20">
                      <p className="text-[#ffcc99] text-xs mb-1">Estimated earnings per sale</p>
                      <p className="text-white text-xl font-bold">
                        You&apos;ll earn approx ₦
                        {(() => {
                          const price = parseFloat(formData.price) || 0;
                          const commission = (getSelectedCategory() as Category & { commissionB2C?: number })?.commissionB2C ?? 12;
                          const rate = 1 - commission / 100;
                          return (price * rate).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                        {' '}per sale
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
                      <label className="block text-[#ffcc99] text-sm font-medium mb-3">Selling mode</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { value: 'B2C_ONLY' as const, icon: Users, label: 'B2C Only', desc: 'Sell directly to individual buyers' },
                          { value: 'B2B_ONLY' as const, icon: Building2, label: 'B2B Only', desc: 'Sell in bulk to businesses, get quote requests' },
                          { value: 'B2C_AND_B2B' as const, icon: ShoppingBag, label: 'Both B2C & B2B', desc: 'Reach all buyer types', recommended: true },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = (formData.sellingMode || 'B2C_ONLY') === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, sellingMode: opt.value }))}
                              className={`relative p-4 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-[#FF6B0010] border-[#FF6B00]'
                                  : 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#222] hover:border-[#444444]'
                              }`}
                              style={isSelected ? { borderWidth: '1.5px' } : undefined}
                            >
                              {opt.recommended && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00] text-black">Recommended</span>
                              )}
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#FF6B00]/20' : 'bg-[#2A2A2A]'}`}>
                                  <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FF6B00]' : 'text-[#A0A0A0]'}`} />
                                </div>
                                <div>
                                  <p className={`font-semibold text-sm ${isSelected ? 'text-[#FF6B00]' : 'text-white'}`}>{opt.label}</p>
                                  <p className="text-xs mt-0.5 text-[#A0A0A0]">{opt.desc}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
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
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasFormChanges()) setShowCancelConfirm(true);
                      else router.push('/seller/products');
                    }}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#1a1a1a] border border-[#2A2A2A] text-[#ffcc99] font-medium hover:bg-[#222] hover:border-[#444444] transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <div className="flex-1 relative group/submit">
                    <button
                      type="submit"
                      disabled={loading || !isFormValid()}
                      className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#cc5200] text-white font-bold hover:from-[#cc5200] hover:to-[#FF6B00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Product...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Add Product
                        </>
                      )}
                    </button>
                    {!loading && !isFormValid() && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#222] border border-[#2A2A2A] rounded-lg text-xs text-[#ffcc99] whitespace-nowrap opacity-0 group-hover/submit:opacity-100 pointer-events-none transition-opacity z-10">
                        Complete required fields to continue
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancel confirmation dialog */}
                {showCancelConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowCancelConfirm(false)}>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                      <p className="text-white font-medium mb-4">Discard changes?</p>
                      <p className="text-[#A0A0A0] text-sm mb-6">Your product details will be lost.</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 px-4 py-3 rounded-lg border border-[#2A2A2A] text-[#ffcc99] hover:bg-[#222] font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCancelConfirm(false); router.push('/seller/products'); }}
                          className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-500 font-medium"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </form>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}
