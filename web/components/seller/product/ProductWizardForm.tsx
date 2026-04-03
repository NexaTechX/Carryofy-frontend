import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import SellerLayout from '../SellerLayout';
import { useAuth } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import { useCategories } from '../../../lib/buyer/hooks/useCategories';
import {
  Package,
  X,
  DollarSign,
  Layers,
  FileText,
  ArrowLeft,
  Check,
  AlertCircle,
  Plus,
  Wand2,
  Loader2,
  ShieldAlert,
  ShieldX,
  Clock,
  Image as ImageIcon,
  Camera,
  Building2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  price: string;
  categoryIds: string[];
  quantity: string;
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  moq?: string;
}

/** B2B tier form rows (₦ per unit in UI; sent as kobo on submit) */
interface WholesalePriceTierForm {
  minQuantity: string;
  maxQuantity: string;
  unitPrice: string;
}

const DRAFT_STORAGE_KEY = 'carryofy-seller-add-product-draft-v1';

interface ProductDraftV1 {
  v: 1;
  savedAt: string;
  mode: 'retail' | 'wholesale';
  wizardStep: 1 | 2 | 3 | 4;
  formData: FormData;
  productImages: string[];
  priceTiers: WholesalePriceTierForm[];
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

/** Loaded product shape for edit mode (API / kobo fields) */
export interface ProductWizardInitialProduct {
  title: string;
  description: string;
  price: number;
  images: string[];
  quantity: number;
  categoryIds: string[];
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  sellingMode?: 'B2C_ONLY' | 'B2B_ONLY' | 'B2C_AND_B2B';
  moq?: number;
  priceTiers?: { minQuantity: number; maxQuantity: number; priceKobo: number }[];
}

export interface ProductWizardFormProps {
  variant: 'create' | 'edit';
  /** Required when variant is edit */
  productId?: string;
  initialProduct?: ProductWizardInitialProduct | null;
}

export function ProductWizardForm({ variant, productId, initialProduct }: ProductWizardFormProps) {
  // 1. All hooks and state first
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState<boolean>(true);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { id: string; url: string; progress: number; file: File }[]
  >([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    categoryIds: [],
    quantity: '',
    material: '',
    careInfo: '',
    keyFeatures: [],
    moq: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [aiGeneratingField, setAiGeneratingField] = useState<'description' | 'keyFeatures' | 'material' | 'careInfo' | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [draftKeyFeature, setDraftKeyFeature] = useState('');
  const [mode, setMode] = useState<'retail' | 'wholesale'>('retail');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [priceTiers, setPriceTiers] = useState<WholesalePriceTierForm[]>([]);
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const [draftRestoreOffer, setDraftRestoreOffer] = useState<ProductDraftV1 | null>(null);

  const draftSnapshotRef = useRef({
    mode,
    wizardStep,
    formData,
    productImages,
    priceTiers,
  });
  draftSnapshotRef.current = { mode, wizardStep, formData, productImages, priceTiers };

  useEffect(() => {
    if (variant !== 'edit' || !initialProduct) return;
    const sm = initialProduct.sellingMode;
    setMode(sm === 'B2B_ONLY' ? 'wholesale' : 'retail');
    setProductImages(initialProduct.images?.length ? [...initialProduct.images] : []);
    setFormData({
      title: initialProduct.title,
      description: initialProduct.description || '',
      price: (initialProduct.price / 100).toFixed(2),
      categoryIds: initialProduct.categoryIds?.length ? [...initialProduct.categoryIds] : [],
      quantity: String(initialProduct.quantity),
      material: initialProduct.material || '',
      careInfo: initialProduct.careInfo || '',
      keyFeatures: initialProduct.keyFeatures?.length ? [...initialProduct.keyFeatures] : [],
      moq: initialProduct.moq != null ? String(initialProduct.moq) : '',
    });
    setPriceTiers(
      (initialProduct.priceTiers || []).map((t) => ({
        minQuantity: String(t.minQuantity),
        maxQuantity: String(t.maxQuantity),
        unitPrice: (t.priceKobo / 100).toFixed(2),
      }))
    );
    setWizardStep(1);
    setErrors({});
    setPendingImages([]);
  }, [variant, initialProduct]);

  const handleModeChange = (newMode: 'retail' | 'wholesale') => {
    if (newMode === mode) return;
    setMode(newMode);
    setFormData(prev => ({
      ...prev,
      price: '',
      quantity: '',
      moq: '',
    }));
    setPriceTiers([]);
    setErrors(prev => ({
      ...prev,
      price: undefined,
      quantity: undefined,
      moq: undefined,
    }));
  };

  // 2. Function declarations (helpers - hoisted but kept here for clarity)
  async function fetchOnboardingStatus() {
    try {
      const [kycRes, sellerRes] = await Promise.allSettled([
        apiClient.get('/sellers/kyc'),
        apiClient.get('/sellers/me')
      ]);

      if (kycRes.status === 'fulfilled') {
        const data = kycRes.value.data?.data || kycRes.value.data;
        setKycStatus(data.status);
      }

      if (sellerRes.status === 'fulfilled') {
        const data = sellerRes.value.data?.data || sellerRes.value.data;
        // Detailed check for location components
        const hasAddr = !!data.businessAddress;
        const hasLat = data.latitude != null;
        const hasLng = data.longitude != null;

        console.log('Location Check:', { hasAddr, hasLat, hasLng, data });

        setHasLocation(hasAddr && hasLat && hasLng);
      } else {
        console.warn('Seller Profile fetch failed:', sellerRes.reason);
        setHasLocation(false);
      }
    } catch (err) {
      console.error('Error fetching onboarding status:', err);
    } finally {
      setKycLoading(false);
      setCheckingLocation(false);
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

  function getEffectiveCommissionPercent(): number | null {
    const cat = getSelectedCategory();
    if (!cat) return null;
    if (mode === 'wholesale') {
      const b2b = cat.commissionB2B;
      if (b2b != null && !Number.isNaN(b2b)) return b2b;
      return cat.commissionB2C ?? 15;
    }
    return cat.commissionB2C ?? 15;
  }

  function getEarningsPerUnitNaira(): string | null {
    const pct = getEffectiveCommissionPercent();
    const p = parseFloat(formData.price);
    if (pct == null || !formData.price || Number.isNaN(p) || p <= 0) return null;
    const earn = p * (1 - pct / 100);
    return earn.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function stepImagesOk() {
    return productImages.length > 0;
  }

  function stepBasicOk() {
    const titleOk = formData.title.trim().length >= 3 && formData.title.trim().length <= 100;
    const catOk = (formData.categoryIds?.length ?? 0) > 0;
    if (!titleOk || !catOk) return false;
    if (categorySlug) {
      const catInfo = shouldShowMaterialCarePrompt(categorySlug);
      if (catInfo.required) {
        if (!formData.material?.trim() || !formData.careInfo?.trim()) return false;
      }
    }
    if (mode === 'retail' && formData.keyFeatures?.length) {
      const err = validateKeyFeatures(formData.keyFeatures);
      if (err) return false;
    }
    return true;
  }

  function stepPricingOk() {
    if (!formData.price || parseFloat(formData.price) <= 0) return false;
    if (formData.quantity === '' || parseInt(formData.quantity, 10) < 0) return false;
    if (mode === 'wholesale') {
      if (!formData.moq || parseInt(formData.moq, 10) < 1) return false;
      for (const t of priceTiers) {
        const hasAny = !!(t.minQuantity || t.maxQuantity || t.unitPrice);
        if (!hasAny) continue;
        const min = parseInt(t.minQuantity, 10);
        const max = parseInt(t.maxQuantity, 10);
        const pr = parseFloat(t.unitPrice);
        if (
          !t.minQuantity ||
          !t.maxQuantity ||
          !t.unitPrice ||
          Number.isNaN(min) ||
          Number.isNaN(max) ||
          min < 1 ||
          max < min ||
          Number.isNaN(pr) ||
          pr <= 0
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function persistDraftToStorage() {
    if (variant !== 'create' || typeof window === 'undefined') return;
    const { mode: m, wizardStep: ws, formData: fd, productImages: imgs, priceTiers: tiers } =
      draftSnapshotRef.current;
    const hasContent =
      imgs.length > 0 ||
      fd.title.trim() !== '' ||
      fd.description.trim() !== '' ||
      (fd.keyFeatures && fd.keyFeatures.some((f) => f.trim() !== '')) ||
      (fd.categoryIds?.length ?? 0) > 0 ||
      fd.price !== '' ||
      fd.quantity !== '' ||
      (fd.material && fd.material.trim() !== '') ||
      (fd.careInfo && fd.careInfo.trim() !== '') ||
      (fd.moq && fd.moq !== '') ||
      tiers.length > 0;
    if (!hasContent) return;
    try {
      const payload: ProductDraftV1 = {
        v: 1,
        savedAt: new Date().toISOString(),
        mode: m,
        wizardStep: ws,
        formData: fd,
        productImages: imgs,
        priceTiers: tiers,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setDraftSavedVisible(true);
      window.setTimeout(() => setDraftSavedVisible(false), 2500);
    } catch {
      /* ignore quota */
    }
  }

  function clearDraftStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function restoreDraft(d: ProductDraftV1) {
    setMode(d.mode);
    setWizardStep(d.wizardStep >= 1 && d.wizardStep <= 4 ? d.wizardStep : 1);
    setFormData(d.formData);
    setProductImages(d.productImages || []);
    setPriceTiers(Array.isArray(d.priceTiers) ? d.priceTiers : []);
    setErrors({});
    setDraftRestoreOffer(null);
    toast.success('Draft restored');
  }

  // 4. Effects
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (variant !== 'create' || !mounted || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ProductDraftV1;
      if (parsed?.v !== 1 || !parsed.formData) return;
      const hasContent =
        (parsed.productImages?.length ?? 0) > 0 ||
        (parsed.formData.title?.trim?.() ?? '') !== '' ||
        (parsed.formData.description?.trim?.() ?? '') !== '' ||
        (parsed.formData.categoryIds?.length ?? 0) > 0 ||
        (parsed.formData.price ?? '') !== '';
      if (hasContent) setDraftRestoreOffer(parsed);
    } catch {
      /* ignore */
    }
  }, [mounted, variant]);

  useEffect(() => {
    if (variant !== 'create' || !mounted) return;
    const id = window.setInterval(() => {
      persistDraftToStorage();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [mounted, variant]);

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
    fetchOnboardingStatus();
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

    // Upload images sequentially to avoid network timeout and Cloudinary rate limits on mobile connections
    for (const pendingItem of newPending) {
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
    }

    try {
      // Replaced Promise.all directly with try/finally since we awaited in the for loop above
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
    
    // Simulate input change by creating a pseudo event object
    const pseudoEvent = {
       target: { files }
    } as any;
    handleImageUpload(pseudoEvent);
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
    if (wizardStep !== 4) return;

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

    // Wholesale: MOQ required and >= 1
    if (mode === 'wholesale') {
      if (!formData.moq || formData.moq.trim() === '') {
        newErrors.moq = 'Minimum order quantity is required';
      } else if (parseInt(formData.moq, 10) < 1) {
        newErrors.moq = 'Minimum order quantity must be at least 1';
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
      const sellingMode = mode === 'wholesale' ? 'B2B_ONLY' : 'B2C_ONLY';

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

      if (mode === 'wholesale' && formData.moq) {
        productData.moq = parseInt(formData.moq, 10);
      }

      const tiersPayload =
        mode === 'wholesale' && priceTiers.length > 0
          ? priceTiers
              .filter((t) => t.minQuantity && t.maxQuantity && t.unitPrice)
              .map((t) => ({
                minQuantity: parseInt(t.minQuantity, 10),
                maxQuantity: parseInt(t.maxQuantity, 10),
                priceKobo: Math.round(parseFloat(t.unitPrice) * 100),
              }))
          : [];

      if (variant === 'edit') {
        productData.priceTiers = mode === 'wholesale' && tiersPayload.length > 0 ? tiersPayload : [];
      } else if (mode === 'wholesale' && tiersPayload.length > 0) {
        productData.priceTiers = tiersPayload;
      }

      console.log('🚀 SUBMITTING PRODUCT DATA - Images:', productData.images);

      if (variant === 'edit') {
        if (!productId) {
          toast.error('Missing product');
          setLoading(false);
          return;
        }
        await apiClient.put(`/products/${productId}`, productData);
        toast.success('Product updated successfully!');
      } else {
        await apiClient.post('/products', productData);
        clearDraftStorage();
        toast.success('Product created successfully!');
      }
      router.push('/seller/products');
    } catch (error: any) {
      console.error(variant === 'edit' ? 'Error updating product:' : 'Error creating product:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        (variant === 'edit' ? 'Failed to update product' : 'Failed to create product');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => stepImagesOk() && stepBasicOk() && stepPricingOk();

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
      (formData.moq && formData.moq !== '') ||
      priceTiers.length > 0
    );
  };

  const goWizardBack = () => {
    if (wizardStep > 1) setWizardStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const goWizardNext = () => {
    if (wizardStep === 1 && !stepImagesOk()) {
      toast.error('Add at least one product image to continue');
      return;
    }
    if (wizardStep === 2 && !stepBasicOk()) {
      toast.error('Complete title, category, and required product details');
      return;
    }
    if (wizardStep === 3 && !stepPricingOk()) {
      toast.error('Fix pricing, stock, and tier rows before continuing');
      return;
    }
    if (wizardStep < 4) setWizardStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  };

  const stepperItems: { label: string; step: 1 | 2 | 3 | 4 }[] = [
    { label: 'Images', step: 1 },
    { label: 'Basic Info', step: 2 },
    { label: 'Pricing', step: 3 },
    { label: 'Publish', step: 4 },
  ];

  if (authLoading || kycLoading || checkingLocation) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Checking your status...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Location Gate — block the form if seller location is missing
  if (!hasLocation) {
    return (
      <>
        <Head>
          <title>Location Required - Seller Portal | Carryofy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <SellerLayout>
          <div className="min-h-full flex items-center justify-center py-16 px-4">
            <div className="max-w-lg w-full">
              {/* Icon */}
              <div className="w-24 h-24 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-8">
                <Building2 className="w-12 h-12 text-amber-400" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-center mb-3 text-amber-300">
                Business Location Required
              </h1>

              {/* Description */}
              <div className="text-[#ffcc99]/80 text-center text-sm leading-relaxed mb-8 space-y-2">
                <p>
                  To list products on Carryofy, you must provide your business pickup location. This allows us to calculate accurate delivery fees and coordinate riders for your orders.
                </p>
                {!hasLocation && !checkingLocation && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-left">
                    <p className="font-bold mb-1">Status:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Profile Found: Yes</li>
                      <li>Business Address: {/* We can't easily access the partial data here without adding more state, but let's just show general guidance */} Check Settings</li>
                      <li>Coordinates (GPS): Required for pricing engine</li>
                    </ul>
                  </div>
                )}
              </div>

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
                  href="/seller/settings?tab=business"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#ff6600] hover:bg-[#cc5200] rounded-xl font-bold text-black transition-all"
                >
                  <Building2 className="w-4 h-4" /> Add Location
                </a>
              </div>
            </div>
          </div>
        </SellerLayout>
      </>
    );
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
        <title>{variant === 'edit' ? 'Edit Product' : 'Add Product'} - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content={variant === 'edit' ? 'Edit your product on Carryofy.' : 'Add a new product to your inventory on Carryofy.'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div className="min-h-full pb-8 -m-3 sm:-m-4 lg:-m-6 xl:-m-8">
          {/* Sticky stepper — Publish shows ✓ only on step 4 */}
          <div
            className="sticky top-0 z-20 flex flex-wrap items-center gap-y-2 px-4 sm:px-6 lg:px-8 py-2.5 border-b border-[#2A2A2A]"
            style={{ backgroundColor: '#111111' }}
          >
            <div className="flex items-center gap-0 w-full max-w-3xl">
              {stepperItems.map((item, idx) => {
                const isPublish = item.step === 4;
                const isActive = wizardStep === item.step;
                const priorComplete = !isPublish && wizardStep > item.step;
                const publishComplete = isPublish && wizardStep === 4;
                const showCheck = priorComplete || publishComplete;
                return (
                  <div key={item.label} className="flex items-center flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                          showCheck
                            ? 'bg-green-500/20 text-green-500'
                            : isActive
                              ? 'bg-[#F97316]/20 text-[#F97316]'
                              : 'bg-[#2A2A2A] text-[#6B6B6B]'
                        }`}
                      >
                        {showCheck ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${
                          showCheck
                            ? 'text-[#6B6B6B]'
                            : isActive
                              ? 'text-[#F97316]'
                              : 'text-[#6B6B6B]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {idx < stepperItems.length - 1 && (
                      <div
                        className="shrink-0 w-6 h-px mx-1"
                        style={{
                          backgroundColor: wizardStep > item.step ? '#22c55e' : '#2A2A2A',
                        }}
                      />
                    )}
                  </div>
                );
              })}
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
              {/* Selling Type Switcher */}
              <div className="mb-4">
                <p className="text-[#ffcc99] text-sm font-medium mb-2">Selling type</p>
                <div
                  className="inline-flex rounded-lg p-1 bg-[#1A1A1A] gap-0 border border-[#2A2A2A]"
                  role="tablist"
                >
                  <button
                    type="button"
                    onClick={() => handleModeChange('retail')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${mode === 'retail'
                      ? 'bg-[#F97316] text-white'
                      : 'text-[#A0A0A0] hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Retail (D2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('wholesale')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${mode === 'wholesale'
                      ? 'bg-[#F97316] text-white'
                      : 'text-[#A0A0A0] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Wholesale (B2B)
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#F97316] to-[#c2410c] flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{variant === 'edit' ? 'Edit Product' : 'Add New Product'}</h1>
                    <p className="text-[#ffcc99] text-sm">
                      {variant === 'edit' ? 'Update your listing with the same steps as creating a product' : 'Fill in the details to list your product'}
                    </p>
                  </div>
                </div>
                {variant === 'create' && draftSavedVisible && (
                  <p className="text-xs text-[#A0A0A0] tabular-nums" aria-live="polite">
                    Draft saved
                  </p>
                )}
              </div>
            </div>

            {variant === 'create' && draftRestoreOffer && (
              <div className="mb-6 rounded-xl border border-[#F97316]/35 bg-[#F97316]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-[#ffcc99]">
                  You have a saved draft from{' '}
                  {new Date(draftRestoreOffer.savedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  . Restore it?
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDraftRestoreOffer(null)}
                    className="px-3 py-2 rounded-lg border border-[#2A2A2A] text-[#ffcc99] text-sm hover:bg-[#222]"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => restoreDraft(draftRestoreOffer)}
                    className="px-3 py-2 rounded-lg bg-[#F97316] text-black text-sm font-semibold hover:bg-[#ea580c]"
                  >
                    Restore draft
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-4">
                  {wizardStep === 1 && (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-[#F97316]/20 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <ImageIcon className="w-5 h-5 text-[#F97316]" />
                      <h2 className="text-white font-semibold">Product Images</h2>
                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages || productImages.length >= 5}
                      className="hidden"
                      id="image-upload"
                    />

                    {(() => {
                      const showSecondarySlots = productImages.length > 0;
                      return (
                    <div
                      className={`grid gap-3 ${showSecondarySlots ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}
                      style={showSecondarySlots ? { gridTemplateRows: 'minmax(200px,1fr) 88px' } : undefined}
                    >
                      <div
                        className={
                          showSecondarySlots
                            ? 'row-span-2 col-span-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[200px]'
                            : 'flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[240px]'
                        }
                        style={{
                          borderColor: productImages[0] ? 'transparent' : '#F97316',
                        }}
                      >
                        {productImages[0] ? (
                          <label
                            htmlFor="image-upload"
                            className="relative w-full h-full min-h-[200px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group/img"
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
                          <div className="w-full h-full min-h-[200px] rounded-xl overflow-hidden border-2 border-[#F97316]/30 bg-[#1a1a1a] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
                              <span className="text-sm text-[#A0A0A0]">Uploading...</span>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="image-upload"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="w-full h-full min-h-[220px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer hover:bg-[#F97316]/5 transition-all duration-200 px-4 text-center"
                            style={{ borderColor: '#F97316' }}
                          >
                            <Camera className="w-10 h-10 text-[#F97316] mb-3 shrink-0" />
                            <span className="font-semibold text-white text-base">Tap to upload from camera or gallery</span>
                            <span className="text-xs mt-2 text-[#A0A0A0]">JPG, PNG, WebP · up to 5 images · max 5MB each</span>
                          </label>
                        )}
                      </div>

                      {showSecondarySlots &&
                        [1, 2, 3, 4].map((idx) => (
                        <div
                          key={idx}
                          className="w-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all min-h-[88px]"
                          style={{
                            borderColor: productImages[idx] ? 'transparent' : '#2A2A2A',
                          }}
                        >
                          {productImages[idx] ? (
                            <label
                              htmlFor="image-upload"
                              className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group/img min-h-[88px]"
                            >
                              <Image
                                src={productImages[idx]}
                                alt={`Product ${idx + 1}`}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover min-h-[88px]"
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
                            <div className="w-full h-full rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#1a1a1a] flex items-center justify-center min-h-[88px]">
                              <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
                            </div>
                          ) : (
                            <label
                              htmlFor="image-upload"
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              className="w-full h-full min-h-[88px] flex items-center justify-center rounded-xl border-2 border-dashed cursor-pointer hover:bg-[#222] transition-colors"
                              style={{ borderColor: '#2A2A2A' }}
                            >
                              <span className="text-sm font-medium text-[#A0A0A0]">{idx + 1}</span>
                            </label>
                          )}
                        </div>
                        ))}
                    </div>
                      );
                    })()}

                    {productImages.length === 0 && (
                      <p className="mt-3 text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        At least one product image is required
                      </p>
                    )}
                  </div>
                  )}

                  {wizardStep === 2 && (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-[#F97316]/20 p-5">
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
                            className={`text-xs tabular-nums ${formData.title.length > 80 ? 'text-[#FF6B00]' : 'text-[#A0A0A0]'
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
                        <button
                          type="button"
                          onClick={() => handleGenerateAIField('description')}
                          disabled={!!aiGeneratingField || !formData.title.trim()}
                          className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-sm font-medium hover:bg-[#F97316]/25 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {aiGeneratingField === 'description' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                          <span>✨ Generate with AI</span>
                        </button>
                      </div>

                      {/* Key Features - Retail only */}
                      {mode === 'retail' && (
                        <div>
                          <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                            Key Features
                          </label>
                          <p className="text-[#ffcc99]/60 text-xs mb-3">
                            Add up to 3 short highlights (press <kbd className="px-1 py-0.5 rounded bg-[#2A2A2A] text-[#ffcc99] text-[10px] font-sans">Enter</kbd> to add)
                          </p>

                          <div className="space-y-3">
                            {(formData.keyFeatures || []).filter((f) => f.trim()).length < 3 && (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  placeholder="Type a feature, press Enter to add"
                                  value={draftKeyFeature}
                                  onChange={(e) => setDraftKeyFeature(e.target.value)}
                                  maxLength={30}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddKeyFeature();
                                    }
                                  }}
                                  className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316] ${errors.keyFeatures ? 'border-red-500' : 'border-[#2A2A2A]'}`}
                                />
                                <button
                                  type="button"
                                  onClick={handleAddKeyFeature}
                                  className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#F97316]/40 text-[#F97316] text-sm font-medium hover:bg-[#F97316]/10 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </button>
                              </div>
                            )}

                            {(formData.keyFeatures || []).some((f) => f.trim()) && (
                              <div className="flex flex-wrap gap-2">
                                {(formData.keyFeatures || []).map((feature, index) =>
                                  feature.trim() ? (
                                    <span
                                      key={index}
                                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full border border-[#F97316]/35 text-[#F97316] text-sm font-medium bg-[#F97316]/10"
                                    >
                                      <span className="max-w-[220px] truncate">{feature}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveKeyFeature(index)}
                                        className="p-1 rounded-full hover:bg-[#F97316]/20 transition-colors text-[#ffcc99]"
                                        aria-label={`Remove ${feature}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  ) : null
                                )}
                              </div>
                            )}
                          </div>

                          {errors.keyFeatures && (
                            <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.keyFeatures}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Product Description */}
                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Description
                        </label>
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
                            <p className="text-[#ffcc99]/70 text-sm mb-3">
                              Select one or more categories (up to 10). First selected is primary for commission — platform commission is deducted from each sale; you receive the remainder after each order.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {categories.map((cat) => {
                                const isSelected = formData.categoryIds.includes(cat.id);
                                const isPrimary = formData.categoryIds[0] === cat.id;
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
                                    className={`relative rounded-xl border text-left transition-all flex items-center gap-3 px-3 py-3 min-h-[4.5rem] ${
                                      isSelected
                                        ? 'bg-[#F97316]/15 border-[#F97316] text-white'
                                        : (formData.categoryIds?.length ?? 0) >= 10
                                          ? 'opacity-60 cursor-not-allowed bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0]'
                                          : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#222] hover:border-[#444444]'
                                    } ${errors.categoryIds ? 'border-red-500' : ''}`}
                                    disabled={!formData.categoryIds.includes(cat.id) && (formData.categoryIds?.length ?? 0) >= 10}
                                  >
                                    <span className="text-2xl shrink-0 w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                                      {cat.icon || <Package className="w-5 h-5 text-[#F97316]" />}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                      <span className="text-sm font-semibold text-white block truncate">{cat.name}</span>
                                      {isPrimary && isSelected && (
                                        <span className="mt-1 inline-block text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#F97316] text-black">
                                          Primary
                                        </span>
                                      )}
                                    </span>
                                    {isSelected && (
                                      <Check className="w-4 h-4 shrink-0 text-[#F97316]" />
                                    )}
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
                            {getEffectiveCommissionPercent() != null && formData.categoryIds.length > 0 && getSelectedCategory() && (
                              <p className="mt-3 text-sm text-[#ffcc99] leading-relaxed">
                                {mode === 'retail' ? (
                                  <>
                                    Your commission for{' '}
                                    <span className="text-white font-medium">{getSelectedCategory()!.name}</span>:{' '}
                                    {getEffectiveCommissionPercent()}%.
                                    {getEarningsPerUnitNaira() != null ? (
                                      <>
                                        {' '}
                                        You earn{' '}
                                        <span className="text-[#F97316] font-semibold tabular-nums">₦{getEarningsPerUnitNaira()}</span>{' '}
                                        per unit at this price.
                                      </>
                                    ) : (
                                      <span className="text-[#A0A0A0]">
                                        {' '}
                                        Enter your price on the next step to see earnings per unit at that price.
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="text-white font-medium">Your commission: {getEffectiveCommissionPercent()}%.</span>
                                    {getEarningsPerUnitNaira() != null ? (
                                      <>
                                        {' '}
                                        At this price, you earn{' '}
                                        <span className="text-[#F97316] font-semibold tabular-nums">₦{getEarningsPerUnitNaira()}</span>{' '}
                                        per unit.
                                      </>
                                    ) : (
                                      <span className="text-[#A0A0A0]"> Enter your price on the next step to see earnings per unit.</span>
                                    )}
                                  </>
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  )}

                  {wizardStep === 3 && (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-[#F97316]/20 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <DollarSign className="w-5 h-5 text-[#F97316]" />
                      <h2 className="text-white font-semibold">Pricing & Inventory</h2>
                    </div>

                    <div className={`grid gap-4 ${mode === 'wholesale' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {/* Price / Wholesale Price */}
                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          {mode === 'wholesale' ? 'Wholesale Price (₦ per unit)' : 'Price (₦)'} <span className="text-red-400">*</span>
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
                        {mode === 'retail' && getSelectedCategory() && getEffectiveCommissionPercent() != null && (
                          <p className="mt-2 text-xs text-[#ffcc99] leading-relaxed">
                            Your commission for{' '}
                            <span className="text-white font-medium">{getSelectedCategory()!.name}</span>:{' '}
                            {getEffectiveCommissionPercent()}%.
                            {getEarningsPerUnitNaira() != null ? (
                              <>
                                {' '}
                                You earn{' '}
                                <span className="text-[#F97316] font-semibold tabular-nums">₦{getEarningsPerUnitNaira()}</span>{' '}
                                per unit at this price.
                              </>
                            ) : (
                              <span className="text-[#A0A0A0]"> Enter a valid unit price to see earnings.</span>
                            )}
                          </p>
                        )}
                        {errors.price && (
                          <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.price}
                          </p>
                        )}

                        {mode === 'wholesale' && (
                          <div className="mt-4 pt-4 border-t border-[#2A2A2A] space-y-3">
                            <p className="text-[#ffcc99] text-sm font-medium">Bulk pricing tiers (optional)</p>
                            <p className="text-[#ffcc99]/60 text-xs">
                              Define unit prices by quantity range (e.g. 1–10 units at one price, 11–50 at another). Use a high max (e.g. 999999) for &quot;and above&quot;.
                            </p>
                            {priceTiers.map((tier, idx) => (
                              <div key={idx} className="flex flex-wrap items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  placeholder="Min qty"
                                  value={tier.minQuantity}
                                  onChange={(e) => {
                                    const next = [...priceTiers];
                                    next[idx] = { ...next[idx], minQuantity: e.target.value };
                                    setPriceTiers(next);
                                  }}
                                  className="w-24 px-2 py-2 rounded-lg bg-black border border-[#F97316]/30 text-white text-sm"
                                />
                                <span className="text-[#ffcc99]">–</span>
                                <input
                                  type="number"
                                  min={1}
                                  placeholder="Max qty"
                                  value={tier.maxQuantity}
                                  onChange={(e) => {
                                    const next = [...priceTiers];
                                    next[idx] = { ...next[idx], maxQuantity: e.target.value };
                                    setPriceTiers(next);
                                  }}
                                  className="w-28 px-2 py-2 rounded-lg bg-black border border-[#F97316]/30 text-white text-sm"
                                />
                                <span className="text-[#ffcc99] text-sm">₦ / unit</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  placeholder="0.00"
                                  value={tier.unitPrice}
                                  onChange={(e) => {
                                    const next = [...priceTiers];
                                    next[idx] = { ...next[idx], unitPrice: e.target.value };
                                    setPriceTiers(next);
                                  }}
                                  className="flex-1 min-w-[100px] px-2 py-2 rounded-lg bg-black border border-[#F97316]/30 text-white text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPriceTiers((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg"
                                  aria-label="Remove tier"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setPriceTiers((prev) => [
                                  ...prev,
                                  { minQuantity: '', maxQuantity: '', unitPrice: '' },
                                ])
                              }
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-dashed border-[#F97316]/50 text-[#F97316] text-sm font-medium hover:bg-[#F97316]/10 inline-flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Price Tier
                            </button>
                          </div>
                        )}
                      </div>

                      {/* MOQ - Wholesale only */}
                      {mode === 'wholesale' && (
                        <div>
                          <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                            Minimum Order Quantity (MOQ) <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2">
                              <Layers className="w-4 h-4 text-[#ffcc99]" />
                            </span>
                            <input
                              name="moq"
                              type="number"
                              min="1"
                              placeholder="e.g. 10"
                              value={formData.moq || ''}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, moq: e.target.value }));
                                setErrors(prev => ({ ...prev, moq: undefined }));
                              }}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${errors.moq ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'}`}
                            />
                          </div>
                          <p className="mt-1 text-[#A0A0A0] text-xs">
                            Minimum units buyers must order
                          </p>
                          {errors.moq && (
                            <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.moq}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Stock Quantity / Available Stock */}
                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          {mode === 'wholesale' ? 'Available Stock' : 'Stock Quantity'} <span className="text-red-400">*</span>
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
                        {mode === 'retail' && formData.quantity && parseInt(formData.quantity) > 0 && parseInt(formData.quantity) <= 5 && (
                          <p className="mt-1 text-yellow-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Low stock warning will be shown to buyers
                          </p>
                        )}
                      </div>
                    </div>

                    {getEffectiveCommissionPercent() != null && formData.categoryIds.length > 0 && getSelectedCategory() && (
                      <div className="mt-4 p-3 rounded-xl border border-[#F97316]/25 bg-[#F97316]/5">
                        <p className="text-sm text-[#ffcc99] leading-relaxed">
                          {mode === 'retail' ? (
                            <>
                              Your commission for{' '}
                              <span className="text-white font-medium">{getSelectedCategory()!.name}</span>:{' '}
                              {getEffectiveCommissionPercent()}%.
                              {getEarningsPerUnitNaira() != null ? (
                                <>
                                  {' '}
                                  You earn{' '}
                                  <span className="text-[#F97316] font-semibold tabular-nums">₦{getEarningsPerUnitNaira()}</span>{' '}
                                  per unit at this price.
                                </>
                              ) : (
                                <span className="text-[#A0A0A0]"> Enter a valid unit price to see earnings.</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-white font-medium">Your commission: {getEffectiveCommissionPercent()}%.</span>
                              {getEarningsPerUnitNaira() != null ? (
                                <>
                                  {' '}
                                  At this price, you earn{' '}
                                  <span className="text-[#F97316] font-semibold tabular-nums">₦{getEarningsPerUnitNaira()}</span>{' '}
                                  per unit.
                                </>
                              ) : (
                                <span className="text-[#A0A0A0]"> Enter a valid unit price to see your earnings per unit.</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                  {wizardStep === 4 && (
                    <div className="bg-[#1a1a1a] rounded-2xl border border-[#F97316]/20 p-5 space-y-4">
                      <h2 className="text-white font-semibold text-lg">{variant === 'edit' ? 'Review & save' : 'Review & publish'}</h2>
                      <p className="text-[#ffcc99]/80 text-sm">
                        {variant === 'edit'
                          ? 'Confirm your changes before saving.'
                          : `Confirm your listing details before it goes live on Carryofy${mode === 'wholesale' ? ' for wholesale buyers' : ''}.`}
                      </p>
                      <ul className="space-y-2 text-sm text-[#ffcc99]">
                        <li>
                          <span className="text-[#A0A0A0]">Images:</span>{' '}
                          <span className="text-white">{productImages.length} uploaded</span>
                        </li>
                        <li>
                          <span className="text-[#A0A0A0]">Title:</span>{' '}
                          <span className="text-white">{formData.title || '—'}</span>
                        </li>
                        <li>
                          <span className="text-[#A0A0A0]">Primary category:</span>{' '}
                          <span className="text-white">{getSelectedCategory()?.name ?? '—'}</span>
                        </li>
                        <li>
                          <span className="text-[#A0A0A0]">Price:</span>{' '}
                          <span className="text-white tabular-nums">
                            ₦{formData.price ? parseFloat(formData.price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </span>
                          {mode === 'wholesale' && formData.moq && (
                            <span className="text-[#A0A0A0]"> · MOQ {formData.moq}</span>
                          )}
                        </li>
                        <li>
                          <span className="text-[#A0A0A0]">Stock:</span>{' '}
                          <span className="text-white">{formData.quantity || '—'}</span>
                        </li>
                        {mode === 'wholesale' && priceTiers.filter((t) => t.minQuantity && t.maxQuantity && t.unitPrice).length > 0 && (
                          <li>
                            <span className="text-[#A0A0A0]">Price tiers:</span>{' '}
                            <span className="text-white">
                              {priceTiers.filter((t) => t.minQuantity && t.maxQuantity && t.unitPrice).length} configured
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 items-stretch sm:items-center">
                    {wizardStep > 1 && (
                      <button
                        type="button"
                        onClick={goWizardBack}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#1a1a1a] border border-[#2A2A2A] text-[#ffcc99] font-medium hover:bg-[#222] inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                    {wizardStep < 4 && (
                      <button
                        type="button"
                        onClick={goWizardNext}
                        disabled={loading}
                        className="flex-1 sm:ml-auto px-6 py-3 rounded-xl bg-[#F97316] text-black font-semibold hover:bg-[#ea580c] inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {wizardStep === 4 && (
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
                        className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#F97316] to-[#c2410c] text-white font-bold hover:from-[#ea580c] hover:to-[#F97316] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {variant === 'edit'
                              ? 'Saving...'
                              : mode === 'wholesale'
                                ? 'Publishing Wholesale Product...'
                                : 'Creating Product...'}
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            {variant === 'edit'
                              ? 'Save changes'
                              : mode === 'wholesale'
                                ? 'Publish Wholesale Product'
                                : 'Publish Product'}
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
                  )}

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
                            onClick={() => {
                              setShowCancelConfirm(false);
                              clearDraftStorage();
                              router.push('/seller/products');
                            }}
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
