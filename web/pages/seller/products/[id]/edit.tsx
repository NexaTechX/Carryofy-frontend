import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import SellerLayout from '../../../../components/seller/SellerLayout';
import { tokenManager, userManager } from '../../../../lib/auth';
import { X } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  quantity: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  status: string;
}

export default function EditProductPage() {
  const router = useRouter();
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
  });

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
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
  }, [router, id]);

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
          category: '',
          quantity: product.quantity.toString(),
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

      const productData = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: uploadedImageUrls,
        quantity: parseInt(formData.quantity),
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

