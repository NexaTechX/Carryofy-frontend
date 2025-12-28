import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import SellerLayout from '../../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../../lib/auth';
import { apiClient } from '../../../../lib/api/client';
import { X, Plus, AlertCircle, Sparkles, Wand2, Loader2 } from 'lucide-react';

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

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  status: string;
  category?: string;
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
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
          quantity: product.quantity.toString(),
          material: product.material || '',
          careInfo: product.careInfo || '',
          keyFeatures: product.keyFeatures || [],
        });
        
        setUploadedImageUrls(product.images || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    try {
      const token = tokenManager.getAccessToken();
      const formData = new FormData();
      formData.append('images', file);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
      
      const response = await fetch(
        `${apiUrl}/products/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newUrls = data.urls || [];
        setUploadedImageUrls([...uploadedImageUrls, ...newUrls]);
        toast.success('Image uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setUploadedImageUrls(uploadedImageUrls.filter(url => url !== urlToRemove));
    if (imagePreview === urlToRemove) {
      const remainingImages = uploadedImageUrls.filter(url => url !== urlToRemove);
      setImagePreview(remainingImages.length > 0 ? remainingImages[0] : '');
    }
  };

  const handleGenerateAIContent = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    setAiGenerating(true);
    try {
      // Determine if material/careInfo should be generated based on category
      const materialCareCategories = ['clothing', 'home', 'fashion', 'beauty', 'sports'];
      const needsMaterialCare = formData.category && materialCareCategories.includes(formData.category);

      const response = await apiClient.post('/products/ai/generate-content', {
        title: formData.title,
        category: formData.category || undefined,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : undefined,
        existingDescription: formData.description || undefined,
        needsMaterial: needsMaterialCare || false,
        needsCareInfo: needsMaterialCare || false,
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

    if (!formData.title || !formData.price || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (uploadedImageUrls.length === 0) {
      toast.error('Please upload at least one product image');
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

      const productData = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: uploadedImageUrls,
        quantity: parseInt(formData.quantity),
        material: formData.material || undefined,
        careInfo: formData.careInfo || undefined,
        keyFeatures: formData.keyFeatures && formData.keyFeatures.length > 0 
          ? formData.keyFeatures.filter(f => f.trim()).map(f => f.trim())
          : undefined,
      };

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
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30 flex items-center justify-center min-h-[200px]"
                    style={
                      imagePreview
                        ? { backgroundImage: `url(${imagePreview})` }
                        : {}
                    }
                  >
                    {!imagePreview && (
                      <div className="text-center">
                        <p className="text-[#ffcc99] mb-2">No image uploaded</p>
                        <label className="cursor-pointer bg-[#ff6600] hover:bg-[#cc5200] text-black px-4 py-2 rounded-xl font-semibold transition">
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Image thumbnails */}
                  {uploadedImageUrls.length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div
                            className="w-20 h-20 bg-center bg-cover rounded-lg border border-[#ff6600]/30 cursor-pointer"
                            style={{ backgroundImage: `url(${url})` }}
                            onClick={() => setImagePreview(url)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 border-2 border-dashed border-[#ff6600]/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1a1a1a] transition">
                        <span className="text-[#ff6600] text-2xl">+</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  )}
                  
                  {uploadingImage && (
                    <p className="text-[#ffcc99] text-sm mt-2">Uploading image...</p>
                  )}
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

                {/* AI Assistant */}
                <div className="bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/5 border-2 border-[#ff6600]/30 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#ff6600]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wand2 className="w-5 h-5 text-[#ff6600]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">AI Content Assistant</h3>
                      <p className="text-[#ffcc99]/70 text-xs">
                        Let AI generate product descriptions, key features, and other content for you.
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
                        <span>Generate Content with AI</span>
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
                  <label className="block text-white text-sm font-medium mb-2">
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
                          className={`flex-1 px-4 py-2 rounded-xl bg-[#1a1a1a] border text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] transition-all ${
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
                  <label className="block text-white text-sm font-medium mb-2">
                    Product Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows={4}
                    className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                  />
                </div>

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

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
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

