import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
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
  Loader2
} from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  quantity: string;
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
}

interface UploadedImage {
  url: string;
  preview: string;
}

const categories = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'clothing', label: 'Clothing & Fashion', icon: '👕' },
  { value: 'food', label: 'Food & Groceries', icon: '🍕' },
  { value: 'books', label: 'Books & Media', icon: '📚' },
  { value: 'home', label: 'Home & Garden', icon: '🏠' },
  { value: 'beauty', label: 'Beauty & Health', icon: '💄' },
  { value: 'sports', label: 'Sports & Outdoors', icon: '⚽' },
  { value: 'toys', label: 'Toys & Games', icon: '🎮' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'other', label: 'Other', icon: '📦' },
];

// Categories that strongly benefit from material and care information
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    quantity: '',
    material: '',
    careInfo: '',
    keyFeatures: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{
    description?: string;
    tags?: string[];
    keyFeatures?: string[];
    material?: string;
    careInfo?: string;
    keywords?: string[];
  } | null>(null);

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
    }
  }, [router, authLoading, isAuthenticated, user]);

  const validateField = (name: string, value: string) => {
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
        if (formData.category) {
          const categoryInfo = shouldShowMaterialCarePrompt(formData.category);
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
      const response = await apiClient.post('/products/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload image';
      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAIContent = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    setAiGenerating(true);
    try {
      const categoryInfo = formData.category ? shouldShowMaterialCarePrompt(formData.category) : { required: false, recommended: false };
      const categoryName = categories.find(c => c.value === formData.category)?.label;

      const response = await apiClient.post('/products/ai/generate-content', {
        title: formData.title,
        category: formData.category || undefined,
        categoryName: categoryName || undefined,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : undefined,
        existingDescription: formData.description || undefined,
        needsMaterial: categoryInfo.required || categoryInfo.recommended,
        needsCareInfo: categoryInfo.required || categoryInfo.recommended,
      });

      setAiGeneratedContent(response.data);
      toast.success('AI content generated successfully! Review and accept the fields you want to use.');
    } catch (error: any) {
      console.error('Error generating AI content:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate AI content';
      toast.error(errorMessage);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAcceptAIContent = (field: 'description' | 'keyFeatures' | 'material' | 'careInfo') => {
    if (!aiGeneratedContent) return;

    if (field === 'description' && aiGeneratedContent.description) {
      setFormData(prev => ({ ...prev, description: aiGeneratedContent.description! }));
      toast.success('Description applied');
    } else if (field === 'keyFeatures' && aiGeneratedContent.keyFeatures) {
      setFormData(prev => ({ ...prev, keyFeatures: aiGeneratedContent.keyFeatures! }));
      toast.success('Key features applied');
    } else if (field === 'material' && aiGeneratedContent.material) {
      setFormData(prev => ({ ...prev, material: aiGeneratedContent.material! }));
      toast.success('Material information applied');
    } else if (field === 'careInfo' && aiGeneratedContent.careInfo) {
      setFormData(prev => ({ ...prev, careInfo: aiGeneratedContent.careInfo! }));
      toast.success('Care instructions applied');
    }
  };

  const handleAcceptAllAIContent = () => {
    if (!aiGeneratedContent) return;

    setFormData(prev => ({
      ...prev,
      description: aiGeneratedContent.description || prev.description,
      keyFeatures: aiGeneratedContent.keyFeatures || prev.keyFeatures,
      material: aiGeneratedContent.material || prev.material,
      careInfo: aiGeneratedContent.careInfo || prev.careInfo,
    }));

    toast.success('All AI-generated content applied!');
    setAiGeneratedContent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Partial<Record<keyof FormData, string>> = {};
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

      const productData = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: uploadedImages.map(img => img.url),
        quantity: parseInt(formData.quantity),
        material: formData.material || undefined,
        careInfo: formData.careInfo || undefined,
        keyFeatures: formData.keyFeatures && formData.keyFeatures.length > 0 
          ? formData.keyFeatures.filter(f => f.trim()).map(f => f.trim())
          : undefined,
      };

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
      formData.price &&
      parseFloat(formData.price) > 0 &&
      formData.quantity &&
      parseInt(formData.quantity) >= 0 &&
      uploadedImages.length > 0
    );
  };

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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6600] to-[#cc5200] flex items-center justify-center">
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
                          <img
                            src={image.preview}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#ff6600] text-black text-[10px] font-bold rounded">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
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
                        className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${
                          errors.title ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
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

                    {/* AI Assistant */}
                    <div className="bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/5 border-2 border-[#ff6600]/30 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#ff6600]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wand2 className="w-5 h-5 text-[#ff6600]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">AI Content Assistant</h3>
                          <p className="text-[#ffcc99]/70 text-xs">
                            Let AI generate complete product descriptions, key features, tags, and all necessary details for you. Just provide the product title!
                          </p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleGenerateAIContent}
                        disabled={aiGenerating || !formData.title.trim()}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#ff6600] to-[#cc5200] text-white font-semibold hover:from-[#cc5200] hover:to-[#ff6600] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating Content...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            <span>Generate All Content with AI</span>
                          </>
                        )}
                      </button>

                      {aiGeneratedContent && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[#ff6600] text-sm font-medium">Generated Content Preview</p>
                            <button
                              type="button"
                              onClick={handleAcceptAllAIContent}
                              className="px-3 py-1.5 bg-[#ff6600] text-black text-xs font-semibold rounded-lg hover:bg-[#cc5200] transition"
                            >
                              Accept All
                            </button>
                          </div>

                          {/* Description Preview */}
                          {aiGeneratedContent.description && (
                            <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-white text-xs font-medium">Description</p>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptAIContent('description')}
                                  className="px-2 py-1 bg-[#ff6600]/20 text-[#ff6600] text-xs rounded hover:bg-[#ff6600]/30 transition"
                                >
                                  Accept
                                </button>
                              </div>
                              <p className="text-[#ffcc99] text-xs line-clamp-3">{aiGeneratedContent.description}</p>
                            </div>
                          )}

                          {/* Key Features Preview */}
                          {aiGeneratedContent.keyFeatures && aiGeneratedContent.keyFeatures.length > 0 && (
                            <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-white text-xs font-medium">Key Features</p>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptAIContent('keyFeatures')}
                                  className="px-2 py-1 bg-[#ff6600]/20 text-[#ff6600] text-xs rounded hover:bg-[#ff6600]/30 transition"
                                >
                                  Accept
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {aiGeneratedContent.keyFeatures.map((feature, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-[#ff6600]/20 text-[#ff6600] rounded text-xs"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Material Preview */}
                          {aiGeneratedContent.material && (
                            <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-white text-xs font-medium">Material Information</p>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptAIContent('material')}
                                  className="px-2 py-1 bg-[#ff6600]/20 text-[#ff6600] text-xs rounded hover:bg-[#ff6600]/30 transition"
                                >
                                  Accept
                                </button>
                              </div>
                              <p className="text-[#ffcc99] text-xs line-clamp-2">{aiGeneratedContent.material}</p>
                            </div>
                          )}

                          {/* Care Info Preview */}
                          {aiGeneratedContent.careInfo && (
                            <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-white text-xs font-medium">Care Instructions</p>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptAIContent('careInfo')}
                                  className="px-2 py-1 bg-[#ff6600]/20 text-[#ff6600] text-xs rounded hover:bg-[#ff6600]/30 transition"
                                >
                                  Accept
                                </button>
                              </div>
                              <p className="text-[#ffcc99] text-xs line-clamp-2">{aiGeneratedContent.careInfo}</p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setAiGeneratedContent(null)}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] text-xs rounded-lg hover:bg-[#ff6600]/10 transition"
                          >
                            Dismiss Preview
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Key Features */}
                    <div>
                      <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                        Key Features
                      </label>
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
                              className={`flex-1 px-4 py-2 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${
                                errors.keyFeatures ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
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
                    {(() => {
                      const categoryInfo = formData.category ? shouldShowMaterialCarePrompt(formData.category) : { required: false, recommended: false };
                      const examples = formData.category ? getCategoryExamples(formData.category) : null;
                      const needsMaterial = categoryInfo.required || categoryInfo.recommended;
                      
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[#ffcc99] text-sm font-medium">
                              Materials & Composition
                              {categoryInfo.required && <span className="text-yellow-400 ml-1">*</span>}
                            </label>
                            {needsMaterial && !formData.material && (
                              <button
                                type="button"
                                onClick={() => {
                                  const examples = getCategoryExamples(formData.category);
                                  setFormData(prev => ({ ...prev, material: examples.material }));
                                }}
                                className="text-xs text-[#ff6600] hover:text-[#ff8800] underline"
                              >
                                Use example
                              </button>
                            )}
                          </div>
                          <textarea
                            name="material"
                            placeholder={examples?.material || "e.g., 100% Cotton, Linen blend, Polyester, etc. Include specific materials, blends, dimensions, or composition details."}
                            value={formData.material}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none ${
                              categoryInfo.required && !formData.material
                                ? 'border-yellow-400/50'
                                : errors.material
                                ? 'border-red-500'
                                : 'border-[#ff6600]/30'
                            }`}
                          />
                          {categoryInfo.required && !formData.material && (
                            <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                              <p className="text-yellow-400 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>88% of customers actively look for material information for {categories.find(c => c.value === formData.category)?.label.toLowerCase()} products. Adding this information improves customer confidence and reduces product returns.</span>
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
                      const categoryInfo = formData.category ? shouldShowMaterialCarePrompt(formData.category) : { required: false, recommended: false };
                      const examples = formData.category ? getCategoryExamples(formData.category) : null;
                      const needsCareInfo = categoryInfo.required || categoryInfo.recommended;
                      
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[#ffcc99] text-sm font-medium">
                              Care Instructions
                              {categoryInfo.required && <span className="text-yellow-400 ml-1">*</span>}
                            </label>
                            {needsCareInfo && !formData.careInfo && (
                              <button
                                type="button"
                                onClick={() => {
                                  const examples = getCategoryExamples(formData.category);
                                  setFormData(prev => ({ ...prev, careInfo: examples.careInfo }));
                                }}
                                className="text-xs text-[#ff6600] hover:text-[#ff8800] underline"
                              >
                                Use example
                              </button>
                            )}
                          </div>
                          <textarea
                            name="careInfo"
                            placeholder={examples?.careInfo || "e.g., Machine wash cold, tumble dry low, do not bleach, iron on low heat. Include washing, cleaning, storage, or maintenance instructions."}
                            value={formData.careInfo}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none ${
                              categoryInfo.required && !formData.careInfo
                                ? 'border-yellow-400/50'
                                : errors.careInfo
                                ? 'border-red-500'
                                : 'border-[#ff6600]/30'
                            }`}
                          />
                          {categoryInfo.required && !formData.careInfo && (
                            <div className="mt-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                              <p className="text-yellow-400 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>88% of customers need care instructions for {categories.find(c => c.value === formData.category)?.label.toLowerCase()} products. Without this, customers may skip your product or make returns due to improper care.</span>
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
                        Category
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              formData.category === cat.value
                                ? 'bg-[#ff6600] border-[#ff6600] text-black'
                                : 'bg-black border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600]/60'
                            }`}
                          >
                            <span className="text-lg block mb-1">{cat.icon}</span>
                            <span className="text-xs font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
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
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${
                            errors.price ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
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
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${
                            errors.quantity ? 'border-red-500' : 'border-[#ff6600]/30 focus:border-transparent'
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
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6600] to-[#cc5200] text-white font-bold hover:from-[#cc5200] hover:to-[#ff6600] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
